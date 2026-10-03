import { expect, test } from '@playwright/test';
import { mockLayoutStorefront } from './fixtures/layoutStorefront';

test.beforeEach(async ({ context }) => {
  await mockLayoutStorefront(context);
});

test('contact failure preserves details and a successful retry completes the form', async ({
  page,
}) => {
  const requests = [];
  await page.route('**/api/forms?action=contact', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 503 : 200,
      json:
        requests.length === 1 ? { error: 'Messages are temporarily unavailable.' } : { ok: true },
    });
  });
  await page.goto('/contact');
  await page.getByLabel('Your Name *').fill('Alex');
  await page.getByLabel('Email *', { exact: true }).fill('alex@example.test');
  await page.getByLabel('Message *', { exact: true }).fill('Please contact me.');
  await page.getByRole('button', { name: '✦ Send Message' }).click();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await expect(page.getByLabel('Your Name *')).toHaveValue('Alex');
  await page.getByRole('button', { name: '✦ Send Message' }).click();
  await expect(page.getByRole('button', { name: 'Send Another' })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0].requestId).toBe(requests[1].requestId);
});

test('home newsletter requires consent and only succeeds after provider acceptance', async ({
  page,
}) => {
  const requests = [];
  await page.route('**/api/forms?action=newsletter', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 503 : 200,
      json:
        requests.length === 1
          ? { error: 'Newsletter signup is temporarily unavailable.' }
          : { ok: true },
    });
  });
  await page.goto('/');
  await page.getByPlaceholder('e.g. John', { exact: true }).fill('Alex');
  await page.getByPlaceholder('e.g. john@email.com').fill('alex@example.test');
  await page.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  expect(requests).toHaveLength(0);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await expect(page.getByPlaceholder('e.g. John', { exact: true })).toHaveValue('Alex');
  await page.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  await expect(
    page.locator('main').getByText('Check your inbox for any confirmation steps.'),
  ).toBeVisible();
  expect(requests[1].consent).toBe(true);
  expect(requests[0].requestId).toBe(requests[1].requestId);
});

test('popup newsletter submits to the same provider and closes on success', async ({ page }) => {
  let submitted;
  await page.route('**/api/forms?action=newsletter', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.clock.install();
  await page.goto('/');
  await page.clock.fastForward(180001);
  const dialog = page.getByRole('dialog', { name: 'Join the community' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('First name').fill('Alex');
  await dialog.getByLabel('Email address').fill('alex@example.test');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: /Subscribe — It's Free/ }).click();
  await expect(dialog).toHaveCount(0);
  expect(submitted.consent).toBe(true);
});
