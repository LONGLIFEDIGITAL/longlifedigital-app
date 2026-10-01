import { randomUUID } from 'node:crypto';
import { CommerceError, readBody, requireSameOrigin, send } from '../server/commerce/http.js';
import { signedHeaders, storeRoot } from '../server/commerce/woo.js';
import { clientKey } from '../server/account.js';

function field(body, name, label, max, required = true) {
  const value = body[name] ?? '';
  if (
    typeof value !== 'string' ||
    value.length > max ||
    value.includes('\0') ||
    /[\r\n]/.test(value)
  )
    throw new CommerceError(`Please check your ${label}.`);
  if (required && !value.trim()) throw new CommerceError(`Please enter your ${label}.`);
  return value.trim();
}

export function createInquiryHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    try {
      if (req.method !== 'POST') throw new CommerceError('Method not allowed.', 405);
      try {
        requireSameOrigin(req, env);
      } catch {
        throw new CommerceError(
          'This inquiry request is not allowed. Please reload the page.',
          403,
        );
      }
      const body = await readBody(req, 16384);
      if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new CommerceError('Invalid inquiry.');
      if (body.website) throw new CommerceError('Unable to submit this inquiry.', 400);
      if (!Number.isSafeInteger(body.serviceId) || body.serviceId < 1)
        throw new CommerceError('Please select a service.');
      if (
        typeof body.requestId !== 'string' ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
          body.requestId,
        )
      )
        throw new CommerceError('Please reload the form and try again.');
      const payload = {
        serviceId: body.serviceId,
        requestId: body.requestId,
        firstName: field(body, 'firstName', 'first name', 100),
        lastName: field(body, 'lastName', 'last name', 100),
        email: field(body, 'email', 'email address', 254).toLowerCase(),
        businessName: field(body, 'businessName', 'business name', 160, false),
        phone: field(body, 'phone', 'telephone number', 40),
        client: clientKey(req, env),
      };
      if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(payload.email))
        throw new CommerceError('Please enter a valid email address.');
      const digits = payload.phone.replace(/\D/g, '');
      if (!/^[+\d().\s-]+$/.test(payload.phone) || digits.length < 7 || digits.length > 20)
        throw new CommerceError(
          'Please enter a valid telephone number, including your country or area code.',
        );
      if (
        body.message != null &&
        (typeof body.message !== 'string' ||
          body.message.length > 3000 ||
          body.message.includes('\0'))
      )
        throw new CommerceError('Please keep your project description under 3,000 characters.');
      payload.message = body.message?.trim() || '';
      const store = storeRoot(env);
      const route = '/lld-headless/v1/inquiry';
      const encoded = JSON.stringify(payload);
      const response = await fetchImpl(
        `${store.replace('/wc/store/v1', '/lld-headless/v1')}/inquiry`,
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
          404: 'This service is currently unavailable. Please email info@longlifedigital.co.',
          409: 'Your inquiry is still being processed. Please wait a moment before trying again.',
          429: 'Too many inquiries. Please wait 15 minutes before trying again.',
        };
        throw new CommerceError(
          messages[response.status] ||
            'We couldn’t send your inquiry. Please try again or email info@longlifedigital.co.',
          [404, 409, 429].includes(response.status) ? response.status : 502,
        );
      }
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, error instanceof CommerceError ? error.status : 502, {
        error:
          error instanceof CommerceError
            ? error.message
            : 'We couldn’t confirm your inquiry. Please try again or email info@longlifedigital.co.',
      });
    }
  };
}
export default createInquiryHandler();
