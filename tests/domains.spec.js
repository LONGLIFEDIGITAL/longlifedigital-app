import { test, expect } from '@playwright/test';
import { mockFluidStorefront } from './fixtures/fluidStorefront.js';

const assets = [
  {
    id: 51,
    slug: 'bright-example',
    title: 'bright.example',
    description: 'A fresh address for a creative studio.',
    assetType: 'domain',
    availability: 'available',
    categories: [1],
    pricing: { mode: 'estimate', amount: 1250, currency: 'USD', period: 'once' },
    cta: { label: 'Ask about Bright', destination: '/contact' },
    body: '<p>Build your creative home here.</p>',
  },
  {
    id: 52,
    slug: 'grow-example',
    title: 'grow.example',
    description: 'For your next venture.',
    assetType: 'domain',
    availability: 'sold',
    categories: [2],
    pricing: { mode: 'contact' },
    cta: { label: 'Buy sold domain', destination: '/contact' },
  },
  {
    id: 53,
    slug: 'studio-example',
    title: 'studio.example',
    description: 'An online studio.',
    assetType: 'website',
    availability: 'reserved',
    categories: [1],
    pricing: { mode: 'contact' },
    demoUrl: 'https://studio.example',
    cta: {},
  },
];
async function setup(page, records = assets, copy = {}) {
  await mockFluidStorefront(page);
  await page.route('**/api/content?**', (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get('resource') === 'assets') return route.fulfill({ json: records });
    if (params.get('resource') === 'asset-categories')
      return route.fulfill({
        json: [
          { id: 1, slug: 'creative', title: 'Creative' },
          { id: 2, slug: 'business', title: 'Business' },
        ],
      });
    if (['domains', 'ebook'].includes(params.get('key')))
      return route.fulfill({
        json: { key: params.get('key'), heading: '', body: '', collection: copy },
      });
    return route.fallback();
  });
}
test('domain filters, inquiry, availability and featured links work', async ({ page }) => {
  await setup(page);
  await page.goto('/domains?category=business');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Buy sold domain' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Discover this listing' }).click();
  await expect(page).toHaveURL(/\/domains#bright-example$/);
  await expect(page.locator('article')).toHaveCount(3);
  await page.getByLabel('Search domains & websites').fill('studio');
  await expect(page.locator('article')).toHaveCount(2);
  await page.getByLabel('Category', { exact: true }).selectOption('business');
  await expect(page.getByText('Your next possibility is a search away.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('#studio-example').getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Preview website' })).toHaveAttribute(
    'href',
    'https://studio.example',
  );
  await expect(page.locator('#bright-example')).toContainText('$1,250.00');
  await page.getByRole('button', { name: 'Ask about Bright' }).click();
  await expect(page).toHaveURL(/\/contact$/);
});
for (const width of [320, 393, 1440, 2560]) {
  test(`domain layout fits ${width}px`, async ({ page }, testInfo) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/domains');
    await expect(page.locator('article')).toHaveCount(3);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
    if ([393, 1440].includes(width))
      await page.screenshot({ path: testInfo.outputPath('domains.png'), fullPage: true });
  });
}
test('both collection pages use CMS editorial overrides', async ({ page }) => {
  await setup(page, assets, {
    collection_heading: 'Chosen in WordPress',
    hero_note: 'A CMS note',
    closing_heading: 'Your next step',
    closing: { label: 'Talk to us', destination: '/contact' },
    featuredAsset: 52,
  });
  for (const path of ['/domains', '/ebook']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Chosen in WordPress' })).toBeVisible();
    await expect(page.getByText('A CMS note')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your next step' })).toBeVisible();
  }
  await page.goto('/domains');
  // A selected sold listing must not become the featured for-sale domain.
  await expect(page.getByRole('heading', { level: 2, name: 'bright.example' })).toBeVisible();
});
test('empty inventory uses an editorial hero and no invented listings', async ({ page }) => {
  await setup(page, []);
  await page.goto('/domains');
  await expect(page.getByText('New possibilities are on the horizon.')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
  await expect(page.getByText('Domain for sale', { exact: true })).toHaveCount(0);
});
