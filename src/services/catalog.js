import { CATS } from '../constants/data';
import { sanitizeRichText } from '../utils/richText';

export const storeApiUrl = import.meta.env.VITE_WOOCOMMERCE_STORE_API_URL?.trim() || '';

// Plain-text fields remain useful for labels, summaries and the legacy editor.
export function plainText(html = '') {
  const document = new DOMParser().parseFromString(String(html), 'text/html');
  document.querySelectorAll('script, style, iframe, object').forEach((node) => node.remove());
  document.querySelectorAll('p, li, br, div, h1, h2, h3, h4').forEach((node) => {
    node.append('\n');
  });
  return document.body.textContent
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function publicUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export function normalizeProduct(product, featuredIds = new Set()) {
  const prices = product.prices;
  const minorUnit = prices?.currency_minor_unit;
  const validAmount = (amount) => typeof amount === 'string' && /^\d+$/.test(amount);
  if (
    !Number.isInteger(product.id) ||
    !product.name ||
    !prices?.currency_code ||
    !Number.isInteger(minorUnit) ||
    minorUnit < 0 ||
    minorUnit > 6
  ) {
    throw new Error('The store returned an invalid product.');
  }
  const price = validAmount(prices.price) ? Number(prices.price) / 10 ** minorUnit : null;
  const regularPrice = validAmount(prices.regular_price)
    ? Number(prices.regular_price) / 10 ** minorUnit
    : null;
  const categories = (product.categories || []).map((category) => ({
    id: category.slug,
    label: plainText(category.name),
    icon: '✦',
  }));
  const aliases = CATS.filter((category) =>
    categories.some((item) =>
      [category.id, category.label.toLowerCase().replaceAll(' ', '-')].includes(item.id),
    ),
  ).map((category) => category.id);

  return {
    source: 'woocommerce',
    id: product.id,
    slug: product.slug,
    name: plainText(product.name),
    cat: categories[0]?.id || 'uncategorized',
    categoryLabel: categories[0]?.label || 'Uncategorized',
    categoryIds: [...categories.map((category) => category.id), ...aliases],
    categories,
    price,
    oldPrice: price !== null && product.on_sale && regularPrice > price ? regularPrice : null,
    currency: prices.currency_code,
    minorUnit,
    desc: plainText(product.description || product.short_description),
    descriptionHtml: sanitizeRichText(product.description || product.short_description || ''),
    summary: plainText(product.short_description),
    image: publicUrl(product.images?.[0]?.src),
    thumbnail: publicUrl(product.images?.[0]?.thumbnail),
    imageAlt: plainText(product.images?.[0]?.alt || product.name),
    tag: plainText(product.tags?.[0]?.name),
    rating: Math.max(0, Math.min(5, Number(product.average_rating) || 0)),
    reviews: Math.max(0, Number(product.review_count) || 0),
    featured: featuredIds.has(product.id),
    canAddToCart:
      price !== null &&
      product.is_purchasable === true &&
      product.is_in_stock === true &&
      product.type === 'simple' &&
      !product.has_options,
    availability: !product.is_in_stock
      ? 'Out of stock'
      : product.has_options
        ? 'Options required'
        : product.type !== 'simple'
          ? 'Not available in this storefront yet'
          : !product.is_purchasable || price === null
            ? 'Currently unavailable'
            : '',
    // Private file URLs and arbitrary extensions must never become storefront fields.
  };
}

async function fetchPages(query, signal) {
  const products = [];
  for (let page = 1; ; page += 1) {
    const url = new URL('/api/catalog', window.location.origin);
    url.search = new URLSearchParams({ per_page: '100', page: String(page), ...query });
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`The store could not be reached (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('The store returned an invalid catalog.');
    products.push(...data);
    const totalPages = Number(response.headers.get('X-WP-TotalPages'));
    if (totalPages > 0 ? page >= totalPages : data.length < 100) return products;
  }
}

export async function fetchCatalog(signal) {
  const [products, featured] = await Promise.all([
    fetchPages({}, signal),
    fetchPages({ featured: 'true' }, signal),
  ]);
  const featuredIds = new Set(featured.map((product) => product.id));
  return products
    .filter((product) => !product.is_password_protected)
    .map((product) => normalizeProduct(product, featuredIds));
}

export const matchesCategory = (product, category) =>
  category === 'all' || product.cat === category || product.categoryIds?.includes(category);

export function catalogCategories(products) {
  const categories = new Map();
  for (const product of products) {
    const items = product.categories?.length
      ? product.categories
      : [{ id: product.cat, label: product.categoryLabel, icon: '✦' }];
    items.forEach((category) => categories.set(category.id, category));
  }
  return [CATS[0], ...categories.values()];
}
