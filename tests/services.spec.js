import { test, expect } from '@playwright/test';
import { mockFluidStorefront } from './fixtures/fluidStorefront';
const services = [
  {
    id: 41,
    slug: 'website-design-development',
    title: 'Website Design & Development',
    description: 'A website built for your business.',
    body: '<h2>A useful digital home.</h2><p>Design and development around your goals.</p>',
    specialties: ['Business websites', 'E-commerce websites', 'Landing pages'],
    visual: 'web',
    process: '<p>We discuss your goals and prepare a quote.</p>',
    inquiryTitle: 'Let’s talk about your website.',
  },
  {
    id: 42,
    slug: 'seo-local-seo',
    title: 'SEO & Local SEO',
    description: 'Help customers find you.',
    specialties: ['Keyword research'],
    visual: 'search',
  },
];
async function setup(page) {
  await mockFluidStorefront(page);
  await page.route('**/api/content?resource=services', (route) =>
    route.fulfill({ json: services }),
  );
  await page.route('**/api/account?**', (route) => route.fulfill({ json: { user: null } }));
}
test('service overview, direct routes, old links and mobile layout work with CMS content', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/services');
  await expect(page.getByRole('heading', { name: 'Website Design & Development' })).toBeVisible();
  await page.getByRole('link', { name: /01 Website Design/ }).click();
  await expect(page).toHaveURL(/\/services\/website-design-development$/);
  await expect(page.getByRole('heading', { name: 'A useful digital home.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Let’s talk about your website.' })).toBeVisible();
  await page.goto('/services#seo-local-seo');
  await expect(page).toHaveURL(/\/services\/seo-local-seo$/);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/services/website-design-development');
  await expect(
    page.getByRole('heading', { name: 'Website Design & Development', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/services/detail-mobile.png', fullPage: true });
  await page.goto('/services/does-not-exist');
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
});
test('inquiry validates required fields, shows delivery errors, retries once and confirms success', async ({
  page,
}) => {
  await setup(page);
  const calls = [];
  await page.route('**/api/inquiry', async (route) => {
    calls.push(route.request().postDataJSON());
    return route.fulfill(
      calls.length === 1
        ? { status: 502, json: { error: 'Unable to send inquiry. Please try again.' } }
        : { json: { ok: true } },
    );
  });
  await page.goto('/services/website-design-development');
  const send = page.getByRole('button', { name: 'Send inquiry' });
  await send.click();
  expect(calls).toHaveLength(0);
  await page.getByLabel('First name').fill('Alex');
  await page.getByLabel('Last name').fill('River');
  await page.getByLabel('Email address').fill('alex@example.test');
  await page.getByLabel('Telephone number').fill('+1 555 123 4567');
  await send.click();
  await expect(page.getByRole('alert')).toContainText('Unable to send inquiry');
  await expect(send).toBeEnabled();
  await send.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Thank you for reaching out.' }),
  ).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[0].serviceId).toBe(41);
  expect(calls[0].businessName).toBe('');
  expect(calls[0].requestId).toBe(calls[1].requestId);
});
