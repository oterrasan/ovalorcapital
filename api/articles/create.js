import { requireAdmin } from '../../lib/auth.js';
import { getFileFromGithub, saveFileToGithub, uploadImageToGithub } from '../../lib/github.js';
import { processImage } from '../../lib/images.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdmin(req, res)) return;

  try {
    const { titulo, categoria, subcategoria, resumo, conteudo, autor, imagem, publicar_instagram, legenda_instagram } = req.body;

    if (!titulo || !categoria || !conteudo || !imagem) {
      return res.status(400).json({ error: 'Campos obrigatórios: titulo, categoria, conteudo, imagem' });
    }

    const slug = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = Date.now().toString();

    // Processar imagens
    const images = await processImage(imagem);
    
    // Upload de todas as versões
    const imagePath = `public/images/articles/${id}-${slug}`;
    await uploadImageToGithub(`${imagePath}/destaque.jpg`, images.destaque, 'Upload image destaque');
    await uploadImageToGithub(`${imagePath}/card-lg.jpg`, images.cardLg, 'Upload image card-lg');
    await uploadImageToGithub(`${imagePath}/card-sm.jpg`, images.cardSm, 'Upload image card-sm');
    await uploadImageToGithub(`${imagePath}/insta.jpg`, images.insta, 'Upload image insta');

    // Criar artigo
    const article = {
      id,
      titulo,
      slug,
      categoria,
      subcategoria: subcategoria || '',
      resumo: resumo || conteudo.substring(0, 200),
      conteudo,
      imagem: `/images/articles/${id}-${slug}/destaque.jpg`,
      imagem_card_lg: `/images/articles/${id}-${slug}/card-lg.jpg`,
      imagem_card_sm: `/images/articles/${id}-${slug}/card-sm.jpg`,
      imagem_insta: `/images/articles/${id}-${slug}/insta.jpg`,
      autor: autor || 'Redação OVC',
      status: 'pendente',
      publicar_instagram: Boolean(publicar_instagram),
      legenda_instagram: legenda_instagram || '',
      created_at: new Date().toISOString()
    };

    // Salvar no GitHub
    const file = await getFileFromGithub('data/articles.json');
    const articles = file?.content || [];
    articles.push(article);
    await saveFileToGithub('data/articles.json', articles, `Create article: ${titulo}`);

    res.status(201).json({ success: true, article });
  } catch (error) {
    console.error('[API] Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
