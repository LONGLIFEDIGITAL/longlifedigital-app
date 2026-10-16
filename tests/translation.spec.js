import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mockFluidStorefront, product } from './fixtures/fluidStorefront';
import { translationContent } from '../server/translationContent';

const seed = JSON.parse(
  readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
);
const service = {
  id: 43,
  slug: seed.slug,
  title: seed.title,
  description: seed.excerpt,
  visual: 'translation',
  specialties: ['Certified translations'],
  translation: translationContent(seed.acf),
};
async function setup(page, patch = {}) {
  await mockFluidStorefront(page);
  await page.route('**/api/content?resource=services', (route) =>
    route.fulfill({ json: [{ ...service, translation: { ...service.translation, ...patch } }] }),
  );
  await page.route('**/api/account?**', (route) => route.fulfill({ json: { user: null } }));
  await page.route('**/api/commerce?**', (route) =>
    route.fulfill({ json: { items: [], totals: {} } }),
  );
}

test('translation landing, service discovery and mobile layouts use CMS rates with credentials hidden', async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/services');
  await page.getByRole('link', { name: /01 Document Translation/ }).click();
  await expect(page).toHaveURL(/\/services\/translation$/);
  await expect(page.getByRole('heading', { name: /Your words/ })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Service specialties' })).toContainText(
    'Certified translations',
  );
  await expect(page.getByRole('heading', { name: 'Family Package' })).toBeVisible();
  await expect(page.getByLabel('Translator credentials')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('HIPAA certified');
  await expect(page.getByRole('link', { name: 'Explore the book' })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/services/translation-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/services/translation-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Get a free quote', exact: true }).first().click();
  await expect(page).toHaveURL(/\/services\/translation\/request$/);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'What would you like translated?' }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.getByRole('button', { name: /chat/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'test-results/services/translation-request-mobile.png',
    fullPage: true,
  });
});

test('guided quote validates, preserves fields and reuses request id after delivery failure', async ({
  page,
}) => {
  await setup(page);
  const calls = [];
  await page.route('**/api/inquiry', (route) => {
    calls.push(route.request().postDataJSON());
    return route.fulfill(
      calls.length === 1
        ? { status: 502, json: { error: 'Unable to send inquiry. Please try again.' } }
        : { json: { ok: true } },
    );
  });
  await page.goto('/services/translation/request?service=family');
  await expect(page.getByLabel('Number of documents')).toHaveValue('3');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What would you like translated?' }),
  ).toBeVisible();
  await page.getByLabel('Original language').selectOption('French');
  await expect(page.getByLabel('Translate into')).toHaveValue('English');
  await expect(page.getByLabel('Your translation request')).toContainText('$120.00');
  await page.getByLabel(/Request a 24-hour rush/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Alex');
  await page.getByLabel('Last name').fill('River');
  await page.getByLabel('Email address').fill('alex@example.test');
  await page.getByLabel('Phone number').fill('+1 555 123 4567');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Original language')).toHaveValue('French');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('First name')).toHaveValue('Alex');
  await page.getByRole('button', { name: 'Request my free quote' }).click();
  expect(calls).toHaveLength(0);
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  await page.getByRole('button', { name: 'Request my free quote' }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to send inquiry');
  await page.getByRole('button', { name: 'Request my free quote' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Request received' })).toBeVisible();
  expect(calls).toHaveLength(2);
  expect(calls[0].requestId).toBe(calls[1].requestId);
  expect(calls[0].translation).toMatchObject({
    service: 'family',
    documents: 3,
    pages: 3,
    source: 'French',
    target: 'English',
    consent: true,
    rush: true,
  });
  await expect(page.locator('main')).toContainText('No payment has been taken');
  await expect(page.getByRole('link', { name: 'Open document form' })).toHaveCount(0);
});

test('configured credentials, book and secure form appear only where intended', async ({
  page,
}) => {
  await setup(page, {
    credentials: [
      {
        kind: 'translator',
        description: 'Client-approved credential',
        url: 'https://credentials.example.test/verify',
      },
    ],
    secureFormUrl: 'https://secure.example.test/form',
    bookId: 318,
  });
  await page.route('**/api/inquiry', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/services/translation');
  await expect(page.getByLabel('Translator credentials')).toContainText(
    'Client-approved credential',
  );
  await expect(page.getByRole('link', { name: 'View credential' })).toHaveAttribute(
    'href',
    'https://credentials.example.test/verify',
  );
  await expect(page.getByRole('link', { name: 'Explore the book' })).toHaveAttribute(
    'href',
    '/products/318',
  );
  await page.goto('/services/translation/request');
  await expect(page.getByRole('link', { name: 'Open document form' })).toHaveCount(0);
  await page.getByLabel('Original language').selectOption('Spanish');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Alex');
  await page.getByLabel('Last name').fill('River');
  await page.getByLabel('Email address').fill('alex@example.test');
  await page.getByLabel('Phone number').fill('+1 555 123 4567');
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  await page.getByRole('button', { name: 'Request my free quote' }).click();
  await expect(page.getByRole('link', { name: 'Open document form' })).toHaveAttribute(
    'href',
    'https://secure.example.test/form',
  );
  await expect(page.getByRole('link', { name: 'Open document form' })).toHaveAttribute(
    'referrerpolicy',
    'no-referrer',
  );
});

test('document dropdown follows its group, resets on changes and sends the reviewed selection', async ({
  page,
}) => {
  const offerings = service.translation.offerings.map((option) => ({
    ...option,
    documentTypes:
      option.id === 'certificate'
        ? ['Birth certificate', 'Marriage certificate', 'Death certificate']
        : option.id === 'diploma'
          ? ['Diploma', 'Degree certificate']
          : [],
  }));
  await setup(page, { offerings });
  await page.setViewportSize({ width: 393, height: 852 });
  let submitted;
  await page.route('**/api/inquiry', (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/services/translation/request?service=certificate');
  const document = page.getByRole('combobox', { name: 'Document', exact: true });
  await page.getByLabel('Original language').selectOption('French');
  await expect(document).toHaveValue('');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'What would you like translated?' }),
  ).toBeVisible();
  await document.selectOption('Birth certificate');
  await expect(page.getByLabel('Your translation request')).toContainText('Birth certificate');
  await expect(page.getByLabel('Your translation request')).toContainText('$45.00');
  await page.getByLabel('Document service').selectOption('diploma');
  await expect(document).toHaveValue('');
  await expect(document.locator('option')).toHaveText([
    'Select a document',
    'Diploma',
    'Degree certificate',
  ]);
  await page.getByLabel('Document service').selectOption('family');
  await expect(document).toHaveCount(0);
  await expect(page.getByLabel('Number of documents')).toHaveValue('3');
  await page.getByLabel('Document service').selectOption('certificate');
  await expect(document).toHaveValue('');
  await document.selectOption('Birth certificate');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Your translation request')).toContainText('Birth certificate');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(document).toHaveValue('Birth certificate');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('First name').fill('Alex');
  await page.getByLabel('Last name').fill('River');
  await page.getByLabel('Email address').fill('alex@example.test');
  await page.getByLabel('Phone number').fill('+1 555 123 4567');
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Request my free quote' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Request received' })).toBeVisible();
  expect(submitted.translation).toMatchObject({
    service: 'certificate',
    document: 'Birth certificate',
  });
});

test('selected extras update the itemized estimate and survive review on mobile', async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/services/translation/request?service=certificate');
  await page.getByLabel('Original language').selectOption('French');
  const total = page.getByLabel('Estimated total', { exact: true });
  const breakdown = page.getByLabel('Estimate breakdown', { exact: true });
  await expect(total).toContainText('$45.00');
  await page.getByLabel(/Request a 24-hour rush/).check();
  await expect(total).toContainText('$67.50');
  await page.getByLabel(/Notarized translation/).check();
  await expect(total).toContainText('$82.50');
  await expect(breakdown).toContainText('24-hour rush (50%)');
  await expect(breakdown).toContainText('$22.50');
  await expect(breakdown).toContainText('$15.00');
  await page.getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('mail_standard');
  await expect(total).toContainText('$92.50');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Where should we send your quote?' }),
  ).toBeVisible();
  await expect(total).toContainText('$92.50');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByLabel(/Request a 24-hour rush/).uncheck();
  await expect(total).toContainText('$70.00');
  await page.getByLabel(/Notarized translation/).uncheck();
  await expect(total).toContainText('$55.00');
  await page.getByRole('combobox', { name: 'Delivery', exact: true }).selectOption('digital');
  await expect(total).toContainText('$45.00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an unpriced selected extra shows a custom quote instead of an incomplete total', async ({
  page,
}) => {
  await setup(page, { prices: { ...service.translation.prices, notarization: null } });
  await page.goto('/services/translation/request?service=certificate');
  await page.getByLabel('Original language').selectOption('French');
  const total = page.getByLabel('Estimated total', { exact: true });
  await expect(total).toContainText('$45.00');
  await page.getByLabel(/Notarized translation/).check();
  await expect(total).toContainText('Custom quote');
  await expect(page.getByLabel('Estimate breakdown', { exact: true })).toContainText(
    'Quoted on request',
  );
  await page.getByLabel(/Notarized translation/).uncheck();
  await expect(total).toContainText('$45.00');
});

test('CMS document edits control pricing cards, quote choices and package size; empty catalogs stay empty', async ({
  page,
}) => {
  const config = translationContent({
    ...seed.acf,
    lld_translation_offerings: JSON.stringify([
      {
        id: 'passport',
        title: 'Passports',
        note: 'Current identity document.',
        unit: 'document',
        documents: 1,
        price: 22,
        enabled: true,
      },
      {
        id: 'study',
        title: 'Study bundle',
        note: 'Five academic documents.',
        unit: 'package',
        documents: 5,
        price: 90,
        enabled: true,
      },
      {
        id: 'medical',
        title: 'Medical records',
        note: '',
        unit: 'page',
        documents: 1,
        price: 30,
        enabled: false,
      },
    ]),
  });
  await setup(page, config);
  await page.goto('/services/translation');
  await expect(page.getByRole('heading', { name: 'Passports', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Medical records' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Family Package' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Start your order: Study bundle' }).click();
  await expect(page.getByLabel('Document service')).toHaveValue('study');
  await expect(page.getByLabel('Number of documents')).toHaveValue('5');
  await page.getByLabel('Original language').selectOption('French');
  await expect(page.getByLabel('Your translation request')).toContainText('$90.00');
  await page.getByLabel('Document service').selectOption('passport');
  await expect(page.getByLabel('Number of documents')).toHaveValue('1');
  await expect(page.getByLabel('Your translation request')).toContainText('$22.00');
  await page.goto('/services/translation/request?service=medical');
  await expect(page.getByLabel('Document service')).toHaveValue('passport');
  await page.route('**/api/content?resource=services', (route) =>
    route.fulfill({ json: [{ ...service, translation: { ...config, offerings: [] } }] }),
  );
  // A new visit after CMS content refresh, not the previous fresh session cache.
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('Contact us about your translation');
  await expect(page.getByLabel('Document service')).toHaveCount(0);
});

test('WordPress row editor adds, changes, reorders, hides and removes offerings without editing JSON', async ({
  page,
}) => {
  await page.route('**/__editor-fixture', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<div class="acf-field" data-name="lld_translation_offerings"><textarea></textarea></div>',
    }),
  );
  await page.goto('/__editor-fixture');
  await page.locator('textarea').fill(seed.acf.lld_translation_offerings);
  await page.addStyleTag({
    path: 'wordpress/longlife-headless-commerce/translation-offerings-admin.css',
  });
  await page.addScriptTag({
    path: 'wordpress/longlife-headless-commerce/translation-offerings-admin.js',
  });
  await expect(page.getByRole('group')).toHaveCount(7);
  const certificates = page.getByRole('group', {
    name: 'Birth, marriage & death certificates',
    exact: true,
  });
  await certificates
    .getByLabel('Document choices (one per line)', { exact: true })
    .fill('Birth certificate\n Marriage certificate \n\nDeath certificate');
  let saved = JSON.parse(await page.locator('textarea[data-row-editor]').inputValue());
  expect(saved[0].documentTypes).toEqual([
    'Birth certificate',
    'Marriage certificate',
    'Death certificate',
  ]);
  await page.getByRole('button', { name: 'Add document or package' }).click();
  await expect(
    certificates.getByLabel('Document choices (one per line)', { exact: true }),
  ).toHaveValue('Birth certificate\nMarriage certificate\nDeath certificate');
  await certificates.getByLabel('Document choices (one per line)', { exact: true }).fill('');
  saved = JSON.parse(await page.locator('textarea[data-row-editor]').inputValue());
  expect(saved[0].documentTypes).toEqual([]);
  const row = page.getByRole('group').last();
  await row.getByLabel('Document or package name').fill('Study bundle');
  await row.getByLabel('Price in USD').fill('90');
  await row.getByLabel('Price applies to').selectOption('package');
  await row.getByLabel('Documents included in package').fill('5');
  await row.getByRole('button', { name: /Move offering .* up/ }).click();
  const moved = page.getByRole('group', { name: 'Study bundle', exact: true });
  await moved.getByLabel('Show on website and quote form').uncheck();
  const readRows = async () =>
    JSON.parse(await page.locator('textarea[data-row-editor]').inputValue());
  let rows = await readRows();
  expect(rows[6]).toMatchObject({ title: 'Study bundle', price: 90, documents: 5, enabled: false });
  expect(rows[6].id).toMatch(/^doc-/);
  await moved.getByRole('button', { name: /Remove offering/ }).click();
  rows = await readRows();
  expect(rows).toHaveLength(7);
  while (await page.getByRole('button', { name: /Remove offering/ }).count())
    await page
      .getByRole('button', { name: /Remove offering/ })
      .first()
      .click();
  expect(await readRows()).toEqual([]);
  await expect(
    page.getByText('No documents or packages are offered.', { exact: false }),
  ).toBeVisible();
});

test('home hero ebook artwork fills its card content width on mobile and desktop without cropping', async ({
  page,
}) => {
  await mockFluidStorefront(page);
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({
      headers: { 'X-WP-TotalPages': '1' },
      json: [
        {
          ...product,
          name: 'Haitian Creole Translation Book',
          categories: [{ id: 1, slug: 'ebooks', name: 'Ebooks' }],
          images: [
            { id: 1, src: 'https://images.example.test/ebook-mockup.svg', alt: 'Ebook mockup' },
          ],
        },
      ],
    }),
  );
  await page.route('https://images.example.test/ebook-mockup.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#eee4d9"/></svg>',
    }),
  );
  await page.goto('/');
  const card = page.getByRole('link', {
    name: 'View Haitian Creole Translation Book',
    exact: true,
  });
  const image = card.getByRole('img', { name: 'Ebook mockup', exact: true });
  await expect(card.locator('[data-image-state="loaded"]')).toBeVisible();
  for (const width of [393, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    const dimensions = await image.evaluate((node) => ({
      image: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      container: node.parentElement.getBoundingClientRect().width,
    }));
    expect(Math.abs(dimensions.image - dimensions.container)).toBeLessThan(1);
    expect(Math.abs(dimensions.image / dimensions.height - 4 / 3)).toBeLessThan(0.01);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await expect(card).toHaveAttribute('href', '/products/318');
});
