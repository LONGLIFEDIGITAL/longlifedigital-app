import { expect, test } from '@playwright/test';

const products = [
  'Business Spreadsheet Toolkit',
  'Client Welcome Kit',
  'Budget Planner',
  'Business Course',
].map((name, index) => ({
  id: 15 + index,
  name,
  type: 'simple',
  description:
    '<p>A practical digital toolkit for your business.</p><ul><li>Ready to use</li><li>Instant download</li></ul>',
  short_description:
    '<p>Track revenue, expenses, budgets and monthly performance with this toolkit.</p>',
  prices: { price: '2900', regular_price: '2900', currency_code: 'USD', currency_minor_unit: 2 },
  categories:
    index === 3
      ? [{ id: 2, name: 'Courses', slug: 'courses' }]
      : [{ id: 1, name: 'Business Startup Toolkits', slug: 'business-startup-toolkits' }],
  images: [{ src: `https://images.example.test/${index}.svg`, alt: `${name} preview` }],
  tags: [],
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
}));

function gate() {
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  return { ready, release };
}

async function mockCatalog(page, ready = Promise.resolve(), items = products) {
  await page.route('**/api/catalog?**', async (route) => {
    await ready;
    await route.fulfill({
      headers: { 'X-WP-TotalPages': '1' },
      json: new URL(route.request().url()).searchParams.has('featured') ? [] : items,
    });
  });
}

async function mockImages(page, ready = Promise.resolve(), fail = false) {
  await page.route('https://images.example.test/**', async (route) => {
    await ready;
    await route.fulfill({
      status: fail ? 404 : 200,
      contentType: fail ? 'text/plain' : 'image/svg+xml',
      body: fail
        ? 'Image unavailable'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#ae8abc"/></svg>',
    });
  });
}

const busy = (page, label) => page.getByRole('status', { name: label, exact: true });
const loadingRegions = (page) => page.locator('[role="status"][aria-busy="true"]');

for (const width of [320, 393, 1440]) {
  test(`homepage skeletons reserve responsive product layouts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const data = gate();
    await mockCatalog(page, data.ready);
    await mockImages(page);
    await page.goto('/');
    await expect(busy(page, 'Loading featured product')).toBeVisible();
    await expect(busy(page, 'Loading product categories')).toBeVisible();
    await expect(busy(page, 'Loading product count')).toBeVisible();
    await expect(busy(page, 'Loading footer categories')).toBeAttached();
    const collection = busy(page, 'Loading Explore Our Products');
    await expect(collection).toHaveAttribute('aria-busy', 'true');
    await expect(collection.locator('[data-product-skeleton]')).toHaveCount(4);
    await expect(
      busy(page, 'Loading More to Explore').locator('[data-product-skeleton]'),
    ).toHaveCount(4);
    await expect(collection.getByRole('button')).toHaveCount(0);
    await expect(collection.getByRole('article')).toHaveCount(0);
    await expect(page.getByText('0 items', { exact: true })).toHaveCount(0);
    const skeletons = await collection.locator('[data-product-skeleton]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        x: node.getBoundingClientRect().x,
        y: node.getBoundingClientRect().y,
        width: node.getBoundingClientRect().width,
        height: node.getBoundingClientRect().height,
      })),
    );
    if (width < 768) {
      expect(skeletons[0].y).toBe(skeletons[1].y);
      expect(skeletons[2].y).toBe(skeletons[3].y);
      expect(skeletons[2].y).toBeGreaterThan(skeletons[0].y);
      expect(skeletons[0].width).toBeGreaterThan(125);
      expect(skeletons[0].height).toBeLessThan(310);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await collection.screenshot({ path: `test-results/skeleton-collection-${width}.png` });
    data.release();
    await expect(loadingRegions(page)).toHaveCount(0);
    const actual = page
      .getByRole('region', { name: 'Explore Our Products', exact: true })
      .getByRole('article')
      .first();
    await expect(actual).toBeVisible();
    const card = await actual.boundingBox();
    expect(Math.abs(card.width - skeletons[0].width)).toBeLessThanOrEqual(1);
    expect(Math.abs(card.height - skeletons[0].height)).toBeLessThan(35);
  });
}

for (const width of [393, 1440]) {
  test(`shop filters and detail pages show skeletons while the CMS loads at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const data = gate();
    await mockCatalog(page, data.ready);
    await mockImages(page);
    await page.goto('/products');
    await expect(busy(page, 'Loading All Products')).toBeVisible();
    await expect(busy(page, 'Loading categories').filter({ visible: true })).toHaveCount(1);
    await expect(busy(page, 'Loading product count')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sort products' })).toBeDisabled();
    await expect(page.getByText('No products found.')).toHaveCount(0);
    await page.goto('/products/15');
    const detail = busy(page, 'Loading product details');
    await expect(detail).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product not found' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await detail.screenshot({ path: `test-results/skeleton-detail-${width}.png` });
    data.release();
    await expect(detail).toHaveCount(0);
    await expect(page.getByRole('heading', { name: products[0].name, level: 1 })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add to Cart', exact: true }).first(),
    ).toBeEnabled();
    await page.goBack();
    await expect(page.getByRole('combobox', { name: 'Sort products' })).toBeEnabled();
    await expect(page.getByRole('article')).toHaveCount(4);
    await expect(loadingRegions(page)).toHaveCount(0);
  });
}

test('course sections wait for data without showing premature empty states', async ({ page }) => {
  const data = gate();
  await mockCatalog(page, data.ready);
  await mockImages(page);
  await page.goto('/courses');
  await expect(busy(page, 'Loading courses')).toBeVisible();
  await expect(busy(page, 'Loading other products')).toBeVisible();
  await expect(page.getByText('Courses coming soon!')).toHaveCount(0);
  data.release();
  await expect(loadingRegions(page)).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(4);
  await expect(page.getByRole('article').first()).toContainText('Business Course');
});

test('errors stop skeletons; retry restores them and an empty response settles', async ({
  page,
}) => {
  const retry = gate();
  let fail = true;
  await page.route('**/api/catalog?**', async (route) => {
    if (fail) return route.fulfill({ status: 502, json: { error: 'Unavailable' } });
    await retry.ready;
    await route.fulfill({ headers: { 'X-WP-TotalPages': '1' }, json: [] });
  });
  await page.goto('/products');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(loadingRegions(page)).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(busy(page, 'Loading All Products')).toBeVisible();
  retry.release();
  await expect(loadingRegions(page)).toHaveCount(0);
  await expect(page.getByText('No products found.')).toBeVisible();
});

test('skeletons respect reduced motion and navigation stays usable while loading', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const data = gate();
  await mockCatalog(page, data.ready);
  await mockImages(page);
  await page.goto('/');
  const skeleton = busy(page, 'Loading featured product').locator('.mantine-Skeleton-root').first();
  await expect(skeleton).toBeVisible();
  expect(await skeleton.evaluate((node) => getComputedStyle(node, '::after').animationName)).toBe(
    'none',
  );
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await expect(busy(page, 'Loading All Products')).toBeVisible();
  data.release();
  await expect(loadingRegions(page)).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(4);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Beautifully Crafted');
  await expect(loadingRegions(page)).toHaveCount(0);
});

test('images have independent placeholders without blocking cart actions', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 900 });
  const images = gate();
  await mockCatalog(page);
  await mockImages(page, images.ready);
  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  await expect(loadingRegions(page)).toHaveCount(0);
  const card = page.getByRole('article').first();
  const image = card.locator('[data-image-state]');
  await expect(image).toHaveAttribute('data-image-state', 'loading');
  await expect(image.locator('.mantine-Skeleton-root')).toBeVisible();
  const before = await image.boundingBox();
  expect(before.height).toBeGreaterThan(90);
  await card.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open cart (1)' })).toBeVisible();
  images.release();
  await expect(image).toHaveAttribute('data-image-state', 'loaded');
  await expect(image.locator('.mantine-Skeleton-root')).toHaveCount(0);
  const after = await image.boundingBox();
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  await card.getByRole('button', { name: `View ${products[0].name}` }).click();
  await expect(page.locator('main [data-image-state]').first()).toHaveAttribute(
    'data-image-state',
    'loaded',
  );
});

test('failed product images settle into a fallback and remain navigable', async ({ page }) => {
  await mockCatalog(page);
  await mockImages(page, Promise.resolve(), true);
  await page.goto('/products');
  const card = page.getByRole('article').first();
  const image = card.locator('[data-image-state]');
  await expect(image).toHaveAttribute('data-image-state', 'error');
  await expect(image.locator('.mantine-Skeleton-root')).toHaveCount(0);
  await expect(
    card.getByRole('img', { name: `${products[0].name} preview (image unavailable)` }),
  ).toBeVisible();
  await card.getByRole('button', { name: `View ${products[0].name}` }).click();
  await expect(page.getByRole('heading', { name: products[0].name, level: 1 })).toBeVisible();
});
