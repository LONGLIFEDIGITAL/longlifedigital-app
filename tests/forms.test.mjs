import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFormsHandler } from '../api/forms.js';
import { createHmac } from 'node:crypto';
const env = {
  STOREFRONT_ORIGINS: 'https://shop.example.test',
  LLD_COMMERCE_BRIDGE_SECRET: 'test-only-bridge-secret-at-least-32-characters',
  VITE_WOOCOMMERCE_STORE_API_URL: 'https://wp.example.test/wp-json/wc/store/v1',
};
const form = {
  requestId: '6b030225-d7f1-4695-9e62-8dd372379a41',
  name: 'Alex',
  email: 'alex@example.test',
  message: 'Hello\nWorld',
  consent: true,
};
async function call(
  action,
  body = form,
  fetchImpl = async () => Response.json({ ok: true }),
  overrides = {},
) {
  const result = {};
  await createFormsHandler({ env, fetchImpl })(
    {
      method: 'POST',
      url: `/api/forms?action=${action}`,
      body,
      headers: { origin: 'https://shop.example.test', 'x-lld-commerce': '1' },
      socket: { remoteAddress: '127.0.0.1' },
      ...overrides,
    },
    {
      setHeader() {},
      end(value) {
        result.status = this.statusCode;
        result.body = JSON.parse(value);
      },
    },
  );
  return result;
}
for (const action of ['contact', 'newsletter']) {
  test(`${action} signs only allowed fields and does not expose subscriber information`, async () => {
    const result = await call(
      action,
      { ...form, recipient: 'evil@example.test', list: 999, status: 'subscribed' },
      async (url, init) => {
        assert.equal(url, `https://wp.example.test/wp-json/lld-headless/v1/${action}`);
        const payload = JSON.parse(init.body);
        assert.equal(payload.recipient, undefined);
        assert.equal(payload.list, undefined);
        assert.equal(payload.status, undefined);
        assert.match(payload.client, /^[a-f0-9]{64}$/);
        assert.equal(payload.message, action === 'contact' ? form.message : undefined);
        assert.equal(payload.consent, action === 'newsletter' ? true : undefined);
        const h = init.headers;
        assert.equal(
          h['X-LLD-Signature'],
          createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET)
            .update(
              [
                'POST',
                `/lld-headless/v1/${action}`,
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
        return Response.json({ ok: true, subscriber: { email: form.email } });
      },
    );
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true });
  });
}
test('invalid fields, bots, unconsented signup and foreign origins never reach WordPress', async () => {
  let requests = 0;
  const fetchImpl = async () => {
    requests++;
    return Response.json({ ok: true });
  };
  for (const patch of [
    { name: ' ' },
    { email: 'bad' },
    { email: 'a@b.co\r\nBcc:x@y.co' },
    { website: 'spam' },
    { requestId: 'bad' },
    { message: '' },
  ])
    assert.equal((await call('contact', { ...form, ...patch }, fetchImpl)).status, 400);
  assert.equal((await call('newsletter', { ...form, consent: false }, fetchImpl)).status, 400);
  assert.equal(
    (
      await call('contact', form, fetchImpl, {
        headers: { origin: 'https://evil.test', 'x-lld-commerce': '1' },
      })
    ).status,
    403,
  );
  assert.equal((await call('contact', form, fetchImpl, { method: 'GET' })).status, 405);
  assert.equal(requests, 0);
});
test('provider failures, throttles and timeouts are visible errors rather than false success', async () => {
  for (const status of [404, 409, 429, 503]) {
    const r = await call('newsletter', form, async () =>
      Response.json({ message: 'private provider details' }, { status }),
    );
    assert.equal(r.status, status === 404 ? 502 : status);
    assert.ok(r.body.error);
    assert.equal(r.body.ok, undefined);
    assert.ok(!r.body.error.includes('private'));
  }
  assert.equal((await call('contact', form, async () => Response.json({}))).status, 502);
  assert.equal(
    (
      await call('contact', form, async () => {
        throw new DOMException('timeout', 'TimeoutError');
      })
    ).status,
    502,
  );
});

test('newsletter ineligibility has support guidance without exposing internal subscriber state', async () => {
  const failure = () =>
    Response.json(
      { code: 'lld_newsletter_ineligible', message: 'private trash details' },
      { status: 422 },
    );
  const result = await call('newsletter', form, failure);
  assert.equal(result.status, 422);
  assert.match(result.body.error, /cannot be subscribed through this form/);
  assert.match(result.body.error, /support@longlifedigital.co/);
  assert.doesNotMatch(result.body.error, /private|trash|temporarily unavailable/);
  assert.equal((await call('contact', form, failure)).status, 502);
  assert.equal(
    (
      await call('newsletter', form, () =>
        Response.json({ code: 'unknown', message: 'private' }, { status: 422 }),
      )
    ).status,
    502,
  );
});
