import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import { emergencyByArticleSlug } from "../lib/emergency-content.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BASE = "https://www.ovalorcapital.com.br";

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios", investimentos:"investimentos",
  seguros:"seguros", mercados:"mercados", educacao:"educacao", industria:"industria",
  tecnologia:"tecnologia", esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias", internacional:"internacional",
  vc:"colunistas", colunistas:"colunistas", variedades:"variedades", investigativo:"investigativo",
  seguranca:"seguranca", cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao",
  radar:"radar", geral:"politica"
};

const SLUG_TO_CAT = {
  tributos:"tributacao", tributacao:"tributacao", politica:"politica", economia:"economia",
  negocios:"negocios", investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia", esportes:"esportes",
  saude:"saude", familia:"familia", internacional:"internacional", variedades:"variedades",
  parcerias:"parcerias", regulacao:"regulacao", vc:"colunistas", colunistas:"colunistas",
  investigativo:"investigativo", seguranca:"seguranca", cultura:"cultura", profissoes:"profissoes",
  vagas:"vagas", concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa",
  religiao:"religiao", radar:"radar"
};

const CAT_LABEL = {
  politica:"Politica", economia:"Economia", negocios:"Negocios", investimentos:"Investimentos",
  mercados:"Mercados", tributacao:"Tributacao", regulacao:"Regulacao", seguros:"Seguros",
  saude:"Saude", familia:"Familia", tecnologia:"Tecnologia", industria:"Industria",
  educacao:"Educacao", esportes:"Esportes", internacional:"Internacional", variedades:"Variedades",
  parcerias:"Parcerias", vc:"OVC", colunistas:"Colunistas", investigativo:"Investigativo",
  seguranca:"Seguranca Publica", cultura:"Cultura", profissoes:"Profissoes", vagas:"Vagas",
  concursos:"Concursos Publicos", imoveis:"Imoveis", esg:"ESG", defesa:"Defesa", religiao:"Fe & Espiritualidade",
  radar:"Radar"
};

const templateCache = {};

function getTemplate(catPath) {
  if (templateCache[catPath]) return templateCache[catPath];
  for (const path of [catPath, "politica"]) {
    try {
      const html = readFileSync(join(process.cwd(), "public", path, "index.html"), "utf8");
      templateCache[catPath] = html;
      return html;
    } catch (_) {}
  }
  return null;
}

function esc(value) {
  return String(value || "").replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 55);
}

function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function idRange(id8) {
  return { lo: id8 + "-0000-0000-0000-000000000000", hi: id8 + "-ffff-ffff-ffff-ffffffffffff" };
}

async function findByPrefix(id8) {
  const { lo, hi } = idRange(id8);
  const { data, error } = await supabase.from("posts")
    .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,published_at,created_at,updated_at,metrics")
    .eq("status", "publicado")
    .gte("id", lo)
    .lte("id", hi)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export default async function handler(req, res) {
  const { cat, slug } = req.query;
  const idMatch = String(slug || "").match(/-([a-f0-9]{8})$/i);
  if (!idMatch) return res.status(400).send("invalid slug");

  const id8 = idMatch[1].toLowerCase();
  const catKey = SLUG_TO_CAT[cat] || cat || "politica";
  const catPath = CAT_PATH[catKey] || "politica";

  let article = null;
  try { article = await findByPrefix(id8); } catch (_) { article = null; }
  if (!article) article = emergencyByArticleSlug(slug, catKey);
  if (!article) return res.status(404).send("not found");

  let tags = [];
  try { tags = typeof article.user_tags === "string" ? JSON.parse(article.user_tags) : (article.user_tags || []); } catch (_) {}

  const titulo = String(article.titulo || "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
  let metrics = {};
  try { metrics = typeof article.metrics === "string" ? JSON.parse(article.metrics) : (article.metrics || {}); } catch (_) {}

  const artCat = tags[0] || catKey;
  const catLabel = CAT_LABEL[artCat] || CAT_LABEL[catKey] || "Noticias";
  const slugClean = slugify(titulo);
  const canonical = `${BASE}/${catPath}/${slugClean}-${id8}/`;
  const desc = String(article.comentario_fixado || String(article.conteudo || "").replace(/<[^>]+>/g, " ").slice(0, 220)).trim().slice(0, 200);
  const imagem = article.imagem || `${BASE}/assets/template-ovc.jpg`;
  const publishedAt = article.published_at || article.created_at || new Date().toISOString();
  const modifiedAt = article.updated_at || publishedAt;
  const titleTag = `${String(metrics.meta_title || titulo).replace(/\*\*/g, "").slice(0, 55).trim()} | O Valor Capital`;

  const preload = safeJson({
    id: article.id,
    titulo,
    subtitulo: article.comentario_fixado || "",
    resumo: desc,
    corpo: article.conteudo || "",
    imagem,
    categoria: artCat,
    subcategoria: article.subcategoria || "",
    tags,
    slug: slugClean,
    url: `/${catPath}/${slugClean}-${id8}/`,
    data: publishedAt
  });

  const jsonLd = safeJson({
    "@context":"https://schema.org",
    "@type":"NewsArticle",
    headline: titulo,
    description: desc,
    image: [imagem],
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: [{"@type":"Organization", name:"Redacao OVC", url:BASE}],
    publisher: {"@type":"Organization", name:"O Valor Capital", logo:{"@type":"ImageObject", url:`${BASE}/img/logo-ovc.webp`}},
    mainEntityOfPage: {"@type":"WebPage", "@id": canonical},
    articleSection: catLabel,
    inLanguage: "pt-BR",
    isAccessibleForFree: true
  });

  const emergencyFetchGuard = `<script>(function(){window.__OVC_SUPABASE_EMERGENCY__=true;var nativeFetch=window.fetch&&window.fetch.bind(window);if(!nativeFetch)return;window.fetch=function(input,init){try{var url=typeof input==='string'?input:(input&&input.url)||'';var u=new URL(url,location.origin);if(u.pathname==='/api/manage')return Promise.resolve(new Response(JSON.stringify({ok:true,youtube_live_url:null,degraded:true}),{status:200,headers:{'Content-Type':'application/json'}}));if(u.pathname==='/api/portal-posts'&&!u.searchParams.has('id')&&!u.searchParams.has('format')&&!u.searchParams.has('action'))return Promise.resolve(new Response(JSON.stringify({posts:[],total:0,degraded:true}),{status:200,headers:{'Content-Type':'application/json'}}));}catch(e){}return nativeFetch(input,init);};})();</script>`;

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
    `<meta name="twitter:title" content="${esc(titulo)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(imagem)}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script>window.__OVC_ARTICLE__=${preload};window.SUPABASE_ANON_KEY="";</script>`,
    emergencyFetchGuard,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`
  ].join("\n");

  const tpl = getTemplate(catPath);
  if (!tpl) return res.status(500).send("template not found");

  let html = tpl.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");
  html = html.replace(/<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^>]*><\/script>/ig, "");
  html = html.replace(/<script\s+src="\/js\/auth\.js"[^>]*><\/script>/ig, "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (article._emergency) res.setHeader("X-OVC-Emergency-Fallback", "static");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
