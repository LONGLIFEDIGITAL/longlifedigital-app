import { storeRoot } from '../server/commerce/woo.js';
import { CommerceError, readBody, requireSameOrigin, send } from '../server/commerce/http.js';
import {
  accountBridge,
  clientKey,
  publicCustomer,
  readAccount,
  writeAccount,
} from '../server/account.js';

function text(value, max = 254) {
  if (typeof value !== 'string' || value.length > max)
    throw new CommerceError('Please check your account details.');
  return value.trim();
}
export function createAccountHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const action = url.searchParams.get('action') || 'session';
      if (
        ![
          'session',
          'orders',
          'downloads',
          'login',
          'register',
          'forgot',
          'reset',
          'logout',
        ].includes(action)
      )
        throw new CommerceError('Unknown account operation.', 404);
      if (req.method !== (['session', 'orders', 'downloads'].includes(action) ? 'GET' : 'POST'))
        throw new CommerceError('Method not allowed.', 405);
      if (req.method === 'POST') requireSameOrigin(req, env);
      const account = readAccount(req, env);
      if (action === 'session' && !account) return send(res, 200, { user: null });
      const payload = {};
      if (['session', 'orders', 'downloads', 'logout'].includes(action)) {
        if (!account) {
          if (action === 'logout') {
            writeAccount(res, null, env);
            return send(res, 200, { user: null });
          }
          throw new CommerceError('Please log in to view your account.', 401);
        }
        payload.token = account.token;
        if (action === 'orders') {
          payload.page = Number(url.searchParams.get('page') || 1);
          if (!Number.isSafeInteger(payload.page) || payload.page < 1 || payload.page > 1000)
            throw new CommerceError('Invalid page.');
        }
      } else {
        const body = await readBody(req, 4096);
        if (!body || typeof body !== 'object' || Array.isArray(body))
          throw new CommerceError('Invalid request.');
        payload.client = clientKey(req, env);
        if (['register', 'login', 'forgot'].includes(action)) {
          payload.email = text(body.email).toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
            throw new CommerceError('Please enter a valid email address.');
        }
        if (['login', 'reset'].includes(action)) {
          if (
            typeof body.password !== 'string' ||
            body.password.length < (action === 'reset' ? 12 : 1) ||
            body.password.length > 128
          )
            throw new CommerceError(
              action === 'reset'
                ? 'Use a password with 12–128 characters.'
                : 'Please enter your password.',
            );
          payload.password = body.password;
        }
        if (action === 'register') {
          payload.name = text(body.name, 100);
          if (!payload.name) throw new CommerceError('Please enter your name.');
        }
        if (['register', 'forgot'].includes(action))
          payload.resetUrl = `${req.headers.origin}/reset-password`;
        if (action === 'reset') {
          payload.key = text(body.key, 128);
          payload.login = text(body.login, 254);
          if (!payload.key || !payload.login)
            throw new CommerceError('This reset link is invalid or expired. Request a new link.');
        }
      }
      let data;
      try {
        data = await accountBridge(action, payload, env, fetchImpl);
      } catch (error) {
        if (error.status === 401 && ['session', 'orders', 'downloads', 'logout'].includes(action)) {
          writeAccount(res, null, env);
          if (['session', 'logout'].includes(action)) return send(res, 200, { user: null });
        }
        // Logout still clears the browser session when WordPress cannot be reached.
        if (action === 'logout') writeAccount(res, null, env);
        throw error;
      }
      if (action === 'login') {
        const user = publicCustomer(data.user);
        if (
          typeof data.token !== 'string' ||
          !data.token ||
          data.token.length > 2048 ||
          !Number.isFinite(data.expires) ||
          data.expires <= Date.now() ||
          data.expires > Date.now() + 8 * 86400000
        )
          throw new CommerceError('Invalid account session.', 502);
        writeAccount(res, { token: data.token, expires: data.expires }, env);
        return send(res, 200, { user });
      }
      if (action === 'session') return send(res, 200, { user: publicCustomer(data.user) });
      if (action === 'logout' || action === 'reset') {
        writeAccount(res, null, env);
        return send(res, 200, { user: null });
      }
      if (action === 'downloads') {
        const origin = new URL(storeRoot(env)).origin;
        const downloads = (Array.isArray(data.downloads) ? data.downloads : []).flatMap((file) => {
          try {
            const url = new URL(file.url);
            // Only WooCommerce's permission-checked download endpoint, never raw file paths.
            if (
              url.protocol !== 'https:' ||
              url.origin !== origin ||
              url.username ||
              url.password ||
              !url.searchParams.has('download_file')
            )
              return [];
            if (
              file.remaining !== '' &&
              (!Number.isSafeInteger(Number(file.remaining)) || Number(file.remaining) <= 0)
            )
              return [];
            if (
              file.expires &&
              (!Number.isFinite(Date.parse(file.expires)) || Date.parse(file.expires) < Date.now())
            )
              return [];
            return [
              {
                id: String(file.id),
                name: String(file.name),
                productName: String(file.productName),
                url: url.href,
                remaining: file.remaining === '' ? '' : Number(file.remaining),
                expires: file.expires || null,
              },
            ];
          } catch {
            return [];
          }
        });
        return send(res, 200, { downloads });
      }
      if (action === 'orders') {
        // Do not pass through payment tokens, addresses or arbitrary Woo metadata.
        const orders = Array.isArray(data.orders)
          ? data.orders.map((order) => ({
              number: String(order.number),
              date: order.date,
              status: String(order.status),
              total: String(order.total),
              currency: String(order.currency),
              items: (order.items || []).map((item) => ({
                name: String(item.name),
                quantity: Number(item.quantity),
              })),
            }))
          : [];
        return send(res, 200, {
          orders,
          hasMore: data.hasMore === true,
          ...(Number.isSafeInteger(data.totalOrders) && data.totalOrders >= 0
            ? { totalOrders: data.totalOrders }
            : {}),
        });
      }
      if (data?.ok !== true)
        throw new CommerceError('Unable to confirm your request. Please try again later.', 502);
      return send(res, 200, {
        message:
          'If this email can be used, you’ll receive a link to set your password shortly. Check your spam folder too.',
      });
    } catch (error) {
      return send(res, error.status || 502, {
        error:
          error instanceof CommerceError
            ? error.message
            : 'Accounts are temporarily unavailable. Please try again.',
      });
    }
  };
}
export default createAccountHandler();
