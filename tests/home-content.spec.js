import { expect, test } from '@playwright/test';
import { createContentHandler } from '../api/content.js';
import { bootstrapTag, createBootstrap } from '../server/contentBootstrap.js';
import { catalogStatistics } from '../src/utils/catalogStatistics.js';
import { homeRecord } from './fixtures/home';

const product = {
  id: 26,
  name: '50 AI Prompts for Local Service Businesses',
  type: 'simple',
  prices: { price: '1400', regular_price: '1400', currency_code: 'USD', currency_minor_unit: 2 },
  categories: [{ id: 1, slug: 'ai-prompt-packs', name: 'AI Prompt Packs' }],
  tags: [
    { id: 2, slug: 'downloadable', name: 'Downloadable' },
    { id: 3, slug: 'ai-prompts', name: 'AI prompts' },
  ],
  is_in_stock: true,
  is_purchasable: true,
  images: [],
};

function cms({ preview = true } = {}) {
  const server = {
    pages: [structuredClone(homeRecord)],
    products: [structuredClone(product)],
    blocks: [],
    posts: [],
    postsFail: false,
    postsHold: null,
    fail: false,
    catalogFail: false,
    hold: null,
    calls: [],
    homeRequests: 0,
  };
  const edge = new Map();
  server.handler = createContentHandler({
    cacheTtl: 0,
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    preview,
    fetcher: async (url) => {
      server.calls.push(url);
      if (url.pathname.endsWith('/pages')) {
        if (server.fail) throw new Error('Upstream unavailable');
        // Publishing updates the origin; the CMS edge still caches old URLs.
        if (!edge.has(url.href)) edge.set(url.href, JSON.stringify(server.pages));
        return new Response(edge.get(url.href));
      }
      if (url.pathname.endsWith('/lld-blocks')) return Response.json(server.blocks);
      if (url.pathname.endsWith('/posts')) {
        if (server.postsHold) await server.postsHold;
        if (server.postsFail) throw new Error('Posts unavailable');
        const slug = url.searchParams.get('slug');
        const include = url.searchParams.get('include')?.split(',').map(Number);
        const all = server.posts
          .filter((post) => !slug || post.slug === slug)
          .filter((post) => !include || include.includes(post.id));
        const start =
          (Number(url.searchParams.get('page') || 1) - 1) *
          Number(url.searchParams.get('per_page'));
        return Response.json(all.slice(start, start + Number(url.searchParams.get('per_page'))), {
          headers: {
            'X-WP-TotalPages': String(
              Math.ceil(all.length / Number(url.searchParams.get('per_page'))),
            ),
          },
        });
      }
      if (url.pathname.endsWith('/lld-settings')) {
        return new Response(
          JSON.stringify([
            {
              id: 196,
              slug: 'storefront',
              type: 'lld_settings',
              status: 'publish',
              acf: {
                lld_brand: { name: 'CMS Store', website: 'https://store.example' },
                lld_contact: { email: 'help@store.example' },
                lld_footer: { description: 'Published footer.' },
              },
            },
          ]),
        );
      }
      throw new Error(`Unexpected resource: ${url.pathname}`);
    },
  });
  return server;
}

async function invoke(handler, url = '/api/content?resource=home') {
  const result = { headers: {} };
  await handler(
    { method: 'GET', url },
    {
      set statusCode(value) {
        result.status = value;
      },
      setHeader(name, value) {
        result.headers[name] = value;
      },
      end(body) {
        result.body = JSON.parse(body);
      },
    },
  );
  return result;
}

async function setup(page, server = cms()) {
  await page.clock.install();
  await page.route('**/api/content?**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('resource') === 'home') {
      server.homeRequests++;
      if (server.hold) await server.hold;
    }
    const result = await invoke(server.handler, route.request().url());
    await route.fulfill({ status: result.status, headers: result.headers, json: result.body });
  });
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill(
      server.catalogFail
        ? { status: 502, json: { error: 'Unavailable' } }
        : {
            headers: { 'X-WP-TotalPages': '1' },
            json: server.products,
          },
    ),
  );
  return server;
}

async function refocus(page) {
  await page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    }
  });
}

test('homepage API reads only its published record and allowlists public content', async () => {
  const server = cms();
  const result = await invoke(server.handler);
  expect(result.status).toBe(200);
  expect(result.body.hero.prefix).toBe('Created in WordPress');
  expect(result.body.hero.primaryCta.destination).toBe('/products');
  expect(result.headers['Cache-Control']).toBe('no-store');
  expect(server.calls[0].pathname).toBe('/wp-json/wp/v2/pages');
  expect(server.calls[0].searchParams.get('slug')).toBe('home');
  expect(server.calls[0].searchParams.get('status')).toBe('publish');
  expect(JSON.stringify(result.body)).not.toMatch(/private_note|internal_secret|catalog_title/);
  expect(result.body.collections.catalog.title).toBe('Explore Our Products');
  // Arbitrary slugs, preview modes and duplicate resource values are not accepted.
  for (const query of [
    'resource=home&slug=other',
    'resource=home&preview=1',
    'resource=home&resource=settings',
  ]) {
    expect((await invoke(server.handler, `/api/content?${query}`)).status).toBe(400);
  }
});

test('missing, private, duplicated and mismatched homepage records are rejected', async () => {
  const server = cms();
  for (const [pages, status] of [
    [[], 404],
    [{}, 502],
    [[{ ...homeRecord, status: 'draft' }], 502],
    [[{ ...homeRecord, slug: 'other' }], 502],
    [[{ ...homeRecord, type: 'post' }], 502],
    [[{ ...homeRecord, acf: { lld_page_key: 'about' } }], 502],
    [[homeRecord, homeRecord], 502],
  ]) {
    server.pages = pages;
    const result = await invoke(server.handler);
    expect(result.status).toBe(status);
    expect(result.body.hero).toBeUndefined();
    expect(result.headers['Cache-Control']).toBe('no-store');
  }
});

test('homepage refresh bypasses CMS caches and accepts only safe CTA destinations', async () => {
  const server = cms({ preview: false });
  expect((await invoke(server.handler)).headers['Cache-Control']).toContain('s-maxage=5');
  server.pages[0].acf.lld_home.hero_prefix = 'Published after the first request';
  expect((await invoke(server.handler)).body.hero.prefix).toBe('Published after the first request');
  for (const destination of [
    'javascript:alert(1)',
    '//evil.example',
    '/\\evil.example',
    'http://example.com',
    'https://user:pass@example.com',
  ]) {
    server.pages[0].acf.lld_home.primary_cta.destination = destination;
    expect((await invoke(server.handler)).body.hero.primaryCta.destination).toBe('');
  }
});

test('statistics count distinct categories and classified products once, without parsing names', () => {
  const products = [
    {
      id: 1,
      categories: [{ id: 'ai-prompt-packs' }, { id: 'business' }],
      tags: [{ id: 'ai-prompts' }],
    },
    {
      id: 2,
      categories: [{ id: 'business' }],
      tags: [{ id: 'downloadable' }, { id: 'ai-prompts' }],
    },
    { id: 3, name: '500 AI prompts in the title alone', categories: [{ id: 'business' }] },
  ];
  expect(catalogStatistics([...products, products[0]])).toEqual({
    categoryCount: 2,
    aiPromptProductCount: 2,
  });
  expect(catalogStatistics([])).toEqual({ categoryCount: 0, aiPromptProductCount: 0 });
});

for (const width of [320, 393, 1440]) {
  test(`CMS hero preserves navigation and fits at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Created in WordPress Digital Essentials For your business',
    );
    await expect(page.getByText('Published badge')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
      'font-family',
      /Playfair Display/,
    );
    await expect(page.getByRole('heading', { name: 'Featured Products', exact: true })).toHaveCSS(
      'font-family',
      /Plus Jakarta Sans/,
    );
    await expect(page.getByText(homeRecord.acf.lld_intro)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Featured Products', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Featured in WordPress')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Product Categories', exact: true })).toHaveText(
      '1Product Categories',
    );
    await expect(page.getByRole('group', { name: 'AI Prompt Products', exact: true })).toHaveText(
      '1AI Prompt Products',
    );
    await expect(page.getByRole('group', { name: 'Support', exact: true })).toContainText('24hr');
    await expect(page.getByRole('group', { name: 'Digital', exact: true })).toContainText('100%');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Browse the catalog', exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Created in WordPress');
    await expect(page.getByRole('button', { name: 'Open cart (1)' })).toBeVisible();
    await page.getByRole('button', { name: 'Our story', exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
  });
}

test('hero and counts refresh without resetting the page; reload sees fresh copy', async ({
  page,
}) => {
  const server = await setup(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Created in WordPress');
  server.pages[0].acf.lld_home.hero_prefix = 'New hero copy';
  server.products.push({
    ...product,
    id: 27,
    categories: [{ id: 2, name: 'Business', slug: 'business' }],
  });
  await page.clock.runFor(30_001);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('New hero copy');
  await expect(page.getByRole('group', { name: 'Product Categories', exact: true })).toHaveText(
    '2Product Categories',
  );
  await expect(page.getByRole('group', { name: 'AI Prompt Products', exact: true })).toHaveText(
    '2AI Prompt Products',
  );
  server.fail = true;
  await refocus(page);
  await page.clock.runFor(7000);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('New hero copy');
  await expect(page.getByRole('alert')).toHaveCount(0);
  server.fail = false;
  server.pages[0].acf.lld_home.hero_prefix = 'Saved before reload';
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Saved before reload');
  server.pages = [];
  await refocus(page);
  await expect(page.getByRole('alert')).toContainText('Homepage introduction is unavailable');
  await expect(page.getByText('Saved before reload')).toHaveCount(0);
});

test('hero loading and retry leave the catalog usable and never show sample hero copy', async ({
  page,
}) => {
  const server = await setup(page);
  let release;
  server.hold = new Promise((resolve) => {
    release = resolve;
  });
  server.fail = true;
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'Loading homepage introduction' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Details →', exact: true })).toBeVisible();
  await expect(page.getByText('Beautifully Crafted', { exact: true })).toHaveCount(0);
  release();
  for (let attempt = 0; attempt < 4; attempt++) await page.clock.runFor(3000);
  await expect(page.getByRole('button', { name: 'Retry homepage content' })).toBeVisible();
  server.fail = false;
  await page.getByRole('button', { name: 'Retry homepage content' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Created in WordPress');
});

test('optional fields stay hidden and long CMS text fits; links retain safe destinations', async ({
  page,
}) => {
  const server = await setup(page);
  await page.setViewportSize({ width: 320, height: 700 });
  const acf = server.pages[0].acf;
  acf.lld_eyebrow = '';
  acf.lld_intro = '';
  acf.lld_heading = 'An exceptionally long homepage heading that still fits a phone screen';
  Object.assign(acf.lld_home, {
    hero_prefix: '',
    hero_highlight: '',
    hero_suffix: '',
    primary_cta: {
      label: 'An exceptionally long call to action label',
      destination: 'https://store.example/contact?from=hero',
    },
    secondary_cta: { label: 'Unsafe link', destination: 'javascript:alert(1)' },
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(acf.lld_heading);
  await expect(page.getByText('Published badge')).toHaveCount(0);
  await expect(page.getByText('Unsafe link')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'An exceptionally long call to action label' }).click();
  await expect(page).toHaveURL(/\/contact\?from=hero$/);
  const homeReload = page.waitForResponse((response) =>
    response.url().endsWith('/api/content?resource=home'),
  );
  await page.goBack();
  await homeReload;
  acf.lld_home.secondary_cta = {
    label: 'Visit our partner',
    destination: 'https://partner.example',
  };
  await refocus(page);
  await expect(page.getByRole('link', { name: 'Visit our partner' })).toHaveAttribute(
    'href',
    'https://partner.example/',
  );
});

test('catalog errors do not advertise zero counts, and an empty catalog later reports zero', async ({
  page,
}) => {
  const server = cms();
  server.catalogFail = true;
  await setup(page, server);
  await page.goto('/');
  await expect(
    page
      .getByRole('group', { name: 'Product Categories', exact: true })
      .getByRole('status', { name: 'Loading product categories count' }),
  ).toBeVisible();
  for (let attempt = 0; attempt < 4; attempt++) await page.clock.runFor(3000);
  const count = page.getByRole('group', { name: 'Product Categories', exact: true });
  await expect(count.getByLabel('Currently unavailable')).toBeVisible();
  await expect(count).not.toContainText('0');
  server.catalogFail = false;
  server.products = [];
  await refocus(page);
  await expect(count).toHaveText('0Product Categories');
  await expect(page.getByRole('group', { name: 'AI Prompt Products', exact: true })).toHaveText(
    '0AI Prompt Products',
  );
});

const block = (id, title, kind = 'trust') => ({
  id,
  type: 'lld_block',
  status: 'publish',
  title: { rendered: title },
  excerpt: { rendered: `<p>Description for ${title}</p>`, protected: false },
  acf: {
    lld_kind: kind,
    lld_icon: kind === 'benefit' ? '✓' : '🔒',
    lld_stat_value: kind === 'stat' ? '42' : '',
    private_field: 'secret block',
  },
});
const article = (id, title = `Article ${id}`) => ({
  id,
  type: 'post',
  status: 'publish',
  slug: `article-${id}`,
  title: { rendered: title },
  date: '2026-09-18T01:30:00',
  excerpt: { rendered: '<p>A useful &amp; practical guide.</p>', protected: false },
  content: {
    rendered:
      '<h2>Start here</h2><p>First paragraph.</p><ul><li>First step</li><li>Second step</li></ul><p><strong>Ready to begin.</strong></p>',
    protected: false,
  },
  _embedded: {
    'wp:term': [[{ taxonomy: 'category', name: 'Business &amp; Growth' }]],
    'wp:featuredmedia': [
      {
        media_type: 'image',
        source_url: 'https://images.example/post.jpg',
        alt_text: 'A helpful guide',
      },
    ],
  },
  private_note: 'secret post',
});

function editorialCms() {
  const server = cms();
  const home = server.pages[0].acf.lld_home;
  home.trust_items = [22, 21];
  home.hero_stats = [25];
  home.about = {
    eyebrow: 'Meet us',
    heading: 'Our published story',
    body: '<p>Our <strong>real value</strong>.</p><p>Second paragraph.</p>',
    benefits: [24, 23],
    stats: [25],
    cta: { label: 'Meet the team', destination: '/about' },
  };
  server.blocks = [
    block(21, 'Fast delivery'),
    block(22, 'Secure purchases'),
    block(23, 'Lifetime access', 'benefit'),
    block(24, 'Ready to use', 'benefit'),
    block(25, 'Community projects', 'stat'),
  ];
  server.posts = [article(31), article(32), article(33), article(34)];
  return server;
}

test('home resolves selected blocks by kind and order, skips private/missing records and omits private data', async () => {
  const server = editorialCms();
  server.pages[0].acf.lld_home.trust_items = [22, 999, 23, 21, 22];
  server.blocks[0].status = 'draft';
  const result = await invoke(server.handler);
  expect(result.body.trustItems.map((item) => item.id)).toEqual([22]);
  expect(result.body.about.benefits.map((item) => item.id)).toEqual([24, 23]);
  expect(result.body.heroStats[0].value).toBe('42');
  expect(JSON.stringify(result.body)).not.toMatch(/secret|private_field|internal_secret/);
  const request = server.calls.find((url) => url.pathname.endsWith('/lld-blocks'));
  expect(request.searchParams.get('status')).toBe('publish');
  expect(request.searchParams.get('_lld_refresh')).toBeTruthy();
  server.blocks.find((item) => item.id === 22).excerpt.rendered = '<p>Updated description</p>';
  expect((await invoke(server.handler)).body.trustItems[0].description).toContain(
    'Updated description',
  );
});

test('article endpoint preserves selected order, pagination and slugs while excluding protected content', async () => {
  const server = editorialCms();
  const selected = await invoke(server.handler, '/api/content?resource=posts&include=33,31');
  expect(selected.body.posts.map((post) => post.id)).toEqual([33, 31]);
  expect(selected.body.posts[0].body).toBeUndefined();
  const paged = await invoke(server.handler, '/api/content?resource=posts&page=2&limit=3');
  expect(paged.body.posts.map((post) => post.id)).toEqual([34]);
  expect(paged.body.totalPages).toBe(2);
  const detail = await invoke(server.handler, '/api/content?resource=post&slug=article-31');
  expect(detail.body.body).toContain('<ul>');
  expect(detail.body.image.src).toBe('https://images.example/post.jpg');
  expect(JSON.stringify(detail.body)).not.toContain('secret post');
  server.posts[0].content.protected = true;
  expect((await invoke(server.handler, '/api/content?resource=post&slug=article-31')).status).toBe(
    404,
  );
  server.posts[1].status = 'draft';
  expect(
    (await invoke(server.handler, '/api/content?resource=posts')).body.posts.map((post) => post.id),
  ).toEqual([33, 34]);
  for (const query of [
    'resource=posts&limit=100',
    'resource=posts&page=-1',
    'resource=posts&include=3&include=4',
    'resource=posts&include=31&page=1',
    'resource=post&slug=../settings',
    'resource=post&slug=a&context=edit',
  ]) {
    expect((await invoke(server.handler, `/api/content?${query}`)).status).toBe(400);
  }
});

for (const width of [320, 1440]) {
  test(`complete homepage renders WordPress sections and safe rich text at ${width}px`, async ({
    page,
  }) => {
    const server = editorialCms();
    server.pages[0].acf.lld_home.blog.posts = [33, 31];
    server.pages[0].acf.lld_home.about.body +=
      '<script>window.cmsInjected=true</script><img src="x" onerror="window.cmsInjected=true"><p style="width:5000px" class="untrusted">Safe copy</p>';
    await setup(page, server);
    await page.route('https://images.example/**', (route) => route.fulfill({ status: 404 }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const trust = page.getByRole('region', { name: 'Store benefits' });
    await expect(trust.getByRole('heading')).toHaveText(['Secure purchases', 'Fast delivery']);
    await expect(trust.getByText('Description for Secure purchases')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Our published story' })).toBeVisible();
    const benefits = page.getByRole('list').filter({ hasText: 'Ready to use' });
    await expect(benefits.getByRole('listitem')).toContainText([
      '✓Ready to use',
      '✓Lifetime access',
    ]);
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /Article/ })).toHaveText(
      ['Article 33', 'Article 31'],
    );
    await expect(page.getByRole('group', { name: 'AI Prompt Products', exact: true })).toHaveText(
      '1AI Prompt Products',
    );
    expect(await page.evaluate(() => window.cmsInjected)).toBeUndefined();
    await expect(page.locator('.untrusted')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    // A change to a linked block must appear without reloading Vite or the browser.
    server.blocks.find((item) => item.id === 22).excerpt.rendered =
      '<p>Newly published trust description</p>';
    server.pages[0].acf.lld_home.more_title = 'Fresh collection title';
    await page.clock.runFor(30_001);
    await expect(trust.getByText('Newly published trust description')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fresh collection title' })).toBeVisible();
    await page.getByRole('link', { name: 'Read More: Article 33', exact: true }).click();
    await expect(page).toHaveURL(/\/blog\/article-33$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article 33');
    await expect(page.getByRole('listitem')).toHaveText(['First step', 'Second step']);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article 33');
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article 33');
    await page.getByRole('link', { name: 'Back to blog' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog');
    await expect(page.getByRole('link', { name: /^Read More:/ })).toHaveCount(4);
  });
}

test('articles support loading, retry, pagination, background edits and deleted/empty states', async ({
  page,
}) => {
  const server = editorialCms();
  server.posts = Array.from({ length: 10 }, (_, index) => article(31 + index));
  await setup(page, server);
  let release;
  server.postsHold = new Promise((resolve) => {
    release = resolve;
  });
  server.postsFail = true;
  await page.goto('/blog');
  await expect(page.getByRole('status', { name: 'Loading blog posts' })).toBeVisible();
  release();
  for (let i = 0; i < 4; i++) await page.clock.runFor(3000);
  await expect(page.getByRole('button', { name: 'Retry articles' })).toBeVisible();
  server.postsFail = false;
  await page.getByRole('button', { name: 'Retry articles' }).click();
  await expect(page.getByRole('link', { name: /^Read More:/ })).toHaveCount(9);
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page.getByRole('link', { name: /^Read More:/ })).toHaveCount(1);
  await page.getByRole('link', { name: 'Read More: Article 40', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article 40');
  server.posts[9].content.rendered = '<p>Edited article body</p>';
  await page.clock.runFor(30_001);
  await expect(page.getByText('Edited article body')).toBeVisible();
  server.postsFail = true;
  await refocus(page);
  await page.clock.runFor(7000);
  await expect(page.getByText('Edited article body')).toBeVisible();
  server.postsFail = false;
  server.posts = [];
  await refocus(page);
  await expect(page.getByRole('heading', { name: 'Article not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to blog' }).click();
  await expect(page.getByText('No articles have been published here yet.')).toBeVisible();
});

test('temporary WordPress rate limits retry safely and repeated throttling stays an error', async () => {
  let calls = 0;
  const handler = createContentHandler({
    cacheTtl: 0,
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    fetcher: async () => {
      calls++;
      return calls === 1
        ? new Response('Slow down', { status: 429, headers: { 'Retry-After': '0' } })
        : Response.json([homeRecord]);
    },
  });
  expect((await invoke(handler)).status).toBe(200);
  expect(calls).toBe(2);
  calls = 0;
  const limited = createContentHandler({
    cacheTtl: 0,
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    fetcher: async () => {
      calls++;
      return new Response('Slow down', { status: 429, headers: { 'Retry-After': '0' } });
    },
  });
  const result = await invoke(limited);
  expect(result.status).toBe(502);
  expect(result.headers['Cache-Control']).toBe('no-store');
  expect(calls).toBe(2);
});

test('warm content requests are shared and expire so publishing is still reflected', async () => {
  let now = 1000;
  let calls = 0;
  let records = [structuredClone(homeRecord)];
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const handler = createContentHandler({
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    preview: false,
    now: () => now,
    fetcher: async () => {
      calls++;
      await held;
      return Response.json(records);
    },
  });
  const first = invoke(handler);
  const concurrent = invoke(handler);
  expect(calls).toBe(1);
  release();
  expect((await first).status).toBe(200);
  expect((await concurrent).status).toBe(200);
  await invoke(handler);
  expect(calls).toBe(1);
  records[0].acf.lld_home.hero_prefix = 'Fresh after cache expires';
  now += 10_001;
  expect((await invoke(handler)).body.hero.prefix).toBe('Fresh after cache expires');
  expect(calls).toBe(2);
  records = [];
  now += 10_001;
  expect((await invoke(handler)).status).toBe(404);
});

test('build snapshot uses published content and safely embeds HTML in the document', async () => {
  const server = editorialCms();
  server.pages[0].acf.lld_intro = '</script><script>window.injected=true</script>';
  const snapshot = await createBootstrap({
    handler: server.handler,
    cmsUrl: 'https://content.example.test/wp-json/wp/v2',
  });
  expect(snapshot.entries.home.data.hero.prefix).toBe('Created in WordPress');
  expect(snapshot.entries['posts:1:3:'].data.posts).toHaveLength(3);
  expect(snapshot.entries['post:article-31'].data.body).toContain('First paragraph');
  expect(bootstrapTag(snapshot).children).not.toContain('</script>');
  expect(JSON.parse(bootstrapTag(snapshot).children).entries.home.data.hero.intro).toContain(
    '</script>',
  );
  // A failed revalidation retains the last published snapshot, never demo copy.
  server.fail = true;
  const retained = await createBootstrap({
    handler: server.handler,
    cmsUrl: snapshot.cmsUrl,
    previous: snapshot,
  });
  expect(retained.entries.home).toEqual(snapshot.entries.home);
});

async function injectSnapshot(page, snapshot) {
  await page.route('http://127.0.0.1:5185/', async (route) => {
    const response = await route.fetch();
    const tag = bootstrapTag(snapshot);
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        '</head>',
        `<script type="application/json" id="lld-content">${tag.children}</script></head>`,
      ),
    });
  });
}

for (const width of [393, 1440]) {
  test(`hero and blog render without waiting for any CMS response at ${width}px`, async ({
    page,
  }) => {
    const server = editorialCms();
    const snapshot = await createBootstrap({
      handler: server.handler,
      cmsUrl: 'https://content.example.test/wp-json/wp/v2',
    });
    await setup(page, server);
    await injectSnapshot(page, snapshot);
    await page.route('https://images.example/**', (route) => route.fulfill({ status: 404 }));
    await page.setViewportSize({ width, height: 900 });
    let release;
    server.hold = server.postsHold = new Promise((resolve) => {
      release = resolve;
    });
    try {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Created in WordPress');
      await expect(
        page.getByRole('link', { name: 'Read More: Article 31', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('status', { name: 'Loading homepage introduction' })).toHaveCount(
        0,
      );
      await expect(page.getByRole('status', { name: 'Loading blog posts' })).toHaveCount(0);
      // The gradient must extend below its line box for font descenders, including g.
      const paint = await page
        .getByRole('heading', { level: 1 })
        .locator('span')
        .nth(1)
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            padding: parseFloat(style.paddingBottom),
            size: parseFloat(style.fontSize),
            height: node.getBoundingClientRect().height,
            line: parseFloat(style.lineHeight),
          };
        });
      expect(paint.padding).toBeGreaterThanOrEqual(paint.size * 0.19);
      expect(paint.height).toBeGreaterThan(paint.line);
      await page.getByRole('link', { name: 'Read More: Article 31', exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Article 31');
      await expect(page.getByText('First paragraph.')).toBeVisible();
    } finally {
      release();
    }
  });
}

test('reload uses the latest successful browser copy and removals override older build snapshots', async ({
  page,
}) => {
  const server = editorialCms();
  const snapshot = await createBootstrap({
    handler: server.handler,
    cmsUrl: 'https://content.example.test/wp-json/wp/v2',
  });
  await setup(page, server);
  await injectSnapshot(page, snapshot);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Created in WordPress');
  server.pages[0].acf.lld_home.hero_prefix = 'New published heading';
  await page.clock.runFor(30_001);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('New published heading');
  server.fail = true;
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('New published heading');
  server.fail = false;
  server.pages = [];
  await refocus(page);
  await expect(page.getByRole('alert')).toContainText('Homepage introduction is unavailable');
  server.fail = true;
  await page.reload();
  await expect(page.getByText('Created in WordPress', { exact: true })).toHaveCount(0);
  await expect(page.getByText('New published heading', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('alert')).toContainText('Homepage introduction is unavailable');
});
