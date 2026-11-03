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

// Categorias ativas → path de template. Legado → nova categoria.
const CAT_PATH = {
  // Categorias ativas (11 + colunistas)
  "brasil-on": "brasil-on", politica: "politica", economia: "economia",
  financas: "financas", negocios: "negocios", tecnologia: "tecnologia",
  internacional: "internacional", industria: "industria", familia: "familia",
  esportes: "esportes", giro: "giro", vc: "colunistas", colunistas: "colunistas",
  // Legado → novas categorias (artigos antigos no banco)
  investimentos: "financas", seguros: "financas", mercados: "financas",
  saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
  cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
  variedades: "brasil-on", investigativo: "brasil-on", seguranca: "brasil-on",
  esg: "brasil-on", defesa: "brasil-on", profissoes: "brasil-on",
  vagas: "brasil-on", concursos: "brasil-on", parcerias: "negocios",
  tributos: "economia", tributacao: "economia", regulacao: "economia",
  geral: "politica"
};

// Slug da URL → categoria canônica interna
const SLUG_TO_CAT = {
  // Categorias ativas
  "brasil-on": "brasil-on", politica: "politica", economia: "economia",
  financas: "financas", negocios: "negocios", tecnologia: "tecnologia",
  internacional: "internacional", industria: "industria", familia: "familia",
  esportes: "esportes", giro: "giro", vc: "colunistas", colunistas: "colunistas",
  // Legado → novas categorias
  investimentos: "financas", seguros: "financas", mercados: "financas",
  saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
  cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
  variedades: "brasil-on", investigativo: "brasil-on", seguranca: "brasil-on",
  esg: "brasil-on", defesa: "brasil-on", profissoes: "brasil-on",
  vagas: "brasil-on", concursos: "brasil-on", parcerias: "negocios",
  tributos: "economia", tributacao: "economia", regulacao: "economia"
};

const CAT_LABEL = {
  "brasil-on": "Brasil On", politica: "Política", economia: "Economia",
  financas: "Finanças", negocios: "Negócios", tecnologia: "Tecnologia",
  internacional: "Internacional", industria: "Indústria", familia: "Família",
  esportes: "Esportes", giro: "Giro", colunistas: "Colunistas",
  // Legado (para artigos antigos com user_tags antigas)
  investimentos: "Finanças", seguros: "Finanças", mercados: "Finanças",
  saude: "Brasil On", carreira: "Brasil On", imoveis: "Brasil On",
  cultura: "Brasil On", religiao: "Brasil On", tributos: "Economia",
  tributacao: "Economia", regulacao: "Economia"
};

const STATIC_DIRS = new Set(["js", "css", "assets", "images", "img", "fonts"]);
const templates = new Map();

// 03/11/2026 — causa raiz real confirmada da rejeição do AdSense por
// "conteúdo de baixa qualidade" e da queda de tráfego orgânico: o HTML
// servido por este handler NUNCA continha o corpo real do artigo — só o
// script window.__OVC_ARTICLE__ (lido depois por internal-page-v2.js, que
// monta o H1/corpo real via innerHTML no navegador). Qualquer crawler que
// não executa esse JS (AdSense review, ou o Googlebot sem orçamento pra
// 2ª onda de rendering) via EXATAMENTE o mesmo texto fixo de template de
// categoria ("Cobertura política com leitura organizada...") repetido em
// toda página de artigo do site — thin/duplicate content em escala, a
// causa clássica #1 de recusa de baixa qualidade. Fix: o SSR agora escreve
// o H1/corpo reais direto no HTML, replicando (server-side, sem DOM) a
// mesma lógica de internal-page-v2.js — o JS client-side continua
// rodando por cima depois (mesmo conteúdo, mais "leia também"/share), sem
// nenhuma mudança visual pro usuário humano.
const CORES_CAT = {
  politica: "#dc2626", economia: "#2563eb", negocios: "#7c3aed",
  financas: "#059669", tecnologia: "#6366f1", industria: "#ea580c",
  internacional: "#dc2626", familia: "#db2777", esportes: "#16a34a",
  "brasil-on": "#b91c1c", giro: "#0f766e", colunistas: "#ffc800"
};

function corCat(cat) { return CORES_CAT[cat] || "#dc2626"; }

function dataLongaServer(dt) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch (_) { return ""; }
}

function estimarLeituraServer(texto) {
  if (!texto) return "1 min de leitura";
  const palavras = stripHtml(texto).trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(palavras / 200));
  return `${mins} min de leitura`;
}

function quebrarParagrafosServer(html) {
  if (!html) return html;
  let prev, r = html, passes = 0;
  do {
    prev = r;
    r = r.replace(/<p[^>]*>([\s\S]+?)<\/p>/gi, (match, inner) => {
      if (inner.length < 300) return match;
      const partes = inner.split(/([.!?]["»]?\s+)/);
      let frases = [], buf = "";
      for (let i = 0; i < partes.length; i++) {
        buf += partes[i];
        if (/[.!?]["»]?\s*$/.test(buf) && buf.trim().length > 60) { frases.push(buf.trim()); buf = ""; }
      }
      if (buf.trim()) frases.push(buf.trim());
      if (frases.length <= 1) {
        const words = inner.split(/\s+/);
        let wchunk = "", wchars = 0;
        const wsplits = [];
        words.forEach((w) => {
          wchunk += (wchunk ? " " : "") + w;
          wchars += w.length + 1;
          if (wchars > 220 && /[,;]$/.test(w)) { wsplits.push(wchunk.trim()); wchunk = ""; wchars = 0; }
        });
        if (wchunk.trim()) wsplits.push(wchunk.trim());
        if (wsplits.length <= 1) return match;
        frases = wsplits;
      }
      const maxG = passes === 0 ? 3 : 2;
      let out = "", chk = "", cnt = 0;
      frases.forEach((f) => {
        chk += (chk ? " " : "") + f;
        cnt++;
        if (cnt >= maxG) { out += `<p>${chk}</p>\n`; chk = ""; cnt = 0; }
      });
      if (chk) out += `<p>${chk}</p>`;
      return out;
    });
    passes++;
  } while (r !== prev && passes < 5);
  return r;
}

function renderCorpoServer(texto) {
  if (!texto) return "";
  if (/^\s*<[a-z]/i.test(texto.trim())) {
    const html = quebrarParagrafosServer(texto);
    return `<div class="ovc-corpo" style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);">${html}</div>`;
  }
  const lines = texto.split("\n");
  let html = "";
  const htags = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    if (/^##\s+/.test(t)) {
      html += `<h2 style="font-size:21px;font-weight:800;line-height:1.25;margin:36px 0 14px;color:var(--text-main,#0f172a);border-left:3px solid var(--ovc-accent,#dc2626);padding-left:14px;">${esc(t.replace(/^##\s+/, ""))}</h2>`;
    } else if (/^(#[^\s#,]+[\s,]*)+$/.test(t) && t[0] === "#") {
      htags.push(...(t.match(/#[^\s#,]+/g) || []));
    } else if (/^Redação OVC/i.test(t)) {
      html += `<p style="font-size:13px;font-weight:600;color:#94a3b8;margin:0 0 24px;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">${esc(t)}</p>`;
    } else if (/^<\/?[a-z]/i.test(t)) {
      html += t;
    } else {
      html += `<p style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);margin:0 0 22px;">${esc(t)}</p>`;
    }
  }
  if (htags.length) {
    html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0;">${htags
      .map((t) => `<span style="font-size:12px;font-weight:600;color:#475569;background:#f1f5f9;padding:4px 12px;border-radius:20px;">${esc(t)}</span>`)
      .join("")}</div>`;
  }
  return html;
}

function parseYouTubeServer(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!m) return null;
  return { id: m[1], vertical: /\/shorts\//.test(url) };
}

function renderMediaServer(videoUrl, image, title) {
  if (!videoUrl) return "";
  const yt = parseYouTubeServer(videoUrl);
  if (yt) {
    return `<div class="ovc-art-video-wrap ovc-art-video-yt${yt.vertical ? " ovc-art-video-yt-v" : ""}"><iframe src="https://www.youtube-nocookie.com/embed/${yt.id}" title="${esc(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="ovc-art-video-caption">${esc(title)}</div></div>`;
  }
  const posterAttr = image ? ` poster="${esc(image)}"` : "";
  return `<div class="ovc-art-video-wrap"><video class="ovc-art-video" controls playsinline preload="metadata"${posterAttr} src="${esc(videoUrl)}">Seu navegador não suporta reprodução de vídeo. <a href="${esc(videoUrl)}">Baixar o vídeo</a>.</video><div class="ovc-art-video-caption">${esc(title)}</div></div>`;
}

function renderArticleHeroServer({ title, subtitle, body, image, videoUrl, catPath, catLabel, subcategory, publishedAt }) {
  const c = corCat(catPath);
  const breadcrumb = `<nav style="font-size:12px;color:#94a3b8;margin-bottom:20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><a href="/" style="color:#94a3b8;text-decoration:none;">Início</a><span>&rsaquo;</span><a href="/${catPath}/" style="color:#94a3b8;text-decoration:none;">${esc(catLabel)}</a>${subcategory ? `<span>&rsaquo;</span><span style="color:#64748b;">${esc(subcategory)}</span>` : ""}</nav>`;
  const metaLine = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;"><span style="display:inline-block;background:${c};color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">${esc(catLabel)}</span>${subcategory ? `<span style="font-size:11px;color:#64748b;font-weight:600;">${esc(subcategory)}</span>` : ""}<span style="font-size:13px;color:#64748b;">Redação OVC &middot; ${dataLongaServer(publishedAt)}</span><span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:3px 9px;border-radius:20px;">&#9201; ${estimarLeituraServer(body)}</span></div>`;
  const h1 = `<h1 style="font-size:30px;font-weight:900;line-height:1.18;margin:0 0 16px;color:var(--text-main,#0f172a);letter-spacing:-.02em;">${esc(title)}</h1>`;
  const sub = subtitle ? `<p style="font-size:18px;color:#475569;margin:0 0 4px;line-height:1.6;font-style:italic;border-left:4px solid ${c};padding:6px 0 6px 16px;">${esc(subtitle)}</p>` : "";
  const media = renderMediaServer(videoUrl, image, title);
  const imgTag = !videoUrl && image ? `<img src="${esc(image)}" class="ovc-art-img" alt="${esc(title)}" onerror="this.style.display='none'">` : "";
  const corpo = renderCorpoServer(body || "");
  return `<div style="display:block;padding:24px 28px 32px;box-sizing:border-box;">${breadcrumb}${metaLine}${h1}${sub}${media}<div class="ovc-art-body">${imgTag}<div>${corpo}</div><div style="clear:both;"></div></div></div>`;
}

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
      video: row.video_url || "",
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
    if (row.video_url) {
      // Link do YouTube (01/09/2026, ver core/storage.js e internal-page-v2.js
      // parseYouTube()) usa embedUrl no schema.org, nunca contentUrl -- o
      // YouTube não expõe um arquivo de vídeo bruto na URL de watch/embed,
      // contentUrl deve apontar pra um arquivo real (o caso do vídeo
      // hospedado direto no nosso Storage).
      const ytMatch = String(row.video_url).match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      jsonLd.video = {
        "@type": "VideoObject",
        name: title,
        description,
        thumbnailUrl: [image],
        uploadDate: publishedAt,
        ...(ytMatch
          ? { embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}` }
          : { contentUrl: row.video_url })
      };
    }

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

    // Remove o hero genérico de categoria (H1/texto fixo de template) e
    // injeta o H1/corpo reais do artigo no SSR -- ver comentário acima de
    // CORES_CAT. Envolto em try/catch: se algo der errado aqui, a página
    // continua servindo exatamente como antes (hero vazio, preenchido
    // depois pelo JS) em vez de falhar -- nunca pode derrubar o artigo.
    try {
      html = html.replace(/<section class="ovc-section-hero">[\s\S]*?<\/section>/, "");
      const heroHtml = renderArticleHeroServer({
        title,
        subtitle: row.comentario_fixado || "",
        body: row.conteudo || "",
        image: displayImage,
        videoUrl: row.video_url || "",
        catPath,
        catLabel,
        subcategory: row.subcategoria || "",
        publishedAt
      });
      html = html.replace(
        '<div class="ovc-panel" data-hero-card></div>',
        `<div class="ovc-panel" data-hero-card>${heroHtml}</div>`
      );
    } catch (_) {}

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
  const row = result.data?.[0] || null;
  if (row) row.video_url = await findArticleVideo(row.id);
  return row;
}

// 01/09/2026 — coluna video_url é NOVA (Roberto ainda precisa rodar o
// ALTER TABLE no Supabase — ver seção 4 do CLAUDE.md). Consulta separada e
// silenciosa: nunca pode derrubar a leitura do artigo principal — sem essa
// coluna (ou com qualquer outro erro), simplesmente não há vídeo, igual a
// qualquer post sem video_url de verdade. NUNCA misturar isso no SELECT
// principal (findArticle) — faria QUALQUER artigo do portal parar de
// carregar até a migração rodar, o que violaria a Regra Zero-E.
// 20/09/2026 — metrics.instagram_reel_template.portal_hidden:true marca
// vídeo que existe SÓ pra alimentar o Reel do Instagram (ex: captura
// automática do Bacci) — Roberto: "no portal pode ficar publicado apenas
// a materia com a foto... o video nao precisa ficar no portal a
// principio". Vídeo colocado manualmente no admin nunca seta esse campo,
// então continua aparecendo no site exatamente como antes.
async function findArticleVideo(id) {
  try {
    const { data, error } = await supabase.from("posts").select("video_url, metrics").eq("id", id).maybeSingle();
    if (error) return "";
    if (data?.metrics) {
      try {
        const m = typeof data.metrics === "string" ? JSON.parse(data.metrics) : data.metrics;
        if (m?.instagram_reel_template?.portal_hidden === true) return "";
      } catch (_) {}
    }
    return data?.video_url || "";
  } catch (_) {
    return "";
  }
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
  const map = {
    // Categorias ativas
    brasileon: "brasil-on", brasilon: "brasil-on",
    financas: "financas", financ: "financas",
    // Legado → novas categorias
    investimentos: "financas", seguros: "financas", mercados: "financas",
    saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
    cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
    variedades: "brasil-on", investigativo: "brasil-on", seguranca: "brasil-on",
    segurancapublica: "brasil-on", esg: "brasil-on", defesa: "brasil-on",
    profissoes: "brasil-on", vagas: "brasil-on", concursos: "brasil-on",
    parcerias: "negocios",
    tributos: "economia", tributacao: "economia", regulacao: "economia",
    // Colunistas
    vc: "colunistas", colunista: "colunistas", colunistas: "colunistas",
    fe: "brasil-on"
  };
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
    .slice(0, 55) || "materia";
}