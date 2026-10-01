import { randomUUID } from 'node:crypto';

export function freshWordPressUrl(input) {
  const url = new URL(input);
  // Some WordPress hosts ignore request cache headers for public REST responses.
  url.searchParams.set('_lld_refresh', randomUUID());
  return url;
}

// Public GETs share an origin-wide queue. Independent page/media/catalog reads
// must not all hit WordPress at once, or keep hitting it during Retry-After.
export function createWordPressRequester({
  maxConcurrent = 2,
  minIntervalMs = 200,
  rateLimitDelayMs = 1500,
} = {}) {
  const pools = new WeakMap();
  function poolFor(fetcher, origin) {
    if (!pools.has(fetcher)) pools.set(fetcher, new Map());
    const origins = pools.get(fetcher);
    if (origins.has(origin)) return origins.get(origin);
    const pool = { active: 0, nextStart: 0, pausedUntil: 0, queue: [], timer: null };
    pool.pump = () => {
      clearTimeout(pool.timer);
      pool.timer = null;
      if (!pool.queue.length || pool.active >= maxConcurrent) return;
      const wait = Math.max(pool.nextStart, pool.pausedUntil) - Date.now();
      if (wait > 0) {
        // Node timers cannot represent a delay greater than a signed 32-bit integer.
        pool.timer = setTimeout(pool.pump, Math.min(wait, 2_147_483_647));
        return;
      }
      const job = pool.queue.shift();
      job.signal.removeEventListener('abort', job.abort);
      pool.active++;
      pool.nextStart = Date.now() + minIntervalMs;
      Promise.resolve()
        .then(() => {
          job.signal.throwIfAborted();
          return job.run();
        })
        .then(job.resolve, job.reject)
        .finally(() => {
          pool.active--;
          pool.pump();
        });
      pool.pump();
    };
    origins.set(origin, pool);
    return pool;
  }
  function schedule(pool, signal, run) {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const job = { signal, run, resolve, reject };
      job.abort = () => {
        const index = pool.queue.indexOf(job);
        if (index !== -1) pool.queue.splice(index, 1);
        reject(signal.reason);
        pool.pump();
      };
      signal.addEventListener('abort', job.abort, { once: true });
      pool.queue.push(job);
      pool.pump();
    });
  }
  return async (input, { signal = AbortSignal.timeout(12000), fetcher = fetch } = {}) => {
    const pool = poolFor(fetcher, new URL(input).origin);
    for (let attempt = 0; ; attempt++) {
      const response = await schedule(pool, signal, async () => {
        const result = await fetcher(freshWordPressUrl(input), {
          cache: 'no-store',
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          signal,
          redirect: 'error',
        });
        if (result.status === 429) {
          const retryAfter = result.headers.get('Retry-After');
          const waitMs =
            retryAfter && /^\d+$/.test(retryAfter)
              ? Number(retryAfter) * 1000
              : retryAfter
                ? Date.parse(retryAfter) - Date.now()
                : NaN;
          pool.pausedUntil = Math.max(
            pool.pausedUntil,
            Date.now() + Math.max(rateLimitDelayMs, Number.isFinite(waitMs) ? waitMs : 0),
          );
        }
        return result;
      });
      if (response.status !== 429 || attempt === 1) return response;
      await response.body?.cancel();
      // Re-enter the shared queue once, within the original request deadline.
    }
  };
}

export const requestWordPress = createWordPressRequester();
