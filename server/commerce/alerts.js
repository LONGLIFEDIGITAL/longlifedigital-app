import { randomUUID } from 'node:crypto';
import { signedHeaders, storeRoot } from './woo.js';

const actions = new Set([
  'config',
  'fraud-config',
  'cart',
  'add',
  'update',
  'remove',
  'clear',
  'customer',
  'apply-coupon',
  'remove-coupon',
  'checkout',
  'order',
]);

export function criticalCommerceAlert(error, action, checkoutDispatched) {
  if (error.criticalType) return error.criticalType;
  if ((error.status || 502) < 500) return null;
  if (action === 'order') return 'payment_verification';
  if (checkoutDispatched) return 'checkout_processing';
  return 'store_unavailable';
}

export async function reportCriticalCommerceError({ type, action, status, env, fetchImpl }) {
  // Do not send raw errors, shopper data, cookies, or payment identifiers.
  action = actions.has(action) ? action : 'unknown';
  const body = JSON.stringify({ type, action, status });
  try {
    const store = storeRoot(env);
    const route = '/lld-headless/v1/alert';
    const response = await fetchImpl(`${store.replace('/wc/store/v1', '')}${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...signedHeaders(env, route, { store, id: 'critical-alerts' }, randomUUID(), body),
      },
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error('Alert transport unavailable');
  } catch {
    // WordPress/email outages cannot be reported through that same service.
    // Retain a safe Vercel log without changing the original response.
    console.error('Critical commerce alert delivery failed', { type, action, status });
  }
}
