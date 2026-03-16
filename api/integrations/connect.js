
import { requireAdmin } from '../../lib/security.js';
import { loadResource, saveResource } from '../../lib/store.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.valid) return res.status(401).json({ ok: false, error: 'unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const body = req.body || {};
  const current = await loadResource('integrations', {});
  const next = {
    ...current,
    [body.platform]: {
      ...(current[body.platform] || {}),
      connected: !!body.connected,
      accountLabel: body.accountLabel || '',
      pageId: body.pageId || '',
      channelId: body.channelId || '',
      profileId: body.profileId || '',
      updatedAt: new Date().toISOString(),
      notes: body.notes || '',
      hasToken: !!body.hasToken
    }
  };
  await saveResource('integrations', next);
  return res.status(200).json({ ok: true, platform: body.platform });
}
