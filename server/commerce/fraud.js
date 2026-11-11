import { isIP } from 'node:net';
import { CommerceError } from './http.js';

export function shopperContext(req, env) {
  // Only trust Vercel's overwritten header on Vercel, never arbitrary forwarded
  // headers or a client-provided address. Other hosts use the direct socket IP.
  const address =
    env.VERCEL === '1' ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  const ip = typeof address === 'string' ? address.trim() : '';
  const userAgent = req.headers['user-agent'];
  const identity = /(?:^|;\s*)wfp_id=([a-f0-9]{32})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  return {
    ...(isIP(ip) ? { ip } : {}),
    ...(typeof userAgent === 'string' &&
    userAgent.length <= 512 &&
    // eslint-disable-next-line no-control-regex -- reject header control characters.
    !/[\x00-\x1f\x7f]/.test(userAgent)
      ? { userAgent }
      : {}),
    ...(identity ? { identity } : {}),
  };
}

export function fraudExtension(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const sessionId = value.sessionId;
  if (typeof sessionId !== 'string' || sessionId.length > 1024 || /[^\x21-\x7e]/.test(sessionId))
    throw new CommerceError('Please reload checkout and try again.');
  const error = ['sdk_unavailable', 'sdk_error', 'timeout'].includes(value.error)
    ? value.error
    : 'sdk_error';
  return {
    'woocommerce/fraud-protection': {
      blackbox_session_id: sessionId,
      blackbox_session_id_error: sessionId ? '' : error,
    },
  };
}

export function fraudBootstrap(data, store) {
  if (data?.enabled === false) return { enabled: false };
  const urls = data?.scripts;
  const config = data?.config;
  if (
    data?.enabled === true &&
    Array.isArray(urls) &&
    urls.length === 2 &&
    urls.every((url) => typeof url === 'string') &&
    /^woo:[1-9][0-9]*$/.test(config?.apiKey || '') &&
    config?.identityCookie?.name === 'wfp_id'
  ) {
    try {
      const sdk = new URL(urls[0]);
      const init = new URL(urls[1]);
      if (
        sdk.href === 'https://blackbox-api.wp.com/v1/dist/v.js' &&
        init.origin === new URL(store).origin &&
        !init.username &&
        !init.password &&
        init.pathname.endsWith('/blackbox-init.js')
      ) {
        return {
          enabled: true,
          scripts: urls,
          config: {
            ...config,
            identityCookie: { ...config.identityCookie, path: '/', domain: '' },
          },
        };
      }
    } catch {
      /* Reject malformed script locations. */
    }
  }
  const error = new CommerceError('Checkout browser verification could not be configured.', 503);
  error.criticalType = 'fraud_configuration';
  throw error;
}
