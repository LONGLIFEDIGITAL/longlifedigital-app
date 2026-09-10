import { test, expect } from '@playwright/test';

async function navigate(page, label) {
  const burger = page.getByRole('button', { name: 'Open navigation menu', exact: true });
  if (await burger.isVisible()) {
    await burger.click();
    await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } else {
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('button', { name: label, exact: true })
      .click();
    if (label === 'Services')
      await page.getByRole('menuitem', { name: 'View All Services →' }).click();
    if (label === 'Domains')
      await page.getByRole('menuitem', { name: 'Browse All Domains →' }).click();
  }
}

async function expectFits(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
  for (const dialog of await page.getByRole('dialog').all()) {
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    const overflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
}

for (const [width, height] of [
  [320, 568],
  [393, 852],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
]) {
  test(`pages fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Beautifully Crafted');
    await expectFits(page);
    await page.screenshot({ path: `test-results/home-${width}.png` });
    for (const label of [
      'Services',
      'Courses',
      'Domains',
      'Digital Products',
      'About',
      'Contact',
    ]) {
      await navigate(page, label);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectFits(page);
    }
    for (const label of ['Blog', 'FAQ', 'Refund Policy', 'Privacy Policy', 'Terms of Service']) {
      await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
      await page.locator('footer').getByText(label, { exact: true }).first().click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectFits(page);
    }
    await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
    await page.getByRole('button', { name: 'View Details →', exact: true }).first().click();
    await expect(
      page.getByRole('button', { name: 'Add to Cart', exact: true }).first(),
    ).toBeVisible();
    await expectFits(page);
    expect(errors).toEqual([]);
  });
}

test('mobile navigation, search, cart and checkout retain their behavior', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search products in menu' }).fill('Migraine');
  await page.getByRole('button', { name: 'View search results' }).click();
  await expect(page.locator('main')).toContainText('1 product');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('added to cart');
  await page.getByRole('button', { name: 'Open cart (1)', exact: true }).click();
  const cart = page.getByRole('dialog', { name: 'Shopping cart' });
  await expect(cart).toContainText('Migraine & Headache Tracker');
  await expectFits(page);
  await cart.getByRole('button', { name: /Checkout —/ }).click();
  const checkout = page.getByRole('dialog', { name: 'Secure checkout' });
  await expect(checkout).toBeVisible();
  await expectFits(page);
  await checkout.getByPlaceholder('John Smith').fill('Responsive Test');
  await checkout.getByPlaceholder('john@email.com').fill('responsive@example.com');
  // Exercise the existing request and error path without contacting a payment provider.
  let requested;
  await page.route('**/api/create-payment-intent', async (route) => {
    requested = route.request().postDataJSON();
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Test payment unavailable' }),
    });
  });
  await checkout.getByRole('button', { name: 'Continue to Payment →' }).click();
  await expect(checkout).toContainText('Test payment unavailable');
  expect(requested).toBeTruthy();
  await checkout.getByRole('button', { name: '← Back' }).click();
  await expect(checkout.getByPlaceholder('John Smith')).toHaveValue('Responsive Test');
  await page.keyboard.press('Escape');
  await expect(checkout).toHaveCount(0);
  await page.getByRole('button', { name: 'Open cart (1)', exact: true }).click();
  await cart.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(cart).toContainText('Your cart is empty');
});

test('chat fits a short phone screen and keeps its request behavior', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route('**/api/chat', (route) =>
    route.fulfill({ json: { reply: 'This is a local test response.' } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Open AI chat' }).click();
  await page.getByPlaceholder('Ask about our services...').fill('What products do you offer?');
  await page.getByPlaceholder('Ask about our services...').press('Enter');
  await expect(page.getByText('This is a local test response.')).toBeVisible();
  await expectFits(page);
  await page.screenshot({ path: 'test-results/chat-mobile.png' });
  await page.getByRole('button', { name: 'Close AI chat' }).click();
});

async function loginAsOwner(page) {
  await page.keyboard.type('aaa');
  const login = page.getByRole('dialog', { name: 'Admin login' });
  await expect(login).toBeVisible();
  await login.getByPlaceholder('Password').fill('longlife2024');
  await login.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(login).toHaveCount(0);
}

test('admin dashboard and every tab fit on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await loginAsOwner(page);
  await page.getByRole('button', { name: 'Open dashboard' }).click();
  const dashboard = page.getByRole('dialog', { name: 'Longlife Digital Dashboard' });
  for (const name of ['Overview', 'Orders', 'Products', 'Team', 'Subscribers', 'Settings']) {
    await dashboard.getByRole('button', { name: new RegExp(name) }).click();
    await expectFits(page);
  }
  await dashboard.getByRole('button', { name: /Team/ }).click();
  await dashboard.getByRole('button', { name: '+ Add Member', exact: true }).click();
  await expectFits(page);
  await page.screenshot({ path: 'test-results/admin-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(dashboard).toHaveCount(0);
});

test('product create, edit and delete keep working in a scrollable phone dialog', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 568 });
  await page.goto('/');
  await loginAsOwner(page);
  await page.getByRole('button', { name: '+ Add Product', exact: true }).first().click();
  const editor = page.getByRole('dialog', { name: 'Product editor' });
  await expectFits(page);
  await editor.getByPlaceholder('e.g. The AI Prompt Bible').fill('Responsive test product');
  await editor.getByPlaceholder('e.g. 29', { exact: true }).fill('19');
  await editor
    .getByPlaceholder('Describe your product...')
    .fill('A temporary product for this browser test.');
  await editor.getByRole('button', { name: 'Publish Product' }).click();
  await expect(editor).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Product published');
  await navigate(page, 'Digital Products');
  const card = page.locator('.pcard').filter({ hasText: 'Responsive test product' });
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(editor.getByPlaceholder('e.g. The AI Prompt Bible')).toHaveValue(
    'Responsive test product',
  );
  await editor.getByPlaceholder('e.g. 29', { exact: true }).fill('29');
  await editor.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(card).toContainText('$29');
  await card.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete product' });
  await expectFits(page);
  await confirmation.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(card).toHaveCount(0);
});

test('contact form and newsletter retain their validation and success behavior', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  await navigate(page, 'Contact');
  await page.getByPlaceholder('John Smith').fill('Responsive Test');
  await page.getByPlaceholder('john@email.com').fill('responsive@example.com');
  await page
    .getByPlaceholder('Tell us about your project or question...')
    .fill('Please send information.');
  await page.getByRole('button', { name: /Send Message/ }).click();
  await expect(page.getByText('Thank you! We will reply within 24 hours.')).toBeVisible();
  await page.getByRole('button', { name: 'Longlife Digital home', exact: true }).click();
  await page.getByPlaceholder('e.g. John', { exact: true }).fill('Responsive Test');
  await page
    .getByPlaceholder('e.g. john@email.com', { exact: true })
    .fill('responsive@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  await expect(page.getByText("✦ You're subscribed! Welcome aboard.")).toBeVisible();
  await expectFits(page);
});

test('timed newsletter dialog fits and closes on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.clock.install();
  await page.goto('/');
  await page.clock.fastForward(31000);
  const popup = page.getByRole('dialog', { name: 'Join the community' });
  await expect(popup).toBeVisible();
  await expectFits(page);
  await popup.getByRole('button', { name: 'Close dialog' }).click();
  await expect(popup).toHaveCount(0);
});

test('announcement follows scrolling without covering navigation or moving it repeatedly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.locator('header').evaluate((header) =>
    Math.abs(header.getBoundingClientRect().top + header.firstElementChild.getBoundingClientRect().height)
  )).toBeLessThan(0.1);
  const first = await nav.boundingBox();
  await page.getByRole('button', { name: 'Open cart (0)' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toBeVisible();
  await page.keyboard.press('Escape');
  const second = await nav.boundingBox();
  expect(Math.abs(first.y - second.y)).toBeLessThan(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByText(/Get.*10% off/)).toBeVisible();
  await expectFits(page);
});
