import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export function freshWordPressUrl(input) {
  const url = new URL(input);
  // Some WordPress hosts ignore request cache headers for public REST responses.
  url.searchParams.set('_lld_refresh', randomUUID());
  return url;
}

export async function requestWordPress(input, { signal, fetcher = fetch } = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetcher(freshWordPressUrl(input), {
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal,
      redirect: 'error',
    });
    if (response.status !== 429 || attempt === 1) return response;
    const retryAfter = response.headers.get('Retry-After');
    const waitMs =
      retryAfter && /^\d+$/.test(retryAfter)
        ? Number(retryAfter) * 1000
        : retryAfter
          ? Date.parse(retryAfter) - Date.now()
          : NaN;
    await response.body?.cancel();
    await delay(Number.isFinite(waitMs) ? Math.max(0, waitMs) : 1000, undefined, { signal });
  }
}
