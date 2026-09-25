import { expect, test } from '@playwright/test';
const attempt = '11111111-1111-4111-8111-111111111111';
const currency = { currency_code: 'USD', currency_minor_unit: 2 };
const product = {
  id: 318,
  name: 'Small Business AI Prompt Pack',
  slug: 'small-business-ai-pack',
  type: 'simple',
  description: '<p>Digital download.</p>',
  short_description: '',
  prices: { ...currency, price: '1399', regular_price: '2099', sale_price: '1399' },
  categories: [],
  images: [],
  tags: [],
  is_purchasable: true,
  is_in_stock: true,
  has_options: false,
};
const defaultConfig = {
  enabled: true,
  testMode: true,
  publishableKey: 'pk_test_mock',
  countries: { US: 'United States', AE: 'United Arab Emirates' },
  billingFields: {
    US: { postcode: { required: true } },
    AE: { postcode: { required: false, hidden: true } },
  },
  states: { US: { IL: 'Illinois' } },
};
function state(quantity = 1, total) {
  return {
    items: quantity
      ? [
          {
            ...product,
            key: 'cartkey318',
            quantity,
            quantity_limits: { minimum: 1, maximum: 10, multiple_of: 1 },
            totals: {
              ...currency,
              line_total: String(1399 * quantity),
              line_subtotal: String(1399 * quantity),
            },
          },
        ]
      : [],
    coupons: [],
    needs_shipping: false,
    totals: {
      ...currency,
      total_items: String(1399 * quantity),
      total_discount: '0',
      total_tax: '0',
      total_price: String(total ?? 1399 * quantity),
    },
  };
}
async function setup(page, { quantity = 1, config = defaultConfig, order, zero = false } = {}) {
  let current = state(quantity);
  const calls = [];
  await page.route('**/api/catalog?**', (route) =>
    route.fulfill({ json: [product], headers: { 'X-WP-TotalPages': '1' } }),
  );
  await page.route('**/api/commerce?**', async (route) => {
    const action = new URL(route.request().url()).searchParams.get('action');
    const body = route.request().postDataJSON();
    calls.push({ action, body });
    if (action === 'config') return route.fulfill({ json: config });
    if (action === 'add') current = state((current.items[0]?.quantity || 0) + body.quantity);
    if (action === 'update') current = state(body.quantity);
    if (action === 'remove') current = state(0);
    if (action === 'customer') current = state(current.items[0].quantity, zero ? 0 : 1499);
    if (action === 'apply-coupon') {
      current = { ...state(1, 1299), coupons: [{ code: body.code }] };
      current.totals.total_discount = '100';
    }
    if (action === 'checkout')
      return route.fulfill({
        json: { attempt: body.attempt, authentication: null, paymentStatus: 'success' },
      });
    if (action === 'order')
      return route.fulfill({
        json: order || {
          number: '500',
          status: 'completed',
          paid: true,
          total: zero ? '0' : '13.99',
          currency: 'USD',
          items: [{ id: 318, name: product.name, quantity: 1 }],
          downloads: [
            {
              productId: 318,
              productName: product.name,
              downloadId: 'pack',
              expires: null,
              name: 'Prompt pack.pdf',
              url: 'https://wp.example.test/?download_file=318&key=protected',
            },
          ],
        },
      });
    return route.fulfill({ json: current });
  });
  return calls;
}
async function billing(page) {
  await page.getByRole('textbox', { name: 'First name', exact: true }).fill('Test');
  await page.getByRole('textbox', { name: 'Last name', exact: true }).fill('Customer');
  await page
    .getByRole('textbox', { name: 'Email address', exact: true })
    .fill('buyer@example.test');
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+13125550123');
  await page.getByRole('textbox', { name: 'Address', exact: true }).fill('123 Test Street');
  await page.getByRole('textbox', { name: 'City', exact: true }).fill('Chicago');
  await page.getByRole('combobox', { name: 'Country', exact: true }).click();
  await page.getByRole('option', { name: 'United States', exact: true }).click();
  await page.getByRole('combobox', { name: 'State / region', exact: true }).click();
  await page.getByRole('option', { name: 'Illinois', exact: true }).click();
  await page.getByRole('textbox', { name: 'Postal code', exact: true }).fill('60601');
}

test('billing survives refresh but payment details and reviewed totals are not restored', async ({
  page,
}) => {
  await setup(page);
  await mockStripe(page);
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('button', { name: 'Pay $14.99' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toHaveValue('Test');
  await expect(page.getByRole('textbox', { name: 'Phone', exact: true })).toHaveValue(
    '+13125550123',
  );
  await expect(page.getByRole('textbox', { name: 'Postal code', exact: true })).toHaveValue(
    '60601',
  );
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toHaveValue(
    'United States',
  );
  await expect(page.getByRole('button', { name: 'Review final total' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await page.getByRole('button', { name: 'Pay $14.99' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toHaveValue('');
});

test('postal code is required for US billing and hidden where Woo does not use it', async ({
  page,
}) => {
  const calls = await setup(page);
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('textbox', { name: 'Postal code', exact: true }).fill('');
  await page.getByRole('button', { name: 'Review final total' }).click();
  expect(calls.some((call) => call.action === 'customer')).toBe(false);
  await expect(page.getByRole('textbox', { name: 'Postal code', exact: true })).toHaveAttribute(
    'required',
    '',
  );
  await page.getByRole('combobox', { name: 'Country', exact: true }).click();
  await page.getByRole('option', { name: 'United Arab Emirates', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /Postal code/ })).toHaveCount(0);
});

test('draft verification shows progress then a bounded unconfirmed outcome without granting downloads', async ({
  page,
}) => {
  await page.clock.install();
  let checks = 0;
  await setup(page);
  await page.route('**/api/commerce?action=order', (route) => {
    checks++;
    return route.fulfill({
      json: { status: 'checkout-draft', paid: false, items: [], downloads: [] },
    });
  });
  await page.goto(`/order-confirmation?attempt=${attempt}`);
  await expect(page.getByLabel('Confirming payment')).toBeVisible();
  for (let count = 1; count <= 8; count++) {
    await expect.poll(() => checks).toBe(count);
    await page.clock.runFor(3100);
  }
  await expect(
    page.getByRole('heading', { name: 'We couldn’t confirm your payment yet' }),
  ).toBeVisible();
  await expect(page.getByLabel('Confirming payment')).toHaveCount(0);
  await expect(page.getByText(/checkout-draft|Payment status:/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Check status/ })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Purchased downloads' })).toHaveCount(0);
  await page.clock.runFor(60000);
  expect(checks).toBe(8);
});

test('payment confirmation has a wall-clock deadline even with a stalled response', async ({
  page,
}) => {
  await page.clock.install();
  await setup(page);
  let release;
  await page.route('**/api/commerce?action=order', async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({ json: { paid: false, status: 'pending', items: [], downloads: [] } });
  });
  await page.goto(`/order-confirmation?attempt=${attempt}`);
  await expect.poll(() => !!release).toBe(true);
  await page.clock.runFor(61000);
  await expect(
    page.getByRole('heading', { name: 'We couldn’t confirm your payment yet' }),
  ).toBeVisible();
  await expect(page.getByLabel('Confirming payment')).toHaveCount(0);
  release();
});

test('verification transitions from progress to verified purchase without a manual status check', async ({
  page,
}) => {
  await setup(page);
  let checks = 0;
  await page.route('**/api/commerce?action=order', (route) =>
    route.fulfill({
      json:
        ++checks < 2
          ? { paid: false, status: 'pending', items: [], downloads: [] }
          : {
              paid: true,
              status: 'completed',
              items: [],
              downloads: [
                {
                  productId: 319,
                  productName: 'Purchased product',
                  downloadId: 'purchased',
                  expires: null,
                  name: 'Purchased.pdf',
                  url: 'https://wp.example.test/authorized',
                },
              ],
            },
    }),
  );
  await page.goto(`/order-confirmation?attempt=${attempt}`);
  await expect(page.getByLabel('Confirming payment')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Purchased downloads' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole('link', { name: 'Purchased product' })).toBeVisible();
  await expect(page.getByLabel('Confirming payment')).toHaveCount(0);
});

test('editing reviewed billing unlocks fields without resubmitting and requires a phone', async ({
  page,
}) => {
  const calls = await setup(page);
  await mockStripe(page);
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('');
  await page.getByRole('button', { name: 'Review final total' }).click();
  expect(calls.filter((c) => c.action === 'customer')).toHaveLength(0);
  await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('+13125550123');
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Edit billing details' }).click();
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toBeEnabled();
  await page.getByRole('textbox', { name: 'First name', exact: true }).fill('Updated');
  await expect(page.getByRole('button', { name: 'Review final total' })).toBeVisible();
  expect(calls.filter((c) => c.action === 'customer')).toHaveLength(1);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('button', { name: 'Edit billing details' })).toBeVisible();
  expect(calls.filter((c) => c.action === 'customer').at(-1).body.billing_address.first_name).toBe(
    'Updated',
  );
});

test('billing errors name the field and focus refresh failures keep the form and values', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/api/commerce?action=customer', (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: 'Please check these billing fields: Postal code.',
        fieldErrors: { postcode: 'Please check your postal code.' },
      },
    }),
  );
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('textbox', { name: 'Postal code', exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Refresh cart' })).toHaveCount(0);
  await page.route('**/api/commerce?action=cart', (route) =>
    route.fulfill({ status: 502, json: { error: 'Temporarily unavailable.' } }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toHaveValue('Test');
  await expect(page.getByRole('textbox', { name: 'Postal code', exact: true })).toHaveValue(
    '60601',
  );
  await expect(page.getByText('Your cart is empty.', { exact: false })).toHaveCount(0);
});

test('session requests wait for mutations while configuration remains independent', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/checkout');
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toBeVisible();
  let finishCustomer;
  let cartRequests = 0;
  await page.route('**/api/commerce?action=customer', async (route) => {
    await new Promise((resolve) => {
      finishCustomer = resolve;
    });
    await route.fulfill({ json: state(1) });
  });
  await page.route('**/api/commerce?action=cart', (route) => {
    cartRequests++;
    return route.fulfill({ json: state(1) });
  });
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect.poll(() => !!finishCustomer).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  // A public config request completes even while the session mutation is pending.
  await page.evaluate(async () => {
    const { commerce } = await import('/src/services/checkout.js');
    await commerce('config');
  });
  expect(cartRequests).toBe(0);
  finishCustomer();
  await expect.poll(() => cartRequests).toBe(1);
});

test('paid order retries cart housekeeping automatically without asking to verify payment again', async ({
  page,
}) => {
  const calls = await setup(page);
  let checks = 0;
  await page.route('**/api/commerce?action=order', (route) =>
    route.fulfill({
      json: {
        number: '500',
        paid: true,
        status: 'completed',
        items: [],
        downloads: [
          {
            productId: 318,
            productName: product.name,
            downloadId: 'pack',
            expires: null,
            name: 'Prompt pack.pdf',
            url: 'https://wp.example.test/protected',
          },
        ],
        cartSyncPending: ++checks === 1,
      },
    }),
  );
  await page.goto(`/order-confirmation?attempt=${attempt}`);
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  await expect(page.getByRole('link', { name: product.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check status again' })).toHaveCount(0);
  await expect(page.getByText(/cart could not refresh/)).toHaveCount(0);
  await expect.poll(() => checks, { timeout: 10000 }).toBe(2);
  expect(calls.some((c) => c.action === 'checkout')).toBe(false);
});

test('Woo cart quantity changes, removal and checkout stay in React', async ({ page }) => {
  const calls = await setup(page);
  await page.goto('/products');
  await page.getByRole('button', { name: 'Open cart (1)', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Shopping cart' });
  await drawer.getByRole('button', { name: `Increase quantity of ${product.name}` }).click();
  await expect(drawer.getByLabel('Cart subtotal')).toHaveText('$27.98');
  await drawer.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  await expect(page.getByText('Continue as a guest. No account is required.')).toBeVisible();
  expect(calls.find((c) => c.action === 'update').body).toEqual({ key: 'cartkey318', quantity: 2 });
  await page.getByRole('button', { name: 'Open cart (2)', exact: true }).click();
  await page.getByRole('button', { name: `Remove ${product.name} from cart` }).click();
  await expect(drawer.getByText('Your cart is empty')).toBeVisible();
});
test('checkout reviews server-calculated taxes and coupons before enabling payment', async ({
  page,
}) => {
  const calls = await setup(page);
  await mockStripe(page);
  await page.goto('/checkout');
  await page.getByLabel('Coupon code').fill('SAVE');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByText('$12.99', { exact: true })).toBeVisible();
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('button', { name: 'Pay $14.99' })).toBeVisible();
  expect(
    calls.some(
      (c) => c.action === 'customer' && c.body.billing_address.email === 'buyer@example.test',
    ),
  ).toBeTruthy();
  expect(calls.some((c) => c.action === 'checkout')).toBeFalsy();
});
test('free Woo order completes natively and displays only server-verified downloads', async ({
  page,
}) => {
  const calls = await setup(page, { zero: true });
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await page.getByRole('button', { name: 'Place free order' }).click();
  await expect(page).toHaveURL(/\/order-confirmation\?attempt=/);
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  await expect(page.getByRole('link', { name: product.name })).toHaveAttribute(
    'href',
    /download_file=318/,
  );
  expect(calls.filter((c) => c.action === 'checkout')).toHaveLength(1);
  expect(calls.find((c) => c.action === 'checkout').body.expectedTotal).toBe('0');
});
for (const status of ['pending', 'failed', 'refunded']) {
  test(`${status} orders never display successful payment or downloads`, async ({ page }) => {
    await setup(page, {
      order: {
        number: '501',
        status,
        paid: false,
        total: '13.99',
        currency: 'USD',
        items: [],
        downloads: [],
      },
    });
    await page.goto(`/order-confirmation?attempt=${attempt}&redirect_status=succeeded`);
    await expect(
      page.getByRole('heading', {
        name:
          status === 'pending'
            ? 'Confirming your purchase'
            : status === 'refunded'
              ? 'Purchase refunded'
              : 'Payment was not completed',
      }),
    ).toBeVisible();
    await expect(page.getByText(/Payment status:/)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toHaveCount(0);
    await expect(page.getByRole('table', { name: 'Purchased downloads' })).toHaveCount(0);
  });
}
test('an unverified previous checkout blocks a second payment', async ({ page }) => {
  const calls = await setup(page);
  await page.addInitScript(
    (attempt) =>
      sessionStorage.setItem(
        'lld:checkout:https://catalog.example.test/wp-json/wc/store/v1',
        JSON.stringify({ attempt, pending: true }),
      ),
    attempt,
  );
  await page.goto('/checkout');
  await expect(page).toHaveURL(/order-confirmation/);
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0);
  expect(calls.some((c) => c.action === 'checkout')).toBeFalsy();
});
test('gateway unavailable fails closed without a WordPress checkout redirect', async ({ page }) => {
  await setup(page, { config: { ...defaultConfig, enabled: false } });
  await page.goto('/checkout');
  await expect(
    page.getByText('Checkout is being configured. Please try again later.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review final total' })).toBeDisabled();
  await expect(page).toHaveURL(/\/checkout$/);
});

async function mockStripe(page) {
  // Contract stub only: this does not process a real Stripe payment.
  await page.route('https://js.stripe.com/**', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
    window.Stripe = () => ({
      _registerWrapper(){}, registerAppInfo(){}, createToken(){}, confirmCardPayment(){},
      elements(){ return { update(){}, on(){}, off(){}, submit:async()=>({}),
        create(){
          let destroyed = false; const callbacks = {};
          window.testStripeReady = () => callbacks.ready?.();
          window.testStripeLoadError = () => callbacks.loaderror?.({error:{message:'Simulated load failure'}});
          return {
            mount(el){el.textContent='Secure payment test component'},
            on(name, callback){callbacks[name]=callback; if(name==='ready') setTimeout(()=>{if(!destroyed && !window.testStripeHoldReady) callbacks.ready?.()}, 0)},
            off(name){delete callbacks[name]}, destroy(){destroyed=true}, update(){}
          }
        } } },
      createPaymentMethod:async(options)=>{window.testBillingDetails=options.params.billing_details;return {paymentMethod:{id:'pm_testCard'}}},
      confirmPayment:async()=>{window.testStripeConfirmed=true;return {paymentIntent:{status:'succeeded'}}},
      confirmSetup:async()=>({})
    }); window.Stripe.version="dahlia";`,
    }),
  );
}

test('invalid Stripe configuration never shows an unusable Pay button', async ({ page }) => {
  const calls = await setup(page, {
    config: { ...defaultConfig, publishableKey: 'billing_phone' },
  });
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(
    page.getByText('Payment is temporarily unavailable. Please try again shortly.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0);
  expect(calls.some((call) => call.action === 'checkout')).toBe(false);
});

test('Pay waits for field readiness and load failures can recover without losing billing', async ({
  page,
}) => {
  const calls = await setup(page);
  await mockStripe(page);
  await page.addInitScript(() => {
    window.testStripeHoldReady = true;
  });
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  const pay = page.getByRole('button', { name: 'Pay $14.99' });
  await expect(pay).toBeDisabled();
  await expect(page.getByText('Loading payment fields…')).toBeVisible();
  await page.evaluate(() => window.testStripeLoadError());
  await expect(page.getByRole('button', { name: 'Reload payment fields' })).toBeVisible();
  await expect(pay).toBeDisabled();
  await page.evaluate(() => {
    window.testStripeHoldReady = false;
  });
  await page.getByRole('button', { name: 'Reload payment fields' }).click();
  await expect(pay).toBeEnabled();
  await expect(page.getByRole('textbox', { name: 'First name', exact: true })).toHaveValue('Test');
  expect(calls.some((call) => call.action === 'checkout')).toBe(false);
  await pay.click();
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  expect(calls.filter((call) => call.action === 'checkout')).toHaveLength(1);
});

test('silent payment iframe failures stop loading and provide a safe retry', async ({ page }) => {
  await page.clock.install();
  const calls = await setup(page);
  await mockStripe(page);
  await page.addInitScript(() => {
    window.testStripeHoldReady = true;
  });
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByText('Loading payment fields…')).toBeVisible();
  await page.clock.runFor(16000);
  await expect(page.getByRole('button', { name: 'Reload payment fields' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pay $14.99' })).toBeDisabled();
  expect(calls.some((call) => call.action === 'checkout')).toBe(false);
});
test('card checkout submits one Woo attempt and verifies payment in React', async ({ page }) => {
  const calls = await setup(page);
  await mockStripe(page);
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await page.getByRole('button', { name: 'Pay $14.99' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  const submitted = calls.filter((c) => c.action === 'checkout');
  expect(submitted).toHaveLength(1);
  expect(submitted[0].body.paymentMethod).toBe('pm_testCard');
  expect(submitted[0].body.expectedTotal).toBe('1499');
  expect(await page.evaluate(() => window.testBillingDetails.phone)).toBe('+13125550123');
  expect(calls.some((c) => c.action === 'order' && c.body.confirm)).toBeTruthy();
});
test('mobile checkout fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/checkout-mobile.png', fullPage: true });
});
test('Stripe authentication is followed by Woo order verification', async ({ page }) => {
  await setup(page);
  await mockStripe(page);
  await page.route('**/api/commerce?action=checkout', (route) =>
    route.fulfill({
      json: {
        attempt: route.request().postDataJSON().attempt,
        authentication: { type: 'pi', clientSecret: 'pi_test_secret_test' },
      },
    }),
  );
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await page.getByRole('button', { name: 'Pay $14.99' }).click();
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible();
  expect(await page.evaluate(() => window.testStripeConfirmed)).toBe(true);
});

test('interrupted authentication resumes the existing order without another checkout', async ({
  page,
}) => {
  const calls = await setup(page, {
    order: {
      number: '501',
      status: 'pending',
      paid: false,
      items: [],
      downloads: [],
      authentication: { type: 'pi', clientSecret: 'pi_test_secret_test' },
    },
  });
  await mockStripe(page);
  await page.goto(`/order-confirmation?attempt=${attempt}`);
  await page.getByRole('button', { name: 'Complete payment authentication' }).click();
  await expect.poll(() => page.evaluate(() => window.testStripeConfirmed)).toBe(true);
  expect(calls.some((c) => c.action === 'checkout')).toBeFalsy();
  await expect(page.getByRole('heading', { name: 'Confirming your purchase' })).toBeVisible();
});

test('coupon errors decode entities and remove markup without rendering HTML', async ({ page }) => {
  await setup(page);
  await page.route('**/api/commerce?action=apply-coupon', (route) =>
    route.fulfill({
      status: 400,
      json: {
        error:
          '<strong>Coupon &quot;welcome&quot;</strong> cannot be applied because it does not exist.<script>window.couponInjected = true</script>',
      },
    }),
  );
  await page.goto('/checkout');
  await page.getByLabel('Coupon code').fill('welcome');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(
    page.getByText('Coupon "welcome" cannot be applied because it does not exist.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.couponInjected)).toBeUndefined();
});

test('real Stripe test-mode payment fields mount without submitting a payment', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.LLD_REAL_STRIPE_MOUNT !== '1',
    'Opt-in public Stripe rendering smoke check; no payments.',
  );
  const response = await request.get(
    'https://longlifedigital-zmuro.wpcomstaging.com/wp-json/lld-headless/v1/config',
  );
  const config = await response.json();
  expect(config.testMode).toBe(true);
  expect(config.publishableKey).toMatch(/^pk_test_/);
  const calls = await setup(page, {
    config: { ...config, countries: defaultConfig.countries, states: defaultConfig.states },
  });
  await page.goto('/checkout');
  await billing(page);
  await page.getByRole('button', { name: 'Review final total' }).click();
  await expect(page.getByRole('button', { name: 'Pay $14.99' })).toBeEnabled({ timeout: 20000 });
  const cardNumber = page
    .frameLocator('#checkout-payment-element iframe[title="Secure payment input frame"]')
    .first()
    .getByPlaceholder('1234 1234 1234 1234');
  await expect(cardNumber).toBeVisible({ timeout: 30000 });
  await cardNumber.click();
  await expect(cardNumber).toBeFocused();
  await page.screenshot({ path: 'test-results/stripe-fields-real.png' });
  expect(calls.some((call) => call.action === 'checkout')).toBe(false);
});

test('Buy Now waits for Woo cart success, prevents repeat clicks, and preserves the cart', async ({
  page,
}) => {
  const calls = await setup(page);
  let release;
  const ready = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/api/commerce?action=add', async (route) => {
    await ready;
    await route.fallback();
  });
  await page.goto('/products');
  const card = page.getByRole('article').filter({ hasText: product.name });
  await card.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
  await expect(page).toHaveURL(/\/products$/);
  release();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('button', { name: 'Open cart (2)' })).toBeVisible();
  expect(calls.filter((call) => call.action === 'add')).toHaveLength(1);
  expect(calls.some((call) => call.action === 'checkout')).toBe(false);
});

test('Buy Now stays on the listing when Woo cannot add the product', async ({ page }) => {
  await setup(page);
  await page.route('**/api/commerce?action=add', (route) =>
    route.fulfill({ status: 409, json: { error: 'This product is out of stock.' } }),
  );
  await page.goto('/products');
  const buy = page
    .getByRole('article')
    .filter({ hasText: product.name })
    .getByRole('button', { name: 'Buy Now', exact: true });
  await buy.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'This product is out of stock.' }),
  ).toBeVisible();
  await expect(buy).toBeEnabled();
  await expect(page).toHaveURL(/\/products$/);
});
