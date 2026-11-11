import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createCommerceHandler, checkoutResult } from '../api/commerce.js';
import { seal, unseal } from '../server/commerce/session.js';
import { criticalCommerceAlert, reportCriticalCommerceError } from '../server/commerce/alerts.js';
import { shopperContext } from '../server/commerce/fraud.js';
const env = {
  COMMERCE_SESSION_SECRET: 'test-only-cookie-secret-at-least-32-characters',
  LLD_COMMERCE_BRIDGE_SECRET: 'test-only-bridge-secret-at-least-32-characters',
  STOREFRONT_ORIGINS: 'https://shop.example.test',
  VITE_WOOCOMMERCE_STORE_API_URL: 'https://wp.example.test/wp-json/wc/store/v1',
  NODE_ENV: 'production',
};
const state = {
  id: 'session-1',
  store: env.VITE_WOOCOMMERCE_STORE_API_URL,
  token: 'woo-cart-token',
  expires: Date.now() + 60000,
};
const cookie = `lld_commerce=${seal(state, env)}`;
const attempt = '11111111-1111-4111-8111-111111111111';
const config = {
  enabled: true,
  testMode: true,
  publishableKey: 'pk_test_example',
  gatewayVersion: '11.0.0',
  woocommerceVersion: '11.1.2',
};
const payload = {
  attempt,
  paymentMethod: 'pm_testCard',
  expectedTotal: '1399',
  billing_address: {
    first_name: 'Test',
    last_name: 'Customer',
    email: 'test@example.test',
    country: 'US',
    phone: '+13125550123',
    postcode: '60601',
  },
  amount: 1,
  customer_id: 99,
  paid: true,
};
async function call(action, body, fetchImpl, overrides = {}, reportCritical = async () => {}) {
  const req = {
    url: `/api/commerce?action=${action}`,
    method: body === undefined ? 'GET' : 'POST',
    body,
    headers: { cookie, origin: 'https://shop.example.test', 'x-lld-commerce': '1', ...overrides },
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
  await createCommerceHandler({ env, fetchImpl, reportCritical })(req, res);
  return result;
}
const reply = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers });

test('configuration never creates or overwrites the cart session cookie', async () => {
  for (const existing of ['', cookie]) {
    const result = await call('config', undefined, async () => reply(config), { cookie: existing });
    assert.equal(result.status, 200);
    assert.equal(result.headers['Set-Cookie'], undefined);
  }
});

const fraudConfig = {
  enabled: true,
  scripts: [
    'https://blackbox-api.wp.com/v1/dist/v.js',
    'https://wp.example.test/wp-content/plugins/fraud/assets/js/blackbox-init.js?ver=0.1.9',
  ],
  config: {
    apiKey: 'woo:123',
    identityCookie: { name: 'wfp_id', domain: 'wp.example.test', path: '/wordpress/' },
    timeout: 3000,
  },
};
test('fraud bootstrap uses the fixed frontend route and exports only validated script locations without a cart cookie', async () => {
  const result = await call(
    'fraud-config',
    undefined,
    async (url) => {
      assert.equal(url, 'https://wp.example.test/?lld_checkout_fraud_bootstrap=1');
      return reply(fraudConfig);
    },
    { cookie: '' },
  );
  assert.equal(result.status, 200);
  assert.equal(result.headers['Set-Cookie'], undefined);
  assert.deepEqual(result.body.config.identityCookie, { name: 'wfp_id', domain: '', path: '/' });
  for (const bad of [
    'https://untrusted.test/blackbox-init.js',
    'javascript:alert(1)',
    'https://wp.example.test@untrusted.test/blackbox-init.js',
  ]) {
    const alerts = [];
    const rejected = await call(
      'fraud-config',
      undefined,
      async () => reply({ ...fraudConfig, scripts: [fraudConfig.scripts[0], bad] }),
      {},
      async ({ type }) => alerts.push(type),
    );
    assert.equal(rejected.status, 503);
    assert.deepEqual(alerts, ['fraud_configuration']);
  }
  assert.deepEqual(
    (await call('fraud-config', undefined, async () => reply({ enabled: false }))).body,
    { enabled: false },
  );
});

test('shopper IP is taken only from the trusted deployment header or direct socket, not client input', () => {
  const req = {
    headers: {
      'x-vercel-forwarded-for': '203.0.113.10',
      'x-forwarded-for': '1.2.3.4',
      'user-agent': 'Browser',
      cookie: `wfp_id=${'a'.repeat(32)}`,
    },
    socket: { remoteAddress: '::1' },
  };
  assert.deepEqual(shopperContext(req, { VERCEL: '1' }), {
    ip: '203.0.113.10',
    userAgent: 'Browser',
    identity: 'a'.repeat(32),
  });
  assert.equal(shopperContext(req, {}).ip, '::1');
  for (const address of [undefined, '203.0.113.10, 1.2.3.4', 'not-an-IP']) {
    assert.equal(
      shopperContext(
        { ...req, headers: { ...req.headers, 'x-vercel-forwarded-for': address } },
        { VERCEL: '1' },
      ).ip,
      undefined,
    );
  }
  assert.deepEqual(
    shopperContext({ headers: { 'user-agent': 'bad\r\nheader', cookie: 'wfp_id=invalid' } }, {}),
    {},
  );
});

test('checkout signs native fraud session data and shopper identity while discarding forged security context', async () => {
  const result = await call(
    'checkout',
    {
      ...payload,
      fraud: { sessionId: 'blackbox-session', decision: 'allow' },
      extensions: { attacker: true },
      _lld_shopper: { ip: '1.2.3.4', identity: 'b'.repeat(32) },
    },
    async (url, init) => {
      if (url.endsWith('/config')) return reply(config);
      const body = JSON.parse(init.body);
      assert.deepEqual(body.extensions, {
        'woocommerce/fraud-protection': {
          blackbox_session_id: 'blackbox-session',
          blackbox_session_id_error: '',
        },
      });
      assert.deepEqual(body._lld_shopper, { identity: 'a'.repeat(32), userAgent: 'Test browser' });
      const headers = init.headers;
      const canonical = [
        'POST',
        '/wc/store/v1/checkout',
        headers['X-LLD-Session'],
        payload.attempt,
        headers['X-LLD-Timestamp'],
        headers['X-LLD-Nonce'],
        state.token,
        init.body,
      ].join('\n');
      assert.equal(
        headers['X-LLD-Signature'],
        createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET).update(canonical).digest('hex'),
      );
      return reply({ order_id: 1 });
    },
    {
      cookie: `${cookie}; wfp_id=${'a'.repeat(32)}`,
      'user-agent': 'Test browser',
      'x-forwarded-for': '1.2.3.4',
    },
  );
  assert.equal(result.status, 200);
});

test('missing SDK session is reported honestly; malformed input cannot be dispatched', async () => {
  let submitted = 0;
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/config')) return reply(config);
    submitted++;
    assert.deepEqual(JSON.parse(init.body).extensions['woocommerce/fraud-protection'], {
      blackbox_session_id: '',
      blackbox_session_id_error: 'timeout',
    });
    return reply({ order_id: 1 });
  };
  assert.equal(
    (await call('checkout', { ...payload, fraud: { sessionId: '', error: 'timeout' } }, fetchImpl))
      .status,
    200,
  );
  const invalid = await call(
    'checkout',
    { ...payload, fraud: { sessionId: ['invalid'] } },
    fetchImpl,
  );
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.retrySafe, true);
  assert.equal(submitted, 1);
});

test('nested Woo billing errors identify individual fields without forwarding debug data', async () => {
  const result = await call('customer', payload, async (url) =>
    url.endsWith('/config')
      ? reply(config)
      : reply(
          {
            code: 'rest_invalid_param',
            message: 'Invalid parameter(s): billing_address',
            data: {
              params: { billing_address: 'Invalid parameter(s): email, postcode' },
              details: {
                billing_address: {
                  code: 'rest_invalid_param',
                  data: { params: { email: 'Invalid email.', postcode: 'Invalid postcode.' } },
                },
              },
              debug: 'private database trace',
            },
          },
          400,
        ),
  );
  assert.equal(result.status, 400);
  assert.deepEqual(Object.keys(result.body.fieldErrors), ['email', 'postcode']);
  assert.match(result.body.error, /Email address, Postal code/);
  assert.ok(!JSON.stringify(result.body).includes('private database'));
});

test('postal code is required before submission only when Woo country rules require it', async () => {
  const rules = {
    US: { postcode: { required: true } },
    AE: { postcode: { required: false, hidden: true } },
  };
  for (const action of ['customer', 'checkout']) {
    for (const country of ['US', 'AE']) {
      let submitted = false;
      const result = await call(
        action,
        { ...payload, billing_address: { ...payload.billing_address, country, postcode: '' } },
        async (url) => {
          if (url.endsWith('/config')) return reply({ ...config, billingFields: rules });
          submitted = true;
          return reply(
            action === 'customer'
              ? { items: [] }
              : { order_id: 5, payment_result: { payment_status: 'success' } },
          );
        },
      );
      assert.equal(result.status, country === 'US' ? 400 : 200);
      assert.equal(submitted, country !== 'US');
      if (country === 'US') {
        assert.match(result.body.fieldErrors.postcode, /postal code/);
        assert.equal(result.body.retrySafe, true);
      }
    }
  }
});

test('checkout phone is required before dispatching a Woo payment', async () => {
  const result = await call(
    'checkout',
    {
      ...payload,
      billing_address: { ...payload.billing_address, phone: ' ' },
    },
    async (url) => {
      assert.ok(url.endsWith('/config'));
      return reply(config);
    },
  );
  assert.equal(result.status, 400);
  assert.equal(result.body.retrySafe, true);
  assert.match(result.body.fieldErrors.phone, /phone number/);
});

test('cart cleanup failure preserves paid proof and can recover on the next check', async () => {
  let fail = true;
  const fetchImpl = async (url) => {
    if (url.endsWith('/order'))
      return reply({
        paid: true,
        status: 'completed',
        items: [{ id: 318, quantity: 1 }],
        downloads: [],
      });
    if (fail) throw new Error('cart temporarily offline');
    return reply({ items: [] });
  };
  const result = await call('order', { attempt }, fetchImpl);
  assert.equal(result.body.paid, true);
  assert.equal(result.body.cartSyncPending, true);
  fail = false;
  const next = await call('order', { attempt }, fetchImpl, {
    cookie: result.headers['Set-Cookie'].split(';')[0],
  });
  assert.equal(next.body.paid, true);
  assert.equal(next.body.cartSyncPending, undefined);
});

test('cart identity stays in encrypted HttpOnly cookie and preserves the Woo token', async () => {
  const result = await call('cart', undefined, async (url, init) => {
    assert.equal(url, `${env.VITE_WOOCOMMERCE_STORE_API_URL}/cart`);
    assert.equal(init.headers['Cart-Token'], state.token);
    return reply({ items: [] }, 200, { 'Cart-Token': 'new-token' });
  });
  assert.equal(result.status, 200);
  assert.match(result.headers['Set-Cookie'], /HttpOnly; SameSite=Lax.*Secure/);
  assert.equal(result.headers['Cache-Control'], 'no-store, private');
  assert.ok(!JSON.stringify(result.body).includes('token'));
  const value = result.headers['Set-Cookie'].split(';')[0].split('=')[1];
  assert.equal(unseal(value, env).token, 'new-token');
  const bytes = Buffer.from(value, 'base64url');
  bytes[30] ^= 1;
  assert.equal(unseal(bytes.toString('base64url'), env), null);
});
test('cross-origin mutation fails before any upstream request', async () => {
  const result = await call(
    'add',
    { id: 318, quantity: 1 },
    () => assert.fail('upstream must not run'),
    { origin: 'https://attacker.test' },
  );
  assert.equal(result.status, 403);
});
test('cart inputs cannot override prices or choose arbitrary upstream URLs', async () => {
  const result = await call(
    'add',
    { id: 318, quantity: 2, price: 1, url: 'https://attacker.test' },
    async (url, init) => {
      assert.equal(url, `${env.VITE_WOOCOMMERCE_STORE_API_URL}/cart/add-item`);
      assert.deepEqual(JSON.parse(init.body), { id: 318, quantity: 2 });
      return reply({ items: [] });
    },
  );
  assert.equal(result.status, 200);
  const invalid = await call('add', { id: 318, quantity: -1 }, () =>
    assert.fail('invalid quantity'),
  );
  assert.equal(invalid.status, 400);
});
test('checkout invokes the pinned Woo gateway, signs exact body, strips PII and order keys', async () => {
  const result = await call('checkout', payload, async (url, init) => {
    if (url.endsWith('/config')) return reply(config);
    assert.equal(url, `${env.VITE_WOOCOMMERCE_STORE_API_URL}/checkout`);
    const body = JSON.parse(init.body);
    assert.equal(body.expected_total, '1399');
    assert.equal(body.payment_method, 'stripe');
    assert.equal(body.create_account, false);
    assert.equal(body.customer_id, undefined);
    assert.equal(body.amount, undefined);
    assert.equal(
      body.payment_data.find((d) => d.key === 'wc-stripe-payment-method').value,
      'pm_testCard',
    );
    const h = init.headers;
    const canonical = [
      'POST',
      '/wc/store/v1/checkout',
      h['X-LLD-Session'],
      attempt,
      h['X-LLD-Timestamp'],
      h['X-LLD-Nonce'],
      state.token,
      init.body,
    ].join('\n');
    assert.equal(
      h['X-LLD-Signature'],
      createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET).update(canonical).digest('hex'),
    );
    return reply({
      order_id: 45,
      order_key: 'never-expose',
      billing_address: { email: 'private' },
      payment_result: {
        payment_status: 'success',
        redirect_url: '#wc-stripe-confirm-pi:45:pi_abc_secret_xyz:nonce',
      },
    });
  });
  assert.deepEqual(result.body, {
    attempt,
    paymentStatus: 'success',
    authentication: { type: 'pi', clientSecret: 'pi_abc_secret_xyz' },
  });
});
test('missing capabilities, disabled checkout, and mismatched Stripe credentials block payment submission', async () => {
  for (const value of [
    { ...config, testMode: false },
    { ...config, testMode: undefined },
    { ...config, publishableKey: 'pk_live_example' },
    { ...config, publishableKey: null },
    { ...config, enabled: false, configurationIssues: ['stripe_payment_api'] },
    { ...config, enabled: false, configurationIssues: ['woocommerce_order_api'] },
    { ...config, enabled: false },
  ]) {
    const result = await call('checkout', payload, async (url) => {
      assert.ok(url.endsWith('/config'));
      return reply(value);
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.retrySafe, true);
  }
});
test('release numbers and advisory warnings never disable a ready gateway in either Stripe mode', async () => {
  const versions = JSON.parse(
    readFileSync(new URL('./fixtures/checkout-versions.json', import.meta.url), 'utf8'),
  );
  for (const { gatewayVersion, woocommerceVersion, reviewed } of versions) {
    for (const testMode of [true, false]) {
      let dispatched = false;
      const result = await call('checkout', payload, async (url, init) => {
        if (url.endsWith('/config'))
          return reply({
            ...config,
            gatewayVersion,
            woocommerceVersion,
            compatibilityWarnings: reviewed
              ? []
              : ['stripe_version_unreviewed', 'woocommerce_version_unreviewed'],
            testMode,
            publishableKey: testMode ? 'pk_test_example' : 'pk_live_example',
          });
        dispatched = true;
        assert.ok(url.endsWith('/wc/store/v1/checkout'));
        assert.ok(init.headers['X-LLD-Signature']);
        return reply({ order_id: 45, payment_result: { payment_status: 'success' } });
      });
      const label = JSON.stringify({ gatewayVersion, woocommerceVersion, testMode });
      assert.equal(result.status, 200, label);
      assert.equal(dispatched, true, label);
    }
  }
});
test('ambiguous payment failures do not suggest it is safe to pay again', async () => {
  const result = await call('checkout', payload, async (url) => {
    if (url.endsWith('/config')) return reply(config);
    throw new Error('timeout');
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.retrySafe, false);
});

test('critical alerts exclude customer validation, declines, ownership errors, and forbidden browser requests', () => {
  for (const status of [400, 401, 402, 403, 404, 409, 422, 429]) {
    assert.equal(criticalCommerceAlert({ status }, 'checkout', true), null);
  }
  assert.equal(
    criticalCommerceAlert({ status: 403, criticalType: 'bridge_authentication' }, 'checkout', true),
    'bridge_authentication',
  );
  assert.equal(criticalCommerceAlert({ status: 502 }, 'order', false), 'payment_verification');
  assert.equal(criticalCommerceAlert({ status: 502 }, 'config', false), 'store_unavailable');
  assert.equal(
    criticalCommerceAlert(new Error('network timeout'), 'checkout', true),
    'checkout_processing',
  );
  assert.throws(
    () => checkoutResult({ order_id: 5, payment_result: { redirect_url: '#invalid' } }, attempt),
    (error) => {
      assert.equal(criticalCommerceAlert(error, 'checkout', true), 'payment_verification');
      return true;
    },
  );
});

test('checkout failures notify admin without changing payment retry safety, even when alerts fail', async () => {
  const alerts = [];
  const result = await call(
    'checkout',
    payload,
    async (url) => {
      if (url.endsWith('/config')) return reply(config);
      throw new Error('private upstream details');
    },
    {},
    async ({ type, action, status }) => {
      alerts.push({ type, action, status });
      throw new Error('mail failed');
    },
  );
  assert.deepEqual(alerts, [{ type: 'checkout_processing', action: 'checkout', status: 502 }]);
  assert.equal(result.status, 502);
  assert.equal(result.body.retrySafe, false);
  assert.ok(!JSON.stringify(result).includes('private upstream'));
  alerts.length = 0;
  await call(
    'checkout',
    payload,
    async () => reply({ ...config, enabled: false }),
    {},
    async ({ type }) => alerts.push(type),
  );
  assert.deepEqual(alerts, ['checkout_configuration']);
  alerts.length = 0;
  await call(
    'checkout',
    { ...payload, billing_address: {} },
    async () => reply(config),
    {},
    async () => alerts.push('unexpected'),
  );
  assert.deepEqual(alerts, []);
});

test('critical alerts use a signed bounded request containing only diagnostic codes', async () => {
  let sent;
  await reportCriticalCommerceError({
    type: 'checkout_processing',
    action: 'checkout',
    status: 502,
    env,
    fetchImpl: async (url, init) => {
      sent = { url, init };
      return reply({ ok: true });
    },
  });
  assert.equal(sent.url, 'https://wp.example.test/wp-json/lld-headless/v1/alert');
  const { init } = sent;
  assert.deepEqual(JSON.parse(init.body), {
    type: 'checkout_processing',
    action: 'checkout',
    status: 502,
  });
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(init.redirect, 'error');
  const h = init.headers;
  const canonical = [
    'POST',
    '/lld-headless/v1/alert',
    h['X-LLD-Session'],
    h['X-LLD-Attempt'],
    h['X-LLD-Timestamp'],
    h['X-LLD-Nonce'],
    '',
    init.body,
  ].join('\n');
  assert.equal(
    h['X-LLD-Signature'],
    createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET).update(canonical).digest('hex'),
  );
});

test('expired customer sessions stay quiet while rejected bridge signatures alert', async () => {
  for (const status of [401, 403]) {
    const alerts = [];
    const result = await call(
      'checkout',
      payload,
      async (url) => {
        if (url.endsWith('/config')) return reply(config);
        return reply(
          {
            code: 'lld_checkout',
            message: status === 401 ? 'Please log in again.' : 'Request not authorized.',
          },
          status,
        );
      },
      {},
      async ({ type }) => alerts.push(type),
    );
    assert.equal(result.status, status);
    assert.deepEqual(alerts, status === 403 ? ['bridge_authentication'] : []);
  }
  const alerts = [];
  await call(
    'cart',
    undefined,
    async () => reply({ message: 'Expired cart token.' }, 403),
    {},
    async ({ type }) => alerts.push(type),
  );
  assert.deepEqual(alerts, []);
});
test('order ownership uses the signed browser session, never a supplied customer/order ID', async () => {
  const result = await call(
    'order',
    { attempt, order_id: 99, customer_id: 8, paid: true, confirm: true },
    async (url, init) => {
      assert.ok(url.endsWith('/lld-headless/v1/order'));
      assert.deepEqual(JSON.parse(init.body), { confirm: true });
      assert.equal(init.headers['X-LLD-Attempt'], attempt);
      return reply({ message: 'Order not available.' }, 404);
    },
  );
  assert.equal(result.status, 404);
});

test('Woo fraud rejection preserves the support message without a false bridge-authentication alert or automatic retry', async () => {
  const alerts = [];
  let submissions = 0;
  const message =
    'We are unable to process this request online. Please contact support to complete your purchase.';
  const result = await call(
    'checkout',
    payload,
    async (url) => {
      if (url.endsWith('/config')) return reply(config);
      submissions++;
      return reply({ code: 'woocommerce_rest_checkout_error', message }, 403);
    },
    {},
    async ({ type }) => alerts.push(type),
  );
  assert.equal(result.status, 403);
  assert.equal(result.body.error, message);
  assert.equal(result.body.retrySafe, false);
  assert.equal(submissions, 1);
  assert.deepEqual(alerts, []);
});

test('invalid authentication references are rejected; WP checkout URLs never leave the BFF', () => {
  assert.throws(() =>
    checkoutResult(
      {
        order_id: 5,
        payment_result: { redirect_url: '#wc-stripe-confirm-pi:6:pi_abc_secret_xyz:nonce' },
      },
      attempt,
    ),
  );
  const result = checkoutResult(
    {
      order_id: 5,
      payment_result: {
        redirect_url: 'https://wp.example.test/checkout/order-received/5?key=secret',
      },
    },
    attempt,
  );
  assert.equal(result.authentication, null);
  assert.equal(result.redirect_url, undefined);
});
test('free orders still go through WooCommerce and its authoritative zero-total validation', async () => {
  const result = await call(
    'checkout',
    { ...payload, paymentMethod: undefined, expectedTotal: '0' },
    async (url, init) => {
      if (url.endsWith('/config')) return reply(config);
      assert.equal(JSON.parse(init.body).expected_total, '0');
      return reply({ order_id: 4, payment_result: { payment_status: 'success' } });
    },
  );
  assert.equal(result.status, 200);
});
test('verified payment clears an unchanged purchased cart once and preserves later shopping', async () => {
  let removed = 0;
  const fetchImpl = async (url, init) => {
    if (url.endsWith('/order'))
      return reply({ paid: true, items: [{ id: 318, quantity: 1 }], downloads: [] });
    if (url.endsWith('/cart')) return reply({ items: [{ id: 318, key: 'key318', quantity: 1 }] });
    if (url.endsWith('/remove-item')) {
      removed++;
      assert.deepEqual(JSON.parse(init.body), { key: 'key318' });
      return reply({ items: [] });
    }
    assert.fail('unexpected endpoint');
  };
  const result = await call('order', { attempt }, fetchImpl);
  assert.equal(removed, 1);
  const updatedCookie = result.headers['Set-Cookie'].split(';')[0];
  await call('order', { attempt }, fetchImpl, { cookie: updatedCookie });
  assert.equal(removed, 1);
  await call('order', { attempt }, async (url) => {
    if (url.endsWith('/order'))
      return reply({ paid: true, items: [{ id: 318, quantity: 1 }], downloads: [] });
    assert.ok(url.endsWith('/cart'));
    return reply({ items: [{ id: 318, key: 'key318', quantity: 2 }] });
  });
});

test('malformed bodies and upstream debug errors do not expose private details', async () => {
  const invalid = await call('add', null, () => assert.fail('invalid body must not reach Woo'));
  assert.equal(invalid.status, 400);
  const failed = await call('cart', undefined, async () =>
    reply({ message: 'Private database stack trace' }, 500),
  );
  assert.equal(failed.status, 502);
  assert.ok(!JSON.stringify(failed.body).includes('Private database'));
});

test('authenticated checkout binds the server-held account token and ignores client ownership', async () => {
  const account = `lld_account=${seal({ kind: 'account', store: env.VITE_WOOCOMMERCE_STORE_API_URL, token: 'verified-wp-session', expires: Date.now() + 60000 }, env)}`;
  let dispatched = false;
  const result = await call(
    'checkout',
    { ...payload, _lld_account: 'attacker-token' },
    async (url, init) => {
      if (url.endsWith('/config')) return reply(config);
      const body = JSON.parse(init.body);
      assert.equal(body._lld_account, 'verified-wp-session');
      assert.equal(body.customer_id, undefined);
      dispatched = true;
      return reply({ order_id: 12, payment_result: { payment_status: 'success' } });
    },
    { cookie: `${cookie}; ${account}` },
  );
  assert.equal(result.status, 200);
  assert.equal(dispatched, true);
});

test('guest personal coupons sync the billing email before Woo validates the code', async () => {
  const calls = [];
  const result = await call(
    'apply-coupon',
    {
      code: ' PERSONAL-10 ',
      email: ' reader@example.test ',
      customer_id: 99,
      _lld_account: 'forged',
    },
    async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      assert.equal(init.headers['X-LLD-Account'], undefined);
      return reply({ coupons: [{ code: 'personal-10' }] });
    },
  );
  assert.equal(result.status, 200);
  assert.deepEqual(calls, [
    {
      url: `${state.store}/cart/update-customer`,
      body: { billing_address: { email: 'reader@example.test' } },
    },
    { url: `${state.store}/cart/apply-coupon`, body: { code: 'PERSONAL-10' } },
  ]);
});

test('coupon requests do not forward account credentials, even with a logged-in account', async () => {
  const account = `lld_account=${seal({ kind: 'account', store: state.store, token: 'verified-wp-session', expires: Date.now() + 60000 }, env)}`;
  const result = await call(
    'apply-coupon',
    { code: 'PERSONAL-10' },
    async (url, init) => {
      assert.equal(init.headers['X-LLD-Account'], undefined);
      assert.deepEqual(JSON.parse(init.body), { code: 'PERSONAL-10' });
      return reply({ coupons: [] });
    },
    { cookie: `${cookie}; ${account}` },
  );
  assert.equal(result.status, 200);
});

test('site-wide coupons and coupon removal remain available without email or login', async () => {
  for (const [action, code] of [
    ['apply-coupon', 'SUMMER'],
    ['remove-coupon', 'WELCOME10'],
  ]) {
    const result = await call(action, { code }, async (url) => {
      assert.equal(url, `${state.store}/cart/${action}`);
      return reply({ coupons: [] });
    });
    assert.equal(result.status, 200);
  }
});

test('invalid billing emails cannot reach Woo coupon application', async () => {
  for (const email of [
    'invalid',
    '',
    'reader@example.test\nheader:value',
    { email: 'reader@example.test' },
  ]) {
    const result = await call('apply-coupon', { code: 'PERSONAL-10', email }, () =>
      assert.fail('invalid email must not reach Woo'),
    );
    assert.equal(result.status, 400);
    assert.ok(result.body.fieldErrors.email);
  }
});

test('Woo email, usage and expiry rejections reach guests unchanged', async () => {
  for (const message of [
    'This coupon is not valid for your email.',
    'Coupon usage limit has been reached.',
    'This coupon has expired.',
    'This discount is available for first orders only. Remove it to continue with your order.',
  ]) {
    const result = await call('apply-coupon', { code: 'PERSONAL-10' }, async () =>
      reply({ message }, 400),
    );
    assert.equal(result.status, 400);
    assert.equal(result.body.error, message);
  }
});

test('failed billing email update stops coupon application', async () => {
  const result = await call(
    'apply-coupon',
    { code: 'PERSONAL-10', email: 'reader@example.test' },
    async (url) => {
      assert.equal(url, `${state.store}/cart/update-customer`);
      return reply({ message: 'Billing email could not be updated.' }, 400);
    },
  );
  assert.equal(result.status, 400);
});
