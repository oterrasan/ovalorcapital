import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "sb_publishable_3SXiMraMn_oaubinB2Wn5w_Iqj7W2yf";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE = "https://www.ovalorcapital.com.br";
const OG_DEFAULT = `${BASE}/images/og-default.jpg`;
const OLD_SUPABASE_REF = "bfsegqdgscudtdgwdyci";

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
  radar: "radar", vc: "colunistas", colunistas: "colunistas", geral: "politica",
  "brasil-on": "brasil-on", carreira: "carreira"
};

const CATEGORY_ALIASES = {
  "brasil-on": ["seguranca", "investigativo", "variedades"],
  "carreira": ["vagas", "concursos", "profissoes", "parcerias", "educacao"]
};

const VALID_CATS = new Set(Object.keys(CAT_PATH));
const HOME_CATS = [
  "politica", "economia", "negocios", "investimentos", "seguros", "mercados",
  "educacao", "industria", "tecnologia", "esportes", "saude", "familia",
  "tributacao", "regulacao", "parcerias", "internacional", "colunistas",
  "variedades", "investigativo", "seguranca", "cultura", "profissoes", "vagas",
  "concursos", "imoveis", "esg", "defesa", "religiao"
];
const POST_COLUMNS = "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at,updated_at,metrics";

const FOUC_GUARD = `<style id="ovc-fouc-guard">html.ovc-boot{background:#f4f6fb}html.ovc-boot body{opacity:0}html.ovc-ready body{opacity:1}@media (prefers-reduced-motion:no-preference){html.ovc-ready body{transition:opacity .12s ease}}</style><script id="ovc-fouc-guard-js">(function(d){d.classList.add('ovc-boot');function r(){d.classList.remove('ovc-boot');d.classList.add('ovc-ready')}if(document.readyState!=='loading'){requestAnimationFrame(r)}else{document.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(r)},{once:true})}setTimeout(r,1800)})(document.documentElement);</script>`;
const CRITICAL_CSS = `*,*::before,*::after{box-sizing:border-box}:root{--font-base:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,sans-serif;--font-mono:"SF Mono",ui-monospace,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--bg-header-top:#050816;--bg-header-mid:#050816;--bg-header-menu:#050816;--bg-footer:#030712;--gold:#d4af37;--bg-page:#f3f4f8;--bg-elevated:#fff;--bg-card:#fff;--border-subtle:#e2e8f0;--text-main:#0f172a;--text-soft:#475569;--text-muted:#94a3b8;--accent:#b91c1c;--shadow-card:0 4px 20px rgba(15,23,42,.08);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}[data-theme="dark"],[data-theme="graphite"]{--bg-page:#0b0f1a;--bg-elevated:#131929;--bg-card:#131929;--border-subtle:#1e2d45;--text-main:#e8edf5;--text-soft:#94a3b8;--text-muted:#64748b;--accent:#60a5fa;--shadow-card:0 4px 20px rgba(0,0,0,.35);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}[data-theme="gold"]{--bg-page:#faf7f0;--bg-elevated:#fffdf8;--bg-card:#fffdf8;--border-subtle:#e8e0ce;--text-main:#1a1208;--text-soft:#5c4a28;--text-muted:#8a7455;--accent:#9a6700;--shadow-card:0 4px 20px rgba(90,60,0,.09);--ovc-body-bg:var(--bg-page);--ovc-surface:var(--bg-elevated);--ovc-text:var(--text-main);--ovc-muted:var(--text-soft);--ovc-accent:var(--accent);--ovc-line:var(--border-subtle);--ovc-shadow:var(--shadow-card)}html,body{margin:0;padding:0;min-height:100%}body{font-family:var(--font-base);background:var(--bg-page);color:var(--text-main);line-height:1.5}a{color:inherit;text-decoration:none}.page-root{display:flex;flex-direction:column;min-height:100vh;background:var(--bg-page)}`;

let _templateCache = null;
function getHomeTemplate() {
  if (_templateCache) return _templateCache;
  let html = readFileSync(join(process.cwd(), "public", "index.html"), "utf8");
  html = html.replace(/<link href="data:image\/png;base64,[^"]{100,}" rel="icon"\/>/, '<link rel="icon" href="/favicon.png" type="image/png">');
  _templateCache = html;
  return _templateCache;
}

function escHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function injectHeadGuards(html) {
  let out = html;
  if (!out.includes("ovc-fouc-guard")) {
    const vp = '<meta content="width=device-width, initial-scale=1.0" name="viewport"/>';
    out = out.includes(vp) ? out.replace(vp, `${vp}\n${FOUC_GUARD}`) : out.replace("</head>", `${FOUC_GUARD}\n</head>`);
  }
  if (!out.includes("ovc-critical-css")) {
    out = out.replace('<link href="/css/home.css?v=2" rel="stylesheet"/>', `<style id="ovc-critical-css">${CRITICAL_CSS}</style><link href="/css/home.css?v=2" rel="stylesheet"/>`);
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
    const hero = (posts || []).find(p => { const t = parseTags(p.user_tags)[0]; return t === "politica" || t === "economia"; });
    if (!hero) return html;
    const cat = parseTags(hero.user_tags)[0] === "economia" ? "economia" : "politica";
    const sl = slugify(hero.titulo || "").slice(0, 55);
    const id8 = String(hero.id || "").slice(0, 8);
    const url = `/${cat}/${sl}-${id8}/`;
    const summary = String(hero.conteudo || hero.comentario_fixado || "").replace(/<[^>]+>/g, "").slice(0, 220).trim();
    return html
      .replace('<h1 class="card-title" id="card-hero-titulo">Carregando...</h1>', `<h1 class="card-title" id="card-hero-titulo">${escHtml(hero.titulo)}</h1>`)
      .replace('<p class="card-excerpt" id="card-hero-resumo"></p>', `<p class="card-excerpt" id="card-hero-resumo">${escHtml(summary)}</p>`)
      .replace('<a class="card-cta" id="card-hero-link" href="/politica/">', `<a class="card-cta" id="card-hero-link" href="${escHtml(url)}">`);
  } catch (_) { return html; }
}

async function handleHome(req, res) {
  let html = injectHeadGuards(getHomeTemplate());
  html = await injectHero(html);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
  return res.status(200).send(html);
}

export default async function handler(req, res) {
  if (req.query.format === "home") return handleHome(req, res);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

  if (req.query.format === "live-data") return handleLiveData(res);

  try {
    if (req.query.id) return handleOne(req, res);
    if (req.query.recentes === "true") return handleRecentes(req, res);
    return handleList(req, res);
  } catch (error) {
    return res.status(500).json({ posts: [], total: 0, error: "portal_posts_failed", detail: error?.message || String(error) });
  }
}

async function handleOne(req, res) {
  const id = String(req.query.id || "").trim();
  let row = null;

  if (id.length >= 36) {
    const result = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
    if (result.error) throw result.error;
    row = result.data;
  } else if (/^[a-f0-9]{8}$/i.test(id.slice(0, 8))) {
    const id8 = id.slice(0, 8).toLowerCase();
    const lo = `${id8}-0000-0000-0000-000000000000`;
    const hi = `${id8}-ffff-ffff-ffff-ffffffffffff`;
    const result = await supabase.from("posts").select(POST_COLUMNS).gte("id", lo).lte("id", hi).limit(1);
    if (result.error) throw result.error;
    row = result.data?.[0] || null;
  }

  if (!row) return res.status(404).json({ error: "not_found" });
  return res.status(200).json(formatPost(row, true));
}

async function handleRecentes(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");

  const limit = clampInt(req.query.limit, 80, 1, 300);
  const { data, error } = await supabase.from("posts")
    .select(POST_COLUMNS)
    .eq("status", "publicado")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const seenIds = new Set();
  const seenCats = new Set();
  const posts = [];

  function addRow(row) {
    if (!row?.id || seenIds.has(row.id)) return;
    const post = formatPost(row, false);
    if (!VALID_CATS.has(post.categoria)) return;
    seenIds.add(row.id);
    posts.push(post);
    if (post.categoria) seenCats.add(post.categoria);
    (post.tags || []).forEach(tag => VALID_CATS.has(tag) && seenCats.add(tag));
  }

  dedupe(data || []).forEach(addRow);

  if (limit >= 120) {
    const missing = HOME_CATS.filter(cat => !seenCats.has(cat));
    const fillers = await Promise.all(missing.map(async cat => {
      try {
        const result = await supabase.from("posts")
          .select(POST_COLUMNS)
          .eq("status", "publicado")
          .like("user_tags", `%"${cat}"%`)
          .order("published_at", { ascending: false })
          .limit(4);
        return result.data || [];
      } catch (_) {
        return [];
      }
    }));
    fillers.flat().forEach(addRow);
  }

  const primaryCats = new Set(posts.map(post => post.categoria).filter(Boolean));
  HOME_CATS.forEach(cat => {
    if (primaryCats.has(cat)) return;
    const source = posts.find(post => (post.tags || []).includes(cat));
    if (!source) return;
    const id8 = String(source.id || "").slice(0, 8);
    posts.push({
      ...source,
      id: `${source.id}-${cat}`,
      categoria: cat,
      url: `/${CAT_PATH[cat] || "politica"}/${source.slug}-${id8}/`
    });
    primaryCats.add(cat);
  });

  return res.status(200).json({ posts, total: posts.length });
}

async function handleList(req, res) {
  const limit = clampInt(req.query.limit, 40, 1, 80);
  const page = clampInt(req.query.page, 0, 0, 5000);
  const categoria = normalizeCat(req.query.categoria || req.query.cat || "");
  const searchTerm = String(req.query.q || "").trim();

  let q = supabase.from("posts")
    .select(POST_COLUMNS)
    .eq("status", "publicado")
    .order("published_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (categoria && categoria !== "all") {
    const aliases = CATEGORY_ALIASES[categoria];
    if (aliases) {
      q = q.or(aliases.map(c => `user_tags.like.%"${c}"%`).join(","));
    } else {
      q = q.like("user_tags", `%"${categoria}"%`);
    }
  }
  if (searchTerm) q = q.or(`titulo.ilike.%${escapeLike(searchTerm)}%,conteudo.ilike.%${escapeLike(searchTerm)}%`);

  const { data, error } = await q;
  if (error) throw error;

  const posts = dedupe(data || []).map(row => formatPost(row, false)).filter(p => VALID_CATS.has(p.categoria));

  if (req.query.resources) {
    return res.status(200).json({
      articles: posts.map(p => ({
        title: p.titulo,
        excerpt: p.resumo,
        image: p.imagem,
        url: p.url,
        category: p.categoria,
        source: "Redacao OVC",
        relativeDate: dataBr(p.data),
        readingTime: "3 min",
        slug: p.slug
      })),
      banners: []
    });
  }

  return res.status(200).json({ posts, total: posts.length });
}

async function handleLiveData(res) {
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");

  const [awResult, brapiResult] = await Promise.allSettled([
    safeFetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL"),
    safeFetch("https://brapi.dev/api/quote/%5EBVSP,%5EIXIC,%5EDJI")
  ]);

  const aw = awResult.status === "fulfilled" ? awResult.value : null;
  const br = brapiResult.status === "fulfilled" ? brapiResult.value : null;
  const brapiMap = {};
  for (const item of br?.results || []) brapiMap[item.symbol] = item;

  const youtubeUrl = process.env.YOUTUBE_LIVE_URL || "";
  const tvChannels = [
    ...(youtubeUrl ? [{ label: "TV OVC", url: youtubeUrl, group: "ao vivo", kind: "embed" }] : []),
    { label: "TV Câmara", url: "https://www.youtube.com/embed/live_stream?channel=UCcr3e8PiJTJDlLkwE_9vlqg", group: "institucional", kind: "embed" },
    { label: "TV Senado", url: "https://www.youtube.com/embed/live_stream?channel=UCccCfUCGP-6s8X6-_VQ8RFA", group: "institucional", kind: "embed" },
    { label: "TV Brasil", url: "https://www.youtube.com/embed/live_stream?channel=UCcLvHFM2XLj2JqLwFAjpHUw", group: "pública", kind: "embed" },
  ];

  return res.status(200).json({
    usd: aw?.USDBRL ? { valor: Number(aw.USDBRL.bid), variacao: Number(aw.USDBRL.pctChange) } : null,
    eur: aw?.EURBRL ? { valor: Number(aw.EURBRL.bid), variacao: Number(aw.EURBRL.pctChange) } : null,
    gbp: aw?.GBPBRL ? { valor: Number(aw.GBPBRL.bid), variacao: Number(aw.GBPBRL.pctChange) } : null,
    btc: aw?.BTCBRL ? { valor: Number(aw.BTCBRL.bid), variacao: Number(aw.BTCBRL.pctChange) } : null,
    ibov: marketValue(brapiMap["^BVSP"]),
    nasdaq: marketValue(brapiMap["^IXIC"]),
    dow: marketValue(brapiMap["^DJI"]),
    impostometro: impostometro(),
    ratePerSec: 114155,
    tv: tvChannels,
    ts: Date.now()
  });
}

function formatPost(row, full) {
  const tags = parseTags(row.user_tags);
  const isColunista = tags.includes("colunistas");
  const categoria = isColunista ? "colunistas" : (normalizeCat(tags[0] || row.categoria || "politica") || "politica");
  const catPath = CAT_PATH[categoria] || "politica";
  const titulo = clean(row.titulo || "");
  const id8 = String(row.id || "").slice(0, 8);
  const slug = slugify(titulo) || "materia";
  const conteudo = row.conteudo || "";
  const resumo = clean(row.comentario_fixado || stripHtml(conteudo).slice(0, 220));
  const data = row.published_at || row.created_at || row.updated_at || new Date().toISOString();

  return {
    id: row.id,
    titulo,
    title: titulo,
    subtitulo: row.comentario_fixado || resumo,
    comentario_fixado: row.comentario_fixado || resumo,
    resumo,
    conteudo: full ? conteudo : undefined,
    corpo: full ? conteudo : undefined,
    imagem: safeImage(row.imagem),
    categoria,
    subcategoria: row.subcategoria || "",
    subcategoria_slug: row.subcategoria_slug || "",
    tags,
    slug,
    url: `/${catPath}/${slug}-${id8}/`,
    data,
    published_at: data,
    metrics: row.metrics || {}
  };
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
  const raw = String(value || "").trim();
  if (!raw) return "";
  const s = slugify(raw).replace(/-/g, "");
  if (!s) return "";
  const map = { politica: "politica", economica: "economia", negocio: "negocios", negocios: "negocios", tributos: "tributacao", tributacao: "tributacao", vc: "colunistas", coluna: "colunistas", colunista: "colunistas", colunistas: "colunistas", saude: "saude", familia: "familia", fe: "religiao", religiao: "religiao", seguranca: "seguranca", segurancapublica: "seguranca", profissoes: "profissoes", vagas: "vagas", brasillon: "brasil-on", brasilon: "brasil-on", brasilieon: "brasil-on", brasilnews: "brasil-on" };
  if (raw === "brasil-on") return "brasil-on";
  return map[s] || s;
}

function safeImage(url) {
  const value = String(url || "").trim();
  if (!value || value.includes(OLD_SUPABASE_REF)) return OG_DEFAULT;
  return value;
}

function dedupe(rows) {
  const ids = new Set();
  const titles = new Set();
  const out = [];
  for (const row of rows) {
    if (!row?.id || !row?.titulo) continue;
    const t = slugify(row.titulo).slice(0, 45);
    if (ids.has(row.id) || titles.has(t)) continue;
    ids.add(row.id);
    titles.add(t);
    out.push(row);
  }
  return out;
}

async function safeFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;
    return response.json();
  } catch (_) {
    clearTimeout(timer);
    return null;
  }
}

function marketValue(item) {
  return item ? { valor: item.regularMarketPrice, variacao: item.regularMarketChangePercent } : null;
}

function impostometro() {
  const start = new Date(`${new Date().getFullYear()}-01-01T03:00:00Z`).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 1000)) * 114155;
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function escapeLike(value) {
  return String(value).replace(/[%,]/g, " ").slice(0, 80);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function dataBr(dt) {
  try { return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch (_) { return ""; }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
