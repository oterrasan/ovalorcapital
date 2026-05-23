const BASE = "https://www.ovalorcapital.com.br";
const LOGO = `${BASE}/images/logo-ovc.png`;
const OG_DEFAULT = `${BASE}/images/og-default.jpg`;
const SITE = "O Valor Capital";

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const EMAIL_REAL    = "ovalorcapital@gmail.com";
const EMAIL_DISPLAY = "contato@ovalorcapital.com.br";

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
  <li><strong>Contato de Redação:</strong> <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a></li>
</ul>
<h2>Canais de Atendimento e Ouvidoria</h2>
<ul>
  <li><strong>E-mail de Contato Geral:</strong> <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a></li>
  <li><strong>Redação e Pauta:</strong> <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a></li>
  <li><strong>Ouvidoria e Retificações:</strong> <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a></li>
  <li><strong>Endereço de Correspondência:</strong> Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000</li>
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
<p>A presente Política Editorial estabelece as diretrizes de conduta, ética e responsabilidade técnica que regem a produção de conteúdo do portal <strong>O Valor Capital (OVC)</strong>.</p>
<h2>1. Precisão e Verificação de Fatos</h2>
<p>Todo o conteúdo reproduzido ou agregado pelo portal O Valor Capital passa por um processo rigoroso de triagem baseado em <strong>fontes oficiais</strong>, agências de notícias de credibilidade e documentos públicos.</p>
<h2>2. Política de Correções e Retificações</h2>
<p>Pedidos de retificação: <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a></p>
<h2>3. Uso de Inteligência Artificial</h2>
<p>O Valor Capital utiliza sistemas de <strong>Inteligência Artificial</strong> (modelos de linguagem da OpenAI) para otimizar o fluxo de publicação. O portal assume total responsabilidade editorial por todo o conteúdo final publicado.</p>
<h2>4. Responsável Editorial</h2>
<p><strong>Roberto Cesar Terrasan</strong> — Fundador, Diretor Editorial e Editor-Chefe.<br>
Contato: <a href="mailto:${EMAIL_REAL}">${EMAIL_DISPLAY}</a><br>
Endereço: Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000</p>
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
    "publisher": { "@type": "Organization", "name": SITE, "logo": { "@type": "ImageObject", "url": LOGO } },
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
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`,
  ].join("\n");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${seoTags}<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:860px;margin:0 auto;padding:24px 16px 64px;color:#1a1a1a;line-height:1.7}h1{font-size:1.8rem;font-weight:700;color:#111}h2{font-size:1.2rem;font-weight:600;margin-top:36px;border-left:4px solid #c8102e;padding-left:12px}a{color:#c8102e}</style></head><body><a href="/"><img src="/images/logo-ovc.png" alt="O Valor Capital" style="height:36px;margin-bottom:32px;display:block"></a>${page.html}</body></html>`;
}

export default async function handler(req, res) {
  const pageKey = (req.query.page || req.url || "").includes("politica-editorial") ? "politica-editorial" : "quem-somos";
  const page = PAGES[pageKey];
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).send(buildHtml(page));
}