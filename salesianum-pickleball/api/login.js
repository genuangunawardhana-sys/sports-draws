import { redis, key } from '../lib/store.js';
import { passwordMatches, issueToken, readBody } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD isn’t set on the server.' });
  }

  // Basic brute-force protection: 15 attempts per IP per 10 minutes.
  if (redis) {
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const k = key(`login:${ip}`);
    const n = Number(await redis.incr(k));
    if (n === 1) await redis.expire(k, 600);
    if (n > 15) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }

  const { password } = readBody(req);
  if (!passwordMatches(password)) return res.status(401).json({ error: 'Wrong password.' });
  return res.status(200).json(issueToken(12));
}
