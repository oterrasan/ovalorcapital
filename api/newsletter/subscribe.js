
import { loadResource, saveResource } from '../../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ ok: false, error: 'invalid_email' });
  const topics = Array.isArray(body.topics) ? body.topics : [];
  const list = await loadResource('newsletter', []);
  const exists = list.find(item => item.email === email);
  if (exists) return res.status(200).json({ ok: true, duplicate: true });
  list.unshift({ email, topics, createdAt: new Date().toISOString(), source: body.source || 'site' });
  await saveResource('newsletter', list);
  return res.status(200).json({ ok: true });
}
