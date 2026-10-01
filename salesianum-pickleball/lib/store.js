import { Redis } from '@upstash/redis';

// Collections the app stores. Each one is a Redis hash: field = document id, value = JSON.
export const COLS = ['teams', 'groups', 'matches', 'pmatches', 'playoff'];

// Works with either naming scheme the Vercel / Upstash integration may inject.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const redis = url && token
  ? new Redis({ url, token, automaticDeserialization: false })
  : null;

// Change STORE_PREFIX to run a second tournament on the same database.
const PREFIX = process.env.STORE_PREFIX || 'pb';
export const key = (name) => `${PREFIX}:${name}`;

const parse = (v) => {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
};

export async function getVersion() {
  return Number((await redis.get(key('ver'))) || 0);
}

export async function readAll() {
  const p = redis.pipeline();
  COLS.forEach((c) => p.hgetall(key(c)));
  p.get(key('meta'));
  p.get(key('ver'));
  const r = await p.exec();

  const out = {};
  COLS.forEach((c, i) => {
    const docs = {};
    for (const [id, raw] of Object.entries(r[i] || {})) {
      const v = parse(raw);
      if (v) docs[id] = v;
    }
    out[c] = docs;
  });
  out.meta = parse(r[COLS.length]) || {};
  out.ver = Number(r[COLS.length + 1] || 0);
  return out;
}

// Applies a batch of writes atomically and bumps the version so clients refresh.
export async function applyOps(ops) {
  const m = redis.multi();
  for (const o of ops) {
    if (o.col === 'meta') {
      if (o.del) m.del(key('meta'));
      else m.set(key('meta'), JSON.stringify(o.data));
    } else if (o.del) {
      m.hdel(key(o.col), o.id);
    } else {
      m.hset(key(o.col), { [o.id]: JSON.stringify(o.data) });
    }
  }
  m.incr(key('ver'));
  const r = await m.exec();
  return Number(r[r.length - 1]);
}
