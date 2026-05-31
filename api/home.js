import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let _tpl = null;
function getTemplate() {
  if (_tpl) return _tpl;
  _tpl = readFileSync(join(process.cwd(), "public", "_home-tpl.html"), "utf8");
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
    // graceful degradation: serve template as-is
  }

  // Non-render-blocking CSS to improve FCP/LCP on mobile
  html = html.replace(
    '<link href="/css/home.css?v=2" rel="stylesheet"/><link href="/css/site.css" rel="stylesheet"/><link href="/css/noticias.css" rel="stylesheet"/>',
    `<link rel="preload" href="/css/home.css?v=2" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/site.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><link rel="preload" href="/css/noticias.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link href="/css/home.css?v=2" rel="stylesheet"><link href="/css/site.css" rel="stylesheet"><link href="/css/noticias.css" rel="stylesheet"></noscript>`
  );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res.status(200).send(html);
}
