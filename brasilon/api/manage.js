// Brasil ON — administração mínima.
// action=sync: copia pra brasilon_posts os posts do OVC (mesmo Supabase)
// que são brasil-on/política/futebol e publicado, sempre automático (Roberto,
// 25/08/2026: "MESMA LOGICA, AUTOMATICO"), sem fila de aprovação própria.
//
// Motor de publicação no Instagram (03/09/2026) — core/instagram.js e
// core/instagram_image.js (ambos dentro de brasilon/, zero import cruzado
// com o OVC) são importados de forma DINÂMICA aqui, nunca estática — mesmo
// padrão obrigatório já estabelecido no incidente de 31/08/2026 (sharp,
// dependência nativa, derrubou TODO api/manage.js do OVC quando importado
// no topo do arquivo). Se esses 2 módulos falharem ao carregar, só a ação
// de publicar no Instagram quebra — o resto do arquivo (sync/status/config)
// continua funcionando.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let _modInstagram = null;
let _modInstagramImage = null;
async function _loadInstagram() { return _modInstagram || (_modInstagram = await import("../core/instagram.js")); }
async function _loadInstagramImage() { return _modInstagramImage || (_modInstagramImage = await import("../core/instagram_image.js")); }

const PASS = "ovc-admin-2026-secreto";
const SYNC_LOOKBACK_HORAS = 72;
const SYNC_LIMIT = 200;
const INSTAGRAM_USERNAME = "obrasilon";
const INSTAGRAM_CATEGORIES = ["politica", "policia", "brasil-on", "futebol"];
const INSTAGRAM_CONFIG_KEYS = [
  "BON_IG_ENABLED", "BON_IG_INTERVAL", "BON_IG_DAILY_LIMIT",
  "BON_IG_CATEGORIES", "BON_IG_LAYOUT_READY", "BON_IG_LAYOUT_VERSION"
];
const SITE_BASE = "https://www.obrasilon.com.br";
// Janela ativa de publicação — mesmo padrão já usado pro OVC, mantido em
// sincronia com api/manage.js (raiz). Sem cron nativo com opção de timezone
// (Vercel não tem — confirmado 30/08/2026), então o cálculo é sempre em
// UTC-3 manual.
// 04/09/2026 — Roberto pediu pausa de almoço: ativo 9h-12h BRT, pausa
// 12h-13h BRT, ativo de novo 13h-22h BRT (corte seco às 22h).
// 04/09/2026 (mesmo dia, correção) — Roberto errou o horário na primeira
// vez: o retorno correto é 14h00, não 13h00, e vale pras DUAS automações
// (OVC e Brasil ON — ver api/manage.js na raiz, atualizado junto).
const IG_AUTO_JANELA_MANHA_INICIO_BRT = 9;
const IG_AUTO_JANELA_PAUSA_INICIO_BRT = 12;
const IG_AUTO_JANELA_PAUSA_FIM_BRT = 14;
const IG_AUTO_JANELA_ATIVA_FIM_BRT = 22;
function _igAutoDentroDaJanelaAtiva() {
  const horaBRT = new Date(Date.now() - 3 * 3600 * 1000).getUTCHours();
  const manha = horaBRT >= IG_AUTO_JANELA_MANHA_INICIO_BRT && horaBRT < IG_AUTO_JANELA_PAUSA_INICIO_BRT;
  const tarde = horaBRT >= IG_AUTO_JANELA_PAUSA_FIM_BRT && horaBRT < IG_AUTO_JANELA_ATIVA_FIM_BRT;
  return manha || tarde;
}
function _igAutoDiaBRT() {
  const brt = new Date(Date.now() - 3 * 3600 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}

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

  if (action === "instagram_publish") {
    if (req.method !== "POST" || req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleInstagramPublish(req, res, req.body);
  }

  if (action === "instagram_auto_publish") {
    if (req.query.pass !== PASS && req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleInstagramAutoPublish(req, res);
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
  // 03/09/2026 — Roberto: "esquece layout" — a imagem (foto crua+caixa
  // amarela+ícone) não depende de nenhuma aprovação separada, já é o
  // comportamento padrão de core/instagram_image.js. blocker removido.
  const blockers = [];
  if (!account?.ig_user_id || !account?.token) blockers.push("credenciais_da_conta_pendentes");
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

// ══════════════════════════════════════════════════════
// PUBLICAÇÃO NO INSTAGRAM — 03/09/2026, pedido explícito de Roberto.
// Adaptado do motor real do OVC (api/manage.js raiz), simplificado pro
// caso do Brasil ON: 1 conta só (@obrasilon), conteúdo vem de
// brasilon_posts (não de posts), sem coluna metrics/ig_id nessa tabela
// — anti-duplicata e contador diário vivem 100% na tabela config, padrão
// insert-only (nunca .upsert com onConflict — a coluna key não tem
// constraint unique real, bug já documentado extensamente no OVC).
// ══════════════════════════════════════════════════════
function stripHtmlToText(html) {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<\/(p|div|h[1-6]|li|blockquote|figure|figcaption)>/gi, "\n\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "- ");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function toHashtag(value) {
  const clean = String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "");
  return clean ? "#" + clean : "";
}

// assinarBrasilOn() já troca "Redação OVC" por "BRASIL ON" no corpo — o
// bloco de assinatura aqui começa com "BRASIL ON", não "Redação OVC".
function extractCaptionBodyAndHashtags(text) {
  if (!text) return { body: "", hashtags: [] };
  let blocks = String(text).split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  if (blocks.length && /^brasil\s+on\b/i.test(blocks[0])) blocks = blocks.slice(1);
  let hashtags = [];
  if (blocks.length) {
    const words = blocks[blocks.length - 1].split(/\s+/).filter(Boolean);
    const hashWords = words.filter(w => w.startsWith("#"));
    if (words.length && hashWords.length / words.length >= 0.7) {
      hashtags = hashWords;
      blocks = blocks.slice(0, -1);
    }
  }
  return { body: blocks.join("\n\n").trim(), hashtags };
}

function normalizeCaptionText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function removeRepeatedHeadline(title, body) {
  const blocks = String(body || "").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  if (!blocks.length) return "";
  const normalizedTitle = normalizeCaptionText(title);
  const normalizedFirstBlock = normalizeCaptionText(blocks[0]);
  if (!normalizedTitle || !normalizedFirstBlock) return blocks.join("\n\n");
  const firstWords = new Set(normalizedFirstBlock.split(" "));
  const titleWords = normalizedTitle.split(" ");
  const sharedWords = titleWords.filter(word => firstWords.has(word)).length;
  const similarity = titleWords.length ? sharedWords / titleWords.length : 0;
  const isHeadlineLength = normalizedFirstBlock.length <= normalizedTitle.length + 30;
  const repeatsHeadline = normalizedFirstBlock === normalizedTitle || (isHeadlineLength && similarity >= 0.8);
  return (repeatsHeadline ? blocks.slice(1) : blocks).join("\n\n").trim();
}

const CAT_HASHTAG_LABEL = { "brasil-on": "BrasilOn", politica: "Politica", policia: "Policia", futebol: "Futebol" };
const FALLBACK_HASHTAGS = ["#Noticias", "#Brasil", "#Atualidades", "#Jornalismo", "#BrasilOn"];
const THEME_HASHTAGS = [
  [/futebol|esporte|copa|campeonato|atleta|flamengo|palmeiras|corinthians|santos|gremio|internacional/i, ["#Esportes", "#Futebol"]],
  [/pol[ií]cia|policial|preso|prisao|flagrante|assalto|roubo|homicidio|crime/i, ["#Policia", "#Seguranca"]],
  [/governo|congresso|senado|c[aâ]mara|stf|elei[cç][aã]o|pol[ií]tica/i, ["#Politica", "#Brasil"]],
  [/internacional|mundo|exterior|global|eua|estados unidos/i, ["#Internacional", "#Mundo"]]
];

function uniqueHashtags(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const tag = toHashtag(value);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function buildInstagramHashtags(post, extracted, category) {
  const source = [post?.titulo, stripHtmlToText(post?.conteudo || "")].filter(Boolean).join(" ");
  const hashtags = [...(extracted?.hashtags || [])];
  if (category && CAT_HASHTAG_LABEL[category]) hashtags.push("#" + CAT_HASHTAG_LABEL[category]);
  for (const [pattern, tags] of THEME_HASHTAGS) if (pattern.test(source)) hashtags.push(...tags);
  hashtags.push(...FALLBACK_HASHTAGS);
  let unique = uniqueHashtags(hashtags).filter(h => h.toLowerCase() !== "#brasilon");
  unique = unique.slice(0, 9);
  unique.push("#BrasilOn");
  return unique.slice(0, 10);
}

function fitInstagramCaption(body, signature, hashtags, ctaBlock) {
  const hashtagBlock = hashtags.join(" ");
  const compose = (bodyText) => [bodyText, signature, hashtagBlock, ctaBlock].filter(Boolean).join("\n\n");
  let bodyText = body.length > 1500 ? body.slice(0, 1500).replace(/\s+\S*$/, "") + "…" : body;
  let caption = compose(bodyText);
  if (caption.length <= 2200) return caption;
  const excess = caption.length - 2200;
  const nextLength = Math.max(0, bodyText.length - excess - 3);
  bodyText = bodyText.slice(0, nextLength).replace(/\s+\S*$/, "");
  if (bodyText && bodyText.length < body.length) bodyText += "…";
  caption = compose(bodyText);
  while (caption.length > 2200 && bodyText.length > 0) {
    bodyText = bodyText.slice(0, Math.max(0, bodyText.length - 40)).replace(/\s+\S*$/, "");
    if (bodyText) bodyText += "…";
    caption = compose(bodyText);
  }
  return caption;
}

function buildArticleUrl(post) {
  const slug = String(post.titulo || "")
    .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "materia";
  const id8 = String(post.id || "").slice(0, 8);
  return `${SITE_BASE}/${post.categoria || "brasil-on"}/${slug}-${id8}/`;
}

function buildInstagramCaption(post) {
  const date = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "long", year: "numeric" });
  // 03/09/2026 — reaplica assinarBrasilOn() aqui (defesa extra, não só no
  // sync). Confirmado com evidência real: posts sincronizados ANTES de
  // 26/08/2026 (quando assinarBrasilOn() foi criada) ficaram com "Redação
  // OVC" gravado permanentemente em brasilon_posts.conteudo — handleSync()
  // nunca re-processa linha já copiada. Sem isso aqui, a legenda sai com
  // "Redação OVC · {data velha}" solto no primeiro parágrafo.
  const extracted = extractCaptionBodyAndHashtags(stripHtmlToText(assinarBrasilOn(post.conteudo)));
  const body = removeRepeatedHeadline(post.titulo, extracted.body);
  const signature = "BRASIL ON — " + date;
  const hashtags = buildInstagramHashtags(post, extracted, post.categoria);
  const ctaBlock = "📲 Acesse o portal e confira a matéria na íntegra:\n" + buildArticleUrl(post);
  return fitInstagramCaption(body, signature, hashtags, ctaBlock);
}

function buildInstagramFirstComment(post) {
  const configured = stripHtmlToText(post?.comentario_fixado || "").trim();
  const text = configured || "Leia a matéria completa no Brasil ON.";
  return text.length > 2000 ? text.slice(0, 1997).replace(/\s+\S*$/, "") + "…" : text;
}

function redactSecrets(message) {
  return String(message || "")
    .replace(/access_token=([^&\s"]+)/gi, "access_token=[redacted]")
    .replace(/("access_token"\s*:\s*")[^"]+/gi, "$1[redacted]")
    .replace(/("token"\s*:\s*")[^"]+/gi, "$1[redacted]");
}

async function _igPostagemJaFeita(postId) {
  const { data } = await supabase.from("config").select("key").eq("key", `BON_IG_POSTED__${postId}`).limit(1);
  return Boolean(data && data.length);
}

async function _igClaim(postId) {
  await supabase.from("config").insert({ key: `BON_IG_POSTED__${postId}`, value: "claiming" });
}
async function _igClaimConfirmar(postId, detalhe) {
  await supabase.from("config").update({ value: JSON.stringify(detalhe) }).eq("key", `BON_IG_POSTED__${postId}`);
}
async function _igClaimDesfazer(postId) {
  await supabase.from("config").delete().eq("key", `BON_IG_POSTED__${postId}`);
}
async function _igContarHojeAuto() {
  const dia = _igAutoDiaBRT();
  const { count } = await supabase.from("config").select("key", { count: "exact", head: true }).ilike("key", `BON_IG_AUTO_COUNT_${dia}__%`);
  return count || 0;
}
async function _igRegistrarContadorDiario() {
  const dia = _igAutoDiaBRT();
  const rowKey = `BON_IG_AUTO_COUNT_${dia}__${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await supabase.from("config").insert({ key: rowKey, value: "1" });
}

async function _igPublicarPost(post) {
  const imageUrl = String(post.imagem || "").trim();
  if (!/^https?:\/\//i.test(imageUrl)) throw new Error("post_sem_imagem_publica");

  const caption = buildInstagramCaption(post);
  const { prepareInstagramImage } = await _loadInstagramImage();
  const { publish, postComment, getAccount } = await _loadInstagram();
  const instagramImage = await prepareInstagramImage({ sourceUrl: imageUrl, postId: post.id, supabase, title: post.titulo });
  const ig = await publish(instagramImage.url, caption);

  const firstCommentText = buildInstagramFirstComment(post);
  let firstComment = null;
  let firstCommentError = null;
  if (firstCommentText) {
    try {
      const account = await getAccount();
      firstComment = await postComment(ig.id, firstCommentText, account?.token);
    } catch (commentError) {
      firstCommentError = redactSecrets(commentError?.message || String(commentError));
    }
  }

  return {
    ig_id: ig.id,
    username: ig.username,
    image_url: instagramImage.url,
    published_at: new Date().toISOString(),
    caption,
    first_comment_text: firstCommentText,
    first_comment_id: firstComment?.id || null,
    first_comment_error: firstCommentError
  };
}

// Manual — Roberto escolhe uma matéria específica no admin.
async function handleInstagramPublish(req, res, body) {
  const postId = String(body?.post_id || "").trim();
  if (!postId) return res.status(400).json({ ok: false, error: "post_id_obrigatorio" });

  const { data: post, error } = await supabase.from("brasilon_posts").select("*").eq("id", postId).single();
  if (error || !post) return res.status(404).json({ ok: false, error: "post_not_found" });

  try {
    const resultado = await _igPublicarPost(post);
    await supabase.from("config").delete().eq("key", `BON_IG_POSTED__${postId}`);
    await supabase.from("config").insert({ key: `BON_IG_POSTED__${postId}`, value: JSON.stringify(resultado) });
    return res.status(200).json({ ok: true, ...resultado });
  } catch (e) {
    const safeError = redactSecrets(e?.message || String(e));
    return res.status(200).json({ ok: false, error: safeError });
  }
}

// Automático — disparado pelo cron nativo da Vercel (brasilon/vercel.json).
async function handleInstagramAutoPublish(req, res) {
  if (!_igAutoDentroDaJanelaAtiva()) {
    return res.status(200).json({ ok: true, skipped: true, reason: "fora_da_janela_ativa_09_12_14_22_brt" });
  }

  try {
    const [config, account] = await Promise.all([readInstagramConfig(), getInstagramAccount()]);
    if (!config.enabled) return res.status(200).json({ ok: true, skipped: true, reason: "automacao_desligada_no_admin" });
    const blockers = instagramReadiness(config, account);
    if (blockers.length) return res.status(200).json({ ok: true, skipped: true, reason: "automacao_nao_pronta", blockers });

    const publicadosHoje = await _igContarHojeAuto();
    if (publicadosHoje >= config.dailyLimit) {
      return res.status(200).json({ ok: true, skipped: true, reason: "limite_diario_atingido", publicados_hoje: publicadosHoje, limite: config.dailyLimit });
    }

    const { data: candidatos, error } = await supabase.from("brasilon_posts")
      .select("id,titulo,conteudo,comentario_fixado,imagem,categoria,status,published_at")
      .eq("status", "publicado")
      .in("categoria", config.categories)
      .order("published_at", { ascending: true })
      .limit(50);
    if (error) throw error;

    let post = null;
    for (const candidato of candidatos || []) {
      if (await _igPostagemJaFeita(candidato.id)) continue;
      post = candidato;
      break;
    }
    if (!post) return res.status(200).json({ ok: true, skipped: true, reason: "nenhum_candidato_elegivel", publicados_hoje: publicadosHoje });

    await _igClaim(post.id);
    try {
      const resultado = await _igPublicarPost(post);
      await _igClaimConfirmar(post.id, resultado);
      await _igRegistrarContadorDiario();
      return res.status(200).json({ ok: true, published: true, post_id: post.id, titulo: post.titulo, publicados_hoje: publicadosHoje + 1, ...resultado });
    } catch (e) {
      await _igClaimDesfazer(post.id);
      const safeError = redactSecrets(e?.message || String(e));
      return res.status(200).json({ ok: false, error: safeError, post_id: post.id });
    }
  } catch (e) {
    const safeError = redactSecrets(e?.message || String(e));
    return res.status(200).json({ ok: false, error: safeError });
  }
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

