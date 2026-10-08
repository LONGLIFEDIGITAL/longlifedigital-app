import { expect, test } from '@playwright/test';
import { mockLayoutStorefront } from './fixtures/layoutStorefront';

const popup = (page) => page.getByRole('dialog', { name: 'Join the community' });

async function visitHome(page) {
  await page.goto('/');
  // Let the mocked CMS response enable the popup before advancing its deadline.
  // React Query delivers updates on timers, so poll while ticking the paused clock.
  await expect
    .poll(async () => {
      await page.clock.runFor(20);
      return page.getByRole('heading', { name: 'Newsletter', exact: true }).isVisible();
    })
    .toBe(true);
}

async function visibility(page, state) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, state);
}

test.beforeEach(async ({ page, context }) => {
  await mockLayoutStorefront(context);
  await context.route('**/api/forms?action=newsletter', (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.clock.install({ time: new Date('2030-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T12:00:01Z'));
  await page.setViewportSize({ width: 393, height: 852 });
});

test('confirmed subscribers see the frontend thank-you page without another signup prompt', async ({
  page,
}) => {
  const submissions = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/forms?')) submissions.push(request.url());
  });
  await page.goto('/newsletter-confirmed');
  await expect(page.getByRole('heading', { name: "You're on the list." })).toBeVisible();
  await expect(page.getByText(/Your newsletter subscription is confirmed/)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.getByRole('link', { name: 'Back to home', exact: true })).toHaveAttribute(
    'href',
    '/',
  );
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 852 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.clock.fastForward(180001);
  await expect(popup(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: "You're on the list." })).toBeVisible();
  await page.getByRole('link', { name: 'Explore products', exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.clock.fastForward(180001);
  await expect(popup(page)).toHaveCount(0);
  expect(submissions).toEqual([]);
});

test('popup waits three minutes, then dismissal persists through navigation, reload and a new tab', async ({
  page,
  context,
}) => {
  await visitHome(page);
  await page.clock.fastForward(179000);
  await expect(popup(page)).toHaveCount(0);
  await page.clock.fastForward(1001);
  await expect(popup(page)).toBeVisible();
  await popup(page).getByRole('button', { name: 'Close dialog' }).click();
  await expect(popup(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await page.clock.fastForward(600000);
  await expect(popup(page)).toHaveCount(0);
  await page.reload();
  await page.clock.fastForward(600000);
  await expect(popup(page)).toHaveCount(0);
  const returning = await context.newPage();
  await returning.goto('/');
  await returning.clock.fastForward(600000);
  await expect(popup(returning)).toHaveCount(0);
});

test('refreshing before the deadline preserves the original first-visit timer', async ({
  page,
}) => {
  await visitHome(page);
  await page.clock.fastForward(90000);
  await page.reload();
  await page.clock.fastForward(89000);
  await expect(popup(page)).toHaveCount(0);
  await page.clock.fastForward(1001);
  await expect(popup(page)).toBeVisible();
});

test('refreshing while the popup is open still counts as its one display', async ({ page }) => {
  await visitHome(page);
  await page.clock.fastForward(180001);
  await expect(popup(page)).toBeVisible();
  await page.reload();
  await page.clock.fastForward(600000);
  await expect(popup(page)).toHaveCount(0);
});

test('the popup waits for a visible page and does not interrupt the cart', async ({ page }) => {
  await visitHome(page);
  await visibility(page, 'hidden');
  await page.clock.fastForward(180001);
  await expect(popup(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Open cart (0)' }).click();
  await visibility(page, 'visible');
  await page.clock.fastForward(1000);
  await expect(popup(page)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.clock.fastForward(1000);
  await expect(popup(page)).toBeVisible();
});

test('an earlier page subscription suppresses the popup on this visit and later visits', async ({
  page,
}) => {
  // Let React Query deliver the initial CMS response before exercising the form.
  await page.clock.resume();
  await page.goto('/');
  await page.getByPlaceholder('e.g. John', { exact: true }).fill('Example');
  await page.getByPlaceholder('e.g. john@email.com', { exact: true }).fill('reader@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  await expect(
    page.locator('main').getByText("✦ You're subscribed! Welcome aboard."),
  ).toBeVisible();
  await page.clock.fastForward(180001);
  await expect(popup(page)).toHaveCount(0);
  await page.reload();
  await page.clock.fastForward(180001);
  await expect(popup(page)).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).not.toContain('reader@example.com');
});

test('unavailable storage does not crash the page or repeat the popup during navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage is disabled', 'SecurityError');
      },
    });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await visitHome(page);
  await page.clock.fastForward(180001);
  await expect(popup(page)).toBeVisible();
  await popup(page).getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Shop Now', exact: true }).click();
  await page.clock.fastForward(600000);
  await expect(popup(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('two tabs share a single popup display', async ({ page, context }) => {
  await visitHome(page);
  const second = await context.newPage();
  await visitHome(second);
  await visibility(page, 'visible');
  await visibility(second, 'visible');
  await page.clock.fastForward(180001);
  await expect
    .poll(
      async () => Number(await popup(page).isVisible()) + Number(await popup(second).isVisible()),
    )
    .toBe(1);
  await second.clock.fastForward(180001);
  expect(Number(await popup(page).isVisible()) + Number(await popup(second).isVisible())).toBe(1);
});
