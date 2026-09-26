import { expect, test } from '@playwright/test';
import { mockFluidStorefront, product } from './fixtures/fluidStorefront.js';

async function fits(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  expect(await nav.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  for (const dialog of await page.getByRole('dialog').all()) {
    await expect.poll(async () => (await dialog.boundingBox()).x).toBeGreaterThanOrEqual(-1);
    await expect
      .poll(async () => {
        const box = await dialog.boundingBox();
        return box.x + box.width;
      })
      .toBeLessThanOrEqual(page.viewportSize().width + 1);
    expect(
      await dialog.evaluate((node) => node.scrollWidth - node.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
}

for (const width of [320, 768, 1024, 1440, 1920, 2560]) {
  test(`all storefront pages and overlays fit at ${width}px`, async ({ page }) => {
    await mockFluidStorefront(page);
    await page.setViewportSize({ width, height: width < 768 ? 740 : 1000 });
    for (const path of [
      '/',
      '/products',
      '/products/318',
      '/blog',
      '/blog/business-guide',
      '/services',
      '/courses',
      '/domains',
      '/about',
      '/faq',
      '/contact',
      '/privacy-policy',
      '/refund-policy',
      '/terms-of-service',
      '/checkout',
      '/order-confirmation',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await fits(page);
      if (path === '/products') {
        await expect(page.getByRole('heading', { name: product.name }).first()).toBeVisible();
        await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await fits(page);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await page.getByRole('button', { name: 'Open cart (1)', exact: true }).click();
        await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();
        await fits(page);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      if (path === '/checkout') {
        const input = page.getByRole('textbox', { name: 'First name', exact: true });
        await expect(input).toBeVisible();
        expect(
          await input.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
        ).toBeGreaterThanOrEqual(16);
      }
    }
    await page.goto('/');
    await page.getByRole('button', { name: 'Open AI chat' }).click();
    await expect(page.getByPlaceholder('Ask about our services...')).toBeVisible();
    await fits(page);
  });
}

test('cards, forms, navigation and footer grow with the screen and preserve text zoom', async ({
  page,
}, testInfo) => {
  await mockFluidStorefront(page);
  const sizes = [];
  for (const width of [1280, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/products');
    const card = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: product.name }) })
      .first();
    await expect(card).toBeVisible();
    sizes.push(
      await card.evaluate((node) => ({
        width: node.getBoundingClientRect().width,
        title: parseFloat(getComputedStyle(node.querySelector('h3')).fontSize),
        button: node.querySelector('button.mantine-Button-root').getBoundingClientRect().height,
        footer: parseFloat(getComputedStyle(document.querySelector('footer')).fontSize),
        nav: document.querySelector('nav').getBoundingClientRect().height,
      })),
    );
    await page.goto('/blog');
    const blogTitle = page.locator('article h3').first();
    await expect(blogTitle).toBeVisible();
    sizes.at(-1).blogTitle = await blogTitle.evaluate((node) =>
      parseFloat(getComputedStyle(node).fontSize),
    );
    await page.goto('/contact');
    const input = page.getByPlaceholder('John Smith');
    await expect(input).toBeVisible();
    sizes.at(-1).inputHeight = (await input.boundingBox()).height;
  }
  for (let i = 1; i < sizes.length; i++) {
    for (const key of Object.keys(sizes[i]))
      expect(sizes[i][key], key).toBeGreaterThan(sizes[i - 1][key]);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/');
  const activeLink = page.locator('[aria-label="Quick navigation"] [data-active]').first();
  await expect(activeLink).toBeVisible();
  const underlineGap = await activeLink.evaluate((node) => {
    const labelNode = node.querySelector('.mantine-Button-label');
    const label = labelNode.getBoundingClientRect();
    return label.top + parseFloat(getComputedStyle(labelNode, '::after').top) - label.bottom;
  });
  expect(underlineGap).toBeGreaterThanOrEqual(0);
  expect(underlineGap).toBeLessThanOrEqual(5);
  await page.screenshot({ path: testInfo.outputPath('laptop-home.png') });
  await page.goto('/products');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await fits(page);
});
