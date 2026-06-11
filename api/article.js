import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function writeLog(level, message) {
  try { await supabase.from('logs').insert({ level, message }); } catch(_) {}
}


const BASE = "https://www.ovalorcapital.com.br";
const OG_DEFAULT = `${BASE}/assets/og-default.jpg`;
const OLD_SUPABASE_REF = "bfsegqdgscudtdgwdyci";
const POST_COLUMNS = "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,created_at,published_at,updated_at,metrics";

const CAT_PATH = {
  politica: "politica", economia: "economia", negocios: "negocios",
  investimentos: "investimentos", seguros: "seguros", mercados: "mercados",
  educacao: "educacao", industria: "industria", tecnologia: "tecnologia",
  esportes: "esportes", saude: "saude", familia: "familia",
  tributacao: "tributos", tributos: "tributos", regulacao: "regulacao",
  parcerias: "parcerias", internacional: "internacional", variedades: "variedades",
  investigativo: "investigativo", seguranca: "seguranca", cultura: "cultura",
  profissoes: "profissoes", vagas: "vagas", concursos: "concursos",
  imoveis: "imoveis", esg: "esg", defesa: "defesa", religiao: "religiao",
  vc: "colunistas", colunistas: "colunistas", geral: "politica"
};

const SLUG_TO_CAT = {
  politica: "politica", economia: "economia", negocios: "negocios",
  investimentos: "investimentos", seguros: "seguros", mercados: "mercados",
  educacao: "educacao", industria: "industria", tecnologia: "tecnologia",
  esportes: "esportes", saude: "saude", familia: "familia",
  tributacao: "tributacao", tributos: "tributacao", regulacao: "regulacao",
  parcerias: "parcerias", internacional: "internacional", variedades: "variedades",
  investigativo: "investigativo", seguranca: "seguranca", cultura: "cultura",
  profissoes: "profissoes", vagas: "vagas", concursos: "concursos",
  imoveis: "imoveis", esg: "esg", defesa: "defesa", religiao: "religiao",
  vc: "colunistas", colunistas: "colunistas"
};

const CAT_LABEL = {
  politica: "Política", economia: "Economia", negocios: "Negócios",
  investimentos: "Investimentos", seguros: "Seguros", mercados: "Mercados",
  educacao: "Educação", industria: "Indústria", tecnologia: "Tecnologia",
  esportes: "Esportes", saude: "Saúde", familia: "Família",
  tributacao: "Tributação", regulacao: "Regulação", parcerias: "Parcerias",
  internacional: "Internacional", variedades: "Variedades", investigativo: "Investigativo",
  seguranca: "Segurança Pública", cultura: "Cultura", profissoes: "Profissões",
  vagas: "Vagas", concursos: "Concursos", imoveis: "Imóveis", esg: "ESG",
  defesa: "Defesa", religiao: "Fé & Espiritualidade", colunistas: "Colunistas"
};

const STATIC_DIRS = new Set(["js", "css", "assets", "images", "img", "fonts"]);
const templates = new Map();

export default async function handler(req, res) {
  try {
    const host = req.headers['host'] || '';
    if (host === 'ovalorcapital.com.br') {
      res.setHeader('Location', `https://www.ovalorcapital.com.br${req.url}`);
      return res.status(301).end();
    }

    if (serveStaticAsset(req, res)) return;

    const slug = String(req.query.slug || "").replace(/\/+$/g, "");
    if (!slug) return res.status(400).send("bad request");

    const idMatch = slug.match(/-([a-f0-9]{8})$/i);
    if (!idMatch) return res.status(400).send("invalid slug");

    const id8 = idMatch[1].toLowerCase();
    const catKey = SLUG_TO_CAT[String(req.query.cat || "").toLowerCase()] || "politica";
    const row = await findArticle(id8);
    if (!row) return res.status(404).send("not found");

    const tags = parseTags(row.user_tags);
    const articleCat = normalizeCat(tags[0]) || catKey;
    const catPath = CAT_PATH[articleCat] || CAT_PATH[catKey] || "politica";
    const title = clean(row.titulo || "O Valor Capital");
    const image = safeImage(row.imagem);
    const rawImg = String(row.imagem || "").trim();
    const displayImage = rawImg && !rawImg.includes(OLD_SUPABASE_REF) ? rawImg : "";
    const description = clean(row.comentario_fixado || stripHtml(row.conteudo || "").slice(0, 220));
    const slugClean = slugify(title);
    const canonical = `${BASE}/${catPath}/${slugClean}-${id8}/`;
    const publishedAt = row.published_at || row.created_at || new Date().toISOString();
    const modifiedAt = row.updated_at || publishedAt;
    const catLabel = CAT_LABEL[articleCat] || CAT_LABEL[catKey] || "Notícias";

    const tplPath = catPath === "colunistas" ? "politica" : catPath;
    const tpl = getTemplate(tplPath) || getTemplate("politica");
    if (!tpl) return res.status(500).send("template not found");

    const preload = {
      id: row.id,
      titulo: title,
      subtitulo: row.comentario_fixado || description,
      resumo: description,
      corpo: row.conteudo || "",
      conteudo: row.conteudo || "",
      imagem: displayImage,
      categoria: articleCat,
      subcategoria: row.subcategoria || "",
      tags,
      slug: slugClean,
      url: `/${catPath}/${slugClean}-${id8}/`,
      data: publishedAt,
      published_at: publishedAt
    };

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description,
      image: [image],
      datePublished: publishedAt,
      dateModified: modifiedAt,
      author: [{ "@type": "Organization", name: "Redação OVC", url: BASE }],
      publisher: {
        "@type": "Organization",
        name: "O Valor Capital",
        logo: { "@type": "ImageObject", url: `${BASE}/images/logo-ovc.png` }
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      articleSection: catLabel,
      inLanguage: "pt-BR",
      isAccessibleForFree: true
    };

    const seoTags = [
      `<title>${esc(title)} | O Valor Capital</title>`,
      `<meta name="description" content="${esc(description)}">`,
      `<link rel="canonical" href="${canonical}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="O Valor Capital">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(description)}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta property="og:locale" content="pt_BR">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(description)}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
      `<script type="application/ld+json">${safeJson(jsonLd)}</script>`,
      `<script>window.__OVC_ARTICLE__=${safeJson(preload)};window.SUPABASE_ANON_KEY=${JSON.stringify(SUPABASE_KEY)};</script>`,
      `<script src="/js/banners.js" defer></script>`
    ].join("\n");

    let html = tpl;
    html = setBodyAttr(html, "data-category", articleCat);
    html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
    html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, "");
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, "");
    html = html.includes("</head>") ? html.replace("</head>", `${seoTags}\n</head>`) : `${seoTags}\n${html}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(html);
  } catch (error) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send(`article failed: ${error?.message || String(error)}`);
  }
}

function serveStaticAsset(req, res) {
  const cat = String(req.query.cat || "").toLowerCase();
  if (!STATIC_DIRS.has(cat)) return false;

  const slug = String(req.query.slug || "").replace(/^\/+|\/+$/g, "");
  if (!slug || slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    res.status(400).send("bad static request");
    return true;
  }

  try {
    const body = readFileSync(join(process.cwd(), "public", cat, slug));
    res.setHeader("Content-Type", mimeFor(slug));
    res.setHeader("Cache-Control", cat === "js" ? "no-cache, no-store, must-revalidate" : "public, max-age=3600, stale-while-revalidate=86400");
    return res.status(200).send(body);
  } catch (_) {
    res.status(404).send("static not found");
    return true;
  }
}

async function findArticle(id8) {
  const lo = `${id8}-0000-0000-0000-000000000000`;
  const hi = `${id8}-ffff-ffff-ffff-ffffffffffff`;
  let result = await supabase.from("posts")
    .select(POST_COLUMNS)
    .eq("status", "publicado")
    .gte("id", lo)
    .lte("id", hi)
    .limit(1);

  if (result.error && String(result.error.message || "").includes("metrics")) {
    result = await supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,created_at,published_at,updated_at")
      .eq("status", "publicado")
      .gte("id", lo)
      .lte("id", hi)
      .limit(1);
  }

  if (result.error) throw result.error;
  return result.data?.[0] || null;
}

function getTemplate(catPath) {
  if (templates.has(catPath)) return templates.get(catPath);
  try {
    const html = readFileSync(join(process.cwd(), "public", catPath, "index.html"), "utf8");
    templates.set(catPath, html);
    return html;
  } catch (_) {
    return null;
  }
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(normalizeCat).filter(Boolean);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(normalizeCat).filter(Boolean);
  } catch (_) {}
  return String(value).split(/[;,\s]+/).map(normalizeCat).filter(Boolean);
}

function normalizeCat(value) {
  const s = slugify(String(value || "")).replace(/-/g, "");
  const map = { tributos: "tributacao", tributacao: "tributacao", vc: "colunistas", colunista: "colunistas", colunistas: "colunistas", segurancapublica: "seguranca", fe: "religiao" };
  return map[s] || s || "";
}

function safeImage(url) {
  const value = String(url || "").trim();
  if (!value || value.includes(OLD_SUPABASE_REF)) return OG_DEFAULT;
  return value;
}

function setBodyAttr(html, name, value) {
  const attr = `${name}="${esc(value)}"`;
  if (new RegExp(`\\s${name}="[^"]*"`, "i").test(html)) {
    return html.replace(new RegExp(`\\s${name}="[^"]*"`, "i"), ` ${attr}`);
  }
  return html.replace(/<body\b([^>]*)>/i, `<body$1 ${attr}>`);
}

function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function mimeFor(filename) {
  const ext = String(filename || "").toLowerCase().split(".").pop();
  const map = {
    js: "application/javascript; charset=utf-8",
    css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    svg: "image/svg+xml; charset=utf-8",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2"
  };
  return map[ext] || "application/octet-stream";
}

function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "materia";
}