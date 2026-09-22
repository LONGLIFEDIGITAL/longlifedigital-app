import { contentCacheKey, CONTENT_SYNC } from '../shared/contentSync.js';

// Share concurrent reads and keep a short warm cache within a Vite/Vercel process.
// Only public successful responses and confirmed removals are cached.
export function cacheContent(
  handler,
  { ttl = CONTENT_SYNC.serverCacheMs, now = Date.now, onRead } = {},
) {
  const cache = new Map();
  const pending = new Map();
  return async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    url.searchParams.sort();
    const key = url.search;
    const deliver = (result) => {
      if (onRead && [200, 404].includes(result.status)) {
        onRead({
          key: contentCacheKey(url.searchParams),
          data: result.status === 404 ? null : JSON.parse(result.body),
          updatedAt: result.updatedAt,
        });
      }
      res.statusCode = result.status;
      for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value);
      res.end(result.body);
    };
    if (req.method !== 'GET') return handler(req, res);
    const saved = cache.get(key);
    if (saved && saved.expires > now()) return deliver(saved.result);
    let work = pending.get(key);
    if (!work) {
      work = (async () => {
        const result = { status: 200, headers: {}, body: '' };
        await handler(req, {
          set statusCode(status) {
            result.status = status;
          },
          setHeader(name, value) {
            result.headers[name] = value;
          },
          end(body) {
            result.body = body;
          },
        });
        result.updatedAt = now();
        if (ttl > 0 && [200, 404].includes(result.status)) {
          cache.delete(key);
          cache.set(key, { result, expires: now() + ttl });
          if (cache.size > 100) cache.delete(cache.keys().next().value);
        }
        return result;
      })();
      pending.set(key, work);
      work.finally(() => pending.delete(key)).catch(() => {});
    }
    return deliver(await work);
  };
}
