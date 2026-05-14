const BASE = "https://www.ovalorcapital.com.br";
const LOGO = `${BASE}/images/logo-ovc.png`;
const OG_DEFAULT = `${BASE}/images/og-default.jpg`;
const SITE = "O Valor Capital";

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PAGES = {
  "quem-somos": {
    title: "Quem Somos e Expediente | O Valor Capital",
    metaTitle: "Quem Somos | O Valor Capital",
    desc: "Conheça o portal O Valor Capital: jornalismo independente de economia, política e mercado financeiro fundado por Roberto Cesar Terrasan.",
    canonical: `${BASE}/quem-somos/`,
    jsonLdType: "AboutPage",
    html: `
<h1>Quem Somos e Expediente — O Valor Capital</h1>

<p>O <strong>Valor Capital (OVC)</strong> é um portal independente de notícias e análises fundado em 2026, dedicado à cobertura diária de <strong>economia, política, mercado financeiro e negócios</strong> do Brasil.</p>

<p>Nosso compromisso é democratizar a informação econômica e política de forma ágil, utilizando tecnologia de ponta para otimizar o fluxo de dados, a leitura mobile e a acessibilidade do conteúdo jornalístico.</p>

<h2>Governança e Corpo Editorial</h2>

<p>O portal opera sob a modalidade de jornalismo independente e produção autônoma de conteúdo, centralizando sua gestão editorial em seu fundador:</p>

<ul>
  <li><strong>Diretor Editorial e Editor-Chefe:</strong> Roberto Cesar Terrasan — Responsável legal e pela curadoria do conteúdo e governança de dados do portal.</li>
  <li><strong>Contato de Redação:</strong> <a href="mailto:contato@ovalorcapital.com.br">contato@ovalorcapital.com.br</a></li>
</ul>

<h2>Canais de Atendimento e Ouvidoria</h2>

<p>Em conformidade com as diretrizes de transparência para veículos de comunicação digitais e motores de busca, disponibilizamos canais diretos de atendimento para leitores, notificações e retificações:</p>

<ul>
  <li><strong>E-mail de Contato Geral:</strong> <a href="mailto:contato@ovalorcapital.com.br">contato@ovalorcapital.com.br</a></li>
  <li><strong>Redação e Pauta:</strong> <a href="mailto:pauta@ovalorcapital.com.br">pauta@ovalorcapital.com.br</a></li>
  <li><strong>Ouvidoria e Retificações:</strong> <a href="mailto:juridico@ovalorcapital.com.br">juridico@ovalorcapital.com.br</a></li>
</ul>
`
  },

  "politica-editorial": {
    title: "Política Editorial e Uso de IA | O Valor Capital",
    metaTitle: "Política Editorial | O Valor Capital",
    desc: "Conheça os princípios editoriais do portal O Valor Capital: verificação de fatos, política de correções e uso ético de Inteligência Artificial.",
    canonical: `${BASE}/politica-editorial/`,
    jsonLdType: "WebPage",
    html: `
<h1>Política Editorial e Princípios Éticos — O Valor Capital</h1>

<p>A presente Política Editorial estabelece as diretrizes de conduta, ética e responsabilidade técnica que regem a produção de conteúdo do portal <strong>O Valor Capital (OVC)</strong>. Nosso objetivo é garantir a transparência da informação perante o público e os motores de busca.</p>

<h2>1. Precisão e Verificação de Fatos</h2>

<p>Todo o conteúdo reproduzido ou agregado pelo portal O Valor Capital passa por um processo rigoroso de triagem baseado em <strong>fontes oficiais</strong>, agências de notícias de credibilidade e documentos públicos. Não compactuamos com a disseminação de boatos, especulações de mercado não fundamentadas ou desinformação.</p>

<h2>2. Política de Correções e Retificações</h2>

<p>Reconhecemos que o jornalismo em tempo real está sujeito a atualizações constantes. Caso alguma matéria apresente erro factual, numérico ou de digitação, o portal se compromete a realizar a correção imediata no texto.</p>

<ul>
  <li>Sempre que uma matéria sofrer alteração substancial após a publicação, uma nota de rodapé será adicionada explicando o que foi corrigido.</li>
  <li>A tag <code>dateModified</code> do artigo será atualizada para refletir a data da correção.</li>
  <li>Pedidos de retificação podem ser enviados para: <a href="mailto:juridico@ovalorcapital.com.br">juridico@ovalorcapital.com.br</a></li>
</ul>

<h2>3. Uso de Inteligência Artificial</h2>

<p>O Valor Capital utiliza sistemas de <strong>Inteligência Artificial</strong> (modelos de linguagem da OpenAI) para otimizar o fluxo de publicação, a formatação de SEO, a acessibilidade textual e a rapidez das coberturas baseadas em feeds de notícias (RSS).</p>

<ul>
  <li>A tecnologia é utilizada como ferramenta de reestruturação técnica, estilística e de SEO On-Page.</li>
  <li>Todos os parâmetros algorítmicos são supervisionados para evitar distorções do fato original.</li>
  <li>O portal assume total responsabilidade editorial por todo o conteúdo final publicado, independentemente do nível de automação utilizado.</li>
</ul>

<h2>4. Responsável Editorial</h2>

<p><strong>Roberto Cesar Terrasan</strong> — Fundador, Diretor Editorial e Editor-Chefe do portal O Valor Capital. Responsável legal por todo o conteúdo publicado na plataforma.</p>

<p>Contato: <a href="mailto:contato@ovalorcapital.com.br">contato@ovalorcapital.com.br</a></p>
`
  }
};

function buildHtml(page) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": page.jsonLdType,
    "name": page.title,
    "description": page.desc,
    "url": page.canonical,
    "publisher": {
      "@type": "Organization",
      "name": SITE,
      "logo": { "@type": "ImageObject", "url": LOGO }
    },
    "inLanguage": "pt-BR"
  });

  const seoTags = [
    `<title>${esc(page.metaTitle)}</title>`,
    `<meta name="description" content="${esc(page.desc)}">`,
    `<link rel="canonical" href="${page.canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.desc)}">`,
    `<meta property="og:image" content="${OG_DEFAULT}">`,
    `<meta property="og:url" content="${page.canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.desc)}">`,
    `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoTags}
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; color: #1a1a1a; line-height: 1.7; background: #fff; }
  h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 8px; color: #111; }
  h2 { font-size: 1.2rem; font-weight: 600; margin-top: 36px; margin-bottom: 10px; color: #111; border-left: 4px solid #c8102e; padding-left: 12px; }
  p { margin: 0 0 16px; font-size: 1rem; }
  ul { margin: 0 0 20px; padding-left: 20px; }
  li { margin-bottom: 8px; }
  a { color: #c8102e; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  .logo { display: block; margin-bottom: 32px; }
  .logo img { height: 36px; }
  .breadcrumb { font-size: 0.85rem; color: #666; margin-bottom: 24px; }
  .breadcrumb a { color: #666; }
</style>
</head>
<body>
<a href="/" class="logo"><img src="/images/logo-ovc.png" alt="O Valor Capital"></a>
<div class="breadcrumb"><a href="/">Início</a> › ${esc(page.title.split("|")[0].trim())}</div>
${page.html}
</body>
</html>`;
}

export default async function handler(req, res) {
  const url = req.url || "";
  const pageKey = url.includes("politica-editorial") ? "politica-editorial" : "quem-somos";
  const page = PAGES[pageKey];

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).send(buildHtml(page));
}
