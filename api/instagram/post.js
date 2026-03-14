import { IgApiClient } from 'instagram-private-api';
import { requireAdmin } from '../../lib/auth.js';

const ig = new IgApiClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { imageBase64, caption } = req.body;
    if (!imageBase64 || !caption) {
      return res.status(400).json({ error: 'imageBase64 and caption required' });
    }

    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME || 'ovalorcapital');
    await ig.account.login(
      process.env.INSTAGRAM_USERNAME || 'ovalorcapital',
      process.env.INSTAGRAM_PASSWORD || '2025acabando!'
    );

    const imageBuffer = Buffer.from(imageBase64, 'base64');

    const publishResult = await ig.publish.photo({
      file: imageBuffer,
      caption
    });

    res.status(200).json({ 
      success: true, 
      media_id: publishResult.media.id 
    });
  } catch (error) {
    console.error('[INSTAGRAM] Error posting:', error);
    res.status(500).json({ error: 'Error posting to Instagram', details: error.message });
  }
}
