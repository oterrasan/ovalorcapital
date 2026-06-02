import { createClient } from "@supabase/supabase-js";

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
  radar: "radar", vc: "colunistas", colunistas: "colunistas", geral: "politica"
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

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

  if (categoria && categoria !== "all") q = q.like("user_tags", `%\"${categoria}\"%`);
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
    ts: Date.now()
  });
}

function formatPost(row, full) {
  const tags = parseTags(row.user_tags);
  const categoria = normalizeCat(tags[0] || row.categoria || "politica") || "politica";
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
  const map = { politica: "politica", economica: "economia", negocio: "negocios", negocios: "negocios", tributos: "tributacao", tributacao: "tributacao", vc: "colunistas", coluna: "colunistas", colunista: "colunistas", colunistas: "colunistas", saude: "saude", familia: "familia", fe: "religiao", religiao: "religiao", seguranca: "seguranca", segurancapublica: "seguranca", profissoes: "profissoes", vagas: "vagas" };
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
