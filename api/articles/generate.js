import { requireAdmin } from '../../lib/auth.js';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;

  try {
    const { tema, categoria } = req.body;
    if (!tema) return res.status(400).json({ error: 'Tema obrigatório' });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Escreva um artigo jornalístico profissional sobre: ${tema}

CATEGORIA: ${categoria || 'Geral'}

REQUISITOS:
- 1600-2200 palavras
- Tom profissional e imparcial
- Estrutura: introdução, desenvolvimento (3-4 seções), conclusão
- Use dados e estatísticas reais
- Inclua 3+ citações de especialistas
- HTML formatado com <p>, <h2>, <strong>, etc
- NÃO use Markdown

Retorne APENAS o HTML do conteúdo do artigo.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const conteudo = message.content[0].text;

    res.status(200).json({ 
      success: true, 
      conteudo,
      titulo: tema,
      resumo: conteudo.substring(0, 200).replace(/<[^>]*>/g, '')
    });
  } catch (error) {
    console.error('[API] Error generating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
