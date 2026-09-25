import { test, expect } from '@playwright/test';
import { createContentHandler } from '../api/content.js';
import { CONTENT_PAGES } from '../src/contentPages.js';
import { initialMarkup, metadataMarkup } from '../server/initialMarkup.js';
import { contentBootstrapPlugin } from '../server/contentBootstrap.js';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

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

function mockCms(options = {}) {
  const state = {
    pages: [],
    blocks: [],
    calls: [],
    collections: {},
    fail: false,
  };
  const edge = new Map();
  const origin = async (url) => {
    if (state.fail) return Response.json({ error: 'internal secret' }, { status: 503 });
    if (url.pathname.endsWith('/pages')) {
      const slugs = url.searchParams.get('slug')?.split(',');
      return Response.json(state.pages.filter((page) => !slugs || slugs.includes(page.slug)));
    }
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
  };
  state.handler = createContentHandler({
    baseUrl: 'https://cms.example/wp-json/wp/v2',
    ...options,
    fetcher: async (url) => {
      state.calls.push(url);
      // Model a host that retains public REST responses despite request headers.
      if (!edge.has(url.href)) edge.set(url.href, await origin(url));
      return edge.get(url.href).clone();
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
    if (query.get('resource') === 'settings')
      return route.fulfill({ json: state.settings || settings });
    if (query.get('resource') === 'posts')
      return route.fulfill({ json: { posts: [], page: 1, totalPages: 0 } });
    const result = await invoke(state.handler, query.toString());
    return route.fulfill({ status: result.status, json: result.body });
  });
}

test('one refresh policy updates About fields, related blocks and shared content without a reload', async ({
  page,
  context,
}) => {
  const state = mockCms();
  state.pages = [
    pageRecord('about', { lld_about: { tagline: 'Original introduction', sections: [1] } }),
  ];
  state.blocks = [item(1, 'lld_block', 'Our Mission', { lld_kind: 'value' })];
  state.collections['lld-navigation'] = [
    item(20, 'lld_nav_item', 'Original footer link', {
      lld_area: 'footer_company',
      lld_destination: '/about',
    }),
  ];
  let documentLoads = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest()) documentLoads++;
  });
  await page.clock.install();
  await routeCms(page, state);
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'Our Mission' })).toBeVisible();
  state.pages[0].acf.lld_heading = 'Updated About heading';
  state.pages[0].acf.lld_about.tagline = 'Updated brand introduction';
  state.blocks[0].content.rendered = '<p>Updated mission body.</p>';
  state.collections['lld-navigation'][0].title.rendered = 'Updated footer link';
  state.settings = { ...settings, footer: { description: 'Updated footer description' } };
  await page.clock.fastForward(15_001);
  await expect(page.locator('main h1')).toHaveText('Updated About heading');
  await expect(page.locator('main')).toContainText('Updated brand introduction');
  await expect(page.locator('main')).toContainText('Updated mission body.');
  await expect(page.locator('footer')).toContainText('Updated footer description');
  await expect(page.locator('footer')).toContainText('Updated footer link');
  expect(documentLoads).toBe(1);

  await context.setOffline(true);
  state.blocks[0].content.rendered = '<p>Mission after reconnect.</p>';
  await page.clock.fastForward(15_001);
  await expect(page.locator('main')).toContainText('Updated mission body.');
  await context.setOffline(false);
  await expect(page.locator('main')).toContainText('Mission after reconnect.');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  });
  const reads = state.calls.length;
  state.blocks[0].content.rendered = '<p>Mission after tab return.</p>';
  await page.clock.fastForward(60_001);
  expect(state.calls).toHaveLength(reads);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  });
  await expect(page.locator('main')).toContainText('Mission after tab return.');
  // A removed relationship is reflected even if the block remains published.
  state.pages[0].acf.lld_about.sections = [];
  await page.clock.fastForward(15_001);
  await expect(page.getByRole('heading', { name: 'Our Mission' })).toHaveCount(0);
  expect(documentLoads).toBe(1);
});

test('About refresh does not inherit a second page-list cache after the response cache expires', async () => {
  let clock = 1000;
  const state = mockCms({ preview: false, now: () => clock });
  state.pages = [pageRecord('about'), pageRecord('privacy')];
  expect((await invoke(state.handler, 'resource=page&key=about')).body.heading).toBe('CMS about');
  clock += 4999;
  await invoke(state.handler, 'resource=page&key=privacy');
  state.pages[0].acf.lld_heading = 'Published just now';
  clock += 2;
  expect((await invoke(state.handler, 'resource=page&key=about')).body.heading).toBe(
    'Published just now',
  );
  state.pages = [];
  clock += 5001;
  expect((await invoke(state.handler, 'resource=page&key=about')).status).toBe(404);
});

test('a running Vite server updates initial HTML and the disk snapshot after published reads', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lld-sync-'));
  let server;
  const listeners = new Set();
  const state = mockCms({ onRead: (entry) => listeners.forEach((listener) => listener(entry)) });
  state.pages = [pageRecord('about')];
  try {
    await writeFile(
      join(root, 'index.html'),
      '<html><head><!--page-metadata--></head><body><!--initial-content--><div id="root"></div></body></html>',
    );
    server = await createServer({
      configFile: false,
      root,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/.cache/**'] } },
      plugins: [
        contentBootstrapPlugin({
          handler: state.handler,
          cmsUrl: 'https://cms.example/wp-json/wp/v2',
          mode: 'development',
          root,
          subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
        }),
        {
          name: 'test-content-api',
          configureServer(vite) {
            vite.middlewares.use('/api/content', (req, res) => state.handler(req, res));
          },
        },
      ],
    });
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    expect(await (await fetch(`${origin}/about`)).text()).toContain('CMS about');
    state.pages[0].acf.lld_heading = 'Fresh without Vite restart';
    const refreshed = await (await fetch(`${origin}/api/content?resource=page&key=about`)).json();
    expect(refreshed.heading).toBe('Fresh without Vite restart');
    expect(await (await fetch(`${origin}/about`)).text()).toContain(
      '<h1>Fresh without Vite restart</h1>',
    );
    const cachePath = join(
      root,
      '.cache',
      (await readdir(join(root, '.cache'))).find((name) => name.endsWith('.json')),
    );
    await expect
      .poll(
        async () =>
          JSON.parse(await readFile(cachePath, 'utf8')).entries['page:about'].data.heading,
      )
      .toBe('Fresh without Vite restart');
    state.fail = true;
    expect((await fetch(`${origin}/api/content?resource=page&key=about`)).status).toBe(502);
    expect(await (await fetch(`${origin}/about`)).text()).toContain(
      '<h1>Fresh without Vite restart</h1>',
    );
    state.fail = false;
    state.pages = [];
    expect((await fetch(`${origin}/api/content?resource=page&key=about`)).status).toBe(404);
    const removed = await (await fetch(`${origin}/about`)).text();
    expect(removed).not.toContain('Fresh without Vite restart');
    expect(removed).toContain('This content is being prepared');
  } finally {
    await server?.close();
    await rm(root, { recursive: true, force: true });
  }
});

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

test('confirmation matches product downloads and expiry, with general and product CMS FAQs', async ({
  page,
}) => {
  const state = mockCms();
  state.collections['lld-faqs'] = [
    item(1, 'lld_faq', 'Where are my files?', { lld_topics: ['products'] }),
    item(2, 'lld_faq', 'How do I contact support?', { lld_topics: ['general', 'products'] }),
    item(3, 'lld_faq', 'How are domains transferred?', { lld_topics: ['domains'] }),
  ];
  await routeCms(page, state);
  await page.route('**/api/commerce?**', (route) =>
    route.fulfill({
      json: {
        number: '341',
        status: 'completed',
        paid: true,
        currency: 'USD',
        total: '36.00',
        items: [
          { id: 318, name: 'Local SEO Starter Toolkit', quantity: 1 },
          { id: 320, name: 'Social Media Content Pack', quantity: 1 },
        ],
        // Deliberately different from order-item order, with two files for one product.
        downloads: [
          {
            productId: 320,
            productName: 'Social Media Content Pack',
            downloadId: 'a',
            name: 'raw-file-a.pdf',
            url: 'https://woo.test/?download_file=320&key=a',
            expires: null,
          },
          {
            productId: 318,
            productName: 'Local SEO Starter Toolkit',
            downloadId: 'b',
            name: 'raw-file-b.pdf',
            url: 'https://woo.test/?download_file=318&key=b',
            expires: '2099-03-12T00:00:00+05:30',
          },
          {
            productId: 320,
            productName: 'Social Media Content Pack',
            downloadId: 'c',
            name: 'raw-file-c.pdf',
            url: 'https://woo.test/?download_file=320&key=c',
          },
        ],
      },
    }),
  );
  await page.goto('/order-confirmation?attempt=11111111-1111-4111-8111-111111111111');
  const table = page.getByRole('table', { name: 'Purchased downloads' });
  const seo = table.getByRole('row').filter({ hasText: 'Local SEO Starter Toolkit' });
  await expect(seo.getByRole('link')).toHaveAttribute(
    'href',
    'https://woo.test/?download_file=318&key=b',
  );
  await expect(seo.locator('time')).toHaveText('Mar 12, 2099');
  const social = table.getByRole('row').filter({ hasText: 'Social Media Content Pack' });
  await expect(social.nth(0).getByRole('link')).toHaveAttribute('href', /key=a$/);
  await expect(social.nth(0)).toContainText('Never');
  await expect(social.nth(1).getByRole('link')).toHaveAttribute('href', /key=c$/);
  await expect(social.nth(1)).toContainText('See purchase email');
  await expect(table).not.toContainText('raw-file');
  await expect(table.getByRole('link').first()).toHaveCSS('font-size', '14px');
  await expect(page.getByRole('heading', { name: 'Downloads', exact: true })).toHaveCSS(
    'font-family',
    /Plus Jakarta Sans/,
  );
  await expect(page.getByRole('button', { name: 'Where are my files?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How do I contact support?' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'How are domains transferred?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Where are my files?' }).click();
  await expect(
    page.getByRole('region', { name: 'Where are my files?' }).locator('strong'),
  ).toHaveText('details');
  await expect(page.getByRole('link', { name: 'Contact support', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue shopping', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/confirmation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await table.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/confirmation-mobile.png' });
});

test('navigation progressively reveals CMS items and keeps all links in the hamburger', async ({
  page,
}) => {
  const state = mockCms();
  state.collections['lld-navigation'] = [
    'Home',
    'Services',
    'Courses',
    'Domains',
    'Digital Products',
    'About',
    'Blog',
    'Contact',
  ].map((title, index) =>
    item(index + 1, 'lld_nav_item', title, {
      lld_area: 'header',
      lld_destination: [
        '/',
        '/services',
        '/courses',
        '/domains',
        '/products',
        '/about',
        '/blog',
        '/contact',
      ][index],
      lld_children_source: index === 1 ? 'manual' : '',
    }),
  );
  state.collections['lld-navigation'].push(
    item(20, 'lld_nav_item', 'Website Design', {
      lld_area: 'header',
      lld_parent: 2,
      lld_destination: '/services#design',
      lld_icon: '💻',
      lld_summary: 'Professional sites for your business',
    }),
  );
  await routeCms(page, state);
  await page.goto('/about');
  for (const [width, count] of [
    [393, 0],
    [768, 4],
    [1024, 6],
    [1100, 7],
    [1280, 8],
    [1440, 8],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('[aria-label="Quick navigation"] > div:visible')).toHaveCount(count);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog');
    for (const title of [
      'Home',
      'Services',
      'Courses',
      'Domains',
      'Digital Products',
      'About',
      'Contact',
    ])
      await expect(drawer.getByRole('link', { name: title, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
  }
  const quickNav = page.locator('[aria-label="Quick navigation"]');
  await expect(quickNav.getByRole('link', { name: 'Contact', exact: true })).toBeVisible();
  await expect(quickNav.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await quickNav.getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(quickNav.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(quickNav.getByRole('link', { name: 'About', exact: true })).not.toHaveAttribute(
    'aria-current',
  );
  await page.getByRole('button', { name: 'Services', exact: true }).hover();
  await expect
    .poll(() =>
      page
        .getByRole('button', { name: 'Services', exact: true })
        .evaluate((element) => getComputedStyle(element, '::after').transform),
    )
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
  await expect(page.getByRole('menuitem', { name: /Website Design/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/navigation-expanded.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Services', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: /Website Design/ })).toBeVisible();
  await page.getByRole('menuitem', { name: /Website Design/ }).click();
  await expect(page.getByRole('button', { name: 'Services', exact: true })).toHaveAttribute(
    'data-active',
    'true',
  );
});
