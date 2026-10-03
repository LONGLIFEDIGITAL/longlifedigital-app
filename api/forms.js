import { randomUUID } from 'node:crypto';
import { CommerceError, readBody, requireSameOrigin, send } from '../server/commerce/http.js';
import { signedHeaders, storeRoot } from '../server/commerce/woo.js';
import { clientKey } from '../server/account.js';

function text(body, name, max, required = true, multiline = false) {
  const value = body[name] ?? '';
  if (
    typeof value !== 'string' ||
    value.length > max ||
    value.includes('\0') ||
    (!multiline && /[\r\n]/.test(value)) ||
    (required && !value.trim())
  )
    throw new CommerceError(`Please check your ${name}.`);
  return value.trim();
}

export function createFormsHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    try {
      if (req.method !== 'POST') throw new CommerceError('Method not allowed.', 405);
      const action = new URL(req.url, 'http://localhost').searchParams.get('action');
      if (!['contact', 'newsletter'].includes(action))
        throw new CommerceError('Unknown form.', 404);
      try {
        requireSameOrigin(req, env);
      } catch {
        throw new CommerceError('This form request is not allowed. Please reload the page.', 403);
      }
      const body = await readBody(req, 16384);
      if (!body || typeof body !== 'object' || Array.isArray(body) || body.website)
        throw new CommerceError('Unable to submit this form.');
      if (
        typeof body.requestId !== 'string' ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
          body.requestId,
        )
      )
        throw new CommerceError('Please reload the form and try again.');
      const payload = {
        requestId: body.requestId,
        name: text(body, 'name', 100),
        email: text(body, 'email', action === 'newsletter' ? 150 : 254).toLowerCase(),
        client: clientKey(req, env),
      };
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(payload.email))
        throw new CommerceError('Please enter a valid email address.');
      if (action === 'contact') {
        payload.service = text(body, 'service', 200, false);
        payload.message = text(body, 'message', 5000, true, true);
      } else {
        if (body.consent !== true)
          throw new CommerceError('Please agree to receive the newsletter.');
        payload.consent = true;
      }
      const store = storeRoot(env);
      const route = `/lld-headless/v1/${action}`;
      const encoded = JSON.stringify(payload);
      const response = await fetchImpl(
        `${store.replace('/wc/store/v1', '/lld-headless/v1')}/${action}`,
        {
          method: 'POST',
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(20000),
          headers: {
            'Content-Type': 'application/json',
            ...signedHeaders(env, route, { id: randomUUID(), store }, randomUUID(), encoded),
          },
          body: encoded,
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true) {
        const messages = {
          409: 'Your request is still being processed. Please wait a moment before trying again.',
          429: 'Too many requests. Please wait 15 minutes before trying again.',
          503:
            action === 'newsletter'
              ? 'Newsletter signup is temporarily unavailable. Please try again later.'
              : 'Messages are temporarily unavailable. Please use the contact email listed on this page.',
        };
        throw new CommerceError(
          messages[response.status] || 'We couldn’t complete your request. Please try again later.',
          [409, 429, 503].includes(response.status) ? response.status : 502,
        );
      }
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, error instanceof CommerceError ? error.status : 502, {
        error:
          error instanceof CommerceError
            ? error.message
            : 'We couldn’t confirm your request. Please try again later.',
      });
    }
  };
}
export default createFormsHandler();
