import { getFileFromGithub, saveFileToGithub } from '../../lib/github.js';

export default async function handler(req, res) {
  try {
    const queueFile = await getFileFromGithub('data/instagram_queue.json');
    const queue = queueFile?.content || [];

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const postsToday = queue.filter(p => p.posted_at?.startsWith(today));

    if (postsToday.length >= 10) {
      return res.status(200).json({ 
        message: 'Daily limit reached', 
        posted_today: postsToday.length 
      });
    }

    const pending = queue.filter(p => !p.posted_at);
    if (pending.length === 0) {
      return res.status(200).json({ message: 'No posts in queue' });
    }

    const toPost = pending[0];
    
    // Aqui entraria a lógica de postar no Instagram
    // Por segurança, apenas marca como "agendado"
    toPost.posted_at = now.toISOString();

    await saveFileToGithub('data/instagram_queue.json', queue, 'Process Instagram queue');

    res.status(200).json({ 
      success: true, 
      posted: toPost,
      remaining: pending.length - 1
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
