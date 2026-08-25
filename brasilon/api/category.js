// Brasil ON — SSR de página de categoria (brasil-on ou futebol).
// Espelho simplificado de api/category.js do OVC: só SEO + template estático,
// a listagem real de posts é buscada client-side via portal-posts.js.
import { readFileSync } from "fs";
import { join } from "path";

const BASE = "https://www.obrasilon.com.br";
const OG_DEFAULT = `${BASE}/assets/og-default.jpg`;
const SITE = "Brasil ON";

const CAT_SEO = {
  "brasil-on": {
    title: "Brasil ON | Notícias do Brasil",
    desc: "Notícias do Brasil, em tempo real: cotidiano, cidades, segurança, política e o que está acontecendo agora — reportado rápido, direto ao ponto.",
    canonical: `${BASE}/brasil-on/`
  },
  futebol: {
    title: "Futebol | Brasil ON",
    desc: "Últimas do futebol brasileiro e internacional: campeonatos, transferências, resultados e bastidores, atualizado ao longo do dia.",
    canonical: `${BASE}/futebol/`
  }
};

const _tpl = {};
function getTemplate(cat) {
  if (_tpl[cat]) return _tpl[cat];
  try {
    _tpl[cat] = readFileSync(join(process.cwd(), "public", cat, "index.html"), "utf8");
    return _tpl[cat];
  } catch (_) {
    return null;
  }
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  const host = req.headers["host"] || "";
  if (host === "obrasilon.com.br") {
    res.setHeader("Location", `https://www.obrasilon.com.br${req.url}`);
    return res.status(301).end();
  }

  const cat = String(req.query.cat || "").toLowerCase();
  const seo = CAT_SEO[cat];
  if (!seo) return res.status(404).send("Not found");

  const tpl = getTemplate(cat);
  if (!tpl) return res.status(500).send("Template error");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    description: seo.desc,
    url: seo.canonical,
    publisher: { "@type": "Organization", name: SITE, logo: { "@type": "ImageObject", url: OG_DEFAULT } },
    inLanguage: "pt-BR",
    isAccessibleForFree: true
  });

  const seoTags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.desc)}">`,
    `<link rel="canonical" href="${seo.canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.desc)}">`,
    `<meta property="og:image" content="${OG_DEFAULT}">`,
    `<meta property="og:url" content="${seo.canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(seo.title)}">`,
    `<meta name="twitter:description" content="${esc(seo.desc)}">`,
    `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`
  ].join("\n");

  let html = tpl;
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).send(html);
}
