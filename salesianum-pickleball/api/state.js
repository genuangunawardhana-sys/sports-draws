import { redis, readAll, getVersion, BUILD } from '../lib/store.js';

// Public: anyone can read scores, courts and brackets.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  if (!redis) {
    return res.status(500).json({ error: 'Storage isn’t connected. Add Upstash Redis to this Vercel project and redeploy.' });
  }
  try {
    const v = req.query?.v;
    if (v !== undefined) {
      const current = await getVersion();
      if (Number(v) === current) return res.status(200).json({ unchanged: true, ver: current, build: BUILD });
    }
    return res.status(200).json(await readAll());
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Couldn’t read tournament data.' });
  }
}
