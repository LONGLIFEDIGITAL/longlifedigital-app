export class CommerceError extends Error {
  constructor(message, status = 400, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}
export async function readBody(req, limit = 16384) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > limit) throw new CommerceError('Request too large.', 413);
    try {
      return JSON.parse(raw);
    } catch {
      throw new CommerceError('Invalid request.');
    }
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > limit) throw new CommerceError('Request too large.', 413);
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new CommerceError('Invalid request.');
  }
}
export function requireSameOrigin(req, env) {
  const origin = req.headers.origin;
  const allowed = (env.STOREFRONT_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || !allowed.includes(origin) || req.headers['x-lld-commerce'] !== '1')
    throw new CommerceError('This checkout request is not allowed.', 403);
}
export function positiveInteger(value) {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new CommerceError('Invalid product or quantity.');
  return value;
}
export function address(value, billingFields) {
  if (!value || typeof value !== 'object')
    throw new CommerceError('Please enter your billing address.');
  const result = {};
  for (const key of [
    'first_name',
    'last_name',
    'company',
    'address_1',
    'address_2',
    'city',
    'state',
    'postcode',
    'country',
    'email',
    'phone',
  ]) {
    if (value[key] !== undefined && (typeof value[key] !== 'string' || value[key].length > 200))
      throw new CommerceError('Please check your billing details.');
    result[key] = value[key]?.trim() || '';
  }
  if (!result.phone)
    throw new CommerceError('Phone: Enter a phone number.', 400, {
      phone: 'Enter a phone number.',
    });
  // Older bridge installations default to requiring a postal code until updated.
  // The current bridge publishes Woo's country-specific required/hidden settings.
  const postal = billingFields?.[result.country]?.postcode;
  if ((postal ? postal.required && !postal.hidden : true) && !result.postcode)
    throw new CommerceError('Postal code: Enter your postal code.', 400, {
      postcode: 'Enter your postal code.',
    });
  return result;
}
