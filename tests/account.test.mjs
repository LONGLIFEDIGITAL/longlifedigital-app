import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createAccountHandler } from '../api/account.js';
import { seal, unseal } from '../server/commerce/session.js';
const env = {
  COMMERCE_SESSION_SECRET: 'test-only-session-secret-at-least-32-characters',
  LLD_COMMERCE_BRIDGE_SECRET: 'test-only-bridge-secret-at-least-32-characters',
  STOREFRONT_ORIGINS: 'https://shop.example.test',
  VITE_WOOCOMMERCE_STORE_API_URL: 'https://wp.example.test/wp-json/wc/store/v1',
  NODE_ENV: 'production',
};
const user = { id: 7, email: 'reader@example.test', name: 'Reader' };
const state = {
  kind: 'account',
  store: env.VITE_WOOCOMMERCE_STORE_API_URL,
  token: 'wp-secret-cookie',
  expires: Date.now() + 60000,
};
const cookie = `lld_account=${seal(state, env)}`;
async function call(action, body, fetchImpl = async () => Response.json({ user }), options = {}) {
  const req = {
    url: `/api/account?action=${action}`,
    method: body === undefined ? 'GET' : 'POST',
    body,
    socket: { remoteAddress: '127.0.0.1' },
    headers: { origin: 'https://shop.example.test', 'x-lld-commerce': '1', ...options.headers },
    ...options.req,
  };
  const result = { headers: {} };
  const res = {
    setHeader(k, v) {
      result.headers[k] = v;
    },
    end(value) {
      result.status = this.statusCode;
      result.body = JSON.parse(value);
    },
  };
  await createAccountHandler({ env, fetchImpl })(req, res);
  return result;
}
test('anonymous session does not call WordPress or write a cookie', async () => {
  const response = await call('session', undefined, () => {
    throw new Error('Unexpected upstream request');
  });
  assert.deepEqual(response.body, { user: null });
  assert.equal(response.status, 200);
  assert.equal(response.headers['Set-Cookie'], undefined);
});
test('login signs the exact payload and keeps the WordPress token in an encrypted HttpOnly cookie', async () => {
  const response = await call(
    'login',
    { email: user.email, password: 'a-customer-password', customer_id: 99 },
    async (url, init) => {
      assert.equal(url, 'https://wp.example.test/wp-json/lld-headless/v1/account');
      const h = init.headers;
      const signature = createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET)
        .update(
          [
            'POST',
            '/lld-headless/v1/account',
            h['X-LLD-Session'],
            h['X-LLD-Attempt'],
            h['X-LLD-Timestamp'],
            h['X-LLD-Nonce'],
            '',
            init.body,
          ].join('\n'),
        )
        .digest('hex');
      assert.equal(h['X-LLD-Signature'], signature);
      assert.equal(JSON.parse(init.body).customer_id, undefined);
      return Response.json({
        user: { ...user, privateMetadata: 'hidden' },
        token: state.token,
        expires: state.expires,
      });
    },
  );
  assert.deepEqual(response.body, { user });
  assert.match(
    response.headers['Set-Cookie'],
    /HttpOnly; SameSite=Lax; Path=\/; Max-Age=\d+; Secure/,
  );
  const token = response.headers['Set-Cookie'].split(';')[0].split('=')[1];
  assert.equal(unseal(token, env).token, state.token);
  assert.ok(!JSON.stringify(response.body).includes(state.token));
  assert.equal(response.headers['Cache-Control'], 'no-store, private');
});
test('origin, method, email and password validation stop invalid requests before dispatch', async () => {
  let requests = 0;
  const upstream = async () => {
    requests++;
    return Response.json({});
  };
  for (const [action, body, options, status] of [
    [
      'login',
      { email: user.email, password: 'pass' },
      { headers: { origin: 'https://evil.test' } },
      403,
    ],
    ['login', undefined, {}, 405],
    ['register', { email: 'bad', name: 'Test' }, {}, 400],
    ['reset', { key: 'key', login: 'reader', password: 'short' }, {}, 400],
    ['orders&page=-1', undefined, { headers: { cookie } }, 400],
  ])
    assert.equal((await call(action, body, upstream, options)).status, status);
  assert.equal(requests, 0);
});
test('registration and reset email URLs use the allowlisted request origin, not client input', async () => {
  const response = await call(
    'register',
    { name: 'Reader', email: user.email, resetUrl: 'https://evil.test', role: 'administrator' },
    async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.resetUrl, 'https://shop.example.test/reset-password');
      assert.equal(body.role, undefined);
      assert.match(body.client, /^[a-f0-9]{64}$/);
      return Response.json({ ok: true, token: 'should-not-leak' });
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.token, undefined);
  assert.match(response.body.message, /If this email/);
});
test('tampered, expired and cross-store cookies cannot identify a customer', async () => {
  for (const value of [
    cookie + 'tampered',
    `lld_account=${seal({ ...state, expires: 0 }, env)}`,
    `lld_account=${seal({ ...state, store: 'https://different.test' }, env)}`,
  ]) {
    const response = await call(
      'session',
      undefined,
      () => {
        throw new Error('Must not call WP');
      },
      { headers: { cookie: value } },
    );
    assert.deepEqual(response.body, { user: null });
  }
});
test('registration and recovery reject unexpected successful upstream bodies', async () => {
  for (const action of ['register', 'forgot']) {
    for (const body of [{}, { ok: false }, { error: 'private upstream problem' }, null]) {
      const response = await call(action, { name: 'Reader', email: user.email }, async () =>
        Response.json(body),
      );
      assert.equal(response.status, 502);
      assert.equal(response.body.message, undefined);
      assert.ok(!JSON.stringify(response.body).includes('private upstream'));
    }
    const accepted = await call(action, { name: 'Reader', email: user.email }, async () =>
      Response.json({ ok: true }),
    );
    assert.equal(accepted.status, 200);
  }
});
test('revoked WordPress sessions clear the storefront cookie', async () => {
  const response = await call(
    'session',
    undefined,
    async () => Response.json({}, { status: 401 }),
    { headers: { cookie } },
  );
  assert.deepEqual(response.body, { user: null });
  assert.match(response.headers['Set-Cookie'], /Max-Age=0/);
});
test('orders require authentication and strip upstream private metadata', async () => {
  assert.equal((await call('orders')).status, 401);
  const response = await call(
    'orders&page=2',
    undefined,
    async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.token, state.token);
      assert.equal(body.page, 2);
      return Response.json({
        orders: [
          {
            number: '12',
            date: null,
            status: 'Completed',
            total: '12.00',
            currency: 'USD',
            items: [{ name: 'Book', quantity: 1, key: 'secret' }],
            payment: 'hidden',
          },
        ],
        hasMore: false,
        totalOrders: 42,
        token: 'hidden',
      });
    },
    { headers: { cookie } },
  );
  assert.equal(response.status, 200);
  assert.ok(!JSON.stringify(response.body).includes('hidden'));
  assert.equal(response.body.orders[0].items[0].key, undefined);
  assert.equal(response.body.totalOrders, 42);
});
test('logout revokes the WP token and clears the browser cookie, including upstream failures', async () => {
  for (const status of [200, 500]) {
    const response = await call(
      'logout',
      {},
      async (_url, init) => {
        assert.equal(JSON.parse(init.body).token, state.token);
        return Response.json({}, { status });
      },
      { headers: { cookie } },
    );
    assert.match(response.headers['Set-Cookie'], /Max-Age=0/);
  }
});
test('login and reset errors are generic and hide upstream details', async () => {
  for (const [action, body, status] of [
    ['login', { email: user.email, password: 'pass' }, 401],
    ['reset', { key: 'key', login: 'reader', password: 'long-new-password' }, 400],
  ]) {
    const response = await call(action, body, async () =>
      Response.json({ message: 'PRIVATE SQL trace' }, { status }),
    );
    assert.equal(response.status, status);
    assert.ok(!JSON.stringify(response.body).includes('PRIVATE'));
  }
});

test('customer downloads require authentication and expose only valid Woo permission URLs', async () => {
  assert.equal((await call('downloads')).status, 401);
  const file = {
    id: '12:book',
    name: 'Book PDF',
    productName: 'An ebook',
    url: 'https://wp.example.test/?download_file=12&key=permission',
    remaining: '',
    expires: null,
    rawFile: '/private/book.pdf',
  };
  const response = await call(
    'downloads',
    undefined,
    async (_url, init) => {
      const payload = JSON.parse(init.body);
      assert.equal(payload.token, state.token);
      assert.equal(payload.customer_id, undefined);
      return Response.json({
        downloads: [
          file,
          { ...file, url: 'javascript:alert(1)' },
          { ...file, url: 'https://evil.test/?download_file=12' },
          { ...file, url: 'https://wp.example.test/raw-book.pdf' },
          { ...file, remaining: 0 },
          { ...file, expires: '2000-01-01' },
        ],
      });
    },
    { headers: { cookie } },
  );
  assert.equal(response.status, 200);
  assert.equal(response.body.downloads.length, 1);
  assert.equal(response.body.downloads[0].rawFile, undefined);
  assert.equal(response.headers['Cache-Control'], 'no-store, private');
  const expired = await call(
    'downloads',
    undefined,
    async () => Response.json({ message: 'Expired' }, { status: 401 }),
    { headers: { cookie } },
  );
  assert.equal(expired.status, 401);
  assert.match(expired.headers['Set-Cookie'], /Max-Age=0/);
});
