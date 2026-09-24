import { CommerceError } from './http.js';
import { createHmac, randomBytes } from 'node:crypto';
import { sessionKey } from './session.js';
import { billingErrors, billingErrorMessage } from './validation.js';

export function signedHeaders(env, route, session, attempt, body, token = '') {
  const secret = env.LLD_COMMERCE_BRIDGE_SECRET;
  if (!secret || secret.length < 32)
    throw new CommerceError('Checkout is being configured. Please try again later.', 503);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString('hex');
  const identity = sessionKey(session);
  const signature = createHmac('sha256', secret)
    .update(['POST', route, identity, attempt, timestamp, nonce, token, body].join('\n'))
    .digest('hex');
  return {
    'X-LLD-Session': identity,
    'X-LLD-Attempt': attempt,
    'X-LLD-Timestamp': timestamp,
    'X-LLD-Nonce': nonce,
    'X-LLD-Signature': signature,
  };
}
export function storeRoot(env) {
  const value = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  if (!value) throw new CommerceError('The store is not configured.', 503);
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !/\/wp-json\/wc\/store\/v1\/?$/.test(url.pathname)
  )
    throw new CommerceError('The store is not configured correctly.', 503);
  url.search = '';
  url.hash = '';
  return url.href.replace(/\/$/, '');
}
export function createWoo(env, fetchImpl = fetch) {
  const store = storeRoot(env);
  async function request(url, init) {
    const response = await fetchImpl(url, {
      ...init,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(25000),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new CommerceError('The store is temporarily unavailable.', 502);
    }
    if (!response.ok) {
      const fields = response.status < 500 ? billingErrors(data) : {};
      if (Object.keys(fields).length)
        throw new CommerceError(billingErrorMessage(fields), response.status, fields);
      // Return Woo validation copy, never upstream debug data or response headers.
      const message =
        response.status < 500 && typeof data.message === 'string'
          ? data.message.replace(/<[^>]*>/g, '').slice(0, 400)
          : 'The store could not complete this request.';
      throw new CommerceError(message, response.status >= 500 ? 502 : response.status);
    }
    return { data, response };
  }
  return {
    async store(path, session, method = 'GET', body, attempt) {
      const { data, response } = await request(`${store}/${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(session.token ? { 'Cart-Token': session.token } : {}),
          ...(attempt
            ? signedHeaders(
                env,
                `/wc/store/v1/${path}`,
                session,
                attempt,
                JSON.stringify(body),
                session.token,
              )
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const token = response.headers.get('Cart-Token');
      if (token) session.token = token;
      return data;
    },
    async order(session, attempt, confirm) {
      const body = JSON.stringify({ confirm: confirm === true });
      const { data } = await request(`${store.replace('/wc/store/v1', '/lld-headless/v1')}/order`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          ...signedHeaders(env, '/lld-headless/v1/order', session, attempt, body),
        },
      });
      return data;
    },
    async config() {
      const { data } = await request(
        `${store.replace('/wc/store/v1', '/lld-headless/v1')}/config`,
        { headers: { Accept: 'application/json' } },
      );
      return data;
    },
  };
}
