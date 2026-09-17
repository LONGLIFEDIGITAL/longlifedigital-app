import { expect, test } from '@playwright/test';

const product = {
  id: 15,
  name: 'Business Spreadsheet Toolkit',
  type: 'simple',
  description: '<p>A practical digital toolkit.</p>',
  short_description: '<p>Start planning your business.</p>',
  prices: { price: '2900', regular_price: '2900', currency_code: 'USD', currency_minor_unit: 2 },
  categories: [{ id: 1, name: 'Business Startup Toolkits', slug: 'business-startup-toolkits' }],
  images: [],
  tags: [],
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
};

async function catalogServer(page, initialProducts = [product]) {
  const server = { products: initialProducts, featured: [], fail: false, requests: 0, hold: null };
  await page.route('**/api/catalog?**', async (route) => {
    if (server.hold) await server.hold;
    if (!new URL(route.request().url()).searchParams.has('featured')) server.requests++;
    await route.fulfill(
      server.fail
        ? { status: 502, json: { error: 'Unavailable' } }
        : {
            headers: { 'X-WP-TotalPages': '1' },
            json: new URL(route.request().url()).searchParams.has('featured')
              ? server.featured
              : server.products,
          },
    );
  });
  return server;
}

async function visibility(page, state) {
  // Exercise the browser event TanStack Query listens to, without accessing query internals.
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, state);
}

async function dismissNewsletter(page) {
  const dialog = page.getByRole('dialog', { name: 'Join the community' });
  if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Close dialog' }).click();
}

async function advancePoll(page) {
  await page.clock.fastForward(30_001);
  await dismissNewsletter(page);
}

const skeletons = (page) => page.locator('[role="status"][aria-busy="true"]');

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('polling updates published fields without resetting the page, filters or cart', async ({
  page,
}) => {
  const server = await catalogServer(page);
  let documentLoads = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentLoads++;
  });
  await page.goto('/products');
  const card = page.getByRole('article').first();
  await card.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search products', exact: true }).fill('Toolkit');
  await page.getByRole('combobox', { name: 'Sort products' }).selectOption('price-desc');
  const category = page.getByText('Business Startup Toolkits', { exact: true }).first();
  await category.click();
  server.products = [
    {
      ...product,
      name: 'Updated Business Toolkit',
      prices: { ...product.prices, price: '4900' },
      short_description: '<p>Updated directly from WordPress.</p>',
    },
  ];
  await advancePoll(page);
  await expect(card).toContainText('Updated Business Toolkit');
  await expect(card).toContainText('Updated directly from WordPress.');
  await expect(card.getByText('$49', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search products', exact: true })).toHaveValue(
    'Toolkit',
  );
  await expect(page.getByRole('combobox', { name: 'Sort products' })).toHaveValue('price-desc');
  await expect(page.getByRole('button', { name: 'Open cart (1)' })).toBeVisible();
  await expect(skeletons(page)).toHaveCount(0);
  expect(documentLoads).toBe(1);
});

test('returning to the tab refreshes even before the next polling interval', async ({ page }) => {
  const server = await catalogServer(page);
  await page.goto('/products/15');
  await expect(page.getByRole('heading', { name: product.name, level: 1 })).toBeVisible();
  await visibility(page, 'hidden');
  server.products = [
    {
      ...product,
      name: 'New WordPress title',
      description: '<p>New WordPress description.</p>',
      is_in_stock: false,
    },
  ];
  await visibility(page, 'visible');
  await expect(page.getByRole('heading', { name: 'New WordPress title', level: 1 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Product description' })).toContainText(
    'New WordPress description.',
  );
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled();
  await expect(skeletons(page)).toHaveCount(0);
});

test('hidden tabs stop polling and catch up when visible', async ({ page }) => {
  const server = await catalogServer(page);
  await page.goto('/products');
  await expect(page.getByRole('article')).toHaveCount(1);
  const initialRequests = server.requests;
  await visibility(page, 'hidden');
  server.products = [product, { ...product, id: 16, name: 'New Product' }];
  await page.clock.fastForward(90_001);
  expect(server.requests).toBe(initialRequests);
  await visibility(page, 'visible');
  await dismissNewsletter(page);
  await expect(page.getByRole('article')).toHaveCount(2);
});

test('offline polling pauses and a network reconnect refreshes the catalog', async ({
  page,
  context,
}) => {
  const server = await catalogServer(page);
  await page.goto('/products');
  await expect(page.getByRole('article')).toHaveCount(1);
  const initialRequests = server.requests;
  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  server.products = [{ ...product, name: 'Updated after reconnect' }];
  await advancePoll(page);
  expect(server.requests).toBe(initialRequests);
  await expect(skeletons(page)).toHaveCount(0);
  await context.setOffline(false);
  await expect(page.getByRole('article')).toContainText('Updated after reconnect');
});

test('slow and failed refreshes retain the last successful catalog and recover', async ({
  page,
}) => {
  const server = await catalogServer(page);
  await page.goto('/products');
  await expect(page.getByRole('article')).toHaveCount(1);
  const initialRequests = server.requests;
  let release;
  server.hold = new Promise((resolve) => {
    release = resolve;
  });
  server.fail = true;
  await advancePoll(page);
  await expect(page.getByRole('article')).toContainText(product.name);
  await expect(skeletons(page)).toHaveCount(0);
  release();
  // Includes two automatic retries, using TanStack Query's backoff.
  await expect
    .poll(() => server.requests, { timeout: 7000 })
    .toBeGreaterThanOrEqual(initialRequests + 3);
  await expect(page.getByRole('article')).toContainText(product.name);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(skeletons(page)).toHaveCount(0);
  server.fail = false;
  server.products = [{ ...product, name: 'Recovered catalog' }];
  await visibility(page, 'hidden');
  await visibility(page, 'visible');
  await expect(page.getByRole('article')).toContainText('Recovered catalog');
});

test('an empty catalog picks up new products, categories and featured selections', async ({
  page,
}) => {
  const server = await catalogServer(page, []);
  await page.goto('/');
  await expect(page.getByText('No products available yet.')).toBeVisible();
  server.products = [product];
  server.featured = [product];
  await advancePoll(page);
  await expect(page.getByRole('heading', { name: 'Featured Products', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Details →', exact: true })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Featured Products', exact: true }).getByRole('article'),
  ).toContainText(product.name);
  await expect(page.getByText('Business Startup Toolkits', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('No products available yet.')).toHaveCount(0);
});

test('a product removed from the CMS stops showing on its open detail page', async ({ page }) => {
  const server = await catalogServer(page);
  await page.goto('/products/15');
  await expect(page.getByRole('heading', { name: product.name, level: 1 })).toBeVisible();
  server.products = [];
  await advancePoll(page);
  await expect(page.getByRole('heading', { name: 'Product not found', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toHaveCount(0);
});
