import { expect, test } from '@playwright/test';
import { createContentHandler } from '../api/content.js';

const record = {
  id: 196,
  slug: 'storefront',
  status: 'publish',
  type: 'lld_settings',
  meta: { private_note: 'Do not expose this' },
  acf: {
    lld_brand: {
      name: 'CMS Store',
      legal_name: 'CMS Store LLC',
      website: 'https://store.example',
      tagline: 'Edited in WordPress',
      logo: { attachment: 197, public_url: '', alt: 'CMS logo' },
    },
    lld_contact: { email: 'help@store.example', social_handle: '', response_note: '', hours: '' },
    lld_social: { instagram: 'https://instagram.com/example', facebook: '' },
    lld_announcement: {
      enabled: false,
      message: '',
      coupon_code: '',
      delivery_note: '',
      cta: { label: '', destination: '' },
    },
    lld_footer: {
      description: 'A published footer description.',
      company_heading: 'Our company',
      support_heading: 'Get help',
      contact_heading: 'Write to us',
      copyright_name: '',
    },
    internal_secret: 'Never copy arbitrary fields',
  },
};

async function invokeHandler(handler, request = {}) {
  const result = { headers: {} };
  await handler(
    { method: 'GET', url: '/api/content?resource=settings', ...request },
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

async function runHandler({
  records = [record],
  mediaFails = false,
  request = {},
  config = {},
} = {}) {
  const calls = [];
  const handler = createContentHandler({
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    fetcher: async (url) => {
      calls.push(url);
      const media = url.pathname.includes('/media/');
      return new Response(
        JSON.stringify(
          media
            ? {
                id: 197,
                media_type: 'image',
                source_url: 'https://images.example/logo.png',
                alt_text: 'Uploaded logo',
              }
            : records,
        ),
        { status: media && mediaFails ? 404 : 200 },
      );
    },
    ...config,
  });
  return { ...(await invokeHandler(handler, request)), calls };
}

// Model the CMS edge observed in staging: response snapshots cached by URL,
// even when request headers ask it to revalidate. Publishing changes the origin.
function cachedWordPress() {
  const origin = {
    record: structuredClone(record),
    media: {
      id: 197,
      media_type: 'image',
      source_url: 'https://images.example/logo.png',
      alt_text: 'Uploaded logo',
    },
  };
  const cache = new Map();
  return {
    origin,
    fetcher: async (url) => {
      if (!cache.has(url.href)) {
        cache.set(
          url.href,
          JSON.stringify(url.pathname.includes('/media/') ? origin.media : [origin.record]),
        );
      }
      return new Response(cache.get(url.href));
    },
  };
}

for (const preview of [true, false]) {
  test(`a running ${preview ? 'local/preview' : 'production'} handler reads published edits through the CMS cache`, async () => {
    const cms = cachedWordPress();
    const handler = createContentHandler({
      baseUrl: 'https://content.example.test/wp-json/wp/v2',
      preview,
      fetcher: cms.fetcher,
    });
    expect((await invokeHandler(handler)).body.footer.description).toBe(
      'A published footer description.',
    );

    cms.origin.record.acf.lld_footer.description = 'Newly published footer.';
    cms.origin.record.acf.lld_contact.email = 'updated@store.example';
    cms.origin.media.source_url = 'https://images.example/updated-logo.png';
    const updated = await invokeHandler(handler);
    expect(updated.status).toBe(200);
    expect(updated.body.footer.description).toBe('Newly published footer.');
    expect(updated.body.contact.email).toBe('updated@store.example');
    expect(updated.body.brand.logo.src).toBe('https://images.example/updated-logo.png');
    expect(updated.headers['Cache-Control']).toBe(
      preview ? 'no-store' : 'public, max-age=0, s-maxage=30, must-revalidate',
    );
  });
}

test('content endpoint reads only the published singleton and maps public fields', async () => {
  const result = await runHandler();
  expect(result.status).toBe(200);
  expect(result.calls[0].pathname).toBe('/wp-json/wp/v2/lld-settings');
  expect(result.calls[0].searchParams.get('slug')).toBe('storefront');
  expect(result.calls[0].searchParams.get('status')).toBe('publish');
  expect(result.body.brand.logo).toEqual({
    src: 'https://images.example/logo.png',
    alt: 'CMS logo',
  });
  expect(result.body.contact.email).toBe('help@store.example');
  expect(result.body.footer.copyrightName).toBe('CMS Store');
  expect(result.headers['Cache-Control']).toBe('no-store');
  expect(JSON.stringify(result.body)).not.toMatch(/private_note|internal_secret|meta|Never copy/);
});

test('a missing logo does not prevent settings from loading', async () => {
  const result = await runHandler({ mediaFails: true });
  expect(result.status).toBe(200);
  expect(result.body.brand.logo.src).toBe('');
  expect(result.body.contact.email).toBe('help@store.example');
});

test('only public HTTPS links are returned, with storefront URLs mapped to local routes', async () => {
  const updated = structuredClone(record);
  updated.acf.lld_brand.logo.public_url = 'https://images.example/public-logo.png';
  updated.acf.lld_social.instagram = 'javascript:alert(1)';
  updated.acf.lld_announcement.cta = {
    label: 'Browse',
    destination: 'https://store.example/products?sort=price',
  };
  const result = await runHandler({ records: [updated] });
  expect(result.calls).toHaveLength(1);
  expect(result.body.social.instagram).toBe('');
  expect(result.body.announcement.cta.destination).toBe('/products?sort=price');
  for (const destination of [
    'javascript:alert(1)',
    '//evil.example',
    '/\\evil.example',
    'https://user:pass@evil.example',
  ]) {
    updated.acf.lld_announcement.cta.destination = destination;
    expect((await runHandler({ records: [updated] })).body.announcement.cta.destination).toBe('');
  }
});

test('content route rejects writes and arbitrary resources without upstream calls', async () => {
  for (const request of [
    { method: 'POST' },
    { url: '/api/content?resource=users' },
    { url: '/api/content?resource=settings&url=https://other.example' },
    { url: '/api/content?resource=settings&resource=media' },
  ]) {
    const result = await runHandler({ request });
    expect(result.status).toBe(request.method === 'POST' ? 405 : 400);
    expect(result.calls).toHaveLength(0);
  }
});

test('missing, malformed and unpublished settings fail without sample content', async () => {
  for (const [records, status] of [
    [[], 404],
    [{}, 502],
    [[{ ...record, status: 'draft' }], 502],
    [[{ ...record, acf: {} }], 502],
    [[record, record], 502],
  ]) {
    const result = await runHandler({ records });
    expect(result.status).toBe(status);
    expect(result.body.brand).toBeUndefined();
    expect(result.headers['Cache-Control']).toBe('no-store');
  }
  expect((await runHandler({ config: { baseUrl: '' } })).status).toBe(503);
});

test('production content uses a short shared cache and upstream failures remain uncached', async () => {
  const success = await runHandler({ config: { preview: false } });
  expect(success.headers['Cache-Control']).toContain('s-maxage=30');
  const failure = await runHandler({
    config: {
      preview: false,
      fetcher: async () => {
        throw new Error('private backend detail');
      },
    },
  });
  expect(failure.status).toBe(502);
  expect(failure.headers['Cache-Control']).toBe('no-store');
  expect(JSON.stringify(failure.body)).not.toContain('private backend detail');
});

async function setup(page, handler) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.install();
  const server = { settings: (await runHandler()).body, failure: false, hold: null };
  await page.route('**/api/content?resource=settings', async (route) => {
    if (server.hold) await server.hold;
    if (handler) {
      const result = await invokeHandler(handler);
      return route.fulfill({ status: result.status, headers: result.headers, json: result.body });
    }
    await route.fulfill(
      server.failure ? { status: 502, json: { error: 'Unavailable' } } : { json: server.settings },
    );
  });
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({ headers: { 'X-WP-TotalPages': '1' }, json: [] }),
  );
  await page.route('https://images.example/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="purple"/></svg>',
    }),
  );
  return server;
}

test('published footer edits appear on the next poll and page reload without restarting the handler', async ({
  page,
}) => {
  const cms = cachedWordPress();
  const handler = createContentHandler({
    baseUrl: 'https://content.example.test/wp-json/wp/v2',
    fetcher: cms.fetcher,
  });
  await setup(page, handler);
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toContainText('A published footer description.');

  cms.origin.record.acf.lld_footer.description = 'Updated while the storefront stays open.';
  await page.clock.runFor(30_001);
  await expect(footer).toContainText('Updated while the storefront stays open.');

  cms.origin.record.acf.lld_footer.description = 'Published immediately before reload.';
  await page.reload();
  await expect(footer).toContainText('Published immediately before reload.');
});

async function refocus(page) {
  await page.evaluate(() => {
    for (const state of ['hidden', 'visible']) {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
    }
  });
}

test('published brand, logo, footer and contact details appear on the existing pages', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'CMS Store home' })).toBeVisible();
  await expect(page.locator('header img')).toHaveAttribute(
    'src',
    'https://images.example/logo.png',
  );
  const footer = page.locator('footer');
  await expect(footer).toContainText('A published footer description.');
  await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
    'href',
    'https://instagram.com/example',
  );
  await expect(footer).not.toContainText('Facebook');
  await expect(page.locator('header')).not.toContainText('WELCOME10');
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: /Email help@store.example/ })).toHaveAttribute(
    'href',
    'mailto:help@store.example',
  );
  await expect(
    page.getByText('We reply to all messages within 24 hours', { exact: false }),
  ).toHaveCount(0);
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'CMS Store', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('help@store.example');
  await expect(page.locator('main')).not.toContainText('support@lldhome.com');
});

test('first-load skeleton and retry do not replace the product area or show stale announcements', async ({
  page,
}) => {
  const server = await setup(page);
  let release;
  server.hold = new Promise((resolve) => {
    release = resolve;
  });
  server.failure = true;
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'Loading site details' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explore Our Products' })).toBeVisible();
  await expect(page.locator('header')).not.toContainText('WELCOME10');
  release();
  // Advance retry delays without waiting on the popup timer.
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.clock.runFor(3000);
  }
  await expect(page.getByRole('button', { name: 'Retry site details' })).toBeVisible();
  server.failure = false;
  await page.getByRole('button', { name: 'Retry site details' }).click();
  await expect(page.getByRole('button', { name: 'CMS Store home' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('background publishing updates copy and announcement links without resetting navigation', async ({
  page,
}) => {
  const server = await setup(page);
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'CMS Store', exact: true })).toBeVisible();
  server.settings = {
    ...server.settings,
    brand: { ...server.settings.brand, name: 'Updated Store' },
    announcement: {
      enabled: true,
      message: 'New collection available',
      couponCode: '',
      deliveryNote: '',
      cta: { label: 'Browse collection', destination: '/products' },
    },
  };
  await refocus(page);
  await expect(page.getByRole('heading', { name: 'Updated Store', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole('link', { name: 'Browse collection' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  server.failure = true;
  await refocus(page);
  await expect(page.getByRole('heading', { name: 'Updated Store', exact: true })).toBeVisible();
  await expect(page.getByRole('status', { name: 'Loading site details' })).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  server.failure = false;
  server.settings.announcement.enabled = false;
  await refocus(page);
  await expect(page.getByRole('link', { name: 'Browse collection' })).toHaveCount(0);
});
