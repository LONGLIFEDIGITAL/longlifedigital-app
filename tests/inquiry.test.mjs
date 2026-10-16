import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createInquiryHandler } from '../api/inquiry.js';
import { readSiteContent } from '../server/siteContent.js';
import { readFileSync } from 'node:fs';
import { translationContent } from '../server/translationContent.js';
import {
  translationEstimate,
  translationPriceBreakdown,
  translationRequestError,
} from '../shared/translation.js';
import { metadataMarkup, initialMarkup } from '../server/initialMarkup.js';

const env = {
  STOREFRONT_ORIGINS: 'https://shop.example.test',
  LLD_COMMERCE_BRIDGE_SECRET: 'test-only-bridge-secret-at-least-32-characters',
  VITE_WOOCOMMERCE_STORE_API_URL: 'https://wp.example.test/wp-json/wc/store/v1',
};
const inquiry = {
  serviceId: 41,
  requestId: '6b030225-d7f1-4695-9e62-8dd372379a41',
  firstName: 'Alex',
  lastName: 'River',
  email: 'alex@example.test',
  phone: '+1 (555) 123-4567',
  businessName: '',
  message: 'A business website.',
};
const translation = {
  type: 'certified',
  source: 'Haitian Creole',
  target: 'English',
  service: 'certificate',
  documents: 1,
  pages: 1,
  rush: false,
  notarized: false,
  delivery: 'digital',
  consent: true,
};
async function call(
  body = inquiry,
  fetchImpl = async () => Response.json({ ok: true }),
  overrides = {},
) {
  const req = {
    method: 'POST',
    url: '/api/inquiry',
    body,
    headers: { origin: 'https://shop.example.test', 'x-lld-commerce': '1' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
  const result = { headers: {} };
  const res = {
    setHeader(k, v) {
      result.headers[k] = v;
    },
    end(body) {
      result.status = this.statusCode;
      result.body = JSON.parse(body);
    },
  };
  await createInquiryHandler({ env, fetchImpl })(req, res);
  return result;
}
test('inquiry bridge signs validated contact details and never trusts a supplied subject or recipient', async () => {
  const result = await call(
    { ...inquiry, recipient: 'attacker@example.test', subject: 'Fake service' },
    async (url, init) => {
      assert.equal(url, 'https://wp.example.test/wp-json/lld-headless/v1/inquiry');
      const body = JSON.parse(init.body);
      assert.equal(body.recipient, undefined);
      assert.equal(body.subject, undefined);
      assert.equal(body.serviceId, 41);
      assert.equal(body.email, inquiry.email);
      assert.match(body.client, /^[a-f0-9]{64}$/);
      const h = init.headers;
      assert.equal(
        h['X-LLD-Signature'],
        createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET)
          .update(
            [
              'POST',
              '/lld-headless/v1/inquiry',
              h['X-LLD-Session'],
              h['X-LLD-Attempt'],
              h['X-LLD-Timestamp'],
              h['X-LLD-Nonce'],
              '',
              init.body,
            ].join('\n'),
          )
          .digest('hex'),
      );
      return Response.json({ ok: true, privateMetadata: 'not public' });
    },
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true });
  assert.equal(result.headers['Cache-Control'], 'no-store, private');
});
test('required fields, invalid email/phone, header injection, bots and foreign origins are rejected before sending', async () => {
  const noSend = () => {
    throw new Error('Should not send');
  };
  for (const patch of [
    { firstName: '' },
    { lastName: ' ' },
    { email: 'invalid' },
    { phone: '123' },
    { phone: 'not a telephone' },
    { email: 'a@example.test\r\nBcc: other@example.test' },
    { website: 'spam' },
    { serviceId: -1 },
    { requestId: 'bad' },
  ]) {
    assert.equal((await call({ ...inquiry, ...patch }, noSend)).status, 400);
  }
  assert.equal((await call(inquiry, noSend, { method: 'GET' })).status, 405);
  assert.equal(
    (
      await call(inquiry, noSend, {
        headers: { origin: 'https://foreign.test', 'x-lld-commerce': '1' },
      })
    ).status,
    403,
  );
});
test('mail failures, throttles, removed services and timeouts cannot produce a success response', async () => {
  for (const status of [404, 409, 429, 503]) {
    const result = await call(inquiry, async () =>
      Response.json({ message: 'private WordPress error' }, { status }),
    );
    assert.equal(result.status, status === 503 ? 502 : status);
    assert.equal(result.body.ok, undefined);
    assert.ok(result.body.error);
    assert.ok(!result.body.error.includes('private WordPress'));
  }
  assert.equal((await call(inquiry, async () => Response.json({}))).status, 502);
  assert.equal(
    (
      await call(inquiry, async () => {
        throw new DOMException('timeout', 'TimeoutError');
      })
    ).status,
    502,
  );
});
test('published service fields are projected from CMS and drafts/private fields stay out', async () => {
  const record = {
    id: 41,
    slug: 'websites',
    type: 'lld_service',
    status: 'publish',
    title: { rendered: 'Website Design' },
    content: { rendered: '<p>Details</p>' },
    acf: {
      lld_specialties: 'Business websites\n\nE-commerce websites',
      lld_service_visual: 'web',
      lld_service_process: '<p>Discuss scope</p>',
      lld_inquiry_title: 'Your next project',
      secret: 'private',
    },
  };
  const data = await readSiteContent({
    resource: 'services',
    query: new URLSearchParams(),
    request: async () => Response.json([record, { ...record, id: 42, status: 'draft' }]),
    destination: () => '',
    httpsUrl: () => '',
  });
  assert.equal(data.length, 1);
  assert.deepEqual(data[0].specialties, ['Business websites', 'E-commerce websites']);
  assert.equal(data[0].inquiryTitle, 'Your next project');
  assert.equal(data[0].process, '<p>Discuss scope</p>');
  assert.equal(data[0].secret, undefined);
});

test('translation inquiries forward only approved metadata, without files, private document text or payment totals', async () => {
  const result = await call(
    {
      ...inquiry,
      message: 'Private document text',
      files: ['private.pdf'],
      translation: { ...translation, total: 1, fileUrl: 'https://example.test/private.pdf' },
    },
    async (_url, init) => {
      const payload = JSON.parse(init.body);
      assert.deepEqual(payload.translation, translation);
      assert.equal(payload.message, '');
      assert.equal(payload.files, undefined);
      return Response.json({ ok: true });
    },
  );
  assert.equal(result.status, 200);
  for (const patch of [
    { source: 'French', target: 'Spanish' },
    { target: 'Haitian Creole' },
    { type: 'fake' },
    { service: '../fake' },
    { documents: 0 },
    { pages: 1.5 },
    { documents: 2, pages: 1 },
    { consent: false },
    { rush: 'true' },
    { delivery: 'unsafe' },
    { document: ['Birth certificate'] },
    { document: null },
    { document: 'x'.repeat(161) },
    { document: 'Birth\ncertificate' },
  ]) {
    let called = false;
    const response = await call(
      { ...inquiry, translation: { ...translation, ...patch } },
      async () => {
        called = true;
        return Response.json({ ok: true });
      },
    );
    assert.equal(response.status, 400, JSON.stringify(patch));
    assert.equal(called, false);
  }
});

test('translation settings keep credentials opt-in, omit blank/unsafe values and expose editable prices', () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const raw = seed.acf.lld_translation;
  const config = translationContent(seed.acf);
  assert.equal(config.offerings.find(({ id }) => id === 'certificate').price, 45);
  assert.equal(config.prices.legal_word, 0.12);
  assert.deepEqual(config.credentials, []);
  assert.equal(config.secureFormUrl, '');
  assert.equal(config.bookId, null);
  assert.equal(config.faqs.length, 3);
  const altered = translationContent({
    ...seed.acf,
    lld_translation: {
      ...raw,
      prices: {
        additional_page: '',
        legal_word: null,
        rush_percent: '-1',
        notarization: '0',
        mail_standard: '40',
      },
      show_credentials: true,
      translator_credentials: 'Client-provided qualification',
      translator_credential_url: 'javascript:alert(1)',
      secure_form_url: 'https://user:password@provider.example.test/form',
    },
  });
  assert.equal(altered.prices.additional_page, null);
  assert.equal(altered.prices.legal_word, null);
  assert.equal(altered.prices.rush_percent, null);
  assert.equal(altered.prices.notarization, 0);
  assert.equal(altered.prices.mail_standard, 40);
  assert.equal(altered.secureFormUrl, '');
  assert.deepEqual(altered.credentials, [
    { kind: 'translator', description: 'Client-provided qualification', url: '' },
  ]);
  assert.deepEqual(
    translationContent({
      ...seed.acf,
      lld_translation: { ...raw, translator_credentials: 'Still unpublished' },
    }).credentials,
    [],
  );
  assert.equal(translationContent({}), null);
});

test('estimates include CMS rates, package counts, additional pages and selected extras', () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const config = translationContent(seed.acf);
  assert.equal(translationEstimate({ ...translation, documents: 2, pages: 3 }, config), 125);
  assert.equal(
    translationEstimate({ ...translation, service: 'transcript', documents: 2, pages: 5 }, config),
    175,
  );
  assert.equal(
    translationEstimate(
      {
        ...translation,
        service: 'family',
        documents: 3,
        pages: 3,
        rush: true,
        notarized: true,
        delivery: 'mail_overnight',
      },
      config,
    ),
    265,
  );
  assert.equal(
    translationEstimate({ ...translation, service: 'immigration', documents: 3, pages: 4 }, config),
    165,
  );
  assert.equal(translationEstimate({ ...translation, type: 'standard' }, config), null);
  assert.equal(translationEstimate(translation, {}), null);
  for (const language of ['Haitian Creole', 'French', 'Spanish']) {
    assert.equal(translationRequestError({ ...translation, source: language }), '');
    assert.equal(
      translationRequestError({ ...translation, source: 'English', target: language }),
      '',
    );
  }
});

test('rush applies only to translation charges and the breakdown adds up to the displayed estimate', () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const config = translationContent(seed.acf);
  const selected = { ...translation, rush: true, notarized: true };
  const breakdown = translationPriceBreakdown(selected, config);
  assert.equal(breakdown.total, 82.5);
  assert.deepEqual(
    breakdown.items.map(({ id, amount }) => [id, amount]),
    [
      ['translation', 45],
      ['rush', 22.5],
      ['notarization', 15],
      ['delivery', 0],
    ],
  );
  assert.equal(translationEstimate({ ...selected, delivery: 'mail_standard' }, config), 92.5);
  assert.equal(translationEstimate({ ...selected, delivery: 'mail_overnight' }, config), 122.5);
  const multiple = translationPriceBreakdown(
    { ...selected, documents: 2, pages: 3, delivery: 'mail_standard' },
    config,
  );
  assert.equal(multiple.total, 227.5);
  assert.deepEqual(
    multiple.items.map(({ id, amount }) => [id, amount]),
    [
      ['translation', 90],
      ['additional_pages', 35],
      ['rush', 62.5],
      ['notarization', 30],
      ['delivery', 10],
    ],
  );
  const perPage = translationPriceBreakdown(
    { ...selected, service: 'transcript', documents: 2, pages: 5, delivery: 'mail_overnight' },
    config,
  );
  assert.equal(perPage.total, 332.5);
  assert.equal(
    perPage.items.some(({ id }) => id === 'additional_pages'),
    false,
  );
  assert.equal(translationEstimate({ ...selected, rush: false, notarized: false }, config), 45);
  const rounded = translationPriceBreakdown(
    { ...selected, documents: 2, pages: 3 },
    {
      ...config,
      offerings: config.offerings.map((row) => ({ ...row, price: 19.99 })),
      prices: { ...config.prices, additional_page: 0.01, rush_percent: 7.5, notarization: 0 },
    },
  );
  assert.equal(rounded.total, 42.99);
  for (const result of [breakdown, multiple, perPage, rounded]) {
    assert.equal(
      result.items.reduce((sum, item) => sum + Math.round(item.amount * 100), 0),
      Math.round(result.total * 100),
    );
  }
});

test('unpriced selected extras require a custom quote; blank unselected rates and zero prices stay valid', () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const config = translationContent(seed.acf);
  for (const [key, patch] of [
    ['rush_percent', { rush: true }],
    ['notarization', { notarized: true }],
    ['mail_standard', { delivery: 'mail_standard' }],
    ['mail_overnight', { delivery: 'mail_overnight' }],
    ['additional_page', { pages: 2 }],
  ]) {
    const missing = { ...config, prices: { ...config.prices, [key]: null } };
    const result = translationPriceBreakdown({ ...translation, ...patch }, missing);
    assert.equal(result.total, null, key);
    assert.ok(
      result.items.some(({ amount }) => amount === null),
      key,
    );
    assert.equal(translationEstimate(translation, missing), 45, `unselected ${key}`);
  }
  const zero = {
    ...config,
    offerings: config.offerings.map((row) => ({ ...row, price: 0 })),
    prices: Object.fromEntries(Object.keys(config.prices).map((key) => [key, 0])),
  };
  assert.equal(
    translationEstimate(
      { ...translation, rush: true, notarized: true, delivery: 'mail_standard', pages: 2 },
      zero,
    ),
    0,
  );
  const standard = translationPriceBreakdown(
    { ...translation, type: 'standard', rush: true, notarized: true },
    config,
  );
  assert.equal(standard.total, null);
  assert.equal(standard.items.find(({ id }) => id === 'rush').amount, null);
  assert.equal(standard.items.find(({ id }) => id === 'notarization').amount, 15);
});

test('translation direct-entry HTML uses the right heading and marks the request page noindex', () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const snapshot = {
    entries: {
      services: { data: [{ ...seed, translation: translationContent(seed.acf) }] },
      settings: {
        data: {
          brand: { name: 'Longlife Digital', website: 'https://longlifedigital.co', logo: {} },
        },
      },
    },
  };
  assert.match(initialMarkup(snapshot, '/services/translation'), /Your words\./);
  assert.match(
    metadataMarkup(snapshot, '/services/translation/request'),
    /Request a translation quote/,
  );
  assert.match(metadataMarkup(snapshot, '/services/translation/request'), /noindex,follow/);
  assert.doesNotMatch(metadataMarkup(snapshot, '/services/translation'), /noindex,follow/);
});

test('editable document catalogs drive prices, package size and availability without fixed document IDs', async () => {
  const rows = [
    {
      id: 'passport',
      title: 'Passports',
      note: 'Identity documents.',
      unit: 'document',
      price: 22,
      documents: 1,
      enabled: true,
    },
    {
      id: 'study-bundle',
      title: 'Study bundle',
      note: 'Five documents.',
      unit: 'package',
      price: 90,
      documents: 5,
      enabled: true,
    },
    {
      id: 'medical',
      title: 'Medical records',
      note: '',
      unit: 'page',
      price: 30,
      documents: 1,
      enabled: false,
    },
  ];
  const config = translationContent({
    lld_service_layout: 'translation',
    lld_translation_offerings: JSON.stringify(rows),
    lld_translation: { prices: { additional_page: 10 } },
  });
  assert.deepEqual(
    config.offerings.map(({ id }) => id),
    ['passport', 'study-bundle'],
  );
  assert.equal(
    translationEstimate({ ...translation, service: 'passport', documents: 2, pages: 3 }, config),
    54,
  );
  assert.equal(
    translationEstimate(
      { ...translation, service: 'study-bundle', documents: 5, pages: 5 },
      config,
    ),
    90,
  );
  assert.match(
    translationRequestError({ ...translation, service: 'study-bundle' }, config.offerings),
    /5 documents/,
  );
  assert.match(
    translationRequestError({ ...translation, service: 'medical' }, config.offerings),
    /no longer available/,
  );
  for (const catalog of ['[]', 'broken JSON', undefined]) {
    assert.deepEqual(
      translationContent({ lld_service_layout: 'translation', lld_translation_offerings: catalog })
        .offerings,
      [],
    );
  }
  const response = await call(
    { ...inquiry, translation: { ...translation, service: 'passport' } },
    async () => Response.json({}, { status: 422 }),
  );
  assert.equal(response.status, 422);
  assert.match(response.body.error, /document choices have changed/);
});

test('document choices belong to the selected group and survive the inquiry bridge', async () => {
  const seed = JSON.parse(
    readFileSync(new URL('../docs/cms/translation-content.json', import.meta.url)),
  );
  const rows = JSON.parse(seed.acf.lld_translation_offerings);
  rows[0].documentTypes = [' Birth certificate ', 'Marriage certificate', 'Death certificate'];
  const project = (catalog) =>
    translationContent({ ...seed.acf, lld_translation_offerings: JSON.stringify(catalog) });
  const config = project(rows);
  assert.deepEqual(config.offerings[0].documentTypes, [
    'Birth certificate',
    'Marriage certificate',
    'Death certificate',
  ]);
  const selected = { ...translation, document: 'Birth certificate' };
  assert.equal(translationRequestError(selected, config.offerings), '');
  assert.equal(translationEstimate(selected, config), 45);
  assert.match(translationRequestError(translation, config.offerings), /choose a document/);
  assert.match(
    translationRequestError({ ...selected, document: 'Passport' }, config.offerings),
    /no longer available/,
  );
  assert.match(
    translationRequestError({ ...selected, service: 'diploma' }, config.offerings),
    /no longer available/,
  );
  assert.equal(
    translationRequestError({ ...translation, service: 'diploma' }, config.offerings),
    '',
  );
  assert.deepEqual(config.offerings[1].documentTypes, []);
  for (const invalid of [
    null,
    {},
    [''],
    ['Birth certificate', ' birth CERTIFICATE '],
    [123],
    ['x'.repeat(161)],
    ['Birth\ncertificate'],
    Array.from({ length: 51 }, (_, i) => `Document ${i}`),
  ]) {
    assert.deepEqual(project([{ ...rows[0], documentTypes: invalid }]).offerings, []);
  }
  const response = await call({ ...inquiry, translation: selected }, async (_url, init) => {
    assert.deepEqual(JSON.parse(init.body).translation, selected);
    return Response.json({ ok: true });
  });
  assert.equal(response.status, 200);
});
