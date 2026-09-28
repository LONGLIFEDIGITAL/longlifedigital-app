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

for (const width of [393, 1440]) {
  test(`ebook detail presents the CMS cover as a book at ${width}px`, async ({
    page,
  }, testInfo) => {
    const coverUrl = 'https://images.example.test/ebook-cover.svg';
    await setup(page, [
      { ...books[0], images: [{ src: coverUrl, alt: 'Creative Business cover artwork' }] },
      product,
    ]);
    await page.route(coverUrl, (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="1000" viewBox="0 0 680 1000"><rect width="680" height="1000" fill="#244b49"/><circle cx="510" cy="610" r="220" fill="#e2bf83"/><text x="65" y="180" fill="#fff5dc" font-family="serif" font-size="70">The Creative</text><text x="65" y="265" fill="#fff5dc" font-family="serif" font-size="70">Business</text><text x="65" y="350" fill="#fff5dc" font-family="serif" font-size="70">Handbook</text><text x="65" y="920" fill="#fff5dc" font-family="sans-serif" font-size="22">A PRACTICAL GUIDE TO YOUR NEXT CHAPTER</text></svg>',
      }),
    );
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/products/701');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'E-books' }),
    ).toHaveAttribute('href', '/ebook');
    const cover = page.getByRole('img', { name: 'Creative Business cover artwork', exact: true });
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', coverUrl);
    await expect(cover).toHaveCSS('object-fit', 'contain');
    const book = cover.locator('..').locator('..');
    await expect(book).not.toHaveCSS('transform', 'none');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath('ebook-detail.png'), fullPage: true });
    // Other digital products retain their existing image presentation.
    await page.goto('/products/318');
    await expect(page.locator('[class*="frontBook"]')).toHaveCount(0);
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb).toContainText('AI Tools');
    await breadcrumb.getByRole('button', { name: 'AI Tools', exact: true }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: books[0].name })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: product.name }).first()).toBeVisible();
    await page.goto('/products/318');
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('button', { name: 'Shop', exact: true })
      .click();
    await expect(page.getByRole('heading', { name: books[0].name }).first()).toBeVisible();
  });
}
