import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { CommerceError } from './http.js';
const cookieName = 'lld_commerce';
const lifetime = 2 * 24 * 60 * 60;
function key(env) {
  if (!env.COMMERCE_SESSION_SECRET || env.COMMERCE_SESSION_SECRET.length < 32)
    throw new CommerceError('Checkout is being configured. Please try again later.', 503);
  return createHash('sha256').update(env.COMMERCE_SESSION_SECRET).digest();
}
export function seal(value, env) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(env), iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), content]).toString('base64url');
}
export function unseal(value, env) {
  try {
    const bytes = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', key(env), bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString(),
    );
  } catch {
    return null;
  }
}
export function readSession(req, env) {
  key(env);
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${cookieName}=`));
  const state = cookie ? unseal(cookie.slice(cookieName.length + 1), env) : null;
  const store = env.VITE_WOOCOMMERCE_STORE_API_URL?.trim();
  if (state?.store === store && state.expires > Date.now() && typeof state.id === 'string')
    return state;
  return { id: randomUUID(), store, expires: Date.now() + lifetime * 1000 };
}
export function writeSession(res, state, env) {
  const secure = env.NODE_ENV === 'production' || env.VERCEL ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${seal(state, env)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${lifetime}${secure}`,
  );
}
export const sessionKey = (session) =>
  createHash('sha256')
    .update(session.store + ':' + session.id)
    .digest('hex');
