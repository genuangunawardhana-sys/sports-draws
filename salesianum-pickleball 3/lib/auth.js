import crypto from 'node:crypto';

// Tokens are signed with ADMIN_SECRET if set, otherwise with a value derived from
// ADMIN_PASSWORD, so changing the password signs every admin out.
const secret = () => process.env.ADMIN_SECRET || `pb-${process.env.ADMIN_PASSWORD || ''}`;
const sign = (s) => crypto.createHmac('sha256', secret()).update(s).digest('base64url');

export function issueToken(hours = 12) {
  const exp = Date.now() + hours * 3600 * 1000;
  const body = `admin.${exp}`;
  return { token: `${body}.${sign(body)}`, exp };
}

export function isAdminRequest(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const i = t.lastIndexOf('.');
  if (i < 0) return false;
  const body = t.slice(0, i);
  const sig = t.slice(i + 1);
  const exp = Number(body.split('.')[1]);
  if (!exp || exp < Date.now()) return false;
  const good = sign(body);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export function passwordMatches(input) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real) return false;
  const a = crypto.createHash('sha256').update(String(input ?? '')).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}
