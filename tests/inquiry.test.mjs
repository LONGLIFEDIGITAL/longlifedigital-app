import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createInquiryHandler } from '../api/inquiry.js';
import { readSiteContent } from '../server/siteContent.js';

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
