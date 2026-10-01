import { requestWordPress } from '../server/wordpressRequest.js';
import { contentCacheControl, CONTENT_SYNC } from '../shared/contentSync.js';
import { cacheContent } from '../server/contentCache.js';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

// Public catalog only. No WooCommerce credentials or write operations are used here.
export function createCatalogHandler({
  baseUrl,
  preview = true,
  fetcher = fetch,
  cacheTtl = CONTENT_SYNC.serverCacheMs,
} = {}) {
  return cacheContent(
    async (req, res) => {
      // Never cache errors or preview responses in a browser or shared cache.
      res.setHeader('Cache-Control', 'no-store');
      if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return send(res, 405, { error: 'Method not allowed.' });
      }
      if (!baseUrl?.trim()) return send(res, 503, { error: 'The catalog is not configured.' });
      const query = new URL(req.url, 'http://localhost').searchParams;
      const page = query.get('page') || '1';
      if (!/^[1-9]\d{0,5}$/.test(page)) {
        return send(res, 400, { error: 'Invalid catalog page.' });
      }
      try {
        const url = new URL(`${baseUrl.trim().replace(/\/+$/, '')}/products`);
        if (url.protocol !== 'https:') throw new Error('HTTPS is required.');
        url.search = new URLSearchParams({ per_page: '100', page });
        if (query.get('featured') === 'true') url.searchParams.set('featured', 'true');
        const response = await requestWordPress(url, {
          signal: AbortSignal.timeout(CONTENT_SYNC.upstreamTimeoutMs),
          fetcher,
        });
        if (!response.ok) throw new Error('Upstream catalog unavailable.');
        const products = await response.json();
        if (!Array.isArray(products)) throw new Error('Invalid upstream catalog.');
        for (const header of ['X-WP-Total', 'X-WP-TotalPages']) {
          if (response.headers.has(header)) res.setHeader(header, response.headers.get(header));
        }
        res.setHeader('Cache-Control', contentCacheControl(preview));
        return send(res, 200, products);
      } catch {
        return send(res, 502, { error: 'The catalog is temporarily unavailable.' });
      }
    },
    { ttl: cacheTtl },
  );
}

let active;
export default function handler(req, res) {
  const baseUrl = process.env.VITE_WOOCOMMERCE_STORE_API_URL;
  const preview = process.env.VERCEL_ENV !== 'production';
  if (
    !active ||
    active.baseUrl !== baseUrl ||
    active.preview !== preview ||
    active.fetcher !== fetch
  ) {
    active = { baseUrl, preview, fetcher: fetch };
    active.handler = createCatalogHandler(active);
  }
  return active.handler(req, res);
}
