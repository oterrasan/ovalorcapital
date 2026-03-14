import { requireAdmin } from '../../lib/auth.js';
import { getFileFromGithub, saveFileToGithub } from '../../lib/github.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const file = await getFileFromGithub('data/articles.json');
    const articles = file?.content || [];
    const article = articles.find(a => a.id === id);

    if (!article) return res.status(404).json({ error: 'Article not found' });

    article.status = 'publicado';
    article.published_at = new Date().toISOString();

    await saveFileToGithub('data/articles.json', articles, `Approve article: ${article.titulo}`);

    // Se marcado para Instagram, adicionar à fila
    if (article.publicar_instagram) {
      const queueFile = await getFileFromGithub('data/instagram_queue.json');
      const queue = queueFile?.content || [];
      queue.push({
        article_id: article.id,
        image: article.imagem_insta,
        caption: article.legenda_instagram || article.titulo,
        scheduled_at: new Date().toISOString()
      });
      await saveFileToGithub('data/instagram_queue.json', queue, 'Add to Instagram queue');
    }

    res.status(200).json({ success: true, article });
  } catch (error) {
    console.error('[API] Error approving article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
