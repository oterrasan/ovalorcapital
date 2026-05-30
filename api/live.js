import { readFileSync } from "fs";
import { join } from "path";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const PAGES = {
  radar: { title: "Radar OVC | Indicadores Econômicos em Tempo Real | O Valor Capital", desc: "Painel de indicadores econômicos e financeiros em tempo real: Ibovespa, dólar, Selic, inflação, desemprego e principais dados do Brasil.", canonical: "https://www.ovalorcapital.com.br/radar/", tplPath: "radar", schema: "WebPage" },
  "tv-ovc": { title: "TV OVC | Notícias ao Vivo | O Valor Capital", desc: "TV OVC: assista a notícias de política, economia e negócios ao vivo. O melhor do jornalismo brasileiro em tempo real.", canonical: "https://www.ovalorcapital.com.br/tv-ovc/", tplPath: "tv-ovc", schema: "WebPage" },
  "radio-ovc": { title: "Rádio OVC | Notícias em Áudio | O Valor Capital", desc: "Rádio OVC: ouça notícias de política, economia, negócios e mercados. Jornalismo em áudio para ouvir quando e onde quiser.", canonical: "https://www.ovalorcapital.com.br/radio-ovc/", tplPath: "radio-ovc", schema: "WebPage" },
  dados: { title: "Dados Econômicos | Cotações, Agenda e Indicadores | O Valor Capital", desc: "Central de dados econômicos: cotações ao vivo, agenda econômica, indicadores macroeconômicos e painel de mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/", tplPath: "dados", schema: "DataCatalog" },
  cotacoes: { title: "Cotações ao Vivo | Dólar, Ibovespa, Bitcoin Hoje | O Valor Capital", desc: "Cotações em tempo real: dólar hoje, euro, bitcoin, Ibovespa, S&P 500, Nasdaq, ouro, petróleo e todas as principais moedas e índices.", canonical: "https://www.ovalorcapital.com.br/dados/cotacoes/", tplPath: "dados/cotacoes", schema: "Dataset" },
  agenda: { title: "Agenda Econômica | Calendário de Indicadores e Eventos | O Valor Capital", desc: "Agenda econômica completa: COPOM, IPCA, PIB, payroll, Fed e todos os indicadores e eventos que movem os mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/agenda-economica/", tplPath: "dados/agenda-economica", schema: "Event" }
};

const _tpl = {};
function getTemplate(tplPath) {
  if (_tpl[tplPath]) return _tpl[tplPath];
  try { _tpl[tplPath] = readFileSync(join(process.cwd(), "public", tplPath, "index.html"), "utf8"); return _tpl[tplPath]; }
  catch (_) { return null; }
}
function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function ensurePortalRails(html, page) {
  if (page !== "tv-ovc" || html.includes("ovc-right-rail")) return html;
  return html.replace(
    '<main class="ovc-main"><section data-tv-page></section></main>',
    '<main class="ovc-main"><section class="ovc-grid"><div class="ovc-story-stack"><section data-tv-page></section></div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>'
  );
}

export default async function handler(req, res) {
  const page = (req.query.page || "").toLowerCase();
  const cfg = PAGES[page];
  if (!cfg) return res.status(404).send("Not found");
  const tpl = getTemplate(cfg.tplPath);
  if (!tpl) return res.status(500).send("Template error");
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": cfg.schema, "name": cfg.title, "description": cfg.desc, "url": cfg.canonical, "publisher": { "@type": "Organization", "name": SITE, "logo": { "@type": "ImageObject", "url": LOGO } }, "inLanguage": "pt-BR", "isAccessibleForFree": true });
  const seoTags = [
    `<title>${esc(cfg.title)}</title>`, `<meta name="description" content="${esc(cfg.desc)}">`, `<link rel="canonical" href="${cfg.canonical}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${SITE}">`, `<meta property="og:title" content="${esc(cfg.title)}">`, `<meta property="og:description" content="${esc(cfg.desc)}">`, `<meta property="og:image" content="${OG_DEFAULT}">`, `<meta property="og:url" content="${cfg.canonical}">`, `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:site" content="@ovalorcapital">`, `<meta name="twitter:title" content="${esc(cfg.title)}">`, `<meta name="twitter:description" content="${esc(cfg.desc)}">`, `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`, `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`
  ].join("\n");
  let html = ensurePortalRails(tpl, page);
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=300");
  return res.status(200).send(html);
}
