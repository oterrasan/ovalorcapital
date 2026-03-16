
import { loadMany, loadResource } from '../../lib/store.js';

function computeRelativeDate(dateValue) {
  const date = new Date(dateValue);
  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} horas atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dias atrás`;
}

function decorateArticles(items = []) {
  return items.map(item => ({
    ...item,
    url: item.url || `/materia/?slug=${encodeURIComponent(item.slug)}`,
    relativeDate: item.relativeDate || computeRelativeDate(item.publishedAt || new Date().toISOString()),
    audioEnabled: item.audioEnabled !== false
  }));
}

export default async function handler(req, res) {
  const resources = String(req.query.resources || 'articles,banners,site-settings,live-config,social-templates').split(',').map(item => item.trim()).filter(Boolean);
  const base = await loadMany(resources);
  if (base.articles) base.articles = decorateArticles(base.articles);
  const slug = req.query.slug;
  if (slug) {
    const articles = base.articles || await loadResource('articles', []);
    base.article = decorateArticles(articles).find(item => item.slug === slug) || null;
  }
  return res.status(200).json({ ok: true, ...base });
}
