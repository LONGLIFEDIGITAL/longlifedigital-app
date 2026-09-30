import { test, expect } from '@playwright/test';
import { mockFluidStorefront } from './fixtures/fluidStorefront.js';
const customer = { id: 7, email: 'reader@example.test', name: 'Reader' };
async function setup(page) {
  await mockFluidStorefront(page);
  const state = { user: null, expired: false, calls: [] };
  await page.route('**/api/account?**', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : {};
    state.calls.push({ action, body });
    if (action === 'session') return route.fulfill({ json: { user: state.user } });
    if (action === 'login') {
      if (body.password !== 'a-valid-password')
        return route.fulfill({
          status: 401,
          json: { error: 'The email or password is incorrect.' },
        });
      state.user = customer;
      return route.fulfill({ json: { user: customer } });
    }
    if (action === 'logout') {
      state.user = null;
      return route.fulfill({ json: { user: null } });
    }
    if (action === 'orders') {
      if (state.expired) {
        state.user = null;
        return route.fulfill({ status: 401, json: { error: 'Session expired.' } });
      }
      return route.fulfill({
        json: {
          orders: [
            {
              number: '42',
              status: 'Completed',
              date: '2026-09-28T12:00:00Z',
              total: '19.99',
              currency: 'USD',
              items: [{ name: 'An ebook', quantity: 1 }],
            },
          ],
          hasMore: false,
        },
      });
    }
    if (action === 'reset') {
      if (body.key !== 'valid-key')
        return route.fulfill({
          status: 400,
          json: { error: 'This reset link is invalid or expired. Request a new link.' },
        });
      return route.fulfill({ json: { user: null } });
    }
    return route.fulfill({
      json: {
        message:
          'If this email can be used, you’ll receive a link to set your password shortly. Check your spam folder too.',
      },
    });
  });
  return state;
}
async function login(page, next = '') {
  await page.goto(`/login${next}`);
  await page.getByLabel(/^Email address/).fill(customer.email);
  await page.getByLabel(/^Password/).fill('a-valid-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
}
test('menu ends with Login and opens the preloaded form while CMS and session requests are pending', async ({
  page,
}) => {
  await setup(page);
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const chunks = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') chunks.push(request.url());
  });
  for (const pattern of ['**/api/content?**', '**/api/account?action=session']) {
    await page.route(pattern, async (route) => {
      await pending;
      await route.fallback();
    });
  }
  try {
    await page.goto('/');
    await expect(
      page.locator('header').getByRole('link', { name: 'Log in or create an account' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const entry = page.locator('#mobile-navigation > :last-child');
    await expect(entry).toHaveText('Login');
    await expect(entry.locator('svg')).toBeVisible();
    await entry.click();
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByLabel(/^Email address/)).toBeEditable();
    await page.getByRole('link', { name: 'Create an account', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your next chapter starts here.' })).toBeVisible(
      { timeout: 2000 },
    );
    expect(chunks.some((url) => /\/AuthPage-[^/]+\.js/.test(url))).toBe(false);
  } finally {
    release();
  }
});
test('customer login, persisted session, own orders and logout', async ({ page }) => {
  await setup(page);
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel(/^Email address/).fill(customer.email);
  await page.getByLabel(/^Password/).fill('wrong-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('email or password is incorrect');
  await page.getByLabel(/^Password/).fill('a-valid-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { name: 'Hello, Reader.' })).toBeVisible();
  await expect(page.getByText('Order #42')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Order #42')).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Order #42')).toHaveCount(0);
});
test('email registration and password reset flow keeps reset credentials out of the URL', async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto('/register');
  await page.getByLabel(/^Your name/).fill('Reader');
  await page.getByLabel(/^Email address/).fill(customer.email);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'receive a link' })).toBeVisible();
  await page.goto('/reset-password#key=valid-key&login=reader');
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel(/^New password/).fill('a-valid-password');
  await page.getByLabel(/^Confirm password/).fill('another-password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByRole('alert')).toContainText('passwords don’t match');
  await page.getByLabel(/^Confirm password/).fill('a-valid-password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByText('Your password is saved. You can now log in.')).toBeVisible();
  expect(state.calls.find((call) => call.action === 'reset').body.key).toBe('valid-key');
});
test('forgot password and invalid reset links are recoverable', async ({ page }) => {
  await setup(page);
  await page.goto('/forgot-password');
  await page.getByLabel(/^Email address/).fill(customer.email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'receive a link' })).toBeVisible();
  await page.goto('/reset-password');
  await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible();
  await page.goto('/reset-password#key=expired-key&login=reader');
  await page.getByLabel(/^New password/).fill('a-valid-password');
  await page.getByLabel(/^Confirm password/).fill('a-valid-password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByRole('alert')).toContainText('invalid or expired');
});
test('a lock held by another tab times out, never sends a delayed reset, and allows retry', async ({
  page,
  context,
}) => {
  const state = await setup(page);
  const blocker = await context.newPage();
  await setup(blocker);
  await blocker.goto('/login');
  await blocker.evaluate(
    () =>
      new Promise((resolve) => {
        navigator.locks.request(
          'lld-account',
          () =>
            new Promise((release) => {
              window.releaseAccountLock = release;
              resolve();
            }),
        );
      }),
  );
  try {
    await page.goto('/reset-password#key=valid-key&login=reader');
    await page.getByLabel(/^New password/).fill('a-valid-password');
    await page.getByLabel(/^Confirm password/).fill('a-valid-password');
    const save = page.getByRole('button', { name: 'Save password' });
    await save.click();
    await expect(page.getByRole('alert')).toContainText('could not confirm the password change', {
      timeout: 30000,
    });
    await expect(save).toBeEnabled();
    expect(state.calls.filter((call) => call.action === 'reset')).toHaveLength(0);
    await blocker.evaluate(() => window.releaseAccountLock());
    // Only the explicit retry may write the password after the lock is released.
    await save.click();
    await expect(page.getByText('Your password is saved. You can now log in.')).toBeVisible();
    expect(state.calls.filter((call) => call.action === 'reset')).toHaveLength(1);
  } finally {
    await blocker.close();
  }
});

test('an offline browser hint cannot silently pause a password submission', async ({ page }) => {
  const state = await setup(page);
  await page.goto('/reset-password#key=valid-key&login=reader');
  await page.getByLabel(/^New password/).fill('a-valid-password');
  await page.getByLabel(/^Confirm password/).fill('a-valid-password');
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByText('Your password is saved. You can now log in.')).toBeVisible();
  expect(state.calls.filter((call) => call.action === 'reset')).toHaveLength(1);
});
test('login returns to checkout, preserves the cart and rejects external redirects', async ({
  page,
}) => {
  await setup(page);
  await login(page, '?next=%2Fcheckout');
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(
    page.getByText(`Logged in as ${customer.email}. This order will appear in your account.`),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open cart (1)' })).toBeVisible();
  await page.goto('/login?next=https%3A%2F%2Fevil.test');
  await expect(page).toHaveURL(/\/account$/);
});
test('an expired account redirects to login without a redirect loop', async ({ page }) => {
  const state = await setup(page);
  state.expired = true;
  await login(page);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});
for (const width of [320, 393, 1440]) {
  test(`account screens fit at ${width}px`, async ({ page }, testInfo) => {
    await setup(page);
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/login', '/register', '/forgot-password']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    if (width !== 320)
      await page.screenshot({ path: testInfo.outputPath('forgot-password.png'), fullPage: true });
    await login(page);
    await expect(page.getByText('Order #42')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
