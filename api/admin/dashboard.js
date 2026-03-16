
import { requireAdmin } from '../../lib/security.js';
import { loadMany, storageMode } from '../../lib/store.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.valid) return res.status(401).json({ ok: false, error: 'unauthorized' });
  const data = await loadMany(['articles', 'banners', 'site-settings', 'newsletter', 'alerts', 'reminders', 'campaigns', 'integrations', 'social-posts', 'live-config']);
  const stats = {
    articles: data['articles']?.length || 0,
    banners: data['banners']?.filter(item => item.active).length || 0,
    leads: data['newsletter']?.length || 0,
    alerts: data['alerts']?.length || 0,
    reminders: data['reminders']?.length || 0,
    campaigns: data['campaigns']?.length || 0,
    scheduledPosts: data['social-posts']?.filter(item => item.status === 'scheduled').length || 0,
    liveChannels: data['live-config']?.tv?.length || 0
  };
  return res.status(200).json({ ok: true, role: auth.role, storage: storageMode(), stats, data });
}
