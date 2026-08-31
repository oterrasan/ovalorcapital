// Brasil ON — administração mínima.
// action=sync: copia pra brasilon_posts os posts do OVC (mesmo Supabase)
// que são brasil-on/política/futebol e publicado, sempre automático (Roberto,
// 25/08/2026: "MESMA LOGICA, AUTOMATICO"), sem fila de aprovação própria.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASS = "ovc-admin-2026-secreto";
const SYNC_LOOKBACK_HORAS = 72;
const SYNC_LIMIT = 200;
const INSTAGRAM_USERNAME = "obrasilon";
const INSTAGRAM_CATEGORIES = ["politica", "policia", "brasil-on", "futebol"];
const INSTAGRAM_CONFIG_KEYS = [
  "BON_IG_ENABLED", "BON_IG_INTERVAL", "BON_IG_DAILY_LIMIT",
  "BON_IG_CATEGORIES", "BON_IG_LAYOUT_READY", "BON_IG_LAYOUT_VERSION"
];

export default async function handler(req, res) {
  // CORS liberado — o admin único do OVC (ovalorcapital.com.br) chama esta
  // rota de outro domínio pra mostrar status/disparar sync do Brasil ON.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = String(req.query.action || req.body?.action || "");

  if (action === "sync") {
    if (req.query.pass !== PASS && req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleSync(req, res);
  }

  if (action === "status") {
    if (req.query.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleStatus(req, res);
  }

  if (action === "instagram_status") {
    if (req.query.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleInstagramStatus(req, res);
  }

  if (action === "instagram_config") {
    if (req.method !== "POST" || req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleInstagramConfig(req, res);
  }

  if (action === "instagram_account") {
    if (req.method !== "POST" || req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleInstagramAccount(req, res);
  }

  return res.status(400).json({ error: "action inválida" });
}

async function readInstagramConfig() {
  const { data, error } = await supabase.from("config")
    .select("key,value,updated_at")
    .in("key", INSTAGRAM_CONFIG_KEYS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const latest = {};
  for (const row of data || []) if (!(row.key in latest)) latest[row.key] = row.value;
  let categories = [...INSTAGRAM_CATEGORIES];
  try {
    const parsed = JSON.parse(latest.BON_IG_CATEGORIES || "[]");
    if (Array.isArray(parsed) && parsed.length) categories = parsed.filter(v => INSTAGRAM_CATEGORIES.includes(v));
  } catch (_) {}
  return {
    enabled: latest.BON_IG_ENABLED === "on",
    interval: Math.max(15, Number(latest.BON_IG_INTERVAL || 15)),
    dailyLimit: Math.min(100, Math.max(1, Number(latest.BON_IG_DAILY_LIMIT || 60))),
    categories,
    layoutReady: latest.BON_IG_LAYOUT_READY === "yes",
    layoutVersion: latest.BON_IG_LAYOUT_VERSION || null
  };
}

async function setInstagramConfig(key, value) {
  await supabase.from("config").delete().eq("key", key);
  const { error } = await supabase.from("config").insert({ key, value: String(value), updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function getInstagramAccount() {
  const { data, error } = await supabase.from("ig_accounts")
    .select("id,username,ig_user_id,token,active,distribuicao_automatica,limite_diario")
    .eq("username", INSTAGRAM_USERNAME)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function instagramReadiness(config, account) {
  const blockers = [];
  if (!account?.ig_user_id || !account?.token) blockers.push("credenciais_da_conta_pendentes");
  if (!config.layoutReady) blockers.push("layout_pendente");
  return blockers;
}

async function handleInstagramStatus(req, res) {
  try {
    const [config, account] = await Promise.all([readInstagramConfig(), getInstagramAccount()]);
    const blockers = instagramReadiness(config, account);
    return res.status(200).json({
      ok: true,
      portal: "brasilon",
      source: "brasilon_posts",
      username: INSTAGRAM_USERNAME,
      config,
      account: account ? {
        id: account.id,
        username: account.username,
        ig_user_id: account.ig_user_id || "",
        token_configured: Boolean(account.token)
      } : null,
      ready: blockers.length === 0,
      blockers,
      automation_active: config.enabled && blockers.length === 0
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

async function handleInstagramConfig(req, res) {
  try {
    const current = await readInstagramConfig();
    const categories = Array.isArray(req.body?.categories)
      ? req.body.categories.filter(v => INSTAGRAM_CATEGORIES.includes(v))
      : current.categories;
    if (!categories.length) return res.status(400).json({ ok: false, error: "selecione_uma_categoria" });

    const interval = Math.max(15, Number(req.body?.interval || current.interval));
    const dailyLimit = Math.min(100, Math.max(1, Number(req.body?.dailyLimit || current.dailyLimit)));
    const wantsEnabled = req.body?.enabled === true;
    const account = await getInstagramAccount();
    const blockers = instagramReadiness(current, account);
    if (wantsEnabled && blockers.length) {
      return res.status(409).json({ ok: false, error: "automacao_nao_pronta", blockers });
    }

    await Promise.all([
      setInstagramConfig("BON_IG_ENABLED", wantsEnabled ? "on" : "off"),
      setInstagramConfig("BON_IG_INTERVAL", interval),
      setInstagramConfig("BON_IG_DAILY_LIMIT", dailyLimit),
      setInstagramConfig("BON_IG_CATEGORIES", JSON.stringify(categories))
    ]);
    return res.status(200).json({ ok: true, enabled: wantsEnabled, interval, dailyLimit, categories });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

async function handleInstagramAccount(req, res) {
  try {
    const igUserId = String(req.body?.ig_user_id || "").trim();
    const token = String(req.body?.token || "").trim();
    const existing = await getInstagramAccount();
    const patch = {
      username: INSTAGRAM_USERNAME,
      ig_user_id: igUserId || existing?.ig_user_id || "",
      active: false,
      distribuicao_automatica: false,
      limite_diario: Number(existing?.limite_diario || 60)
    };
    if (token) patch.token = token;
    let error;
    if (existing) {
      ({ error } = await supabase.from("ig_accounts").update(patch).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("ig_accounts").insert({ ...patch, token: token || "", posts_hoje: 0 }));
    }
    if (error) throw error;
    return res.status(200).json({ ok: true, username: INSTAGRAM_USERNAME, token_configured: Boolean(token || existing?.token) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

// Busca no OVC (posts) os candidatos brasil-on/política/futebol publicados
// recentes, e insere no brasilon_posts os que ainda não foram copiados
// (dedup por origem_post_id, que TEM constraint unique real criada no
// schema — upsert com onConflict é seguro aqui, diferente do bug já
// documentado na tabela config do OVC, que não tem constraint).
async function handleSync(req, res) {
  try {
    const cutoff = new Date(Date.now() - SYNC_LOOKBACK_HORAS * 3600000).toISOString();

    const { data: candidatos, error } = await supabase.from("posts")
      .select("id,titulo,conteudo,comentario_fixado,imagem,metrics,user_tags,subcategoria_slug,created_at,published_at,updated_at,status")
      .eq("status", "publicado")
      .gte("published_at", cutoff)
      .order("published_at", { ascending: false })
      .limit(SYNC_LIMIT);
    if (error) throw error;

    const alvos = (candidatos || [])
      .map(p => ({ post: p, categoria: classificar(p) }))
      .filter(x => x.categoria);

    const porCategoria = {};
    alvos.forEach(a => { porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1; });

    if (!alvos.length) return res.status(200).json({ ok: true, candidatos: (candidatos || []).length, sincronizados: 0, porCategoria });

    const ids = alvos.map(a => a.post.id);
    const { data: existentes } = await supabase.from("brasilon_posts").select("origem_post_id").in("origem_post_id", ids);
    const jaExiste = new Set((existentes || []).map(r => r.origem_post_id));

    const novos = alvos.filter(a => !jaExiste.has(a.post.id));
    if (!novos.length) return res.status(200).json({ ok: true, candidatos: candidatos.length, sincronizados: 0, porCategoria });

    const rows = novos.map(({ post, categoria }) => ({
      origem_post_id: post.id,
      categoria,
      titulo: post.titulo,
      conteudo: assinarBrasilOn(post.conteudo),
      comentario_fixado: post.comentario_fixado || "",
      meta_title: (post.metrics && post.metrics.meta_title) || post.titulo,
      imagem: post.imagem || "",
      status: "publicado",
      created_at: post.created_at,
      published_at: post.published_at || post.created_at,
      updated_at: post.updated_at || post.published_at || post.created_at
    }));

    const { error: insertErr } = await supabase.from("brasilon_posts").insert(rows);
    if (insertErr) throw insertErr;

    return res.status(200).json({ ok: true, candidatos: candidatos.length, sincronizados: rows.length, porCategoria });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

// Palavras que indicam matéria de polícia/crime — usadas só para separar
// esse recorte de dentro do que seria brasil-on genérico. Não existe
// subcategoria estruturada de "polícia" no OVC (cai em Cotidiano/Geral),
// então a única forma barata (sem gastar cota de IA) de identificar é
// por palavra-chave no título/meta descrição — mesmo padrão já usado
// pros widgets de Eleições/Fofoca em public/js/widgets.js.
const POLICIA_KW = [
  "polícia", "policial", "delegacia", "delegado", "preso em", "prisão de",
  "foi preso", "detido", "suspeito de", "flagrante", "assalto", "assaltou",
  "roubo", "roubou", "furto", "furtou", "homicídio", "assassinato",
  "assassinado", "tráfico de drogas", "operação policial",
  "investigação criminal", "sequestro", "chacina", "crime organizado",
  "facção", "tiroteio", "baleado", "esfaqueado", "estupro", "feminicídio",
  "corpo encontrado", "mandado de prisão"
];
function pareceCrimePolicial(titulo, resumo) {
  const texto = ((titulo || "") + " " + (resumo || "")).toLowerCase();
  return POLICIA_KW.some(kw => texto.includes(kw));
}

// Roberto, 26/08/2026: "as materias nao devem ser assinadas como redacao
// ovc, assine como BRASIL On e a data apenas." Os kernels de IA do OVC
// sempre abrem o corpo com "<p><strong>Redação OVC</strong> · {data}</p>"
// — troca a assinatura pro nome do Brasil ON, sem a palavra "Redação".
function assinarBrasilOn(conteudo) {
  return String(conteudo || "").replace(/Reda[çc][ãa]o\s+OVC/gi, "BRASIL ON");
}

// Classifica um post do OVC como 'brasil-on', 'politica', 'policia',
// 'futebol' ou null (fora do escopo do Brasil ON). Roberto, 27/08/2026:
// "o brasil on nao pode ter duas categorias apenas... precisa de uma
// inteligencia organizando melhor politica, noticias, policia, esportes".
// Tudo aqui é regra fixa em cima de metadado que o OVC já gerou (tag +
// palavra-chave) — zero chamada de IA nova, continua sendo um DE-PARA.
// user_tags é TEXT (JSON array) — nunca .contains(), sempre parse manual
// (mesma regra do resto do OVC).
function classificar(post) {
  let tags = [];
  try { tags = JSON.parse(post.user_tags || "[]"); } catch (_) {}
  if (tags.includes("esportes") && post.subcategoria_slug === "futebol") return "futebol";
  if (tags.includes("politica")) return "politica";
  if (tags.includes("brasil-on")) {
    return pareceCrimePolicial(post.titulo, post.comentario_fixado) ? "policia" : "brasil-on";
  }
  return null;
}

async function handleStatus(req, res) {
  const { count: total } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true });
  const { count: brasilOn } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "brasil-on");
  const { count: politica } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "politica");
  const { count: policia } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "policia");
  const { count: futebol } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "futebol");
  const { data: ultimos } = await supabase.from("brasilon_posts").select("titulo,categoria,published_at").order("published_at", { ascending: false }).limit(5);
  return res.status(200).json({ total: total || 0, "brasil-on": brasilOn || 0, politica: politica || 0, policia: policia || 0, futebol: futebol || 0, ultimos: ultimos || [] });
}

