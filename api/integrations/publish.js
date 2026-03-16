
import { requireAdmin } from '../../lib/security.js';
import { loadResource, saveResource } from '../../lib/store.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req);
  if (!auth.valid) return res.status(401).json({ ok: false, error: 'unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const body = req.body || {};
  const queue = await loadResource('social-posts', []);
  const item = {
    id: body.id || `post_${Date.now()}`,
    title: body.title || '',
    caption: body.caption || '',
    platform: body.platform || 'instagram',
    format: body.format || 'feed',
    mediaUrl: body.mediaUrl || '',
    mediaData: body.mediaData || '',
    sourceType: body.sourceType || 'link',
    sourceLink: body.sourceLink || '',
    publishAt: body.publishAt || new Date().toISOString(),
    articleSlug: body.articleSlug || '',
    status: body.publishNow && auth.role === 'master' ? 'published' : 'scheduled',
    createdAt: new Date().toISOString(),
    publishedAt: body.publishNow && auth.role === 'master' ? new Date().toISOString() : null,
    createdBy: auth.role
  };
  queue.unshift(item);
  await saveResource('social-posts', queue);
  return res.status(200).json({ ok: true, item, note: item.status === 'published' ? 'publicado_ou_registrado' : 'agendado' });
}
