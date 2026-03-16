
import { requireAdmin } from '../../lib/security.js';
import { loadResource, saveResource, storageMode } from '../../lib/store.js';

const allowed = new Set(['articles', 'banners', 'site-settings', 'newsletter', 'alerts', 'reminders', 'campaigns', 'integrations', 'social-posts', 'live-config', 'social-templates']);

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.valid) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const resource = req.query.resource || req.body?.resource;
  if (!allowed.has(resource)) return res.status(400).json({ ok: false, error: 'invalid_resource' });
  if (req.method === 'GET') {
    const fallback = Array.from(['articles','banners','newsletter','alerts','reminders','campaigns','social-posts','social-templates']).includes(resource) ? [] : {};
    const item = await loadResource(resource, fallback);
    return res.status(200).json({ ok: true, resource, item, storage: storageMode() });
  }
  if (req.method === 'POST') {
    const payload = req.body?.item;
    if (payload === undefined) return res.status(400).json({ ok: false, error: 'missing_item' });
    const result = await saveResource(resource, payload);
    return res.status(200).json({ ok: true, resource, storage: result.mode });
  }
  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
}
