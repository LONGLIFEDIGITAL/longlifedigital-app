import { CONTENT_PAGES } from '../../src/contentPages.js';

export const product = {
  id: 318,
  name: 'Small Business AI Prompt Pack',
  slug: 'small-business-ai-pack',
  type: 'simple',
  prices: { price: '1399', regular_price: '2099', currency_code: 'USD', currency_minor_unit: 2 },
  categories: [{ id: 1, name: 'AI Tools', slug: 'ai-tools' }],
  images: [],
  tags: [],
  description: '<p>Practical tools to help your business grow.</p>',
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
  average_rating: '5',
  review_count: 81,
};
const post = {
  id: 20,
  slug: 'business-guide',
  title: 'A practical guide to growing your business',
  excerpt: 'Discover practical ways to build your online business and reach more customers.',
  body: '<p>Build a business with useful digital tools.</p>',
  date: '2026-09-01',
  categories: ['Business'],
  tags: [],
  image: { src: '', alt: '' },
};
const settings = {
  brand: {
    name: 'Longlife Digital',
    tagline: 'Premium Digital Store',
    website: 'https://store.example',
    logo: { src: '', alt: 'Longlife Digital' },
  },
  contact: { email: 'help@store.example' },
  footer: { description: 'Digital tools for life and business.' },
  social: {},
  announcement: { enabled: false, cta: {} },
  newsletter: { enabled: false },
  chat: { displayName: 'AI Assistant', welcome: 'How can we help?' },
};
export async function mockFluidStorefront(page) {
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({
      headers: { 'X-WP-TotalPages': '1' },
      json: [
        product,
        { ...product, id: 319, name: 'Business Planning Toolkit', slug: 'planning-toolkit' },
      ],
    }),
  );
  await page.route('**/api/content?**', (route) => {
    const query = new URL(route.request().url()).searchParams;
    const resource = query.get('resource');
    let json = [];
    if (resource === 'settings') json = settings;
    if (resource === 'page') {
      const key = query.get('key');
      json = {
        key,
        title: CONTENT_PAGES[key].title,
        heading: CONTENT_PAGES[key].title,
        intro: 'Digital resources for your business.',
        body: '<p>Explore practical tools and expert guidance.</p>',
        contact: {},
      };
    }
    if (resource === 'posts')
      json = {
        posts: [
          post,
          { ...post, id: 21, slug: 'marketing-guide', title: 'Build a better marketing plan' },
        ],
        page: 1,
        totalPages: 1,
      };
    if (resource === 'post') json = post;
    if (resource === 'home')
      json = {
        hero: {
          heading: '',
          eyebrow: 'Premium Digital Products',
          prefix: 'Beautifully Crafted',
          highlight: 'Digital Products',
          suffix: 'for Life & Business',
          intro: 'Instant download ebooks, courses and marketing tools for your business.',
          primaryCta: { label: 'Shop Now', destination: '/products' },
          secondaryCta: { label: 'Learn More', destination: '/about' },
        },
        collections: {
          catalog: { title: 'Our Products' },
          featured: { title: 'Featured Products' },
          more: { title: 'More to Explore' },
          cta: { label: 'View All', destination: '/products' },
        },
        blog: {
          heading: 'Blog Posts',
          postIds: [],
          cta: { label: 'View All', destination: '/blog' },
        },
      };
    return route.fulfill({ json });
  });
  await page.route('**/api/commerce?**', (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const currency = { currency_code: 'USD', currency_minor_unit: 2, currency_symbol: '$' };
    return route.fulfill({
      json:
        action === 'config'
          ? {
              enabled: true,
              testMode: true,
              publishableKey: 'pk_test_mock',
              countries: { US: 'United States' },
              states: { US: { TX: 'Texas' } },
              billingFields: { US: { postcode: { required: true } } },
            }
          : {
              items: [
                {
                  ...product,
                  key: 'test-cart',
                  quantity: 1,
                  quantity_limits: { minimum: 1, maximum: 10, multiple_of: 1 },
                  totals: { ...currency, line_total: '1399', line_subtotal: '1399' },
                },
              ],
              coupons: [],
              needs_shipping: false,
              totals: {
                ...currency,
                total_items: '1399',
                total_discount: '0',
                total_tax: '0',
                total_price: '1399',
              },
            },
    });
  });
}
