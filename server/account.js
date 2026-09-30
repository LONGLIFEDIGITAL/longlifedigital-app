import { createHmac, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { seal, unseal } from './commerce/session.js';
import { CommerceError } from './commerce/http.js';
import { signedHeaders, storeRoot } from './commerce/woo.js';

const name = 'lld_account';
export function readAccount(req, env) {
  const value = (req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  const account = value ? unseal(value.slice(name.length + 1), env) : null;
  return account?.kind === 'account' &&
    account.store === storeRoot(env) &&
    account.expires > Date.now() &&
    typeof account.token === 'string'
    ? account
    : null;
}
export function writeAccount(res, account, env) {
  const secure = env.NODE_ENV === 'production' || env.VERCEL ? '; Secure' : '';
  const age = account ? Math.max(0, Math.floor((account.expires - Date.now()) / 1000)) : 0;
  res.setHeader(
    'Set-Cookie',
    `${name}=${account ? seal({ ...account, kind: 'account', store: storeRoot(env) }, env) : ''}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure}`,
  );
}
export function clientKey(req, env) {
  // Vercel overwrites this header; never trust arbitrary X-Forwarded-For values.
  const ip = env.VERCEL
    ? req.headers['x-vercel-forwarded-for']?.split(',')[0]?.trim()
    : req.socket?.remoteAddress;
  return createHmac('sha256', env.LLD_COMMERCE_BRIDGE_SECRET || 'unconfigured')
    .update(isIP(ip || '') ? ip : 'unknown-client')
    .digest('hex');
}
export async function accountBridge(action, payload, env, fetchImpl = fetch) {
  const store = storeRoot(env);
  const route = '/lld-headless/v1/account';
  const body = JSON.stringify({ ...payload, action });
  const response = await fetchImpl(`${store.replace('/wc/store/v1', '/lld-headless/v1')}/account`, {
    method: 'POST',
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
    headers: {
      'Content-Type': 'application/json',
      ...signedHeaders(env, route, { id: randomUUID(), store }, randomUUID(), body),
    },
    body,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new CommerceError('Accounts are temporarily unavailable. Please try again.', 502);
  }
  if (!response.ok) {
    const messages = {
      401: 'Your session has expired. Please log in again.',
      403: 'Account access is not available.',
      409: 'Unable to create this account. Try logging in or resetting your password.',
      429: 'Too many attempts. Please wait 15 minutes and try again.',
    };
    if (response.status === 404)
      throw new CommerceError(
        'Customer accounts are being configured. Please try again later.',
        503,
      );
    const message =
      action === 'login' && response.status === 401
        ? 'The email or password is incorrect.'
        : action === 'reset' && response.status === 400
          ? 'This reset link is invalid or expired. Request a new link.'
          : messages[response.status] || 'Unable to complete this request. Please try again later.';
    throw new CommerceError(message, response.status >= 500 ? 502 : response.status);
  }
  return data;
}
export function publicCustomer(value) {
  if (!value || !Number.isSafeInteger(value.id) || value.id <= 0 || typeof value.email !== 'string')
    throw new CommerceError('Invalid account response.', 502);
  return {
    id: value.id,
    email: value.email,
    name: typeof value.name === 'string' ? value.name : '',
  };
}
