import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const CATS_VALIDAS = new Set(['politica','economia','negocios','investimentos','seguros','mercados','educacao','industria','tecnologia','esportes','saude','familia','tributacao','regulacao','parcerias','internacional','colunistas','variedades','investigativo','seguranca','cultura','profissoes','vagas','concursos','imoveis','esg','defesa','religiao','radar']);

function idRange(id8) {
  return { lo: id8 + "-0000-0000-0000-000000000000", hi: id8 + "-ffff-ffff-ffff-ffffffffffff" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");

  const { categoria, limit = 40, page = 0, id, resources, sort, format } = req.query;
  const safeLimit = Math.min(Math.max(parseInt(limit || "40", 10) || 40, 1), 80);
  const safePage = Math.max(parseInt(page || "0", 10) || 0, 0);

  if (format === "comments" && req.query.post_id) return handleGetComments(req, res);
  if (req.method === "POST" && req.query.action === "comment") return handlePostComment(req, res);
  if (format === "live-data") return handleLiveData(req, res);
  if (format === "og" && id) return handleOg(req, res, id);

  try {
    if (sort === "popular") {
      const { data, error } = await supabase.from("posts")
        .select("id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at,metrics")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      const posts = (data || [])
        .filter(p => p.titulo && p.id)
        .sort((a,b) => (((b.metrics && b.metrics.views) || 0) - ((a.metrics && a.metrics.views) || 0)))
        .slice(0, Math.min(Number(limit) || 10, 10))
        .map(p => formatPost(p, false))
        .filter(p => imgOk(p.imagem));
      return res.status(200).json({ posts, total: posts.length });
    }

    if (req.query.recentes === 'true') {
      const lim = Math.min(parseInt(limit || '80', 10) || 80, 80);
      const { data, error } = await supabase.from("posts")
        .select("id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(lim);
      if (error) throw error;
      const posts = (data || []).filter(p => p.titulo && p.id).map(p => formatPost(p, false)).filter(p => CATS_VALIDAS.has(p.categoria));
      return res.status(200).json({ posts, total: posts.length });
    }

    if (id) {
      const data = await getPostById(id, true);
      if (!data) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(formatPost(data, true));
    }

    const { q: searchTerm } = req.query;
    if (searchTerm && searchTerm.trim()) return handleSearch(req, res, searchTerm.trim());

    let q = supabase.from("posts")
      .select("id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(safePage * safeLimit, (safePage + 1) * safeLimit - 1);

    if (categoria && categoria !== "all") q = q.like("user_tags", `%\"${categoria}\"%`);

    const { data, error } = await q;
    if (error) throw error;

    const posts = dedupe(data || []).map(p => formatPost(p, false)).filter(p => imgOk(p.imagem) && CATS_VALIDAS.has(p.categoria));

    if (resources) {
      return res.status(200).json({
        articles: posts.map(p => ({ title: p.titulo, excerpt: p.resumo, image: p.imagem, url: p.url, category: p.categoria, source: "Redação OVC", relativeDate: dataBr(p.data), readingTime: "3 min", slug: p.slug })),
        banners: []
      });
    }

    return res.status(200).json({ posts, total: posts.length });
  } catch (e) {
    return res.status(200).json({ posts: [], total: 0, degraded: true, error: "public_api_degraded" });
  }
}

async function getPostById(id, full) {
  if (id.length >= 36) {
    const { data } = await supabase.from("posts")
      .select(full ? "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at" : "id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
      .eq("status", "publicado").eq("id", id).single();
    return data || null;
  }
  const { lo, hi } = idRange(id.slice(0,8));
  const { data } = await supabase.from("posts")
    .select(full ? "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at" : "id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
    .eq("status", "publicado").gte("id", lo).lte("id", hi).limit(1);
  return data?.[0] || null;
}

async function handleSearch(req, res, termo) {
  const COLS = "id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at";
  const { data, error } = await supabase.from("posts").select(COLS).eq("status", "publicado")
    .ilike("titulo", `%${termo}%`).order("published_at", { ascending: false }).limit(30);
  if (error) throw error;
  const posts = dedupe(data || []).map(p => formatPost(p, false)).filter(p => CATS_VALIDAS.has(p.categoria));
  return res.status(200).json({ posts, total: posts.length, query: termo });
}

async function handleOg(req, res, id) {
  const post = await getPostById(id, false).catch(() => null);
  const p = post ? formatPost(post, false) : null;
  const title = p ? p.titulo : "O Valor Capital";
  const desc = p ? (p.subtitulo || p.resumo || "").slice(0,200) : "Portal premium de notícias do Brasil.";
  const img = p?.imagem || OG_DEFAULT;
  const url = p ? ("https://ovalorcapital.com.br" + p.url) : "https://ovalorcapital.com.br";
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
  return res.status(200).send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(title)} — O Valor Capital</title><meta name="description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:site_name" content="O Valor Capital"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image"><script>window.location.replace(${JSON.stringify(url)});<\/script></head><body><p>Redirecionando para <a href="${esc(url)}">O Valor Capital</a>.</p></body></html>`);
}

async function handleGetComments(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  const { post_id } = req.query;
  try {
    const { data: comments } = await supabase.from("comentarios").select("id,user_nome,texto,created_at").eq("post_id", post_id).eq("oculto_moderacao", false).order("created_at", { ascending: true }).limit(50);
    const { data: post } = await supabase.from("posts").select("comentario_fixado").eq("id", post_id).single();
    return res.status(200).json({ comments: comments || [], pinned: post?.comentario_fixado || null });
  } catch(e) {
    return res.status(200).json({ comments: [], pinned: null, degraded: true });
  }
}

async function handlePostComment(req, res) {
  const { post_id, texto, token } = req.body || {};
  if (!post_id || !texto || !token) return res.status(400).json({ error: "post_id, texto e token obrigatórios" });
  if (texto.trim().length < 2 || texto.length > 2000) return res.status(400).json({ error: "Comentário deve ter entre 2 e 2000 caracteres" });
  let userId = null, userNome = "Usuário";
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Token inválido ou expirado" });
    userId = user.id;
    const { data: profile } = await supabase.from("profiles").select("nome,sobrenome").eq("id", userId).single();
    userNome = profile?.nome ? [profile.nome, profile.sobrenome].filter(Boolean).join(" ") : (user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário");
    const { error } = await supabase.from("comentarios").insert({ post_id, user_id: userId, user_nome: userNome, texto: texto.trim(), oculto_moderacao: false });
    if (error) throw error;
    return res.status(200).json({ ok: true, flagged: false });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleLiveData(_req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  async function safeFetch(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try { const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(timer); return r.ok ? await r.json() : null; }
    catch(_) { clearTimeout(timer); return null; }
  }
  const [awResult, brapiResult] = await Promise.allSettled([
    safeFetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL'),
    safeFetch('https://brapi.dev/api/quote/%5EBVSP,%5EIXIC,%5EDJI'),
  ]);
  const aw = awResult.status === 'fulfilled' ? awResult.value : null;
  const br = brapiResult.status === 'fulfilled' ? brapiResult.value : null;
  const brapiMap = {};
  (br?.results || []).forEach(r => { brapiMap[r.symbol] = r; });
  const data = {
    usd: aw?.USDBRL ? { valor: parseFloat(aw.USDBRL.bid), variacao: parseFloat(aw.USDBRL.pctChange) } : null,
    eur: aw?.EURBRL ? { valor: parseFloat(aw.EURBRL.bid), variacao: parseFloat(aw.EURBRL.pctChange) } : null,
    gbp: aw?.GBPBRL ? { valor: parseFloat(aw.GBPBRL.bid), variacao: parseFloat(aw.GBPBRL.pctChange) } : null,
    btc: aw?.BTCBRL ? { valor: parseFloat(aw.BTCBRL.bid), variacao: parseFloat(aw.BTCBRL.pctChange) } : null,
    ibov: brapiMap['^BVSP'] ? { valor: brapiMap['^BVSP'].regularMarketPrice, variacao: brapiMap['^BVSP'].regularMarketChangePercent } : null,
    nasdaq: brapiMap['^IXIC'] ? { valor: brapiMap['^IXIC'].regularMarketPrice, variacao: brapiMap['^IXIC'].regularMarketChangePercent } : null,
    dow: brapiMap['^DJI'] ? { valor: brapiMap['^DJI'].regularMarketPrice, variacao: brapiMap['^DJI'].regularMarketChangePercent } : null,
    impostometro: (() => { const RATE = 114155; const inicio = new Date(new Date().getFullYear() + '-01-01T03:00:00Z'); return Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 1000)) * RATE; })(),
    ratePerSec: 114155,
    ts: Date.now(),
  };
  return res.status(200).json(data);
}

function formatPost(p, full) {
  let tags = [];
  try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch(_) {}
  const categoria = tags[0] || "geral";
  const conteudo = p.conteudo || "";
  const resumo = conteudo ? conteudo.slice(0, 220).replace(/^Redação OVC.*?\n/, "").trim() + "..." : (p.comentario_fixado || "").slice(0, 220);
  const CAT_PATH = { politica:"politica", economia:"economia", negocios:"negocios", investimentos:"investimentos", seguros:"seguros", mercados:"mercados", educacao:"educacao", industria:"industria", tecnologia:"tecnologia", esportes:"esportes", saude:"saude", familia:"familia", tributacao:"tributos", regulacao:"regulacao", internacional:"internacional", parcerias:"parcerias", vc:"colunistas", colunistas:"colunistas", variedades:"variedades", investigativo:"investigativo", seguranca:"seguranca", cultura:"cultura", profissoes:"profissoes", vagas:"vagas", concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao", radar:"radar", geral:"politica" };
  const sl = slugify(p.titulo || "").slice(0, 55);
  const id8 = (p.id || "").slice(0, 8);
  const cp = CAT_PATH[categoria] || "politica";
  return { id: p.id, titulo: p.titulo || "", subtitulo: p.comentario_fixado || "", resumo, corpo: full ? conteudo : undefined, imagem: p.imagem || OG_DEFAULT, categoria, subcategoria: p.subcategoria || "", subcategoria_slug: p.subcategoria_slug || "", tags, slug: sl, url: `/${cp}/${sl}-${id8}/`, data: p.published_at || p.created_at };
}

function dedupe(rows) {
  const seenId = new Set(), seenTitulo = new Set();
  return rows.filter(p => {
    if (!p.id || !p.titulo || seenId.has(p.id)) return false;
    const tNorm = (p.titulo || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
    if (seenTitulo.has(tNorm)) return false;
    seenId.add(p.id); seenTitulo.add(tNorm); return true;
  });
}

function imgOk(url) {
  if (!url || url.length < 10) return false;
  return ![/logo/i,/icon/i,/avatar/i,/author/i,/reporter/i,/profile/i,/headshot/i,/perfil/i,/brand/i,/\.svg$/i,/\.gif$/i].some(r => r.test(url));
}

function dataBr(dt) {
  try { return dt ? new Date(dt).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }) : ""; } catch(_) { return ""; }
}

function slugify(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

function esc(v) {
  return String(v || "").replace(/[&<>\"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
}
