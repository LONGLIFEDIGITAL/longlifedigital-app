import { plainText } from './catalog';

export const headlessEnabled = import.meta.env.VITE_HEADLESS_COMMERCE === 'true';
let sessionQueue = Promise.resolve();
export function commerce(action, body) {
  if (action === 'config') return request(action, body);
  // Cart, checkout and order verification share one cookie. Serialize their responses,
  // including across tabs where Web Locks is available, so older cookies cannot win.
  const run = () =>
    globalThis.navigator?.locks
      ? navigator.locks.request('lld-commerce-session', () => request(action, body))
      : request(action, body);
  const task = sessionQueue.then(run, run);
  sessionQueue = task.catch(() => {});
  return task;
}
async function request(action, body) {
  const response = await fetch(`/api/commerce?action=${encodeURIComponent(action)}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    ...(action === 'order' ? { signal: AbortSignal.timeout(15000) } : {}),
    headers: { 'Content-Type': 'application/json', 'X-LLD-Commerce': '1' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The store is temporarily unavailable. Please try again.');
  }
  if (!response.ok) {
    const error = new Error(plainText(data.error || '') || 'Unable to update your order.');
    error.status = response.status;
    error.retrySafe = data.retrySafe === true;
    error.fieldErrors = Object.fromEntries(
      Object.entries(data.fieldErrors || {}).map(([field, message]) => [field, plainText(message)]),
    );
    throw error;
  }
  return data;
}
export function cartProducts(data, products) {
  return (data?.items || []).map((item) => ({
    ...products.find((p) => p.id === item.id),
    id: item.id,
    key: item.key,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.prices.price) / 10 ** item.prices.currency_minor_unit,
    currency: item.prices.currency_code,
    minorUnit: item.prices.currency_minor_unit,
    thumbnail: item.images?.[0]?.thumbnail || item.images?.[0]?.src,
    serverLineTotal: Number(item.totals.line_total) / 10 ** item.totals.currency_minor_unit,
    quantityLimits: {
      minimum: item.quantity_limits?.minimum,
      maximum: item.quantity_limits?.maximum,
      multipleOf: item.quantity_limits?.multiple_of,
    },
    canAddToCart: true,
    source: 'woocommerce',
  }));
}
export function moneyMinor(value, totals) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: totals?.currency_code || 'USD',
  }).format(Number(value || 0) / 10 ** (totals?.currency_minor_unit ?? 2));
}
const attemptKey = `lld:checkout:${import.meta.env.VITE_WOOCOMMERCE_STORE_API_URL || 'demo'}`;
const billingKey = `${attemptKey}:billing`;
const billingKeys = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'address_1',
  'address_2',
  'city',
  'country',
  'state',
  'postcode',
];
export function readBillingDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(billingKey));
    if (!draft || draft.expires < Date.now()) {
      clearBillingDraft();
      return {};
    }
    return Object.fromEntries(
      billingKeys
        .filter((key) => typeof draft.fields?.[key] === 'string')
        .map((key) => [key, draft.fields[key].slice(0, 200)]),
    );
  } catch {
    return {};
  }
}
export function saveBillingDraft(fields) {
  // A short-lived, tab-local draft, never card data or a saved customer account.
  try {
    sessionStorage.setItem(
      billingKey,
      JSON.stringify({
        expires: Date.now() + 2 * 60 * 60 * 1000,
        fields: Object.fromEntries(billingKeys.map((key) => [key, fields[key] || ''])),
      }),
    );
  } catch {
    /* Storage-disabled browsers can still complete checkout. */
  }
}
export function clearBillingDraft() {
  try {
    sessionStorage.removeItem(billingKey);
  } catch {
    /* No persisted draft. */
  }
}
export function readAttempt() {
  try {
    return JSON.parse(sessionStorage.getItem(attemptKey));
  } catch {
    return null;
  }
}
export function saveAttempt(value) {
  // Save the identifier before submitting. No card data, billing details or intent secrets.
  if (value) sessionStorage.setItem(attemptKey, JSON.stringify(value));
  else sessionStorage.removeItem(attemptKey);
}
