import { test, expect } from '@playwright/test';
import { createContentHandler } from '../api/content.js';
import { CONTENT_PAGES } from '../src/contentPages.js';
import { initialMarkup, metadataMarkup } from '../server/initialMarkup.js';

const pageRecord = (key, acf = {}, body = '<p>Published page body.</p>') => ({
  id: 100 + Object.keys(CONTENT_PAGES).indexOf(key),
  type: 'page',
  status: 'publish',
  slug: CONTENT_PAGES[key].slug,
  title: { rendered: `CMS ${key}` },
  content: { rendered: body },
  acf: {
    lld_page_key: key,
    lld_heading: `CMS ${key}`,
    lld_intro: `Introduction to ${key}`,
    ...acf,
  },
});
const item = (id, type, title, acf = {}) => ({
  id,
  type,
  status: 'publish',
  slug: `item-${id}`,
  title: { rendered: title },
  excerpt: { rendered: '<p>A short summary.</p>' },
  content: { rendered: '<p>Published <strong>details</strong>.</p>' },
  acf,
});
const settings = {
  brand: { name: 'CMS Brand', logo: { src: '', alt: '' }, website: 'https://store.example' },
  contact: { email: 'hello@store.example' },
  footer: {},
  social: {},
  announcement: { enabled: false, cta: {} },
};

function mockCms() {
  const state = {
    pages: [],
    blocks: [],
    calls: [],
    collections: {},
    fail: false,
  };
  state.handler = createContentHandler({
    baseUrl: 'https://cms.example/wp-json/wp/v2',
    cacheTtl: 0,
    fetcher: async (url) => {
      state.calls.push(url);
      if (state.fail) return Response.json({ error: 'internal secret' }, { status: 503 });
      if (url.pathname.endsWith('/pages')) return Response.json(state.pages);
      if (url.pathname.endsWith('/lld-blocks')) return Response.json(state.blocks);
      const endpoint = url.pathname.split('/').pop();
      const data = state.collections[endpoint] || [];
      return Response.json(
        data.slice(
          (Number(url.searchParams.get('page') || 1) - 1) * 100,
          Number(url.searchParams.get('page') || 1) * 100,
        ),
        { headers: { 'X-WP-TotalPages': String(Math.max(1, Math.ceil(data.length / 100))) } },
      );
    },
  });
  return state;
}
async function invoke(handler, query) {
  const result = {};
  await handler(
    { method: 'GET', url: `/api/content?${query}` },
    {
      set statusCode(status) {
        result.status = status;
      },
      setHeader() {},
      end(body) {
        result.body = JSON.parse(body);
      },
    },
  );
  return result;
}
async function routeCms(page, state) {
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({ json: [], headers: { 'X-WP-TotalPages': '1' } }),
  );
  await page.route('**/api/content?**', async (route) => {
    const query = new URL(route.request().url()).searchParams;
    if (query.get('resource') === 'settings') return route.fulfill({ json: settings });
    if (query.get('resource') === 'posts')
      return route.fulfill({ json: { posts: [], page: 1, totalPages: 0 } });
    const result = await invoke(state.handler, query.toString());
    return route.fulfill({ status: result.status, json: result.body });
  });
}

test('page contracts require the correct slug/key and select published About value blocks in order', async () => {
  const state = mockCms();
  state.pages = [
    pageRecord('about', {
      lld_about: { tagline: 'CMS tagline', sections: [3, 2, 4, 1] },
      internal_secret: 'Never expose',
    }),
  ];
  state.blocks = [
    item(1, 'lld_block', 'Mission', { lld_kind: 'value' }),
    item(2, 'lld_block', 'Promise', { lld_kind: 'value' }),
    item(3, 'lld_block', 'Wrong kind', { lld_kind: 'trust' }),
    {
      ...item(4, 'lld_block', 'Private', { lld_kind: 'value' }),
      content: { protected: true, rendered: 'private' },
    },
  ];
  let result = await invoke(state.handler, 'resource=page&key=about');
  expect(result.status).toBe(200);
  expect(result.body.about.sections.map((section) => section.id)).toEqual([2, 1]);
  expect(JSON.stringify(result.body)).not.toContain('Never expose');
  state.pages[0].acf.lld_page_key = '';
  expect((await invoke(state.handler, 'resource=page&key=about')).status).toBe(404);
  for (const query of [
    'resource=page&key=unknown',
    'resource=page&key=about&status=draft',
    'resource=services&include=2',
  ])
    expect((await invoke(state.handler, query)).status).toBe(400);
});

test('collections paginate completely and never return private records or unsafe destinations', async () => {
  const state = mockCms();
  state.collections['lld-services'] = Array.from({ length: 101 }, (_, index) =>
    item(index + 1, 'lld_service', `Service ${index}`, {
      lld_pricing_mode: 'estimate',
      lld_amount: 45,
      lld_currency: 'USD',
      lld_cta: { label: 'Contact', destination: '/contact' },
    }),
  );
  state.collections['lld-services'][0].status = 'draft';
  state.collections['lld-services'][1].acf.lld_cta.destination = 'javascript:alert(1)';
  state.collections['lld-services'][2].private = 'internal secret';
  const result = await invoke(state.handler, 'resource=services');
  expect(result.status).toBe(200);
  expect(result.body).toHaveLength(100);
  expect(result.body[0].cta.destination).toBe('');
  expect(result.body.at(-1).id).toBe(101);
  expect(JSON.stringify(result.body)).not.toContain('internal secret');
  expect(state.calls.some((url) => url.searchParams.get('page') === '2')).toBe(true);
});

test('all content pages have honest unpublished states while the catalog and contact details remain accessible', async ({
  page,
}) => {
  const state = mockCms();
  await routeCms(page, state);
  for (const key of Object.keys(CONTENT_PAGES).filter((key) => key !== 'home')) {
    await page.goto(CONTENT_PAGES[key].path);
    await expect(page.locator('main h1')).toHaveText(CONTENT_PAGES[key].title);
    await expect(page.locator('main')).toContainText('This content is being prepared');
    await expect(page.locator('main')).not.toContainText('Payhip');
    await expect(page.locator('main')).not.toContainText('Every product is handcrafted');
  }
});

test('About and policies render CMS rich text, metadata, publishing edits and removals', async ({
  page,
}) => {
  const state = mockCms();
  state.pages = [
    pageRecord(
      'about',
      {
        lld_about: { tagline: 'A live tagline', sections: [1] },
        lld_seo_title: 'Published SEO',
        lld_noindex: true,
      },
      '<p>Our <strong>story</strong>.</p><script>window.injected=true</script>',
    ),
    pageRecord(
      'privacy',
      {
        lld_policy: {
          updated_on: '2026-09-21',
          callout_heading: 'Questions?',
          callout_body: 'Please get in touch.',
        },
      },
      '<h2>Approved privacy policy</h2><ul><li>Only approved copy</li></ul>',
    ),
  ];
  state.blocks = [item(1, 'lld_block', 'Our mission from CMS', { lld_kind: 'value' })];
  await routeCms(page, state);
  await page.clock.install();
  await page.goto('/about');
  await expect(page.locator('main h1')).toHaveText('CMS about');
  await expect(page.getByRole('heading', { name: 'Our mission from CMS' })).toBeVisible();
  await expect(page.locator('main strong')).toContainText(['story', 'details']);
  await expect(page).toHaveTitle('Published SEO');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  state.pages[0].acf.lld_heading = 'Edited without refresh';
  await page.clock.fastForward(31_000);
  await expect(page.locator('main h1')).toHaveText('Edited without refresh');
  state.pages = state.pages.filter((record) => record.acf.lld_page_key !== 'about');
  await page.clock.fastForward(31_000);
  await expect(page.locator('main')).toContainText('This content is being prepared');
  await expect(page.getByText('Our mission from CMS')).toHaveCount(0);
  await page.goto('/privacy-policy');
  await expect(page.locator('main li')).toHaveText('Only approved copy');
  await expect(page.locator('main')).toContainText('2026-09-21');
});

test('services, assets, FAQ and contact service choices use the same published records', async ({
  page,
}) => {
  const state = mockCms();
  state.collections['lld-services'] = [
    item(1, 'lld_service', 'CMS Website Design', {
      lld_package_details: '<ul><li>Five pages included</li></ul>',
      lld_pricing_mode: 'estimate',
      lld_amount: 125,
      lld_currency: 'USD',
      lld_billing_period: 'month',
      lld_cta: { label: 'Request a quote', destination: '/contact' },
    }),
  ];
  state.collections['lld-assets'] = [
    {
      ...item(2, 'lld_asset', 'example-domain.test', {
        lld_availability: 'sold',
        lld_cta: { label: 'Buy domain', destination: '/contact' },
      }),
      lld_asset_cat: [10],
    },
  ];
  state.collections['lld-asset-categories'] = [{ id: 10, slug: 'brandable', name: 'Brandable' }];
  state.collections['lld-faqs'] = [
    item(3, 'lld_faq', 'How is the work delivered?', { lld_topics: ['services'] }),
  ];
  await routeCms(page, state);
  await page.goto('/services');
  await expect(page.getByRole('heading', { name: 'CMS Website Design' })).toBeVisible();
  await expect(page.getByText('Five pages included')).toBeVisible();
  await expect(page.getByText('From $125.00 / month')).toBeVisible();
  await page.getByRole('button', { name: 'How is the work delivered?' }).click();
  await expect(page.locator('.mantine-Accordion-panel strong')).toHaveText('details');
  await page.getByRole('button', { name: 'Request a quote' }).click();
  await expect(page.locator('select option', { hasText: 'CMS Website Design' })).toHaveCount(1);
  await page.goto('/domains?category=brandable');
  await expect(page.getByRole('heading', { name: 'example-domain.test' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy domain' })).toHaveCount(0);
});

test('CMS navigation connects manual and derived children on mobile and desktop', async ({
  page,
}) => {
  const state = mockCms();
  state.collections['lld-navigation'] = [
    item(1, 'lld_nav_item', 'What we do', {
      lld_area: 'header',
      lld_destination: '/services',
      lld_children_source: 'services',
    }),
    item(2, 'lld_nav_item', 'Our story', { lld_area: 'footer_company', lld_destination: '/about' }),
  ];
  state.collections['lld-services'] = [
    ...Array.from({ length: 12 }, (_, index) =>
      item(20 + index, 'lld_service', `Other service ${index}`),
    ),
    item(5, 'lld_service', 'Published Service', { lld_nav_label: 'Design help' }),
  ];
  await routeCms(page, state);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');
  await page.getByRole('button', { name: 'What we do' }).click();
  await expect(page.getByRole('menuitem', { name: 'Design help' })).toHaveAttribute(
    'href',
    '/services#item-5',
  );
  await page.getByRole('menuitem', { name: 'Design help' }).click();
  await expect(page).toHaveURL(/\/services#item-5$/);
  await expect(page.locator('#item-5')).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('link', { name: 'Design help' }).click();
  await expect(page).toHaveURL(/\/services#item-5$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#item-5')).toBeInViewport();
  await expect(page.locator('footer').getByRole('link', { name: 'Our story' })).toHaveAttribute(
    'href',
    '/about',
  );
});

test('initial hero paints from escaped HTML even while every app script is blocked', async ({
  page,
}) => {
  const home = {
    hero: {
      eyebrow: 'Live badge',
      prefix: 'Visible immediately',
      highlight: 'Digital Products',
      suffix: 'from the CMS',
      intro: 'No API wait',
      primaryCta: { label: 'Browse', destination: '/products' },
    },
    blog: {},
  };
  const snapshot = { entries: { home: { data: home }, settings: { data: settings } } };
  const html = `<!doctype html><html><head>${metadataMarkup(snapshot, '/')}</head><body>${initialMarkup(snapshot, '/')}<div id="root"></div></body></html>`;
  await page.route('**/*', (route) =>
    route.request().isNavigationRequest()
      ? route.fulfill({ contentType: 'text/html', body: html })
      : route.abort(),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Visible immediately');
  await expect(page.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/products');
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  home.hero.prefix = '</h1><script>window.injected=true</script>';
  expect(initialMarkup(snapshot, '/')).toContain('&lt;script&gt;');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});
