import { test, expect } from '@playwright/test';

const products = [
  { id: 15, name: 'Business Spreadsheet Toolkit' },
  { id: 16, name: 'Client Welcome Kit' },
].map((product) => ({
  ...product,
  type: 'simple',
  description: '<p>A practical digital toolkit.</p>',
  short_description: '<p>Get started today.</p>',
  prices: { price: '2900', regular_price: '3500', currency_code: 'USD', currency_minor_unit: 2 },
  categories: [{ id: 1, name: 'Business Startup Toolkits', slug: 'business-startup-toolkits' }],
  images: [],
  tags: [],
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
}));

async function mockCatalog(page, ready = Promise.resolve()) {
  await page.route('**/api/catalog?**', async (route) => {
    await ready;
    await route.fulfill({
      headers: { 'X-WP-TotalPages': '1' },
      json: new URL(route.request().url()).searchParams.has('featured') ? [] : products,
    });
  });
}

async function expectProduct(page, product) {
  await expect(page).toHaveURL(new RegExp(`/products/${product.id}$`));
  await expect(
    page.getByRole('heading', { name: product.name, level: 1, exact: true }),
  ).toBeVisible();
}

for (const width of [393, 1440]) {
  test(`browser Back and Forward restore pages and individual products at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockCatalog(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    const card = page.getByRole('article').filter({ hasText: products[0].name });
    await card.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await card.getByRole('button', { name: `View ${products[0].name}`, exact: true }).click();
    await expectProduct(page, products[0]);
    await page.getByRole('button', { name: `View ${products[1].name}`, exact: true }).click();
    await expectProduct(page, products[1]);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

    await page.goBack();
    await expectProduct(page, products[0]);
    await page.goBack();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products', level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Beautifully Crafted');
    await page.goForward();
    await expect(page).toHaveURL(/\/products$/);
    await page.goForward();
    await expectProduct(page, products[0]);
    await page.goForward();
    await expectProduct(page, products[1]);
    // History navigation does not remount the application or discard its cart.
    await expect(page.getByRole('button', { name: 'Open cart (1)', exact: true })).toBeVisible();
    await page.reload();
    await expectProduct(page, products[1]);
  });
}

test('search typing and repeated page clicks do not add duplicate history entries', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockCatalog(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const initialLength = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
  expect(await page.evaluate(() => history.length)).toBe(initialLength);
  const search = page.getByRole('textbox', { name: 'Search products', exact: true });
  await search.pressSequentially('Business', { delay: 20 });
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole('article')).toHaveCount(1);
  expect(await page.evaluate(() => history.length)).toBe(initialLength + 1);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Shop Now', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/products$/);
  await expect(search).toHaveValue('Business');
});

test('opening a product URL waits for the CMS, then survives reload', async ({ page }) => {
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  await mockCatalog(page, ready);
  await page.goto('/products/16');
  await expect(
    page.getByRole('status', { name: 'Loading product details', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Product not found' })).toHaveCount(0);
  release();
  await expectProduct(page, products[1]);
  await page.reload();
  await expectProduct(page, products[1]);
});

test('missing products and CMS errors keep usable navigation', async ({ page }) => {
  let fail = true;
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill(
      fail
        ? { status: 502, json: { error: 'Unavailable' } }
        : {
            headers: { 'X-WP-TotalPages': '1' },
            json: new URL(route.request().url()).searchParams.has('featured') ? [] : products,
          },
    ),
  );
  await page.goto('/products/15');
  await expect(page.getByRole('alert')).toContainText('Products are temporarily unavailable');
  await expect(page.getByRole('heading', { name: 'Product not found' })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expectProduct(page, products[0]);
  await page.goto('/products/999');
  await expect(page.getByRole('heading', { name: 'Product not found', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Browse Products', exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/products\/999$/);
  await expect(page.getByRole('heading', { name: 'Product not found', exact: true })).toBeVisible();
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Home', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('Back dismisses the cart and mobile menu without losing cart contents', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await mockCatalog(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await page.getByRole('button', { name: `View ${products[0].name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
  await page.getByRole('button', { name: 'Open cart (1)', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open cart (1)', exact: true })).toBeVisible();
});

test('Back restores scroll position while new pages start at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockCatalog(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'View Details →', exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 750));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(750);
  // Trigger the existing navigation without Playwright scrolling its button into view first.
  await page
    .getByRole('button', { name: 'Learn More', exact: true })
    .evaluate((button) => button.click());
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => Math.abs(scrollY - 750))).toBeLessThanOrEqual(2);
  await page.goForward();
  await expect(page).toHaveURL(/\/about$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
