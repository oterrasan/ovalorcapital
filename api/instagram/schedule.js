import { getFileFromGithub } from '../../lib/github.js';

export default async function handler(req, res) {
  try {
    const file = await getFileFromGithub('data/instagram_queue.json');
    const queue = file?.content || [];

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const postsToday = queue.filter(p => p.scheduled_at?.startsWith(today));

    res.status(200).json({ 
      queue_total: queue.length,
      posts_today: postsToday.length,
      remaining_today: Math.max(0, 10 - postsToday.length),
      next_posts: queue.slice(0, 5)
    });
  } catch (error) {
    console.error('[INSTAGRAM] Error checking schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
