// Brasil ON — SSR de artigo por slug.
// Espelho simplificado de api/article.js do OVC, mas lendo de brasilon_posts
// (tabela própria, alimentada por sync via api/manage.js?action=sync — ver
// core/brasilon.js e a categoria brasil-on/futebol do OVC).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE = "https://www.obrasilon.com.br";
const OG_DEFAULT = `${BASE}/assets/og-default.jpg`;
const POST_COLUMNS = "id,titulo,comentario_fixado,conteudo,imagem,categoria,meta_title,created_at,published_at,updated_at";

const CAT_LABEL = { "brasil-on": "Brasil ON", futebol: "Futebol" };
const STATIC_DIRS = new Set(["js", "css", "assets", "images", "img", "fonts"]);
const templates = new Map();

export default async function handler(req, res) {
  try {
    const host = req.headers["host"] || "";
    if (host === "obrasilon.com.br") {
      res.setHeader("Location", `https://www.obrasilon.com.br${req.url}`);
      return res.status(301).end();
    }

    if (serveStaticAsset(req, res)) return;

    const slug = String(req.query.slug || "").replace(/\/+$/g, "");
    if (!slug) return res.status(400).send("bad request");

    const idMatch = slug.match(/-([a-f0-9]{8})$/i);
    if (!idMatch) return res.status(400).send("invalid slug");

    const id8 = idMatch[1].toLowerCase();
    const catKey = CAT_LABEL[String(req.query.cat || "").toLowerCase()] ? String(req.query.cat).toLowerCase() : "brasil-on";
    const row = await findArticle(id8);
    if (!row) return res.status(404).send("not found");

    const articleCat = CAT_LABEL[row.categoria] ? row.categoria : catKey;
    const title = clean(row.titulo || "Brasil ON");
    const image = safeImage(row.imagem);
    const description = clean(row.comentario_fixado || stripHtml(row.conteudo || "").slice(0, 220));
    const slugClean = slugify(title);
    const canonical = `${BASE}/${articleCat}/${slugClean}-${id8}/`;
    const publishedAt = row.published_at || row.created_at || new Date().toISOString();
    const modifiedAt = row.updated_at || publishedAt;
    const catLabel = CAT_LABEL[articleCat] || "Notícias";

    const tpl = getTemplate(articleCat) || getTemplate("brasil-on");
    if (!tpl) return res.status(500).send("template not found");

    const preload = {
      id: row.id,
      titulo: title,
      resumo: description,
      corpo: row.conteudo || "",
      conteudo: row.conteudo || "",
      imagem: image,
      categoria: articleCat,
      slug: slugClean,
      url: `/${articleCat}/${slugClean}-${id8}/`,
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
      author: [{ "@type": "Organization", name: "Redação Brasil ON", url: BASE }],
      publisher: {
        "@type": "Organization",
        name: "Brasil ON",
        logo: { "@type": "ImageObject", url: `${BASE}/assets/og-default.jpg` }
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      articleSection: catLabel,
      inLanguage: "pt-BR",
      isAccessibleForFree: true
    };

    const seoTags = [
      `<title>${esc(title)} | Brasil ON</title>`,
      `<meta name="description" content="${esc(description)}">`,
      `<link rel="canonical" href="${canonical}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="Brasil ON">`,
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
      `<script>window.__BON_ARTICLE__=${safeJson(preload)};</script>`
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
  const { data, error } = await supabase.from("brasilon_posts")
    .select(POST_COLUMNS)
    .eq("status", "publicado")
    .gte("id", lo)
    .lte("id", hi)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
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

function safeImage(url) {
  const value = String(url || "").trim();
  return value || OG_DEFAULT;
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
    js: "application/javascript; charset=utf-8", css: "text/css; charset=utf-8",
    json: "application/json; charset=utf-8", png: "image/png", jpg: "image/jpeg",
    jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml; charset=utf-8",
    ico: "image/x-icon", woff: "font/woff", woff2: "font/woff2"
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
