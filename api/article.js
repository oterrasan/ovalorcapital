import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const BASE = "https://www.ovalorcapital.com.br";

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias",
  vc:"vc", colunistas:"vc", internacional:"internacional", variedades:"variedades",
  investigativo:"investigativo", seguranca:"seguranca",
  cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao",
  geral:"politica"
};

const SLUG_TO_CAT = {
  tributos:"tributacao", tributacao:"tributacao",
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  internacional:"internacional", variedades:"variedades",
  parcerias:"parcerias", regulacao:"regulacao", vc:"vc", colunistas:"vc",
  investigativo:"investigativo", seguranca:"seguranca",
  cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao"
};

const CAT_LABEL = {
  politica:"Política", economia:"Economia", negocios:"Negócios",
  investimentos:"Investimentos", mercados:"Mercados", tributacao:"Tributação",
  regulacao:"Regulação", seguros:"Seguros", saude:"Saúde", familia:"Família",
  tecnologia:"Tecnologia", industria:"Indústria", educacao:"Educação",
  esportes:"Esportes", internacional:"Internacional", variedades:"Variedades",
  parcerias:"Parcerias", vc:"OVC", colunistas:"Colunistas",
  investigativo:"Investigativo", seguranca:"Segurança Pública",
  cultura:"Cultura", profissoes:"Profissões", vagas:"Vagas",
  concursos:"Concursos Públicos", imoveis:"Imóveis", esg:"ESG",
  defesa:"Defesa", religiao:"Fé & Espiritualidade"
};

const _tpl = {};

function getTemplate(catPath) {
  if (_tpl[catPath]) return _tpl[catPath];
  try {
    const p = join(process.cwd(), "public", catPath, "index.html");
    _tpl[catPath] = readFileSync(p, "utf8");
    return _tpl[catPath];
  } catch(_) {
    try {
      const p = join(process.cwd(), "public", "politica", "index.html");
      _tpl[catPath] = readFileSync(p, "utf8");
      return _tpl[catPath];
    } catch(__) { return null; }
  }
}

function esc(s) {
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function slugify(str) {
  return (str||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,55);
}

function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

async function queryArticle(id8, withMetrics) {
  const cols = withMetrics
    ? "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,published_at,created_at,updated_at,metrics"
    : "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,published_at,created_at,updated_at";
  const { data: rows, error } = await supabase.from("posts")
    .select(cols)
    .eq("status","publicado")
    .filter("id::text", "ilike", `${id8}%`)
    .limit(1);
  return { row: rows?.[0] || null, error };
}

export default async function handler(req, res) {
  const { cat, slug } = req.query;
  if (!slug) return res.status(400).send("bad request");

  const idMatch = (slug||"").match(/-([a-f0-9]{8})$/i);
  if (!idMatch) return res.status(400).send("invalid slug");
  const id8 = idMatch[1].toLowerCase();

  const catKey = SLUG_TO_CAT[cat] || cat || "politica";
  const catPath = CAT_PATH[catKey] || "politica";

  let article = null;
  try {
    // Try with metrics column first
    let { row, error } = await queryArticle(id8, true);
    if (error) {
      // metrics column may not exist — retry without it
      const result2 = await queryArticle(id8, false);
      if (result2.error) return res.status(500).send("db error");
      row = result2.row;
    }
    article = row;
  } catch(e) {
    return res.status(500).send("db error");
  }

  if (!article) return res.status(404).send("not found");

  const titulo = article.titulo || "";

  // meta_title: campo SEO dedicado (max 55 chars) salvo em metrics; fallback: titulo truncado
  let metricsJson = {};
  try { metricsJson = typeof article.metrics === "string" ? JSON.parse(article.metrics) : (article.metrics || {}); } catch(_) {}
  const metaTitleRaw = (metricsJson.meta_title || titulo).slice(0, 55).trim();
  const titleTag = `${metaTitleRaw} | O Valor Capital`;

  const rawDesc = (article.comentario_fixado || (article.conteudo||"").slice(0,220).replace(/\n/g," ")).slice(0,200);
  const desc = rawDesc.trim();
  const imagem = article.imagem || `${BASE}/images/og-default.jpg`;
  const slug_clean = slugify(titulo);
  const canonical = `${BASE}/${catPath}/${slug_clean}-${id8}/`;
  const publishedAt = article.published_at || article.created_at || new Date().toISOString();
  const modifiedAt = article.updated_at || publishedAt;

  let tags = [];
  try { tags = typeof article.user_tags === "string" ? JSON.parse(article.user_tags) : (article.user_tags||[]); } catch(_) {}
  const artCat = tags[0] || catKey;
  const catLabel = CAT_LABEL[artCat] || CAT_LABEL[catKey] || "Notícias";

  const tpl = getTemplate(catPath);
  if (!tpl) return res.status(500).send("template not found");

  const jsonLd = safeJsonForScript({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": titulo,
    "description": desc,
    "image": [imagem],
    "datePublished": publishedAt,
    "dateModified": modifiedAt,
    "author": [{"@type":"Organization","name":"Redação OVC","url":BASE}],
    "publisher": {
      "@type": "Organization",
      "name": "O Valor Capital",
      "logo": {"@type":"ImageObject","url":`${BASE}/images/logo-ovc.png`}
    },
    "mainEntityOfPage": {"@type":"WebPage","@id": canonical},
    "articleSection": catLabel,
    "inLanguage": "pt-BR",
    "isAccessibleForFree": true
  });

  const preload = safeJsonForScript({
    id: article.id,
    titulo,
    subtitulo: article.comentario_fixado||"",
    resumo: desc,
    corpo: article.conteudo||"",
    imagem,
    categoria: artCat,
    subcategoria: article.subcategoria||"",
    tags,
    slug: slug_clean,
    url: `/${catPath}/${slug_clean}-${id8}/`,
    data: publishedAt
  });

  const seoTags = [
    `<title>${esc(titleTag)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="O Valor Capital">`,
    `<meta property="og:title" content="${esc(titulo)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${esc(imagem)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(titulo)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(imagem)}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script>window.__OVC_ARTICLE__=${preload};</script>`
  ].join("\n");

  let html = tpl.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");

  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=60");
  return res.status(200).send(html);
}
