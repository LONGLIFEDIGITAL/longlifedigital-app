import {
  address,
  CommerceError,
  positiveInteger,
  readBody,
  requireSameOrigin,
  send,
} from '../server/commerce/http.js';
import { readSession, writeSession } from '../server/commerce/session.js';
import { createWoo } from '../server/commerce/woo.js';

function attemptId(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)
  )
    throw new CommerceError('Invalid checkout attempt.');
  return value;
}
export function checkoutResult(result, attempt) {
  const payment = result.payment_result || {};
  const redirect = payment.redirect_url || '';
  const match =
    /^#wc-stripe-confirm-(pi|si):(\d+):((?:pi|seti)_[A-Za-z0-9]+_secret_[A-Za-z0-9]+):[A-Za-z0-9]+$/.exec(
      redirect,
    );
  if (redirect.startsWith('#') && (!match || Number(match[2]) !== result.order_id))
    throw new CommerceError('Payment requires verification. Please check your order status.', 409);
  return {
    attempt,
    paymentStatus: payment.payment_status,
    authentication: match ? { type: match[1], clientSecret: match[3] } : null,
  };
}

export function createCommerceHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    let checkoutDispatched = false;
    try {
      const action = new URL(req.url, 'http://localhost').searchParams.get('action') || 'cart';
      if (!['GET', 'POST'].includes(req.method))
        throw new CommerceError('Method not allowed.', 405);
      if (req.method === 'POST') requireSameOrigin(req, env);
      const woo = createWoo(env, fetchImpl);
      // Public configuration must never create or overwrite a customer's cart cookie.
      if (req.method === 'GET' && action === 'config') return send(res, 200, await woo.config());
      const session = readSession(req, env);
      let data;
      if (req.method === 'GET' && action === 'cart') data = await woo.store('cart', session);
      else if (req.method === 'POST') {
        if (!session.token)
          throw new CommerceError('Please reload your cart before continuing.', 409);
        const body = await readBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body))
          throw new CommerceError('Invalid request.');
        if (action === 'order') {
          const attempt = attemptId(body.attempt);
          data = await woo.order(session, attempt, body.confirm);
          if (data.paid && !(session.settled || []).includes(attempt)) {
            try {
              const cart = await woo.store('cart', session);
              // Clear only an unchanged purchased cart. Preserve subsequent shopping.
              const purchased = new Map(data.items.map((item) => [item.id, item.quantity]));
              if (
                cart.items.length === purchased.size &&
                cart.items.every((item) => purchased.get(item.id) === item.quantity)
              ) {
                for (const item of cart.items)
                  await woo.store('cart/remove-item', session, 'POST', { key: item.key });
              }
              session.settled = [...(session.settled || []).slice(-19), attempt];
            } catch {
              data.cartSyncPending = true;
            }
          }
        } else if (action === 'checkout') {
          const attempt = attemptId(body.attempt);
          if (
            body.expectedTotal !== '0' &&
            (typeof body.paymentMethod !== 'string' ||
              !/^pm_[A-Za-z0-9]+$/.test(body.paymentMethod))
          )
            throw new CommerceError('Please enter your payment details.');
          if (typeof body.expectedTotal !== 'string' || !/^\d{1,12}$/.test(body.expectedTotal))
            throw new CommerceError('Please review your order total.');
          const config = await woo.config();
          if (
            !config.enabled ||
            !config.testMode ||
            config.gatewayVersion !== '11.0.0' ||
            config.woocommerceVersion !== '11.1.2'
          )
            throw new CommerceError('Checkout is being configured. Please try again later.', 503);
          const billing = address(body.billing_address, config.billingFields);
          const paymentData = {
            payment_method: 'stripe',
            wc_payment_intent_id: '',
            'wc-stripe-payment-method': body.paymentMethod || '',
            save_payment_method: 'no',
          };
          for (const [key, value] of Object.entries(billing)) paymentData[`billing_${key}`] = value;
          checkoutDispatched = true;
          const result = await woo.store(
            'checkout',
            session,
            'POST',
            {
              billing_address: billing,
              payment_method: 'stripe',
              create_account: false,
              expected_total: body.expectedTotal,
              payment_data: Object.entries(paymentData).map(([key, value]) => ({ key, value })),
            },
            attempt,
          );
          data = checkoutResult(result, attempt);
        } else if (action === 'add')
          data = await woo.store('cart/add-item', session, 'POST', {
            id: positiveInteger(body.id),
            quantity: positiveInteger(body.quantity),
          });
        else if (action === 'update' || action === 'remove') {
          if (typeof body.key !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.key))
            throw new CommerceError('Invalid cart item.');
          data = await woo.store(
            `cart/${action === 'update' ? 'update-item' : 'remove-item'}`,
            session,
            'POST',
            {
              key: body.key,
              ...(action === 'update' ? { quantity: positiveInteger(body.quantity) } : {}),
            },
          );
        } else if (action === 'apply-coupon' || action === 'remove-coupon') {
          if (typeof body.code !== 'string' || !body.code.trim() || body.code.length > 100)
            throw new CommerceError('Please enter a coupon code.');
          data = await woo.store(`cart/${action}`, session, 'POST', { code: body.code.trim() });
        } else if (action === 'customer') {
          const config = await woo.config();
          data = await woo.store('cart/update-customer', session, 'POST', {
            billing_address: address(body.billing_address, config.billingFields),
          });
        } else throw new CommerceError('Unknown cart operation.', 404);
      } else throw new CommerceError('Unknown cart operation.', 404);
      writeSession(res, session, env);
      return send(res, 200, data);
    } catch (error) {
      return send(res, error.status || 502, {
        error:
          error instanceof CommerceError
            ? error.message
            : 'The store is temporarily unavailable. Please try again.',
        retrySafe: !checkoutDispatched,
        ...(error instanceof CommerceError && error.fieldErrors
          ? { fieldErrors: error.fieldErrors }
          : {}),
      });
    }
  };
}
export default createCommerceHandler();
