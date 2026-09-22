import { requestWordPress } from '../server/wordpressRequest.js';
import { contentCacheControl } from '../shared/contentSync.js';

// Public catalog only. No WooCommerce credentials or write operations are used here.
export default async function handler(req, res) {
  // Never cache errors or preview responses in a browser or shared cache.
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const baseUrl = process.env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  if (!baseUrl) return res.status(503).json({ error: 'The catalog is not configured.' });
  const query = new URL(req.url, 'http://localhost').searchParams;
  const page = query.get('page') || '1';
  if (!/^[1-9]\d{0,5}$/.test(page)) {
    return res.status(400).json({ error: 'Invalid catalog page.' });
  }
  try {
    const url = new URL(`${baseUrl.replace(/\/+$/, '')}/products`);
    if (url.protocol !== 'https:') throw new Error('HTTPS is required.');
    url.search = new URLSearchParams({ per_page: '100', page });
    if (query.get('featured') === 'true') url.searchParams.set('featured', 'true');
    const response = await requestWordPress(url, {
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Upstream catalog unavailable.');
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Invalid upstream catalog.');
    for (const header of ['X-WP-Total', 'X-WP-TotalPages']) {
      if (response.headers.has(header)) res.setHeader(header, response.headers.get(header));
    }
    res.setHeader('Cache-Control', contentCacheControl(process.env.VERCEL_ENV !== 'production'));
    return res.status(200).json(products);
  } catch {
    return res.status(502).json({ error: 'The catalog is temporarily unavailable.' });
  }
}
