import { expect, test } from '@playwright/test';

for (const width of [393, 1440]) {
  test(`production card styles retain typography and button colors at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/catalog?**', (route) =>
      route.fulfill({
        headers: { 'X-WP-TotalPages': '1' },
        json: [
          {
            id: 15,
            name: 'Business Toolkit',
            slug: 'business-toolkit',
            type: 'simple',
            prices: {
              price: '2900',
              regular_price: '3500',
              currency_code: 'USD',
              currency_minor_unit: 2,
            },
            categories: [{ id: 1, name: 'Business Tools', slug: 'business-tools' }],
            is_purchasable: true,
            is_in_stock: true,
            images: [],
          },
        ],
      }),
    );
    await page.goto('/products');
    const card = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Business Toolkit' }) })
      .first();
    const category = card.locator('p').filter({ hasText: /^Business Tools$/ });
    const rootSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(
      await category.evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    ).toBeCloseTo((rootSize * 11) / 16, 1);
    await expect(category).toHaveCSS('font-weight', '700');
    const price = card
      .locator('span')
      .filter({ hasText: /^\$29$/ })
      .last();
    expect(await price.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeCloseTo(
      (rootSize * 20) / 16,
      1,
    );
    await expect(price).toHaveCSS('font-weight', '700');
    const add = card.getByRole('button', { name: 'Add to Cart', exact: true });
    await expect(add).toHaveCSS('background-color', 'rgb(17, 24, 39)');
    await expect(add).toHaveCSS('font-weight', '600');
    await expect(card.getByRole('heading', { name: 'Business Toolkit' })).toHaveCSS(
      'font-weight',
      '700',
    );
  });
}
