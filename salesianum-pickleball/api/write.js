import { redis, applyOps, COLS } from '../lib/store.js';
import { isAdminRequest, readBody } from '../lib/auth.js';

const ID = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const MAX_OPS = 200;
const MAX_DOC = 50_000;

// Admin only: every change to teams, groups, scores, brackets and settings.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!redis) return res.status(500).json({ error: 'Storage isn’t connected.' });
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Admin session expired.' });

  const { ops } = readBody(req);
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > MAX_OPS) {
    return res.status(400).json({ error: `send between 1 and ${MAX_OPS} changes` });
  }

  const clean = [];
  for (const o of ops) {
    const colOk = o && (o.col === 'meta' || COLS.includes(o.col));
    if (!colOk || !ID.test(String(o.id))) return res.status(400).json({ error: 'unknown record' });
    if (!o.del) {
      if (!o.data || typeof o.data !== 'object' || Array.isArray(o.data)) {
        return res.status(400).json({ error: 'record data must be an object' });
      }
      if (JSON.stringify(o.data).length > MAX_DOC) return res.status(413).json({ error: 'record is too large' });
    }
    clean.push({ col: o.col, id: String(o.id), del: !!o.del, data: o.data });
  }

  try {
    const ver = await applyOps(clean);
    return res.status(200).json({ ok: true, ver });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Couldn’t save the change.' });
  }
}
