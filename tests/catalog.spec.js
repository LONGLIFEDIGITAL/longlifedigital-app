import { expect, test } from '@playwright/test';
import catalogHandler from '../api/catalog.js';

const product = {
  id: 15,
  name: 'Business Spreadsheet Toolkit',
  slug: 'business-spreadsheet-toolkit',
  type: 'simple',
  description: `
    <p class="wp-block-paragraph" data-start="277">Business Spreadsheet Toolkit is a downloadable set of spreadsheets designed to help entrepreneurs and small business owners organize key financial and operational information.</p>
    <p>Includes:</p>
    <ul class="wp-block-list">
      <li>Monthly income tracker</li>
      <li>Business expense tracker</li>
      <li>Budget planner</li>
      <li>Profit &amp; loss overview</li>
      <li>Cash-flow tracker</li>
      <li>Monthly business performance dashboard</li>
    </ul>
    <p>Designed for use with Microsoft Excel or Google Sheets.</p>
  `,
  short_description: '<p>A practical spreadsheet toolkit.</p>',
  prices: { price: '2900', regular_price: '3500', currency_code: 'USD', currency_minor_unit: 2 },
  on_sale: true,
  average_rating: '0',
  review_count: 0,
  categories: [{ id: 1373, name: 'Business Startup Toolkits', slug: 'business-startup-toolkits' }],
  images: [{ src: 'https://images.example.test/toolkit.png', alt: 'Spreadsheet preview' }],
  tags: [],
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
  extensions: { private_download: 'https://private.example.test/file.pdf' },
};

test.beforeEach(async ({ page }) => {
  // Keep the tests independent of WordPress and external image availability.
  await page.route('https://images.example.test/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="purple"/></svg>',
    }),
  );
});

async function mockCatalog(page, products = [product]) {
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({
      headers: { 'X-WP-TotalPages': '1' },
      json: new URL(route.request().url()).searchParams.has('featured') ? [] : products,
    }),
  );
}

for (const width of [393, 1440]) {
  test(`card opens product details and keeps cart actions separate at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockCatalog(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    const card = page.getByRole('article').filter({ hasText: product.name });
    const addButton = card.getByRole('button', { name: 'Add to Cart', exact: true });
    await expect(addButton).toHaveCount(1);
    await expect(card.getByRole('button', { name: 'View Details', exact: true })).toHaveCount(0);
    await expect(card).toContainText('A practical spreadsheet toolkit.');

    const cardBox = await card.boundingBox();
    const buttonBox = await addButton.boundingBox();
    const leftInset = buttonBox.x - cardBox.x;
    const rightInset = cardBox.x + cardBox.width - buttonBox.x - buttonBox.width;
    expect(leftInset).toBeGreaterThanOrEqual(width < 768 ? 10 : 16);
    expect(rightInset).toBeGreaterThanOrEqual(width < 768 ? 10 : 16);
    expect(Math.abs(leftInset - rightInset)).toBeLessThanOrEqual(1);
    expect(buttonBox.width).toBeGreaterThan(cardBox.width - 64);

    await addButton.click();
    await expect(page.getByRole('heading', { name: 'All Products', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'added to cart' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open cart (1)' })).toBeVisible();
    await card.screenshot({ path: `test-results/product-card-${width}.png` });

    // Both the image and padding around the lower details open the product page.
    for (const point of [
      { x: 12, y: 12 },
      { x: 5, y: cardBox.height - 5 },
    ]) {
      await card.click({ position: point });
      await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
      await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
      await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    }

    // The same card navigation is accessible without a pointer.
    await card.getByRole('button', { name: `View ${product.name}`, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
  });
}

for (const width of [320, 393, 1440]) {
  test(`CMS product, description, category and cart work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockCatalog(page);
    await page.goto('/');
    await expect(page.getByText(product.name, { exact: true }).first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText('AI Wealth Accelerator Bundle');
    await expect(page.getByRole('button', { name: 'Admin login' })).toHaveCount(0);
    await page.keyboard.type('aaa');
    await expect(page.getByRole('dialog', { name: 'Admin login' })).toHaveCount(0);
    await page.getByRole('button', { name: 'View Details →', exact: true }).click();
    await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
    await expect(page.getByAltText('Spreadsheet preview')).toBeVisible();
    await expect(page.locator('main')).toContainText('Profit & loss');
    const description = page.getByRole('region', { name: 'Product description' });
    await expect(description.locator(':scope > p')).toHaveCount(3);
    await expect(description.getByRole('listitem')).toHaveText([
      'Monthly income tracker',
      'Business expense tracker',
      'Budget planner',
      'Profit & loss overview',
      'Cash-flow tracker',
      'Monthly business performance dashboard',
    ]);
    await expect(description.getByRole('list')).toHaveCSS('list-style-type', 'disc');
    await expect(description).toHaveCSS('white-space', 'normal');
    // Items should flow as a list, without the former blank paragraph between each item.
    const itemGap = await description.evaluate((element) => {
      const items = element.querySelectorAll('li');
      return items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom;
    });
    expect(itemGap).toBeLessThanOrEqual(1);
    await description.screenshot({ path: `test-results/product-description-${width}.png` });
    await expect(page.locator('main')).toContainText('Business Startup Toolkits');
    await expect(page.getByText('$29', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.getByRole('button', { name: 'Open cart (1)' }).click();
    const cart = page.getByRole('dialog', { name: 'Shopping cart' });
    await expect(cart).toContainText(product.name);
    await expect(cart).toContainText('$29');
    await expect(cart.getByRole('button', { name: 'Proceed to Checkout' })).toBeDisabled();
    await cart.getByRole('button', { name: `Remove ${product.name} from cart` }).click();
    await expect(cart).toContainText('Your cart is empty');
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    await page.screenshot({ path: `test-results/catalog-product-${width}.png`, fullPage: true });
  });
}

for (const [width, height] of [
  [320, 568],
  [393, 852],
  [1440, 900],
]) {
  test(`cart quantities, totals and removal update immediately at ${width}px`, async ({ page }) => {
    const secondProduct = {
      ...product,
      id: 16,
      name: 'Business Budget Planner',
      prices: { ...product.prices, price: '1299', regular_price: '1299' },
    };
    await page.setViewportSize({ width, height });
    await mockCatalog(page, [product, secondProduct]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    const addFirst = page
      .getByRole('article')
      .filter({ hasText: product.name })
      .getByRole('button', { name: 'Add to Cart', exact: true });
    await addFirst.click();
    await addFirst.click();
    await page
      .getByRole('article')
      .filter({ hasText: secondProduct.name })
      .getByRole('button', { name: 'Add to Cart', exact: true })
      .click();
    await page.getByRole('button', { name: 'Open cart (3)', exact: true }).click();
    const cart = page.getByRole('dialog', { name: 'Shopping cart' });
    const quantity = cart.getByLabel(`Quantity for ${product.name}`, { exact: true });
    const subtotal = cart.getByLabel('Cart subtotal', { exact: true });
    const plus = cart.getByRole('button', { name: `Increase quantity of ${product.name}` });
    const minus = cart.getByRole('button', { name: `Decrease quantity of ${product.name}` });
    await expect(cart.getByRole('listitem')).toHaveCount(2);
    await expect(quantity).toHaveText('2');
    await expect(subtotal).toHaveText('$70.99');
    await plus.focus();
    await page.keyboard.press('Enter');
    // Consecutive events in the same tick must not lose quantity updates.
    await plus.evaluate((button) => {
      button.click();
      button.click();
    });
    await expect(quantity).toHaveText('5');
    await expect(cart.getByLabel(`Total for ${product.name}`, { exact: true })).toHaveText('$145');
    await expect(subtotal).toHaveText('$157.99');
    await expect(page.locator('button[aria-label="Open cart (6)"]')).toHaveCount(1);
    await minus.click();
    await expect(quantity).toHaveText('4');
    await expect(subtotal).toHaveText('$128.99');
    await expect(cart.getByLabel(`Quantity for ${secondProduct.name}`, { exact: true })).toHaveText(
      '1',
    );
    await expect(
      cart.getByRole('button', { name: `Decrease quantity of ${secondProduct.name}` }),
    ).toBeDisabled();
    await expect(cart.getByRole('button', { name: 'Proceed to Checkout' })).toBeDisabled();
    await expect
      .poll(() => cart.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeLessThanOrEqual(1);
    await cart.screenshot({ path: `test-results/cart-${width}.png` });

    // Closing the drawer preserves quantities; removing a line leaves the other item intact.
    await cart.getByRole('button', { name: 'Close cart', exact: true }).click();
    await page.getByRole('button', { name: 'Open cart (5)', exact: true }).click();
    await expect(quantity).toHaveText('4');
    await cart.getByRole('button', { name: `Remove ${product.name} from cart` }).click();
    await expect(cart.getByRole('listitem')).toHaveCount(1);
    await expect(subtotal).toHaveText('$12.99');
    await expect(page.locator('button[aria-label="Open cart (1)"]')).toHaveCount(1);
    await cart.getByRole('button', { name: 'Clear Cart', exact: true }).click();
    await expect(
      cart.getByRole('heading', { name: 'Your cart is empty', exact: true }),
    ).toBeVisible();
    await expect(page.locator('button[aria-label="Open cart (0)"]')).toHaveCount(1);
  });
}

for (const soldIndividually of [false, true]) {
  test(`cart respects WooCommerce quantity limits (sold individually: ${soldIndividually})`, async ({
    page,
  }) => {
    await mockCatalog(page, [
      {
        ...product,
        sold_individually: soldIndividually,
        add_to_cart: { minimum: 2, maximum: 6, multiple_of: 2 },
      },
    ]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    const add = page.getByRole('button', { name: 'Add to Cart', exact: true });
    await add.click();
    await page
      .getByRole('button', { name: `Open cart (${soldIndividually ? 1 : 2})`, exact: true })
      .click();
    const cart = page.getByRole('dialog', { name: 'Shopping cart' });
    const quantity = cart.getByLabel(`Quantity for ${product.name}`, { exact: true });
    const minus = cart.getByRole('button', { name: `Decrease quantity of ${product.name}` });
    const plus = cart.getByRole('button', { name: `Increase quantity of ${product.name}` });
    await expect(minus).toBeDisabled();
    await expect(quantity).toHaveText(soldIndividually ? '1' : '2');
    if (!soldIndividually) {
      await plus.click();
      await expect(quantity).toHaveText('4');
      await minus.click();
      await expect(quantity).toHaveText('2');
      await expect(minus).toBeDisabled();
      await plus.click();
      await plus.click();
      await expect(quantity).toHaveText('6');
    }
    await expect(plus).toBeDisabled();
    await cart.getByRole('button', { name: 'Close cart', exact: true }).click();
    await add.click();
    await expect(page.getByRole('status').filter({ hasText: 'maximum quantity' })).toBeVisible();
    await page
      .getByRole('button', { name: `Open cart (${soldIndividually ? 1 : 6})`, exact: true })
      .click();
    await expect(quantity).toHaveText(soldIndividually ? '1' : '6');
  });
}

const collectionProducts = [
  'Business Spreadsheet Toolkit',
  'Monthly Budget Planner',
  'Social Media Templates',
  'Client Welcome Kit',
  'Content Calendar',
  'Business Startup Course',
  'Goal Planner',
  'Invoice Bundle',
  'Business Reporting Dashboard',
].map((name, index) => ({
  ...product,
  id: 100 + index,
  name,
  images: index === 2 ? [] : product.images,
  prices: {
    ...product.prices,
    price: String((index + 1) * 1000),
    regular_price: String((index + 2) * 1000),
  },
  categories: index < 4 ? product.categories : [{ id: 2, name: 'Courses', slug: 'courses' }],
}));

async function swipeCollection(page, region, direction, overControl) {
  await region.scrollIntoViewIfNeeded();
  if (overControl) await overControl.scrollIntoViewIfNeeded();
  const box = await region.boundingBox();
  const from = box.x + box.width * (direction === 'next' ? 0.85 : 0.15);
  const to = box.x + box.width * (direction === 'next' ? 0.15 : 0.85);
  const controlBox = overControl && (await overControl.boundingBox());
  const y = controlBox ? controlBox.y + controlBox.height / 2 : Math.max(box.y + 60, 220);
  const session = await page.context().newCDPSession(page);
  const point = (x) => [{ x, y, id: 1 }];
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: point(from),
    });
    for (let step = 1; step <= 12; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: point(from + ((to - from) * step) / 12),
      });
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }
}

test.describe('mobile product collections', () => {
  test.use({ hasTouch: true });

  for (const width of [320, 393, 430]) {
    test(`all three product collections show compact 2 by 2 pages and swipe at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 852 });
      await mockCatalog(page, collectionProducts);
      await page.goto('/');
      for (const label of ['Explore Our Products', 'More to Explore', 'All Products']) {
        if (label === 'All Products') {
          await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
          await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
        }
        const region = page.getByRole('region', { name: label, exact: true });
        const firstPage = region.getByRole('group', { name: 'Product page 1 of 3', exact: true });
        await expect(firstPage.getByRole('article')).toHaveCount(4);
        await expect(region.getByRole('article')).toHaveCount(4);
        await region.scrollIntoViewIfNeeded();
        const boxes = await firstPage.getByRole('article').evaluateAll((cards) =>
          cards.map((card) => {
            const { x, y, width, height } = card.getBoundingClientRect();
            return { x, y, width, height };
          }),
        );
        expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(1);
        expect(Math.abs(boxes[2].y - boxes[3].y)).toBeLessThan(1);
        expect(Math.abs(boxes[0].x - boxes[2].x)).toBeLessThan(1);
        expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width);
        expect(boxes[2].y).toBeGreaterThan(boxes[0].y + boxes[0].height);
        for (const box of boxes) {
          expect(box.height).toBeLessThan(310);
          expect(box.height / box.width).toBeLessThan(2.2);
        }
        const firstCard = firstPage.getByRole('article').first();
        await expect(
          firstCard.getByText('A practical spreadsheet toolkit.', { exact: true }),
        ).toBeHidden();
        const buttonBox = await firstCard
          .getByRole('button', { name: 'Add to Cart', exact: true })
          .boundingBox();
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.width).toBeGreaterThan(boxes[0].width - 32);
        await expect(
          page.getByRole('button', { name: `Previous products in ${label}`, exact: true }),
        ).toBeDisabled();
        await region.locator('..').screenshot({
          path: `test-results/collection-${label.replaceAll(' ', '-')}-${width}.png`,
        });

        await swipeCollection(page, region, 'next');
        const secondPage = region.getByRole('group', { name: 'Product page 2 of 3', exact: true });
        await expect(secondPage).toBeInViewport();
        await expect(region.getByRole('status')).toHaveText('Slide 2 of 3');
        await expect(firstPage).toHaveCount(0);
        await swipeCollection(page, region, 'previous');
        await expect(firstPage).toBeInViewport();
        await expect(region.getByRole('status')).toHaveText('Slide 1 of 3');
        await expect(
          page.getByRole('button', { name: 'Open cart (0)', exact: true }),
        ).toBeVisible();

        // Native keyboard navigation reaches the partial last page without stretching its card.
        await region.focus();
        await page.keyboard.press('End');
        const lastPage = region.getByRole('group', { name: 'Product page 3 of 3', exact: true });
        await expect(lastPage).toBeInViewport();
        await expect(region.getByRole('article')).toHaveCount(1);
        const lastBox = await lastPage.getByRole('article').boundingBox();
        expect(Math.abs(lastBox.width - boxes[0].width)).toBeLessThan(1);
        await expect(
          page.getByRole('button', { name: `Next products in ${label}`, exact: true }),
        ).toBeDisabled();
        await page
          .getByRole('button', { name: `Previous products in ${label}`, exact: true })
          .click();
        await expect(secondPage).toBeInViewport();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
          .toBeLessThanOrEqual(1);
      }
    });
  }

  test('sorting, filtering and card actions work after swiping', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockCatalog(page, collectionProducts);
    await page.goto('/');
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    const region = page.getByRole('region', { name: 'All Products', exact: true });
    await swipeCollection(
      page,
      region,
      'next',
      region.getByRole('button', { name: 'Add to Cart', exact: true }).nth(1),
    );
    await expect(page.getByRole('button', { name: 'Open cart (0)', exact: true })).toBeVisible();
    const card = region.getByRole('article').filter({ hasText: 'Content Calendar' });
    await card.getByRole('button', { name: 'Add to Cart', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Open cart (1)', exact: true })).toBeVisible();
    await expect(region).toBeVisible();
    await card.getByRole('button', { name: 'View Content Calendar', exact: true }).tap();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Content Calendar', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
    await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
    await region.focus();
    await page.keyboard.press('End');
    await page.getByLabel('Sort products', { exact: true }).selectOption('price-desc');
    await expect(region.getByRole('status')).toHaveText('Slide 1 of 3');
    await expect(region.getByRole('article').first()).toContainText('Business Reporting Dashboard');
    await page.getByRole('button', { name: 'Next products in All Products', exact: true }).click();
    await expect(region.getByRole('status')).toHaveText('Slide 2 of 3');
    await page.getByLabel('Category', { exact: true }).selectOption('business-startup-toolkits');
    await expect(region.getByRole('status')).toHaveText('Slide 1 of 1');
    await expect(region.getByRole('article')).toHaveCount(4);
    await expect(
      page.getByRole('button', { name: 'Next products in All Products', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open cart (1)', exact: true })).toBeVisible();
  });
});

test('desktop grids remain full size and resizing replaces rather than duplicates collections', async ({
  page,
}) => {
  await mockCatalog(page, collectionProducts);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const explore = page.getByRole('region', { name: 'Explore Our Products', exact: true });
  const more = page.getByRole('region', { name: 'More to Explore', exact: true });
  await expect(explore.getByRole('article')).toHaveCount(4);
  await expect(more.getByRole('article')).toHaveCount(4);
  await expect(
    explore
      .getByRole('article')
      .first()
      .getByText('A practical spreadsheet toolkit.', { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(explore).toHaveAttribute('aria-roledescription', 'carousel');
  await expect(explore.locator('article')).toHaveCount(9);
  await expect(explore.getByRole('article')).toHaveCount(4);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(explore.locator('article')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /Next products in/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  const shop = page.getByRole('region', { name: 'All Products', exact: true });
  await expect(shop.getByRole('article')).toHaveCount(9);
});

test('rich descriptions preserve structure and remove unsafe HTML and pasted styles', async ({
  page,
}) => {
  await mockCatalog(page, [
    {
      ...product,
      description: `
    <h3 class="wp-heading" style="font-size:100px">Getting started</h3>
    <p id="cms-content" data-editor="test" style="margin:200px" onclick="window.cmsExecuted=true">Use <strong>Excel</strong> or <em>Google Sheets</em>.<br>Keep your records up to date.</p>
    <ol start="3"><li><p>Open the file</p><ul><li>Make a copy</li></ul></li><li>Enter your totals</li></ol>
    <blockquote><p>Keep a monthly backup.</p></blockquote>
    <p><a href="https://example.com/guide" title="Setup guide">Setup guide</a></p>
    <p><a href="javascript:window.cmsExecuted=true" onclick="window.cmsExecuted=true">Unsafe link</a></p>
    <script>window.cmsExecuted=true</script>
    <style>body { display:none }</style>
    <iframe srcdoc="<script>parent.cmsExecuted=true</script>"></iframe>
    <svg onload="window.cmsExecuted=true"></svg>
    <img src="https://images.example.test/preview.png" onerror="window.cmsExecuted=true" alt="Preview">
  `,
    },
  ]);
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details →', exact: true }).click();
  const description = page.getByRole('region', { name: 'Product description' });
  await expect(description.getByRole('heading', { name: 'Getting started' })).toBeVisible();
  await expect(description.locator('strong')).toHaveText('Excel');
  await expect(description.locator('em')).toHaveText('Google Sheets');
  await expect(description.locator('ol')).toHaveAttribute('start', '3');
  await expect(description.locator('ol > li ul')).toHaveCount(1);
  await expect(description.locator('blockquote')).toContainText('Keep a monthly backup.');
  await expect(description.getByRole('link', { name: 'Setup guide' })).toHaveAttribute(
    'href',
    'https://example.com/guide',
  );
  await expect(
    description.locator(
      'script, style, iframe, svg, [style], [class], [id], [data-editor], [onclick], [onerror]',
    ),
  ).toHaveCount(0);
  const unsafe = description.getByText('Unsafe link');
  expect(await unsafe.getAttribute('href')).toBeNull();
  await unsafe.click();
  expect(await page.evaluate(() => window.cmsExecuted)).toBeUndefined();
});

test('short descriptions retain formatting when the long description is empty', async ({
  page,
}) => {
  await mockCatalog(page, [
    {
      ...product,
      description: '',
      short_description: '<p>A <strong>practical</strong> toolkit.</p>',
    },
  ]);
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details →', exact: true }).click();
  const description = page.getByRole('region', { name: 'Product description' });
  await expect(description).toHaveText('A practical toolkit.');
  await expect(description.locator('strong')).toHaveText('practical');
});

test('loading, failure, retry and empty states never substitute demo products', async ({
  page,
}) => {
  let state = 'pending';
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/catalog?**', async (route) => {
    if (state === 'pending') await ready;
    await route.fulfill(
      state === 'error'
        ? { status: 502, json: { error: 'Unavailable' } }
        : { json: [], headers: { 'X-WP-TotalPages': '0' } },
    );
  });
  await page.goto('/');
  await expect(
    page.getByRole('status', { name: 'Loading featured product', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Details →' })).toHaveCount(0);
  state = 'error';
  release();
  await expect(page.getByRole('alert')).toContainText('Products are temporarily unavailable');
  await expect(page.locator('main')).not.toContainText('AI Wealth Accelerator Bundle');
  state = 'empty';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No products available yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await expect(page.getByText('No products found.')).toBeVisible();
});

test('pagination, featured selection, search and CMS category filtering', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 900 });
  const course = {
    ...product,
    id: 16,
    name: 'Practical Business Course',
    categories: [{ id: 2, name: 'Courses', slug: 'courses' }],
  };
  await page.route('**/api/catalog?**', (route) => {
    const query = new URL(route.request().url()).searchParams;
    const featured = query.has('featured');
    return route.fulfill({
      headers: { 'X-WP-TotalPages': featured ? '1' : '2' },
      json: featured || query.get('page') === '2' ? [course] : [product],
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details →', exact: true }).click();
  await expect(page.getByRole('heading', { name: course.name })).toBeVisible();
  await page.getByRole('button', { name: 'Longlife Digital home' }).click();
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await expect(page.locator('.pcard')).toHaveCount(2);
  await page.getByLabel('Category', { exact: true }).selectOption('business-startup-toolkits');
  await expect(page.locator('.pcard')).toHaveCount(1);
  await expect(page.locator('.pcard')).toContainText(product.name);
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('textbox', { name: 'Search products in menu' }).fill('Practical');
  await page.getByRole('button', { name: 'View search results' }).click();
  await expect(page.locator('.pcard')).toHaveCount(1);
  await expect(page.locator('.pcard')).toContainText(course.name);
});

test('unavailable products, currency precision, inert content and private-field omission', async ({
  page,
}) => {
  await mockCatalog(page, [
    {
      ...product,
      is_in_stock: false,
      description: '<p>Safe &amp; sound</p><script>window.cmsExecuted = true</script>',
      prices: {
        price: '1299',
        regular_price: '1299',
        currency_code: 'EUR',
        currency_minor_unit: 2,
      },
    },
  ]);
  await page.goto('/');
  await page.getByRole('button', { name: 'View Details →', exact: true }).click();
  await expect(page.getByText('€12.99', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Out of stock')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled();
  await expect(page.locator('main')).toContainText('Safe & sound');
  expect(await page.evaluate(() => window.cmsExecuted)).toBeUndefined();
  const result = await page.evaluate(async (data) => {
    const { normalizeProduct } = await import('/src/services/catalog.js');
    const item = normalizeProduct(data);
    const zero = normalizeProduct({ ...data, prices: { ...data.prices, price: '0' } });
    const yen = normalizeProduct({
      ...data,
      prices: { price: '1299', currency_code: 'JPY', currency_minor_unit: 0 },
    });
    return { item, free: zero.price, yen: yen.price };
  }, product);
  expect(JSON.stringify(result)).not.toContain('private.example.test');
  expect(result.item.price).toBe(29);
  expect(result.free).toBe(0);
  expect(result.yen).toBe(1299);
});

test('Vercel endpoint restricts requests and forwards only public pagination', async () => {
  const originalFetch = globalThis.fetch;
  const previousUrl = process.env.VITE_WOOCOMMERCE_STORE_API_URL;
  const previousEnvironment = process.env.VERCEL_ENV;
  process.env.VITE_WOOCOMMERCE_STORE_API_URL = 'https://store.example.test/wp-json/wc/store/v1';
  process.env.VERCEL_ENV = 'production';
  let requested;
  globalThis.fetch = async (url) => {
    requested = url;
    return new Response(JSON.stringify([product]), { headers: { 'X-WP-TotalPages': '2' } });
  };
  const invoke = async (method, url) => {
    const res = {
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    await catalogHandler({ method, url }, res);
    return res;
  };
  try {
    expect((await invoke('POST', '/api/catalog')).code).toBe(405);
    expect((await invoke('GET', '/api/catalog?page=-1')).code).toBe(400);
    const response = await invoke(
      'GET',
      '/api/catalog?page=2&featured=true&status=draft&url=https://untrusted.test',
    );
    expect(response.code).toBe(200);
    expect(response.headers['X-WP-TotalPages']).toBe('2');
    expect(response.headers['Cache-Control']).toBe(
      'public, max-age=0, s-maxage=5, must-revalidate',
    );
    expect(requested.searchParams.get('_lld_refresh')).toBeTruthy();
    requested.searchParams.delete('_lld_refresh');
    expect(requested.href).toBe(
      'https://store.example.test/wp-json/wc/store/v1/products?per_page=100&page=2&featured=true',
    );
    process.env.VERCEL_ENV = 'preview';
    expect((await invoke('GET', '/api/catalog')).headers['Cache-Control']).toBe('no-store');
    process.env.VERCEL_ENV = 'production';
    globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 503 });
    const error = await invoke('GET', '/api/catalog');
    expect(error.code).toBe(502);
    expect(error.headers['Cache-Control']).toBe('no-store');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.VITE_WOOCOMMERCE_STORE_API_URL;
    else process.env.VITE_WOOCOMMERCE_STORE_API_URL = previousUrl;
    if (previousEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousEnvironment;
  }
});

test('approved ACF product extras render safely without exposing unrelated extensions', async ({
  page,
}) => {
  await mockCatalog(page, [
    {
      ...product,
      extensions: {
        ...product.extensions,
        'longlife-content': {
          level: 'Beginner',
          duration: 'Two hours',
          includes:
            '<ul><li>Published worksheet</li></ul><script>window.productInjected=true</script>',
          compatibility: 'Excel and Google Sheets',
          license_summary: 'One business license',
          seo_title: 'CMS product search title',
          noindex: true,
          internal_note: 'Never render this',
        },
      },
    },
  ]);
  await page.goto(`/products/${product.id}`);
  await expect(page.getByText('Published worksheet')).toBeVisible();
  await expect(page.getByText('One business license')).toBeVisible();
  await expect(page).toHaveTitle('CMS product search title');
  await expect(page.locator('main')).not.toContainText('Never render this');
  await expect(page.locator('main')).not.toContainText('private.example.test');
  expect(await page.evaluate(() => window.productInjected)).toBeUndefined();
});
