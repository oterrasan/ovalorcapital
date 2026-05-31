import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Critical CSS: variables + reset to prevent CLS when full CSS loads async
const CRITICAL_CSS = `*,*::before,*::after{box-sizing:border-box;}:root{--font-base:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif;--font-mono:"SF Mono",ui-monospace,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--font-size-xxs:10px;--font-size-xs:11px;--font-size-sm:12px;--font-size-md:13px;--font-size-base:14px;--font-size-lg:15px;--font-size-xl:17px;--font-size-2xl:19px;--bg-header-top:#050816;--bg-header-mid:#050816;--bg-header-menu:#050816;--bg-chip:#111827;--bg-footer:#030712;--border-header:#111827;--card-radius:18px;--rail-radius:18px;--gold:#d4af37;--blue:#0f4c81;--cat-politica:#b91c1c;--cat-economia:#b45309;--cat-negocios:#059669;--cat-investimentos:#2563eb;--cat-seguros:#d4af37;--cat-mercados:#7c3aed;--cat-familia:#16a34a;--cat-tributos:#c2410c;--cat-regulacao:#4f46e5;--cat-saude:#0d9488;--cat-educacao:#0284c7;--cat-esportes:#be123c;--cat-industria:#6b7280;--cat-tecnologia:#0891b2;--bg-page:#f3f4f8;--bg-elevated:#ffffff;--bg-card:#ffffff;--bg-card-hover:#f8faff;--border-subtle:#e2e8f0;--border-medium:#cbd5e1;--text-main:#0f172a;--text-soft:#475569;--text-muted:#94a3b8;--text-invert:#f9fafb;--accent:#b91c1c;--accent-soft:rgba(185,28,28,0.08);--shadow-soft:0 2px 12px rgba(15,23,42,0.07),0 1px 3px rgba(15,23,42,0.05);--shadow-card:0 4px 20px rgba(15,23,42,0.08);--shadow-hover:0 8px 30px rgba(15,23,42,0.14);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-accent-soft:var(--accent-soft);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card);}[data-theme="graphite"]{--bg-page:#0b0f1a;--bg-elevated:#131929;--bg-card:#131929;--bg-card-hover:#1a2236;--border-subtle:#1e2d45;--border-medium:#2a3d5a;--text-main:#e8edf5;--text-soft:#94a3b8;--text-muted:#64748b;--text-invert:#f9fafb;--accent:#60a5fa;--accent-soft:rgba(96,165,250,0.12);--shadow-soft:0 2px 12px rgba(0,0,0,0.3),0 1px 3px rgba(0,0,0,0.2);--shadow-card:0 4px 20px rgba(0,0,0,0.35);--shadow-hover:0 8px 30px rgba(0,0,0,0.5);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-accent-soft:var(--accent-soft);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card);}[data-theme="gold"]{--bg-page:#faf7f0;--bg-elevated:#fffdf8;--bg-card:#fffdf8;--bg-card-hover:#fffef4;--border-subtle:#e8e0ce;--border-medium:#d6c9a8;--text-main:#1a1208;--text-soft:#5c4a28;--text-muted:#8a7455;--text-invert:#f9fafb;--accent:#9a6700;--accent-soft:rgba(154,103,0,0.10);--shadow-soft:0 2px 12px rgba(90,60,0,0.07);--shadow-card:0 4px 20px rgba(90,60,0,0.09);--shadow-hover:0 8px 30px rgba(90,60,0,0.15);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-accent-soft:var(--accent-soft);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card);}[data-theme="dark"]{--bg-page:#0b0f1a;--bg-elevated:#131929;--bg-card:#131929;--bg-card-hover:#1a2236;--border-subtle:#1e2d45;--border-medium:#2a3d5a;--text-main:#e8edf5;--text-soft:#94a3b8;--text-muted:#64748b;--text-invert:#f9fafb;--accent:#60a5fa;--accent-soft:rgba(96,165,250,0.12);--shadow-soft:0 2px 12px rgba(0,0,0,0.3);--shadow-card:0 4px 20px rgba(0,0,0,0.35);--shadow-hover:0 8px 30px rgba(0,0,0,0.5);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-accent-soft:var(--accent-soft);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card);}*{box-sizing:border-box;}html,body{margin:0;padding:0;height:100%;}body{font-family:var(--font-base);background:var(--bg-page);color:var(--text-main);line-height:1.5;font-size:var(--font-size-base);}a{color:inherit;text-decoration:none;}a:hover{text-decoration:underline;}.page-root{display:flex;flex-direction:column;min-height:100vh;background:var(--bg-page);}`;

let _tpl = null;
function getTemplate() {
  if (_tpl) return _tpl;
  let html = readFileSync(join(process.cwd(), "public", "index.html"), "utf8");
  // Strip ~120KB inline base64 favicon — /favicon.png already exists as static file
  html = html.replace(/<link href="data:image\/png;base64,[^"]{100,}" rel="icon"\/>/,
    '<link rel="icon" href="/favicon.png" type="image/png">');
  _tpl = html;
  return _tpl;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slugify(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

export default async function handler(req, res) {
  let html = getTemplate();

  // Step 1: Inline critical CSS before the existing CSS links
  // This ensures CSS variables + reset are available immediately, preventing CLS
  html = html.replace(
    '<link href="/css/home.css?v=2" rel="stylesheet"/>',
    `<style>${CRITICAL_CSS}</style><link href="/css/home.css?v=2" rel="stylesheet"/>`
  );

  // Step 2: Convert render-blocking CSS to non-blocking (critical CSS above handles CLS)
  html = html.replace(
    '<link href="/css/home.css?v=2" rel="stylesheet"/><link href="/css/site.css" rel="stylesheet"/><link href="/css/noticias.css" rel="stylesheet"/>',
    `<link rel="preload" href="/css/home.css?v=2" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/site.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/noticias.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link href="/css/home.css?v=2" rel="stylesheet"><link href="/css/site.css" rel="stylesheet"><link href="/css/noticias.css" rel="stylesheet"></noscript>`
  );

  // Step 3: Pre-render hero content server-side (fixes LCP: no more JS API wait)
  try {
    const { data: posts } = await supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,user_tags,published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(20);

    const heroPost = (posts || []).find(p => {
      let tags = [];
      try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch (_) {}
      return tags[0] === "politica" || tags[0] === "economia";
    });

    if (heroPost) {
      let tags = [];
      try { tags = typeof heroPost.user_tags === "string" ? JSON.parse(heroPost.user_tags) : (heroPost.user_tags || []); } catch (_) {}
      const cat = tags[0] || "politica";
      const cp = cat === "economia" ? "economia" : "politica";
      const sl = slugify(heroPost.titulo || "").slice(0, 55);
      const id8 = (heroPost.id || "").slice(0, 8);
      const url = `/${cp}/${sl}-${id8}/`;
      const resumo = (heroPost.conteudo || heroPost.comentario_fixado || "").slice(0, 220).trim();

      html = html.replace(
        '<h1 class="card-title" id="card-hero-titulo">Carregando...</h1>',
        `<h1 class="card-title" id="card-hero-titulo">${esc(heroPost.titulo || "")}</h1>`
      );
      html = html.replace(
        '<p class="card-excerpt" id="card-hero-resumo"></p>',
        `<p class="card-excerpt" id="card-hero-resumo">${esc(resumo)}</p>`
      );
      html = html.replace(
        '<a class="card-cta" id="card-hero-link" href="/politica/">',
        `<a class="card-cta" id="card-hero-link" href="${esc(url)}">`
      );
    }
  } catch (_) {
    // Graceful degradation: serve template as-is on Supabase error
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res.status(200).send(html);
}
