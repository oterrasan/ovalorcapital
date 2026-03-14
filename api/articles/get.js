import { getFileFromGithub } from '../../lib/github.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const file = await getFileFromGithub('data/articles.json');
    const articles = file?.content || [];
    const article = articles.find(a => a.id === id);

    if (!article) return res.status(404).json({ error: 'Article not found' });

    res.status(200).json({ article });
  } catch (error) {
    console.error('[API] Error getting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
