// No payment/order creation. --cart exercises an isolated guest cart and removes its item.
import { loadEnv } from 'vite';
import { createCommerceHandler } from '../api/commerce.js';
const env = { ...process.env, ...loadEnv('development', process.cwd(), '') };
const root = env.VITE_WOOCOMMERCE_STORE_API_URL?.replace(/\/$/, '');
if (!root) throw new Error('Configure VITE_WOOCOMMERCE_STORE_API_URL first.');
const productResponse = await fetch(`${root}/products/318`, {
  signal: AbortSignal.timeout(15000),
  cache: 'no-store',
});
const product = await productResponse.json();
console.log(
  JSON.stringify({
    product: {
      status: productResponse.status,
      id: product.id,
      name: product.name,
      price: product.prices?.price,
      currency: product.prices?.currency_code,
      purchasable: product.is_purchasable,
    },
  }),
);
const response = await fetch(`${root.replace('/wc/store/v1', '/lld-headless/v1')}/config`, {
  signal: AbortSignal.timeout(15000),
  cache: 'no-store',
});
const config = await response.json();
console.log(
  JSON.stringify({
    bridge: {
      status: response.status,
      enabled: config.enabled ?? false,
      testMode: config.testMode,
      gatewayVersion: config.gatewayVersion,
      woocommerceVersion: config.woocommerceVersion,
    },
  }),
);
if (process.argv.includes('--cart')) {
  let cookie = '';
  const origin = (env.STOREFRONT_ORIGINS || '').split(',')[0].trim();
  if (!origin) throw new Error('Configure STOREFRONT_ORIGINS first.');
  const handler = createCommerceHandler({ env });
  async function call(action, body) {
    let data;
    const req = {
      url: `/api/commerce?action=${action}`,
      method: body ? 'POST' : 'GET',
      body,
      headers: { cookie, origin, 'x-lld-commerce': '1' },
    };
    const res = {
      setHeader(k, v) {
        if (k === 'Set-Cookie') cookie = v.split(';')[0];
      },
      end(value) {
        data = JSON.parse(value);
      },
    };
    await handler(req, res);
    if (res.statusCode !== 200) throw new Error(`${action}: ${data.error}`);
    return data;
  }
  await call('cart');
  let cart;
  try {
    cart = await call('add', { id: 318, quantity: 1 });
    const item = cart.items.find((i) => i.id === 318);
    if (!item) throw new Error('Test product was not added.');
    console.log(
      JSON.stringify({
        cart: 'added',
        quantity: item.quantity,
        total: cart.totals.total_price,
        currency: cart.totals.currency_code,
      }),
    );
    if (item.quantity_limits.maximum >= 2) {
      cart = await call('update', { key: item.key, quantity: 2 });
      console.log(
        JSON.stringify({
          cart: 'updated',
          quantity: cart.items.find((i) => i.id === 318)?.quantity,
          total: cart.totals.total_price,
        }),
      );
    }
  } finally {
    for (const item of cart?.items || []) cart = await call('remove', { key: item.key });
    console.log(JSON.stringify({ cart: 'cleaned', remainingItems: cart?.items.length ?? 0 }));
  }
}
