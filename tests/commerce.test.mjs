import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createCommerceHandler, checkoutResult } from '../api/commerce.js';
import { seal, unseal } from '../server/commerce/session.js';
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
async function call(action, body, fetchImpl, overrides = {}) {
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
  await createCommerceHandler({ env, fetchImpl })(req, res);
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
test('changed gateway or live Stripe blocks payment submission', async () => {
  for (const value of [
    { ...config, testMode: false },
    { ...config, gatewayVersion: '12.0.0' },
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
test('ambiguous payment failures do not suggest it is safe to pay again', async () => {
  const result = await call('checkout', payload, async (url) => {
    if (url.endsWith('/config')) return reply(config);
    throw new Error('timeout');
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.retrySafe, false);
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
