import { test, expect } from '@playwright/test';
import { mockFluidStorefront, product } from './fixtures/fluidStorefront.js';

const books = [
  {
    ...product,
    id: 701,
    name: 'The Creative Business Handbook',
    categories: [{ slug: 'ebooks', name: 'Ebooks' }],
    prices: { ...product.prices, price: '1900' },
  },
  {
    ...product,
    id: 702,
    name: 'A Little Guide to Better Habits',
    tags: [{ slug: 'e-book', name: 'E-book' }],
    prices: { ...product.prices, price: '900' },
  },
  {
    ...product,
    id: 703,
    name: 'Build Your Next Chapter',
    categories: [{ slug: 'business-ebooks', name: 'Business Ebooks' }],
    prices: { ...product.prices, price: '2500' },
  },
];
async function setup(page, items = [...books, product]) {
  await mockFluidStorefront(page);
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({ headers: { 'X-WP-TotalPages': '1' }, json: items }),
  );
  await page.route('**/api/content?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    return params.get('key') === 'ebook'
      ? route.fulfill({ json: { key: 'ebook', title: 'E-book', heading: '', intro: '', body: '' } })
      : route.fallback();
  });
}

test('ebook membership, search, sorting and existing purchase actions work', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/ebook');
  const collection = page.getByRole('region', { name: 'E-book collection', exact: true });
  await expect(collection.locator('article')).toHaveCount(3);
  await expect(collection.getByRole('heading', { name: product.name })).toHaveCount(0);
  await page.getByLabel('Search e-books').fill('habits');
  await expect(collection.locator('article')).toHaveCount(1);
  await page.getByLabel('Search e-books').fill('no matching book');
  await expect(page.getByText('A different search, a new possibility.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await page.getByLabel('Sort e-books').selectOption('price-desc');
  await expect(collection.locator('article h3').first()).toHaveText('Build Your Next Chapter');
  await page.getByLabel('Sort e-books').selectOption('price-asc');
  await expect(collection.locator('article h3').first()).toHaveText(
    'A Little Guide to Better Habits',
  );
  const added = page.waitForRequest((request) => request.url().includes('action=add'));
  await collection.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
  expect((await added).postDataJSON().id).toBe(702);
  await collection.getByRole('button', { name: 'Buy Now', exact: true }).first().click();
  await expect(page).toHaveURL(/\/checkout$/);
});

for (const width of [320, 393, 1440, 2560]) {
  test(`ebook page fits at ${width}px`, async ({ page }, testInfo) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/ebook');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Small books.');
    await expect(page.getByRole('heading', { name: books[0].name }).first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    if (width < 768) {
      await page.getByRole('button', { name: 'Next products in E-book collection' }).click();
      await expect(page.getByRole('heading', { name: books[1].name })).toBeVisible();
    }
    if ([393, 1440].includes(width))
      await page.screenshot({ path: testInfo.outputPath('ebook-page.png'), fullPage: true });
  });
}

test('an empty ebook collection never substitutes unrelated products', async ({ page }) => {
  await setup(page, [product]);
  await page.goto('/ebook');
  await expect(page.getByText('The next chapter is on its way.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Explore all products', exact: true }),
  ).toHaveAttribute('href', '/products');
});
