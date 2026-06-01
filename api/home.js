import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const FOUC_GUARD = `<style id="ovc-fouc-guard">html.ovc-boot{background:#f4f6fb}html.ovc-boot body{opacity:0}html.ovc-ready body{opacity:1}@media (prefers-reduced-motion:no-preference){html.ovc-ready body{transition:opacity .12s ease}}</style><script id="ovc-fouc-guard-js">(function(d){d.classList.add('ovc-boot');function r(){d.classList.remove('ovc-boot');d.classList.add('ovc-ready')}if(document.readyState!=='loading'){requestAnimationFrame(r)}else{document.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(r)},{once:true})}setTimeout(r,1800)})(document.documentElement);</script>`;

const CRITICAL_CSS = `*,*::before,*::after{box-sizing:border-box}:root{--font-base:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif;--font-mono:"SF Mono",ui-monospace,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--bg-header-top:#050816;--bg-header-mid:#050816;--bg-header-menu:#050816;--bg-footer:#030712;--gold:#d4af37;--bg-page:#f3f4f8;--bg-elevated:#fff;--bg-card:#fff;--border-subtle:#e2e8f0;--text-main:#0f172a;--text-soft:#475569;--text-muted:#94a3b8;--accent:#b91c1c;--shadow-card:0 4px 20px rgba(15,23,42,.08);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}[data-theme="dark"],[data-theme="graphite"]{--bg-page:#0b0f1a;--bg-elevated:#131929;--bg-card:#131929;--border-subtle:#1e2d45;--text-main:#e8edf5;--text-soft:#94a3b8;--text-muted:#64748b;--accent:#60a5fa;--shadow-card:0 4px 20px rgba(0,0,0,.35);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}[data-theme="gold"]{--bg-page:#faf7f0;--bg-elevated:#fffdf8;--bg-card:#fffdf8;--border-subtle:#e8e0ce;--text-main:#1a1208;--text-soft:#5c4a28;--text-muted:#8a7455;--accent:#9a6700;--shadow-card:0 4px 20px rgba(90,60,0,.09);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}html,body{margin:0;padding:0;min-height:100%}body{font-family:var(--font-base);background:var(--bg-page);color:var(--text-main);line-height:1.5}a{color:inherit;text-decoration:none}.page-root{display:flex;flex-direction:column;min-height:100vh;background:var(--bg-page)}`;

let templateCache = null;

function getTemplate() {
  if (templateCache) return templateCache;

  let html = readFileSync(join(process.cwd(), "public", "index.html"), "utf8");

  html = html.replace(
    /<link href="data:image\/png;base64,[^"]{100,}" rel="icon"\/>/,
    '<link rel="icon" href="/favicon.png" type="image/png">'
  );

  templateCache = html;
  return templateCache;
}

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function firstTag(row) {
  try {
    const tags = typeof row.user_tags === "string" ? JSON.parse(row.user_tags) : row.user_tags;
    return Array.isArray(tags) ? tags[0] : "";
  } catch (_) {
    return "";
  }
}

function injectHeadGuards(html) {
  let out = html;

  if (!out.includes("ovc-fouc-guard")) {
    const viewport = '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>';
    if (out.includes(viewport)) out = out.replace(viewport, `${viewport}\n${FOUC_GUARD}`);
    else out = out.replace("</head>", `${FOUC_GUARD}\n</head>`);
  }

  if (!out.includes("ovc-critical-css")) {
    out = out.replace(
      '<link href="/css/home.css?v=2" rel="stylesheet"/>',
      `<style id="ovc-critical-css">${CRITICAL_CSS}</style><link href="/css/home.css?v=2" rel="stylesheet"/>`
    );
  }

  out = out.replace(
    '<link href="/css/home.css?v=2" rel="stylesheet"/><link href="/css/site.css" rel="stylesheet"/><link href="/css/noticias.css" rel="stylesheet"/>',
    `<link rel="preload" href="/css/home.css?v=2" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/site.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/noticias.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link href="/css/home.css?v=2" rel="stylesheet"><link href="/css/site.css" rel="stylesheet"><link href="/css/noticias.css" rel="stylesheet"></noscript>`
  );

  return out;
}

async function injectHero(html) {
  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("id,titulo,comentario_fixado,conteudo,user_tags,published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(20);

    const hero = (posts || []).find((post) => {
      const tag = firstTag(post);
      return tag === "politica" || tag === "economia";
    });

    if (!hero) return html;

    const cat = firstTag(hero) === "economia" ? "economia" : "politica";
    const slug = slugify(hero.titulo || "").slice(0, 55);
    const id8 = String(hero.id || "").slice(0, 8);
    const url = `/${cat}/${slug}-${id8}/`;
    const summary = String(hero.conteudo || hero.comentario_fixado || "").replace(/<[^>]+>/g, "").slice(0, 220).trim();

    return html
      .replace(
        '<h1 class="card-title" id="card-hero-titulo">Carregando...</h1>',
        `<h1 class="card-title" id="card-hero-titulo">${esc(hero.titulo)}</h1>`
      )
      .replace(
        '<p class="card-excerpt" id="card-hero-resumo"></p>',
        `<p class="card-excerpt" id="card-hero-resumo">${esc(summary)}</p>`
      )
      .replace(
        '<a class="card-cta" id="card-hero-link" href="/politica/">',
        `<a class="card-cta" id="card-hero-link" href="${esc(url)}">`
      );
  } catch (_) {
    return html;
  }
}

export default async function handler(req, res) {
  let html = injectHeadGuards(getTemplate());
  html = await injectHero(html);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res.status(200).send(html);
}
