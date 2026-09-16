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
    await expect(page.getByRole('button', { name: 'Checkout coming soon' })).toBeDisabled();
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.getByRole('button', { name: 'Open cart (1)' }).click();
    const cart = page.getByRole('dialog', { name: 'Shopping cart' });
    await expect(cart).toContainText(product.name);
    await expect(cart).toContainText('$29');
    await expect(cart.getByRole('button', { name: 'Checkout coming soon' })).toBeDisabled();
    await cart.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(cart).toContainText('Your cart is empty');
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1);
    await page.screenshot({ path: `test-results/catalog-product-${width}.png`, fullPage: true });
  });
}

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
  await expect(page.getByText('Loading products…')).toBeVisible();
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
  process.env.VITE_WOOCOMMERCE_STORE_API_URL = 'https://store.example.test/wp-json/wc/store/v1';
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
    expect(requested.href).toBe(
      'https://store.example.test/wp-json/wc/store/v1/products?per_page=100&page=2&featured=true',
    );
    globalThis.fetch = async () => new Response('<html>Unavailable</html>', { status: 503 });
    expect((await invoke('GET', '/api/catalog')).code).toBe(502);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.VITE_WOOCOMMERCE_STORE_API_URL;
    else process.env.VITE_WOOCOMMERCE_STORE_API_URL = previousUrl;
  }
});
