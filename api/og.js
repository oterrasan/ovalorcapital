import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const BOT_AGENTS = [
  'whatsapp', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'telegrambot', 'slackbot', 'discordbot', 'googlebot', 'bingbot',
  'applebot', 'embedly', 'quora', 'outbrain', 'pinterest'
];

function isBot(ua = '') {
  const lower = ua.toLowerCase();
  return BOT_AGENTS.some(b => lower.includes(b));
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || '';
  const slug = req.query.slug || '';

  // Se não for bot, redirecionar para a matéria normal
  if (!isBot(ua)) {
    return res.redirect(302, `/materia/${slug}`);
  }

  // Buscar post pelo slug no banco
  const { data: posts } = await supabase
    .from('posts')
    .select('titulo, resumo, imagem, categoria, subcategoria, published_at')
    .ilike('url', `%${slug}%`)
    .eq('status', 'publicado')
    .limit(1);

  const post = posts && posts[0];

  const titulo = post ? post.titulo : 'O Valor Capital';
  const descricao = post ? (post.resumo || post.titulo) : 'Portal de notícias sobre política, economia, negócios e finanças.';
  const imagem = post ? (post.imagem || 'https://www.ovalorcapital.com.br/assets/og-default.jpg') : 'https://www.ovalorcapital.com.br/assets/og-default.jpg';
  const url = `https://www.ovalorcapital.com.br/materia/${slug}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${titulo} | O Valor Capital</title>
  <meta name="description" content="${descricao}">
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="O Valor Capital">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descricao}">
  <meta property="og:image" content="${imagem}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="pt_BR">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ovalorcapital">
  <meta name="twitter:title" content="${titulo}">
  <meta name="twitter:description" content="${descricao}">
  <meta name="twitter:image" content="${imagem}">
  <!-- Redirect para a página real -->
  <meta http-equiv="refresh" content="0;url=${url}">
  <link rel="canonical" href="${url}">
</head>
<body>
  <p>Redirecionando para <a href="${url}">${titulo}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(html);
}
