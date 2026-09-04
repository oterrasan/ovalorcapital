import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { detectPublicationLocation } from "../core/instagram_location.js";
import { rewritePortal, rewriteColuna } from "../core/ai_portal.js";

// 🚨 REGRA PERMANENTE — INCIDENTE 31/08/2026 (FUNCTION_INVOCATION_FAILED em TODA
// ação de api/manage.js, admin em tela preta + Instagram automático parado):
// core/instagram.js e core/instagram_image.js eram importados de forma ESTÁTICA
// no topo do arquivo. core/instagram_image.js usa "sharp" — biblioteca nativa/
// binária conhecida por falhar ao carregar quando o binário compilado não bate
// com o container serverless (falha SEM nenhum commit novo, só recriando o
// container). Import estático = QUALQUER falha ao carregar QUALQUER um desses 2
// arquivos derruba TODO o módulo — ou seja, TODAS as ~40 ações de api/manage.js
// (vendor_js, colunistas, aprovação de posts, editor IA, etc.), mesmo as que nada
// têm a ver com Instagram.
// Fix: import() DINÂMICO, carregado sob demanda só dentro da função que usa, com
// try/catch — se esses 2 módulos falharem, SÓ a ação de publicar/pré-visualizar
// no Instagram retorna erro limpo em JSON; o resto do arquivo continua funcionando.
// (core/instagram_location.js e core/ai_portal.js NÃO usam bibliotecas nativas —
// só JS/dados puros — por isso continuam import estático, sem esse risco.)
// ❌ NUNCA voltar a transformar isto em `import { x } from "../core/instagram.js"`
// ou `"../core/instagram_image.js"` no topo do arquivo — usar sempre os helpers
// _loadInstagram()/_loadInstagramImage() abaixo.
let _modInstagram = null, _modInstagramImage = null;
async function _loadInstagram() { return _modInstagram || (_modInstagram = await import("../core/instagram.js")); }
async function _loadInstagramImage() { return _modInstagramImage || (_modInstagramImage = await import("../core/instagram_image.js")); }

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const OLD_REF = "bfsegqdgscudtdgwdyci";
const ADMIN_PASS = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || "ovc-admin-2026-secreto";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function writeLog(level, message) {
  try { await supabase.from('logs').insert({ level, message }); } catch(_) {}
}


const VENDOR_JS = {
  react: "https://unpkg.com/react@18/umd/react.production.min.js",
  "react-dom": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  babel: "https://unpkg.com/@babel/standalone@7/babel.min.js",
  supabase: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  html2canvas: "https://html2canvas.hertzen.com/dist/html2canvas.min.js"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    if (req.method === "GET") {
      const action = String(req.query.action || "");
      if (action === "vendor_js") return handleVendorJs(req, res);
      if (action === "validate-token") return res.status(200).json({ valid: String(req.query.token || "") === ADMIN_PASS });
      if (action === "list_colunistas") return handleListColunistas(res);
      if (action === "setup_storage") return handleSetupStorage(res);
      if (action === "limpar_pendentes_antigos") return handleLimparPendentesAntigos(req, res);
      if (action === "categorizar_rss") return handleCategorizarRss(req, res);
      if (action === "archive_old_rss") return handleArchiveOldRss(req, res);
      if (action === "limpar_imagens_espurias") return handleLimparImagensEspurias(req, res);
      if (action === "get_pesquisa_eleitoral") return handleGetPesquisa(res);
      if (action === "update_pesquisa_eleitoral") return handleUpdatePesquisa(req, res);
      if (action === "nota_luto_status") return handleNotaLutoStatus(res);
      if (action === "nota_luto_toggle") return handleNotaLutoToggle(req, res);
      if (action === "interruptor_status") return handleInterruptorStatus(req, res);
      if (action === "interruptor_toggle") return handleInterruptorToggle(req, res);
      if (action === "banners") return handleBanners(req, res);
      if (action === "list_posts_colunista") return handleListPostsColunista(req, res);
      return handleStatus(res);
    }

    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const body = req.body || {};
    const action = String(body.action || req.query.action || "");

    if (action === "create_colunista") return handleCreateColunista(req, res, body);
    if (action === "login_colunista") return handleLoginColunista(req, res, body);
    if (action === "update_colunista_photo") return handleUpdateColunistaPhoto(req, res, body);
    if (action === "toggle_colunista") return handleToggleColunista(req, res, body);
    if (action === "delete_colunista") return handleDeleteColunista(req, res, body);
    if (action === "submit_colunista_post") return handleSubmitColunistaPost(req, res, body);
    if (action === "admin_colunista_post") return handleAdminColunistaPost(req, res, body);
    if (action === "ig_publish") return handleIgPublish(req, res, body);
    if (action === "ig_preview") return handleIgPreview(req, res, body);
    if (action === "ig_auto_publish") return handleIgAutoPublish(req, res, body);
    if (action === "revisar_texto_ia") return handleRevisarTextoIA(req, res, body);
    if (action === "gerar_coluna") return handleGerarColuna(req, res, body);
    if (["aprovar", "rejeitar", "editar_aprovar", "aprovar_lote", "rejeitar_lote"].includes(action)) return handleApprovePortal(res, body);
    if (action === "track_view") return handleTrackView(res, body);
    if (action === "newsletter_subscribe") return handleNewsletterSubscribe(res, body);
    if (body.id && !action) return handleApprovePortal(res, { id: body.id, action: "aprovar" });

    return res.status(200).json({ ok: false, degraded: true, error: "acao_indisponivel_no_modo_emergencia" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

async function handleVendorJs(req, res) {
  const name = String(req.query.name || "");
  const url = VENDOR_JS[name];
  if (!url) return res.status(404).send("not found");

  const upstream = await fetch(url);
  if (!upstream.ok) return res.status(502).send("vendor unavailable");
  let code = await upstream.text();

  if (name === "supabase") {
    code += `\n;(function(){\n  var NEW_URL=${JSON.stringify(SUPABASE_URL)};\n  var NEW_KEY=${JSON.stringify(SUPABASE_KEY)};\n  var OLD_REF=${JSON.stringify(OLD_REF)};\n  window.SUPABASE_ANON_KEY=NEW_KEY;\n  if(window.supabase&&window.supabase.createClient){\n    var original=window.supabase.createClient.bind(window.supabase);\n    window.supabase.createClient=function(url,key,options){\n      try{ if(String(url||'').indexOf(OLD_REF)>=0){ return original(NEW_URL, NEW_KEY, options); } }catch(e){}\n      return original(url||NEW_URL, key||NEW_KEY, options);\n    };\n  }\n})();`;
  }

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.status(200).send(code);
}

async function handleStatus(res) {
  // BUG REAL (30/08/2026, Roberto reportou "Posts Hoje: 0" às 21h07 BRT) — a versão
  // anterior usava o DIA UTC ATUAL (today.getUTCDate()) pra montar "hoje às 03:00 UTC".
  // Entre 21h00 e 00h00 BRT, o dia UTC já virou (BRT=UTC-3), então esse limite virava
  // um horário NO FUTURO em relação ao "agora" — a query `created_at >= start` nunca
  // batia, e o card sempre mostrava 0, todo dia, nessa janela de 3h — mesmo com posts
  // reais sendo gerados (confirmado comparando com "Categorias Hoje", calculado no
  // client com a lógica correta abaixo, que nunca teve esse bug).
  // Fix: mesma técnica já usada e comprovada certa em contarHoje() (api/run_portal.js)
  // — desloca "agora" 3h pra trás (BRT), aí sim extrai o dia/mês/ano, e remonta o
  // limite de 03:00 UTC a partir da data BRT real, nunca do dia UTC corrente.
  const nowBRT = new Date(Date.now() - 3 * 3600 * 1000);
  const start = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate(), 3, 0, 0));

  const [autoCfg, maxCfg, pendentes, erros, hoje, youtube] = await Promise.allSettled([
    supabase.from("config").select("value").eq("key", "AUTOMATION").maybeSingle(),
    supabase.from("config").select("value").eq("key", "MAX_POSTS_DIA").maybeSingle(),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "error"),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
    supabase.from("config").select("value").eq("key", "YOUTUBE_LIVE_URL").maybeSingle()
  ]);

  return res.status(200).json({
    running: autoCfg.value?.data?.value === "on",
    posts_hoje: hoje.value?.count || 0,
    max_posts: Number(maxCfg.value?.data?.value || 300),
    pendentes: pendentes.value?.count || 0,
    erros: erros.value?.count || 0,
    youtube_live_url: youtube.value?.data?.value || null,
    supabase_project: "yntwvfcxjardzafdqanj",
    emergency_manage: true
  });
}

async function handleSetupStorage(res) {
  const { error } = await supabase.storage.createBucket("posts-images", { public: true });
  if (error && !String(error.message || "").toLowerCase().includes("already")) return res.status(200).json({ ok: false, error: error.message });
  // 01/09/2026 — bucket de vídeo das matérias. Best-effort e silencioso —
  // o admin também tenta criar sob demanda antes do primeiro upload (não
  // depende de alguém clicar neste botão), isto aqui é só redundância.
  try { await supabase.storage.createBucket("post-videos", { public: true }); } catch (_) {}
  return res.status(200).json({ ok: true });
}

async function handleApprovePortal(res, body) {
  const now = new Date().toISOString();
  const { id, ids, action, titulo, conteudo, imagem, comentario_fixado, video_url } = body;

  if (action === "aprovar" && id) {
    const { error } = await supabase.from("posts").update({ status: "publicado", approved: true, published_at: now, updated_at: now }).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "aprovado", id });
  }

  if (action === "rejeitar" && id) {
    const { error } = await supabase.from("posts").update({ status: "rejeitado", approved: false, updated_at: now }).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "rejeitado", id });
  }

  if (action === "editar_aprovar" && id) {
    const patch = { titulo, conteudo, imagem, comentario_fixado, video_url, status: "publicado", approved: true, published_at: now, updated_at: now };
    const { error } = await supabase.from("posts").update(patch).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "editado_aprovado", id });
  }

  if (action === "aprovar_lote" && Array.isArray(ids)) {
    const { error } = await supabase.from("posts").update({ status: "publicado", approved: true, published_at: now, updated_at: now }).in("id", ids);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "lote_aprovado", total: ids.length });
  }

  if (action === "rejeitar_lote" && Array.isArray(ids)) {
    const { error } = await supabase.from("posts").update({ status: "rejeitado", approved: false, updated_at: now }).in("id", ids);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "lote_rejeitado", total: ids.length });
  }

  return res.status(400).json({ ok: false, error: "missing_params" });
}

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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "");
  return clean ? "#" + clean : "";
}

function parseJsonMaybe(value, fallback) {
  if (value && typeof value === "object") return value;
  try { return JSON.parse(value || ""); } catch (_) { return fallback; }
}

function extractCaptionBodyAndHashtags(text) {
  if (!text) return { body: "", hashtags: [] };
  let blocks = String(text).split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  if (blocks.length && /^reda[çc][ãa]o\s+ovc\b/i.test(blocks[0])) blocks = blocks.slice(1);
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
    .replace(/[\u0300-\u036f]/g, "")
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
  const repeatsHeadline = normalizedFirstBlock === normalizedTitle ||
    (isHeadlineLength && similarity >= 0.8);

  return (repeatsHeadline ? blocks.slice(1) : blocks).join("\n\n").trim();
}

const CAT_HASHTAG_LABEL = {
  "brasil-on": "BrasilOn",
  politica: "Politica",
  economia: "Economia",
  financas: "Financas",
  negocios: "Negocios",
  tecnologia: "Tecnologia",
  internacional: "Internacional",
  industria: "Industria",
  familia: "Familia",
  esportes: "Esportes",
  vc: "VC",
  colunistas: "Colunistas"
};

const FALLBACK_HASHTAGS = [
  "#Noticias",
  "#Brasil",
  "#Economia",
  "#Politica",
  "#Mercado",
  "#Financas",
  "#Atualidades",
  "#Jornalismo",
  "#LiberdadeEconomica"
];

const THEME_HASHTAGS = [
  [/eua|estados unidos|washington|nova york|california|florida/i, ["#EUA", "#EstadosUnidos", "#Internacional"]],
  [/internacional|mundo|exterior|global/i, ["#Internacional", "#Mundo"]],
  [/crime|assassin|homic[ií]dio|matar|facada|pris[aã]o|culpad|tribunal|justi[cç]a/i, ["#Crime", "#Justica", "#Tribunal"]],
  [/governo|congresso|senado|c[aâ]mara|stf|elei[cç][aã]o|pol[ií]tica/i, ["#Politica", "#Brasil"]],
  [/economia|mercado|juros|banco central|infla[cç][aã]o|d[oó]lar|bolsa/i, ["#Economia", "#Mercado", "#Financas"]],
  [/fam[ií]lia|educa[cç][aã]o|sa[uú]de|comportamento/i, ["#Familia", "#Sociedade"]],
  [/tecnologia|intelig[eê]ncia artificial|startup|inova[cç][aã]o/i, ["#Tecnologia", "#Inovacao"]],
  [/futebol|esporte|copa|campeonato|atleta/i, ["#Esportes", "#Futebol"]]
];

function uniqueHashtags(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const tag = String(value || "").startsWith("#") ? toHashtag(value) : toHashtag(value);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

function buildInstagramHashtags(post, extracted, category) {
  const source = [post?.titulo, post?.subcategoria, stripHtmlToText(post?.conteudo || "")].filter(Boolean).join(" ");
  const hashtags = [];
  hashtags.push(...(extracted?.hashtags || []));
  if (category && CAT_HASHTAG_LABEL[category]) hashtags.push("#" + CAT_HASHTAG_LABEL[category]);
  hashtags.push(toHashtag(post?.subcategoria));
  for (const [pattern, tags] of THEME_HASHTAGS) {
    if (pattern.test(source)) hashtags.push(...tags);
  }
  hashtags.push(...FALLBACK_HASHTAGS);

  let unique = uniqueHashtags(hashtags).filter(h => h.toLowerCase() !== "#ovalorcapital");
  unique = unique.slice(0, 9);
  unique.push("#OValorCapital");
  return unique.slice(0, 10);
}

function fitInstagramCaption(body, signature, hashtags, ctaBlock, location) {
  const hashtagBlock = hashtags.join(" ");
  const locationBlock = location ? `📍 ${location}` : "";
  const compose = (bodyText) => [locationBlock, bodyText, signature, hashtagBlock, ctaBlock].filter(Boolean).join("\n\n");
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

// URL real do portal para a matéria — mesmo esquema usado por api/portal-posts.js
// (formatPost) e public/js/ovc-cards.js (buildUrl): /{categoria}/{slug}-{id8}/.
// O lookup em api/article.js resolve o artigo só pelo id8, então o slug/categoria
// aqui não precisam bater 100% com o canonical — o link sempre abre a matéria certa.
const SITE_BASE = "https://www.ovalorcapital.com.br";
const IG_CAT_PATH = {
  "brasil-on": "brasil-on", politica: "politica", economia: "economia",
  financas: "financas", negocios: "negocios", tecnologia: "tecnologia",
  internacional: "internacional", industria: "industria", familia: "familia",
  esportes: "esportes", vc: "colunistas", colunistas: "colunistas"
};

function buildArticleUrl(post) {
  const tags = Array.isArray(post.user_tags) ? post.user_tags : parseJsonMaybe(post.user_tags, []);
  const categoria = tags[0] || "politica";
  const catPath = IG_CAT_PATH[categoria] || "politica";
  const slug = slugify(post.titulo || "") || "materia";
  const id8 = String(post.id || "").slice(0, 8);
  return `${SITE_BASE}/${catPath}/${slug}-${id8}/`;
}

function buildInstagramCaption(post) {
  const date = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const tags = Array.isArray(post.user_tags) ? post.user_tags : parseJsonMaybe(post.user_tags, []);
  const category = tags[0] || "";
  const extracted = extractCaptionBodyAndHashtags(stripHtmlToText(post.conteudo));
  const body = removeRepeatedHeadline(post.titulo, extracted.body);
  const location = detectPublicationLocation(post.titulo, body);
  const signature = "Redação OVC — " + date;
  const hashtags = buildInstagramHashtags(post, extracted, category);
  // Pedido explícito de Roberto (25/08/2026): toda publicação termina com CTA + link real da matéria.
  const ctaBlock = "📲 Acesse o portal e confira a matéria na íntegra:\n" + buildArticleUrl(post);
  return fitInstagramCaption(body, signature, hashtags, ctaBlock, location);
}

function buildInstagramFirstComment(post) {
  const configured = stripHtmlToText(post?.comentario_fixado || "").trim();
  const text = configured || "Leia a matéria completa no O Valor Capital.";
  return text.length > 2000 ? text.slice(0, 1997).replace(/\s+\S*$/, "") + "…" : text;
}

function redactSecrets(message) {
  return String(message || "")
    .replace(/access_token=([^&\s"]+)/gi, "access_token=[redacted]")
    .replace(/("access_token"\s*:\s*")[^"]+/gi, "$1[redacted]")
    .replace(/("token"\s*:\s*")[^"]+/gi, "$1[redacted]");
}

async function handleIgPublish(req, res, body) {
  const postId = String(body?.post_id || body?.id || "").trim();
  if (!postId) return res.status(400).json({ ok: false, error: "post_id_obrigatorio" });

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error || !post) return res.status(404).json({ ok: false, error: "post_not_found" });

  const imageUrl = String(post.imagem || "").trim();
  if (!/^https?:\/\//i.test(imageUrl)) {
    return res.status(400).json({ ok: false, error: "post_sem_imagem_publica" });
  }

  const accountId = body?.account_id || body?.ig_account_id || post.ig_account_id || null;
  const caption = buildInstagramCaption(post);
  const now = new Date().toISOString();

  try {
    const { prepareInstagramImage } = await _loadInstagramImage();
    const { publish, getAccount, postComment, likeMedia } = await _loadInstagram();
    const instagramImage = await prepareInstagramImage({ sourceUrl: imageUrl, postId: post.id, supabase, title: post.titulo });
    const ig = await publish(instagramImage.url, caption, accountId);
    const firstCommentText = buildInstagramFirstComment(post);
    let firstComment = null;
    let firstCommentError = null;
    let selfLike = null;
    let selfLikeError = null;
    if (firstCommentText) {
      try {
        const account = await getAccount(ig.account_id);
        firstComment = await postComment(ig.id, firstCommentText, account?.token);
      } catch (commentError) {
        firstCommentError = redactSecrets(commentError?.message || String(commentError));
      }
    }
    try {
      selfLike = await likeMedia(ig.id, ig.account_id);
    } catch (likeError) {
      selfLikeError = redactSecrets(likeError?.message || String(likeError));
    }
    const metrics = parseJsonMaybe(post.metrics, {});
    const nextStatus = post.status === "publicado" ? post.status : "success";
    const patch = {
      status: nextStatus,
      ig_id: ig.id,
      ig_account_id: ig.account_id,
      approved: true,
      updated_at: now,
      metrics: {
        ...metrics,
        instagram: {
          ig_id: ig.id,
          account_id: ig.account_id,
          username: ig.username,
          image_url: instagramImage.url,
          image_path: instagramImage.path,
          published_at: now,
          quota_before_publish: ig.quota_before || null,
          first_comment_text: firstCommentText,
          first_comment_id: firstComment?.id || null,
          first_comment_error: firstCommentError,
          self_like_success: selfLike?.success === true,
          self_like_error: selfLikeError
        }
      }
    };
    if (post.status !== "publicado") patch.published_at = now;

    const { error: updateError } = await supabase.from("posts").update(patch).eq("id", post.id);
    if (updateError) {
      const fallbackPatch = {
        status: nextStatus,
        ig_account_id: ig.account_id,
        approved: true,
        updated_at: now,
        metrics: patch.metrics
      };
      if (post.status !== "publicado") fallbackPatch.published_at = now;
      const { error: fallbackError } = await supabase.from("posts").update(fallbackPatch).eq("id", post.id);
      if (fallbackError) throw updateError;
    }

    return res.status(200).json({
      ok: true,
      ig_id: ig.id,
      account_id: ig.account_id,
      username: ig.username,
      first_comment_id: firstComment?.id || null,
      first_comment_error: firstCommentError,
      self_like_success: selfLike?.success === true,
      self_like_error: selfLikeError
    });
  } catch (e) {
    const safeError = redactSecrets(e?.message || String(e));
    await writeLog("error", `[ig-auto] falha: ${safeError}`);
    try {
      await supabase.from("posts").update({ error_msg: safeError, updated_at: now }).eq("id", post.id);
    } catch (_) {}
    return res.status(200).json({ ok: false, error: safeError });
  }
}

// ══════════════════════════════════════════════════════
// PUBLICAÇÃO AUTOMÁTICA NO INSTAGRAM — 25/08/2026 (pedido de Roberto)
// Função NOVA e autocontida — NUNCA chama nem reaproveita a orquestração de
// handleIgPublish() acima, para blindar o botão manual (já confirmado
// funcionando em produção) contra qualquer bug introduzido aqui.
// Escopo: todas as matérias publicadas no portal. O limite diário é controlado
// pelo Admin; zero desativa apenas a trava interna (a cota oficial da Meta
// continua valendo). O intervalo é controlado pelo cron e pelo Admin.
// ══════════════════════════════════════════════════════
const IG_AUTO_LIMITE_DIARIO = 0;
const IG_AUTO_JANELA_HORAS = 12;
const IG_AUTO_IDADE_MAXIMA_MS = IG_AUTO_JANELA_HORAS * 60 * 60 * 1000;
const IG_AUTO_CATEGORIAS = new Set(["politica", "economia", "financas", "brasil-on", "colunistas"]);
const IG_CRON_SECRET_HASH = "0a03ca4d9bda122e00ca8d5ebcd3f4798dfaabd66f5dbeba00c40a0c8ed16065";

// 02/09/2026 (2ª correção do dia) — Roberto reportou publicação real às
// 04h13 BRT, mesmo com a janela ativa configurada em
// .github/workflows/instagram-auto.yml. Investigado com evidência real
// (logs do próprio run no GitHub Actions): o cron do Actions de fato
// disparou fora do filtro de hora configurado (github's scheduled trigger
// não garante 100% que só dispara dentro do range de horas do cron —
// quirk real e observado, não suposição). Como o backend não tinha
// NENHUM gate próprio de horário, publicou.
// Fix: gate de segurança aqui, redundante ao cron — mesmo se o Actions
// disparar fora de hora de novo, o backend recusa. Janela precisa ficar
// EXATAMENTE em sincronia com o cron do workflow — se Roberto pedir pra
// mudar o horário de novo, atualizar os dois juntos.
//
// 04/09/2026 — Roberto pediu janela com pausa de almoço: ativo 9h-12h BRT,
// pausa 12h-13h BRT, ativo de novo 13h-22h BRT (corte seco às 22h).
// 04/09/2026 (mesmo dia, 2 ajustes seguidos) — primeiro Roberto pediu
// 13h30 só pro OVC; depois corrigiu: ele tinha errado o horário, é 14h00
// e vale pras DUAS automações (OVC e Brasil ON — ver brasilon/api/manage.js,
// atualizado junto). ESTADO FINAL, vigente: retorno às 14h00. Mantido o
// gate em MINUTOS (herdado da tentativa de 13h30) — inofensivo pra hora
// cheia, e já pronto se Roberto pedir precisão de minuto de novo no futuro.
const IG_AUTO_JANELA_MANHA_INICIO_BRT_MIN = 9 * 60;        // 09:00 BRT — início
const IG_AUTO_JANELA_PAUSA_INICIO_BRT_MIN = 12 * 60;       // 12:00 BRT — pausa de almoço começa
const IG_AUTO_JANELA_PAUSA_FIM_BRT_MIN = 14 * 60;          // 14:00 BRT — retoma
const IG_AUTO_JANELA_ATIVA_FIM_BRT_MIN = 22 * 60;          // corte seco às 22:00 BRT (22h já é pausa)
function _igAutoDentroDaJanelaAtiva() {
  const nowBRT = new Date(Date.now() - 3 * 3600 * 1000);
  const minutosBRT = nowBRT.getUTCHours() * 60 + nowBRT.getUTCMinutes();
  const manha = minutosBRT >= IG_AUTO_JANELA_MANHA_INICIO_BRT_MIN && minutosBRT < IG_AUTO_JANELA_PAUSA_INICIO_BRT_MIN;
  const tarde = minutosBRT >= IG_AUTO_JANELA_PAUSA_FIM_BRT_MIN && minutosBRT < IG_AUTO_JANELA_ATIVA_FIM_BRT_MIN;
  return manha || tarde;
}

function _igCronAuthorized(req, body) {
  if (checkAdmin(req, body)) return true;
  const supplied = String(req.headers["x-ovc-cron-secret"] || "");
  if (!supplied) return false;
  const digest = crypto.createHash("sha256").update(supplied).digest("hex");
  const expected = Buffer.from(IG_CRON_SECRET_HASH, "hex");
  const actual = Buffer.from(digest, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
const IG_AUTO_CONFIG_KEYS = [
  "IG_AUTOMATION_ENABLED", "IG_AUTOMATION_INTERVAL",
  "IG_AUTOMATION_DAILY_LIMIT", "IG_AUTOMATION_CATEGORIES",
  "IG_AUTOMATION_LAST_RUN"
];

async function _igAutoConfig() {
  const { data } = await supabase.from("config").select("key,value,updated_at").in("key", IG_AUTO_CONFIG_KEYS).order("updated_at", { ascending: false });
  const latest = {};
  for (const row of data || []) if (!(row.key in latest)) latest[row.key] = row.value;
  let categories = [...IG_AUTO_CATEGORIAS];
  try {
    const parsed = JSON.parse(latest.IG_AUTOMATION_CATEGORIES || "[]");
    if (Array.isArray(parsed) && parsed.length) categories = parsed.map(v => String(v).trim().toLowerCase()).filter(Boolean);
  } catch (_) {}
  const interval = Number(latest.IG_AUTOMATION_INTERVAL || 15);
  const dailyLimit = Number(latest.IG_AUTOMATION_DAILY_LIMIT ?? IG_AUTO_LIMITE_DIARIO);
  return {
    enabled: latest.IG_AUTOMATION_ENABLED !== "off",
    interval: Number.isFinite(interval) ? Math.max(15, interval) : 15,
    dailyLimit: Number.isFinite(dailyLimit) ? Math.max(0, Math.floor(dailyLimit)) : IG_AUTO_LIMITE_DIARIO,
    categories: new Set(categories),
    lastRun: Number(latest.IG_AUTOMATION_LAST_RUN || 0)
  };
}

async function _igAutoSetConfig(key, value) {
  await supabase.from("config").delete().eq("key", key);
  await supabase.from("config").insert({ key, value: String(value), updated_at: new Date().toISOString() });
}

function _igAutoPublishedAtMs(value) {
  const raw = String(value || "").trim();
  if (!raw) return NaN;
  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(raw);
  return Date.parse(hasTimezone ? raw : `${raw}Z`);
}

function _igAutoTitleKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function _igAutoDiaBRT() {
  // BRT = UTC-3. Usa o "dia de calendário" em BRT, não em UTC.
  const brt = new Date(Date.now() - 3 * 3600 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}

// Contador via tabela config, sem upsert (a coluna "key" não tem constraint
// unique real no banco — ver CLAUDE.md, bug já documentado e corrigido em
// 13/08 e 20/08/2026). Cada publicação grava 1 linha nova com chave única
// (timestamp+random) — nunca há corrida entre chamadas concorrentes, e a
// contagem real vem de um COUNT agregado, não de leitura+soma de 1 linha.
function _igAutoInicioDiaBRT() {
  const dia = _igAutoDiaBRT();
  const iso = `${dia.slice(0, 4)}-${dia.slice(4, 6)}-${dia.slice(6, 8)}`;
  return new Date(`${iso}T00:00:00-03:00`).toISOString();
}

async function _igAutoContarHoje(accountId) {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("ig_account_id", accountId)
    .not("ig_id", "is", null)
    .gte("updated_at", _igAutoInicioDiaBRT());
  if (error) throw error;
  return count || 0;
}

async function _igAutoRegistrarPublicacao(accountId) {
  const dia = _igAutoDiaBRT();
  const rowKey = `IG_AUTO_${dia}__${accountId}__${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await supabase.from("config").insert({ key: rowKey, value: "1" });
}

async function handleIgPreview(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ ok: false, error: "unauthorized" });
  const postId = String(body.post_id || "").trim();
  if (!postId) return res.status(400).json({ ok: false, error: "post_id_obrigatorio" });

  const { data: post, error } = await supabase
    .from("posts")
    .select("id,titulo,imagem,status,approved")
    .eq("id", postId)
    .single();
  if (error || !post) return res.status(404).json({ ok: false, error: "materia_nao_encontrada" });
  if (!/^https?:\/\//i.test(String(post.imagem || ""))) {
    return res.status(400).json({ ok: false, error: "imagem_publica_ausente" });
  }

  const { prepareInstagramImage } = await _loadInstagramImage();
  const preview = await prepareInstagramImage({
    sourceUrl: post.imagem,
    postId: `preview-${post.id}`,
    supabase,
    title: post.titulo
  });
  return res.status(200).json({
    ok: true,
    preview_only: true,
    post_id: post.id,
    titulo: post.titulo,
    image_url: preview.url,
    image_path: preview.path,
    generator_version: preview.version || null
  });
}

async function _igAutoProcessAccount(account, candidatos, settings, agoraMs) {
  const username = String(account.username || "").replace(/^@/, "").toLowerCase();
  const isDefaultAccount = username === "ovalorcapital";
  const hasAccountLimit = account.limite_diario !== null
    && account.limite_diario !== undefined
    && String(account.limite_diario).trim() !== "";
  const accountLimitRaw = hasAccountLimit ? Number(account.limite_diario) : settings.dailyLimit;
  const accountLimit = Number.isFinite(accountLimitRaw) ? Math.max(0, Math.floor(accountLimitRaw)) : 0;

  let publicadosHoje;
  try {
    publicadosHoje = await _igAutoContarHoje(account.id);
  } catch (e) {
    return { ok: false, account_id: account.id, username, error: "erro_contador: " + redactSecrets(e?.message || String(e)) };
  }
  if (accountLimit > 0 && publicadosHoje >= accountLimit) {
    return { ok: true, skipped: true, reason: "limite_diario_da_conta_atingido", account_id: account.id, username, publicados_hoje: publicadosHoje, limite: accountLimit };
  }

  const titulosJaPublicados = new Set(
    candidatos
      .filter((p) => String(p.ig_account_id || "") === String(account.id) && (p.ig_id || parseJsonMaybe(p.metrics, {})?.instagram?.ig_id))
      .map((p) => _igAutoTitleKey(p.titulo))
      .filter(Boolean)
  );

  const post = candidatos.find((p) => {
    const assignedAccountId = String(p.ig_account_id || "");
    const routedToAccount = assignedAccountId
      ? assignedAccountId === String(account.id)
      : isDefaultAccount;
    if (!routedToAccount) return false;

    const publishedAtMs = _igAutoPublishedAtMs(p.published_at);
    const idadeMs = agoraMs - publishedAtMs;
    if (!Number.isFinite(publishedAtMs) || idadeMs < 0 || idadeMs > IG_AUTO_IDADE_MAXIMA_MS) return false;
    if (!/^https?:\/\//i.test(String(p.imagem || ""))) return false;
    const tags = Array.isArray(p.user_tags) ? p.user_tags : parseJsonMaybe(p.user_tags, []);
    const categoria = String(tags[0] || "").trim().toLowerCase();
    if (!settings.categories.has(categoria)) return false;
    const metrics = parseJsonMaybe(p.metrics, {});
    if (p.ig_id || metrics?.instagram?.ig_id) return false;
    if (titulosJaPublicados.has(_igAutoTitleKey(p.titulo))) return false;
    return true;
  });

  if (!post) {
    await writeLog("info", `[ig-auto] @${username}: nenhuma matéria elegível`);
    return { ok: true, skipped: true, reason: "nenhum_candidato_recente_elegivel", account_id: account.id, username, janela_horas: IG_AUTO_JANELA_HORAS, publicados_hoje: publicadosHoje };
  }

  const caption = buildInstagramCaption(post);
  const now = new Date().toISOString();
  const claimId = `processing:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

  const { data: claimedRows, error: claimError } = await supabase
    .from("posts")
    .update({ ig_id: claimId, updated_at: now })
    .eq("id", post.id)
    .is("ig_id", null)
    .select("id");
  if (claimError) {
    return { ok: false, error: "erro_reserva_publicacao", post_id: post.id, account_id: account.id, username };
  }
  if (!claimedRows?.length) {
    return { ok: true, skipped: true, reason: "materia_ja_reservada_ou_publicada", post_id: post.id, account_id: account.id, username };
  }

  try {
    const { prepareInstagramImage } = await _loadInstagramImage();
    const { publish, getAccount, postComment, likeMedia } = await _loadInstagram();
    const instagramImage = await prepareInstagramImage({ sourceUrl: post.imagem, postId: post.id, supabase, title: post.titulo });
    const ig = await publish(instagramImage.url, caption, account.id);
    const firstCommentText = buildInstagramFirstComment(post);
    let firstComment = null;
    let firstCommentError = null;
    let selfLike = null;
    let selfLikeError = null;
    if (firstCommentText) {
      try {
        const account = await getAccount(ig.account_id);
        firstComment = await postComment(ig.id, firstCommentText, account?.token);
      } catch (commentError) {
        firstCommentError = redactSecrets(commentError?.message || String(commentError));
      }
    }
    try {
      selfLike = await likeMedia(ig.id, ig.account_id);
    } catch (likeError) {
      selfLikeError = redactSecrets(likeError?.message || String(likeError));
    }

    const metrics = parseJsonMaybe(post.metrics, {});
    const patch = {
      ig_id: ig.id,
      ig_account_id: ig.account_id,
      updated_at: now,
      metrics: {
        ...metrics,
        instagram: {
          ig_id: ig.id,
          account_id: ig.account_id,
          username: ig.username,
          image_url: instagramImage.url,
          image_path: instagramImage.path,
          published_at: now,
          published_via: "ig_auto_publish",
          quota_before_publish: ig.quota_before || null,
          first_comment_text: firstCommentText,
          first_comment_id: firstComment?.id || null,
          first_comment_error: firstCommentError,
          self_like_success: selfLike?.success === true,
          self_like_error: selfLikeError
        }
      }
    };

    const { error: updateError } = await supabase.from("posts").update(patch).eq("id", post.id);
    if (updateError) {
      const fallbackPatch = { ig_account_id: ig.account_id, updated_at: now, metrics: patch.metrics };
      const { error: fallbackError } = await supabase.from("posts").update(fallbackPatch).eq("id", post.id);
      if (fallbackError) throw updateError;
    }

    try { await _igAutoRegistrarPublicacao(account.id); } catch (_) {}
    await writeLog("info", `[ig-auto] @${username} publicado: ${post.titulo} | ig:${ig.id}`);

    return {
      ok: true,
      published: true,
      post_id: post.id,
      titulo: post.titulo,
      ig_id: ig.id,
      account_id: ig.account_id,
      username: ig.username,
      publicados_hoje: publicadosHoje + 1,
      first_comment_id: firstComment?.id || null,
      first_comment_error: firstCommentError,
      self_like_success: selfLike?.success === true,
      self_like_error: selfLikeError
    };
  } catch (e) {
    const safeError = redactSecrets(e?.message || String(e));
    try {
      await supabase
        .from("posts")
        .update({ ig_id: null, error_msg: safeError, updated_at: new Date().toISOString() })
        .eq("id", post.id)
        .eq("ig_id", claimId);
    } catch (_) {}
    await writeLog("error", `[ig-auto] @${username} falhou: ${safeError}`);
    return { ok: false, error: safeError, post_id: post.id, account_id: account.id, username };
  }
}

async function handleIgAutoPublish(req, res, body) {
  if (!_igCronAuthorized(req, body)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!_igAutoDentroDaJanelaAtiva()) {
    return res.status(200).json({ ok: true, skipped: true, reason: "fora_da_janela_ativa_09_12_14_22_brt" });
  }

  const settings = await _igAutoConfig();
  if (!settings.enabled) return res.status(200).json({ ok: true, skipped: true, reason: "automacao_desligada_no_admin" });
  const elapsedMinutes = settings.lastRun ? (Date.now() - settings.lastRun) / 60000 : Infinity;
  if (elapsedMinutes < settings.interval - 1) {
    return res.status(200).json({ ok: true, skipped: true, reason: "intervalo_configurado", proxima_em_minutos: Math.ceil(settings.interval - elapsedMinutes) });
  }
  await _igAutoSetConfig("IG_AUTOMATION_LAST_RUN", Date.now());
  await writeLog("info", "[ig-auto] execução simultânea iniciada");

  try {
    const [{ data: accounts, error: accountsError }, { data: candidatos, error: candidatesError }] = await Promise.all([
      supabase
        .from("ig_accounts")
        .select("*")
        .eq("active", true)
        .eq("distribuicao_automatica", true)
        .not("token", "is", null),
      supabase
        .from("posts")
        .select("id, titulo, imagem, conteudo, comentario_fixado, user_tags, subcategoria, status, metrics, ig_id, ig_account_id, published_at")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(500)
    ]);
    if (accountsError) throw accountsError;
    if (candidatesError) throw candidatesError;
    if (!accounts?.length) return res.status(200).json({ ok: true, skipped: true, reason: "nenhuma_conta_ativa_para_distribuicao" });

    const results = await Promise.all(accounts.map((account) => _igAutoProcessAccount(account, candidatos || [], settings, Date.now())));
    const failures = results.filter((result) => !result.ok);
    return res.status(200).json({
      ok: failures.length === 0,
      simultaneous: true,
      accounts_processed: results.length,
      published: results.filter((result) => result.published).length,
      results
    });
  } catch (e) {
    const safeError = redactSecrets(e?.message || String(e));
    await writeLog("error", "[ig-auto] falha na execução simultânea: " + safeError);
    return res.status(200).json({ ok: false, error: safeError });
  }
}

async function handleTrackView(res, body) {
  const postId = String(body.post_id || "");
  if (!postId || postId.length < 8) return res.status(200).json({ ok: false });
  try {
    const { data } = await supabase
      .from("posts")
      .select("id,metrics")
      .eq("id", postId)
      .eq("status", "publicado")
      .single();
    if (!data) return res.status(200).json({ ok: false });
    const m = typeof data.metrics === "string" ? JSON.parse(data.metrics || "{}") : (data.metrics || {});
    m.views = (parseInt(m.views || 0, 10) + 1);
    await supabase.from("posts").update({ metrics: m }).eq("id", postId);
    return res.status(200).json({ ok: true, views: m.views });
  } catch (_) {
    return res.status(200).json({ ok: false });
  }
}

// Roberto (31/07/2026): apenas estes 6 colunistas devem aparecer em qualquer lugar do portal.
const ALLOWED_COLUNISTAS_SLUGS = ["roberto-terrasan", "beta-ferreira", "adriana-ferreira", "michele-froiz", "prof-marcos-pizzolatto", "taisa-da-fonseca"];

async function handleListColunistas(res) {
  let { data, error } = await supabase
    .from("colunistas")
    .select("id,nome,email,ativo,created_at,last_login,slug,bio")
    .order("nome");

  if (error) {
    const fallback = await getColunistasConfig();
    return res.status(200).json({ ok: true, fallback_config: true, colunistas: fallback });
  }

  const filtered = (data || []).filter(c => ALLOWED_COLUNISTAS_SLUGS.includes((c.slug || slugify(c.nome)).toLowerCase()));
  const photoMap = await getColunistaPhotoMap();
  const colunistas = filtered.map(c => attachFotoColunista(c, photoMap));
  return res.status(200).json({ ok: true, colunistas });
}

async function getColunistasConfig() {
  try {
    const { data } = await supabase.from("config").select("value").eq("key", "COLUNISTAS_ACCOUNTS").maybeSingle();
    const parsed = JSON.parse(data?.value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

async function getColunistaPhotoMap() {
  const map = {};

  try {
    // 20/08/2026 — .maybeSingle() trocado por .limit(1): mesma classe de bug
    // já corrigida em _salvarPesquisa() (PESQUISA_ELEITORAL, 13/08) — com
    // linhas duplicadas de key="COLUNISTAS_PHOTOS" (causadas pelo upsert
    // quebrado abaixo, agora também corrigido), .maybeSingle() lançava erro
    // e o catch(_){} engolia silenciosamente, sempre retornando mapa vazio.
    const { data } = await supabase.from("config").select("value").eq("key", "COLUNISTAS_PHOTOS").limit(1);
    const row = data && data[0];
    const parsed = JSON.parse(row?.value || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(map, parsed);
  } catch (_) {}

  try {
    const { data, error } = await supabase.storage.from("posts-images").list("colunistas", { limit: 100 });
    if (!error) {
      const base = `${SUPABASE_URL}/storage/v1/object/public/posts-images/colunistas/`;
      (data || []).forEach(file => {
        if (!file?.name || file.name.startsWith(".")) return;
        const slug = file.name.replace(/\.[^.]+$/, "");
        map[slug] = base + file.name;
      });
    }
  } catch (_) {}

  return map;
}

function attachFotoColunista(c, photoMap) {
  const safe = { ...c };
  const slug = safe.slug || slugify(safe.nome);
  if (!safe.slug) safe.slug = slug;
  const foto = safe.foto_url || photoMap[slug] || photoMap[safe.nome] || photoMap[slugify(safe.nome)];
  if (foto && !String(foto).includes(OLD_REF)) safe.foto_url = foto;
  return safe;
}

// 20/08/2026 — handler que faltava. As 3 frentes do site (footer sitewide via
// bindNewsletterForms() em site.js, a barra escura injetada por newsletter-bar.js,
// e a página dedicada /newsletter/) sempre chamaram uma action "newsletter_subscribe"
// (ou uma rota /api/newsletter/subscribe que nunca existiu) sem NENHUM handler real
// aqui — todo cadastro sempre caía no fallback "acao_indisponivel_no_modo_emergencia".
// Armazena em config.NEWSLETTER_SUBSCRIBERS (JSON array) — sem tabela nova, sem
// migração manual, funciona imediatamente. Usa o padrão seguro (select → update-se-
// existir-senão-insert) — NUNCA .upsert(...,{onConflict:"key"}), a tabela config não
// tem essa constraint (ver bugs GEMINI_BUDGET_*/COLUNISTAS_PHOTOS, mesma sessão).
async function handleNewsletterSubscribe(res, body) {
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(200).json({ ok: false, error: "E-mail inválido." });
  }
  const topics = Array.isArray(body?.topics) ? body.topics.filter(t => typeof t === "string").slice(0, 20) : [];
  const categoria = typeof body?.categoria === "string" ? body.categoria.slice(0, 60) : null;
  const source = typeof body?.source === "string" ? body.source.slice(0, 60) : null;

  try {
    const { data } = await supabase.from("config").select("value").eq("key", "NEWSLETTER_SUBSCRIBERS").limit(1);
    const row = data && data[0];
    let list = [];
    if (row?.value) {
      try { const parsed = JSON.parse(row.value); if (Array.isArray(parsed)) list = parsed; } catch (_) {}
    }
    const already = list.some(s => s && s.email === email);
    if (!already) {
      list.push({ email, topics, categoria, source, created_at: new Date().toISOString() });
      const value = JSON.stringify(list);
      if (row) {
        await supabase.from("config").update({ value }).eq("key", "NEWSLETTER_SUBSCRIBERS");
      } else {
        await supabase.from("config").insert({ key: "NEWSLETTER_SUBSCRIBERS", value });
      }
    }
    return res.status(200).json({ ok: true, duplicate: already });
  } catch (error) {
    return res.status(200).json({ ok: false, error: "Erro ao cadastrar. Tente novamente." });
  }
}

// Mesmo padrão de hash usado na senha mestra do admin (public/admin/index.html,
// _sha256(pass + 'ovc_salt_2026')) — reaproveitado aqui pra senha de colunista.
function hashSenhaColunista(senha) {
  return crypto.createHash("sha256").update(String(senha || "") + "ovc_salt_2026").digest("hex");
}

async function handleCreateColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  // 31/08/2026 — BUG CORRIGIDO: este handler lia body.senha_hash, mas o único
  // caller real (criarLogin() no admin) sempre mandou body.senha em texto puro
  // — senha_hash nunca era populada, todo colunista criado por este caminho
  // ficava com senha_hash:null e nunca conseguia logar. Agora hasheia
  // server-side a partir de body.senha (aceita senha_hash direto também, pra
  // não quebrar nenhum outro caller que já mande o hash pronto).
  const senhaHash = body.senha_hash || (body.senha ? hashSenhaColunista(body.senha) : null);
  // 31/08/2026 — BUG CORRIGIDO: "telefone" NÃO existe na tabela colunistas real
  // (schema confirmado via consulta direta: id,nome,slug,bio,email,rss_url,
  // ativo,created_at,updated_at,senha_hash,session_token,last_login) — incluir
  // esse campo no payload fazia o INSERT falhar com "column ... does not exist"
  // (Postgres 42703). Removido daqui e do SELECT/resposta de handleLoginColunista.
  const payload = {
    nome: body.nome,
    email: String(body.email || "").toLowerCase().trim(),
    slug: slugify(body.slug || body.nome),
    bio: body.bio || null,
    ativo: true,
    senha_hash: senhaHash
  };
  const { error } = await supabase.from("colunistas").insert(payload);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (body.foto_url) await savePhoto(payload.slug, body.foto_url);
  return res.status(200).json({ ok: true });
}

// 31/08/2026 — NOVO. login_colunista e list_posts_colunista: até aqui,
// public/admin/colunista/index.html (o portal de autoatendimento do
// colunista — "entra no portal, tem login e senha") chamava as duas sem
// NENHUM handler existir no backend (confirmado via grep em todo o repo) —
// a página nunca funcionou pra ninguém, mesmo já sendo linkada de dentro do
// admin. Reaproveita o mesmo mecanismo de sessão que já é validado de
// verdade em handleSubmitColunistaPost() (col.session_token === token).
async function handleLoginColunista(req, res, body) {
  const email = String(body?.email || "").toLowerCase().trim();
  const senha = String(body?.senha || "");
  if (!email || !senha) return res.status(400).json({ ok: false, error: "email e senha obrigatorios" });
  const { data: col, error } = await supabase.from("colunistas")
    .select("id,nome,slug,email,bio,ativo,senha_hash").eq("email", email).maybeSingle();
  if (error || !col) return res.status(401).json({ ok: false, error: "email ou senha invalidos" });
  if (!col.ativo) return res.status(403).json({ ok: false, error: "conta desativada" });
  if (!col.senha_hash || col.senha_hash !== hashSenhaColunista(senha)) {
    return res.status(401).json({ ok: false, error: "email ou senha invalidos" });
  }
  const token = crypto.randomBytes(24).toString("hex");
  await supabase.from("colunistas").update({ session_token: token, last_login: new Date().toISOString() }).eq("id", col.id);
  let fotoUrl = null;
  try {
    const fotos = await getColunistaPhotoMap();
    fotoUrl = fotos?.[col.slug] || null;
  } catch (_) {}
  return res.status(200).json({
    ok: true, colunista_id: col.id, token, nome: col.nome,
    bio: col.bio || "", email: col.email, foto_url: fotoUrl
  });
}

async function handleListPostsColunista(req, res) {
  const colunista_id = req.query?.colunista_id;
  const token = req.query?.token;
  if (!colunista_id || !token) return res.status(401).json({ ok: false, error: "colunista_id e token obrigatorios" });
  const { data: col, error } = await supabase.from("colunistas")
    .select("id,nome,slug,ativo,session_token").eq("id", colunista_id).maybeSingle();
  if (error || !col) return res.status(401).json({ ok: false, error: "colunista nao encontrado" });
  if (!col.ativo) return res.status(403).json({ ok: false, error: "colunista inativo" });
  if (col.session_token !== token) return res.status(401).json({ ok: false, error: "token invalido" });
  const slug = col.slug || slugify(col.nome);
  // 31/08/2026 — REMOVIDO .eq("publish_method","colunista"): a posse real de um
  // post é subcategoria_slug (o dono da coluna), não o mecanismo que o publicou.
  // Colunas geradas pelo pipeline normal (publish_method:"portal") — comum quando
  // o colunista ainda não tinha login e a equipe publicava manualmente por ele —
  // ficavam invisíveis no próprio portal do colunista com o filtro antigo, mesmo
  // já estando ao vivo no site. Ver Taísa da Fonseca: 8 de 10 colunas reais dela
  // tinham publish_method:"portal" e nunca apareciam pra ela.
  const { data: posts, error: postsErr } = await supabase.from("posts")
    .select("id,titulo,status,created_at").eq("subcategoria_slug", slug)
    .order("created_at", { ascending: false }).limit(100);
  if (postsErr) return res.status(500).json({ ok: false, error: postsErr.message });
  return res.status(200).json({ ok: true, posts: posts || [] });
}

// 31/08/2026 — NOVO. Suporta "Devolver para revisão" e "Revisar com IA" em
// Postagens() (public/admin/index.html) — antes as duas chamavam POST
// /api/editor_ia, uma action que nunca teve handler em lugar nenhum (mesma
// causa raiz do Editor IA, ver comentário no admin) e sempre caía no
// fallback genérico com status HTTP 200 — a chamada nunca lançava erro
// visível, então "Revisar com IA" abria o modal de edição com o post
// INALTERADO marcado como `_revisado:true`, dando a falsa impressão de que a
// IA tinha revisado o texto. Reaproveita rewritePortal() (MASTER_PROMPT,
// intocado — Regra Zero-B) já usado pelo pipeline principal, mas SEM
// inserir nada no banco — só devolve titulo/corpo pro caller decidir o que
// fazer (update no post existente, não um post novo).
async function handleRevisarTextoIA(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const textoLimpo = String(body.texto || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (textoLimpo.length < 200) return res.status(400).json({ ok: false, error: "Texto curto demais para revisão editorial (minimo 200 caracteres de texto puro)." });
  try {
    const result = await rewritePortal(textoLimpo, body.titulo || "", "");
    return res.status(200).json({
      ok: true,
      titulo: result.titulo,
      corpo: result.corpo,
      subtitulo: result.subtitulo || result.meta_descricao || "",
      meta_descricao: result.meta_descricao || ""
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message || "Falha na revisão editorial" });
  }
}

// 31/08/2026 — NOVO. Espelha COLUNISTAS_COM_IA/COLUNISTAS_PERFIS do admin
// (public/admin/index.html) — só os 5 colunistas com IA habilitada (tag/bio
// copiados de lá, mantidos em sincronia manualmente já que o admin não
// consegue importar este arquivo do backend). Suporta "Editor de Colunas".
const COLUNA_PERSONAS = {
  "roberto-terrasan": { nome: "Roberto Terrasan", tag: "Fundador & Editor", bio: "Visceral, feroz, incorruptível. Patriota, família, conservador, direita." },
  "beta-ferreira":    { nome: "Beta Ferreira",     tag: "Colunista Internacional", bio: "Intelectual, elegante, provocativa. Nível dos maiores jornais globais." },
  "adriana-ferreira": { nome: "Adriana Ferreira",  tag: "Colunista Investigativa", bio: "Intelectual, elegante, investigativa. Conservadora de alto nível." },
  "michele-froiz":    { nome: "Michele Froiz",     tag: "Colunista Comportamento", bio: "Leve, sutil, fala a língua da galera sem perder substância." },
  "coluna-ovc":       { nome: "Coluna OVC",        tag: "Voz Institucional", bio: "Padrão editorial OVC estilo coluna. Conservador, analítico, factual." }
};

// 31/08/2026 — NOVO. "Editor de Colunas" (aba EditorColunas do admin) chamava
// esta action sem NENHUM handler existir (grep confirmado) — sempre caía no
// fallback genérico. Gera via rewriteColuna() (core/ai_portal.js — kernel
// próprio, MASTER_PROMPT intocado, Regra Zero-B) e já salva como pendente
// (mesmo modelo de status/approved de handleAdminColunistaPost), pra bater
// com o que o frontend já espera de volta (id/preview/chars).
async function handleGerarColuna(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const slug = slugify(body.colunista_nome || "");
  const persona = COLUNA_PERSONAS[slug];
  if (!persona) return res.status(400).json({ ok: false, error: "Colunista não habilitado para geração por IA." });
  const tema = String(body.tema || "").trim();
  if (!tema) return res.status(400).json({ ok: false, error: "Informe o tema da coluna." });
  try {
    const { titulo, corpo } = await rewriteColuna(persona.nome, persona.tag, persona.bio, tema, body.referencias || "", body.contexto || "");
    const hash = crypto.createHash("md5").update(slug + "_" + tema.slice(0, 100) + "_" + Date.now()).digest("hex");
    const post = {
      titulo, conteudo: corpo,
      comentario_fixado: "",
      imagem: null, hash,
      status: "pendente", approved: false,
      publish_method: "colunista",
      published_at: null,
      user_tags: JSON.stringify(["colunistas"]),
      subcategoria: persona.nome, subcategoria_slug: slug,
      collaborators: "[]", metrics: {},
      priority: 1, retry_count: 0, max_retries: 3
    };
    const { data: saved, error } = await supabase.from("posts").insert(post).select("id").maybeSingle();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    const plain = corpo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return res.status(200).json({
      ok: true, id: saved?.id, colunista: persona.nome, titulo,
      categoria: "colunistas", chars: plain.length,
      preview: plain.slice(0, 300) + (plain.length > 300 ? "…" : "")
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message || "Falha ao gerar coluna" });
  }
}

async function handleUpdateColunistaPhoto(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const slug = slugify(body.slug || body.nome || "");
  const foto = String(body.foto_url || "").trim();
  if (!slug || !foto) return res.status(400).json({ error: "slug/nome e foto_url obrigatorios" });
  await savePhoto(slug, foto);
  return res.status(200).json({ ok: true, slug, foto_url: foto });
}

async function savePhoto(slug, foto) {
  const current = await getColunistaPhotoMap();
  current[slug] = foto;
  const value = JSON.stringify(current);
  // 20/08/2026 — .upsert(...,{onConflict:"key"}) FALHA nesta tabela (config
  // não tem constraint unique na coluna key — causa raiz real confirmada em
  // 13/08/2026 pro card Internacional: "there is no unique or exclusion
  // constraint matching the ON CONFLICT specification"). Com `if (error)
  // throw error;`, isso derrubava toda tentativa de salvar foto de colunista.
  // Fix: mesmo padrão já corrigido e comprovado em _salvarPesquisa() —
  // checagem via .limit(1) (nunca ambígua) e update-se-existir-senão-insert.
  const { data: existing } = await supabase.from("config").select("key").eq("key", "COLUNISTAS_PHOTOS").limit(1);
  if (existing && existing.length) {
    const { error } = await supabase.from("config").update({ value }).eq("key", "COLUNISTAS_PHOTOS");
    if (error) throw error;
  } else {
    const { error } = await supabase.from("config").insert({ key: "COLUNISTAS_PHOTOS", value });
    if (error) throw error;
  }
}

async function handleToggleColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const { id, ativo } = body;
  const { error } = await supabase.from("colunistas").update({ ativo: !ativo }).eq("id", id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleDeleteColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const { error } = await supabase.from("colunistas").delete().eq("id", body.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleSubmitColunistaPost(req, res, body) {
  const { colunista_id, token, titulo, conteudo, imagem } = body || {};
  if (!colunista_id || !token) return res.status(401).json({ ok: false, error: "colunista_id e token obrigatorios" });
  if (!titulo || !conteudo) return res.status(400).json({ ok: false, error: "titulo e conteudo obrigatorios" });

  // Validate token against colunistas table
  const { data: col, error: colErr } = await supabase
    .from("colunistas")
    .select("id,nome,slug,ativo,session_token")
    .eq("id", colunista_id)
    .maybeSingle();

  if (colErr || !col) return res.status(401).json({ ok: false, error: "colunista nao encontrado" });
  if (!col.ativo) return res.status(403).json({ ok: false, error: "colunista inativo" });
  if (col.session_token !== token) return res.status(401).json({ ok: false, error: "token invalido" });

  const slug = col.slug || slugify(col.nome);
  const tituloClean = String(titulo).trim();
  const hash = crypto.createHash("md5").update(tituloClean + "_colunista_" + colunista_id).digest("hex");

  const post = {
    titulo: tituloClean,
    conteudo: String(conteudo).trim(),
    imagem: imagem || null,
    hash,
    status: "pendente",
    approved: false,
    publish_method: "colunista",
    user_tags: JSON.stringify(["colunistas"]),
    subcategoria: col.nome,
    subcategoria_slug: slug,
    published_at: null,
    metrics: JSON.stringify({ meta_title: tituloClean.slice(0, 55) })
  };

  const { data: saved, error: saveErr } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (saveErr) return res.status(500).json({ ok: false, error: saveErr.message });
  return res.status(200).json({ ok: true, id: saved?.id });
}

async function handleAdminColunistaPost(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ ok: false, error: "unauthorized" });
  // comentario_fixado — 08/08/2026: opcional. Colunas costumam vir com uma "frase fixada"
  // (pull-quote/resumo editorial) que corresponde exatamente à coluna comentario_fixado
  // (= meta_descricao, ver seção 4 do CLAUDE.md). Antes este handler simplesmente ignorava
  // qualquer coisa nesse sentido — toda coluna saía sem meta description própria, violando
  // a Regra #1 (SEO 100% completo em toda página). Aceita agora e grava só se vier.
  const { nome_colunista, titulo, conteudo, imagem, comentario_fixado } = body || {};
  if (!nome_colunista || !titulo || !conteudo) return res.status(400).json({ ok: false, error: "nome_colunista, titulo e conteudo obrigatorios" });

  const tituloClean = String(titulo).trim();
  const subcSlug = String(nome_colunista).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const hash = crypto.createHash("md5").update(tituloClean + "_admin_col_" + nome_colunista).digest("hex");

  const post = {
    titulo: tituloClean,
    conteudo: String(conteudo).trim(),
    imagem: imagem || null,
    hash,
    status: "publicado",
    approved: true,
    publish_method: "colunista",
    user_tags: JSON.stringify(["colunistas"]),
    subcategoria: String(nome_colunista).trim(),
    subcategoria_slug: subcSlug,
    published_at: new Date().toISOString(),
    metrics: JSON.stringify({ meta_title: tituloClean.slice(0, 55), meta_descricao: comentario_fixado || undefined })
  };
  if (comentario_fixado) post.comentario_fixado = String(comentario_fixado).trim();

  const { data: saved, error: saveErr } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (saveErr) return res.status(500).json({ ok: false, error: saveErr.message });
  return res.status(200).json({ ok: true, id: saved?.id });
}

async function handleLimparPendentesAntigos(req, res) {
  const corte = req.query.antes || "2026-05-18T00:00:00";
  const { data, error } = await supabase.from("posts").update({ status: "arquivado" }).eq("status", "pendente").lt("created_at", corte).select("id");
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, arquivados: (data || []).length, corte });
}

function checkAdmin(req, body) {
  const auth = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const supplied = auth || req.headers?.["x-admin-token"] || req.headers?.["x-admin-password"] || body?.token || body?.admin_token || req.query?.token || req.query?.pass || "";
  return String(supplied) === String(ADMIN_PASS);
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
    .slice(0, 80);
}

function inferCategoriaRss(name, url) {
  const t = ((name || "") + " " + (url || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/religi|biblia|gospel|evange|catolic|cristo|jesus|diocese|cnbb|vaticano|papa|episcopal|batist|presbiter|adventist|espirita|candombl|umbanda|terreiro/.test(t)) return "religiao";
  if (/esport|futebol|basquet|volei|olimp|atletis|corrida|ciclism|tenis|surf|mma|boxe|golfe|formula.?1|motorsport|nba|nfl|fifa|cbf|lance\b|placar|globoesporte/.test(t)) return "esportes";
  if (/imove|imobili|construtora|incorpor|loteament|vivareal|zapimoveis|imovelweb|habitac|sindicato.?constru/.test(t)) return "imoveis";
  if (/seguro|resseguro|seguradora|cnseg|susep|apolic|sindseg|fenacor|zurich|mapfre|porto.?seguro|tokio.?marine|allianz|icatu/.test(t)) return "seguros";
  if (/saude|medic|hospital|clinic|farmace|remedio|vacin|epidemi|doenc|cancer|oncolog|cardiolog|pediatr|cirurgi|diagnostic|ans\b|cfm\b|crm\b|sus\b|unimed|coren|dentist|odontolog|psicolog|enfermagem|nutric|fisioter|covid|amgen|astrazeneca|pfizer|bayer|roche|novartis|sanofi|merck|lilly|abbott|medtronic|johnson/.test(t)) return "saude";
  if (/tribut|imposto|fiscal|receita.?federal|sefaz|irpf|irpj|csll|pis\b|cofins|icms|iss\b|ipi\b|carf|pgfn|contabilidade|contabil|contador|cfc\b|crc\b/.test(t)) return "tributos";
  if (/vaga|emprego|carreira|recrutamento|recursos.?humano|conc[uo]rso.?(public|servidor)|catho|infojobs|sine\b|caged|abrh|educac|faculdade|universidade|escola|vestibular|enade|profiss/.test(t)) return "carreira";
  if (/famil|filho|filho|mae\b|bebe\b|infant|adolescent|maternidade|paternidade|gravidez|gestac|puericultura|pais.?e.?filhos|creche/.test(t)) return "familia";
  if (/cultur|arte\b|music|cinema|teatro|danc|literatur|livro|museu|galeri|design|fashion|moda|festival|show\b|podcast|entretenimento|celebrid|famoso|novela|serie|streaming|geek|gamer|games|anime|manga/.test(t)) return "cultura";
  if (/industr|agroneg|agricultur|pecuari|cooperativa|canal.?rural|embrapa|mapa\b|cna\b|soja|milho|cana\b|cafe\b|algodao|trigo|commodit|petroleo|mineracao|siderurgia|metalurgia|automobil|automotiv|montadora|ford\b|gm\b|volkswagen|toyota|honda.*auto|kia\b|bmw|mercedes|stellantis|energia|hidrel|eolica|solar|vale\b|usiminas|gerdau|braskem|embraer|boeing|airbus|defesa|militar|marinha|exercito|forca.?aerea/.test(t)) return "industria";
  if (/invest|b3\b|bolsa.?(valor|mercado)|fundo.?(imob|invest|renda)|cdb\b|lci\b|lca\b|debenture|fiagro|dividendo|tesouro.?direto|xp\b|btg|genial|empiricus|moneywise|toro\b|clear\b|avenue\b|easynvest|modal\b/.test(t)) return "investimentos";
  if (/econom|banco|bancari|financ|credit|cambio|dolar|euro|moeda|bacen|bcb\b|bndes|caixa.?econom|bradesco|itau|santander|sicredi|sicoob|nubank|neon\b|inter\b|pagbank|mercado.?pago|cielo|stone\b|mastercard|visa\b|macro|pib\b|deficit|superavit|arrecad|balanca.?comercial|cni\b|fiesp|ibge|abr.?fin/.test(t)) return "economia";
  if (/negoc|empresa|corporat|executiv|gestao|empreendedor|startup|scaleup|venture.?capital|fintech|insurtec|ecommerce|e.?commerce|varejo|logistic|supply.?chain|consumidor|abracom|abradi|abf\b|abcc\b|abcomm/.test(t)) return "negocios";
  if (/reuters|bloomberg|wsj|wall.?street|financial.?times|guardian|bbc|cnn\b|cnbc|time\b|economist|foreign.?affairs|geopolit|diplomac|onu\b|imf\b|fmi\b|world.?bank|bis\b|wto\b|nato\b|otan|g20|g7|mercosul|brics|multilateral|international|intl\b/.test(t)) return "internacional";
  if (/politic|governo|president|minister|congresso|senado|camara\b|stf\b|eleic|partido|legislat|judicial|justica|judici|pgr\b|mpu\b|senado\.leg/.test(t)) return "politica";
  if (/brasil|estadao|folha|globo|g1\b|r7\b|uol\b|terra\b|metropoles|correio|jconline|gazeta|jornal|agencia|policia|seguranca|crime|violencia|operacao\b|denuncia|investigat|report/.test(t)) return "brasil-on";
  // tecnologia: padrões específicos apenas — removidos "digital","google","meta","amazon","dell","ibm","oracle","apple","microsoft" (muitos falsos positivos)
  if (/tecnolog|\btech\b|software|hardware|inteligencia.?artif|machine.?learning|cyber|cibersegur|nuvem\b|cloud|blockchain|cripto|\bnft\b|metaverso|big.?data|programac|desenvolvim|linux|nvidia|qualcomm|samsung|motorola|xiaomi|huawei|asus|tiktok|canaltech|tecmundo|olhardigital|gizmodo|techcrunch|wired\.|arstechnica|theverge/.test(t)) return "tecnologia";
  return "geral";
}

async function handleCategorizarRss(req, res) {
  if (!checkAdmin(req, {})) return res.status(401).json({ error: "Nao autorizado" });
  const dryRun = req.query.dry === "1";
  const { data: sources, error } = await supabase.from("rss_sources").select("id,name,url,categoria").eq("active", true);
  if (error) return res.status(500).json({ error: error.message });
  const mapa = {};
  for (const s of (sources || [])) {
    const cat = inferCategoriaRss(s.name, s.url);
    if (!mapa[cat]) mapa[cat] = [];
    mapa[cat].push(s.id);
  }
  const resultado = {};
  if (!dryRun) {
    for (const [cat, ids] of Object.entries(mapa)) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        await supabase.from("rss_sources").update({ categoria: cat }).in("id", chunk);
      }
      resultado[cat] = ids.length;
    }
  } else {
    for (const [cat, ids] of Object.entries(mapa)) resultado[cat] = ids.length;
  }
  return res.status(200).json({ ok: true, dry_run: dryRun, total: (sources || []).length, distribuicao: resultado });
}

// ── Pesquisa Eleitoral — GET: retorna dados atuais da config ─────────────────
async function handleGetPesquisa(res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  try {
    // 17/08/2026 — CAUSA RAIZ do "mai/2026" travado nos prints de Roberto: o
    // upsert antigo de _salvarPesquisa() (ver abaixo) criava LINHA NOVA a cada
    // atualização em vez de atualizar a existente (mesma classe de bug do
    // .upsert({onConflict:"key"}) sem constraint unique, já confirmada e
    // corrigida pro card Internacional em 13/08/2026). Com múltiplas linhas
    // key='PESQUISA_ELEITORAL' na tabela, .maybeSingle() lança erro ("multiple
    // rows returned"), o catch(_){} engolia silenciosamente, e a resposta
    // sempre caía no fallback hardcoded abaixo — que tinha "mai/2026" escrito
    // no código. Fix: .limit(1) nunca lança em caso de duplicata (não exige 0
    // ou 1 linha como maybeSingle() exige) — sem coluna de timestamp
    // confiável na tabela config não dá pra garantir "pegar a mais recente"
    // entre duplicatas antigas, mas o fix real de fundo é _salvarPesquisa()
    // nunca mais CRIAR duplicata daqui pra frente (ver abaixo) — o problema
    // para de piorar, e um UPDATE atualiza TODAS as linhas com essa key de
    // uma vez, convergindo qualquer duplicata antiga pro mesmo valor novo.
    const { data } = await supabase.from("config").select("value").eq("key", "PESQUISA_ELEITORAL").limit(1);
    const row = data && data[0];
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      return res.status(200).json({ ok: true, pesquisa: parsed });
    }
  } catch (_) {}
  // Fallback padrão — sem mês/ano fixo no texto (evita parecer dado real
  // desatualizado quando na verdade é só o placeholder de "nunca atualizou ainda")
  return res.status(200).json({
    ok: true,
    pesquisa: {
      candidatos: [
        { nome: "Lula", pct: 37, cor: "#e11d48" },
        { nome: "Bolsonaro", pct: 29, cor: "#2563eb" },
        { nome: "Outros", pct: 34, cor: "#94a3b8" }
      ],
      fonte: "Quaest / Datafolha — aguardando 1ª atualização automática",
      atualizado: null
    }
  });
}

// ── Nota de Luto/Pesar — card grande na home, controlado por interruptor em config ──
// Pedido por Roberto Terrasan em 07/08/2026: card reutilizável, ligado/desligado a
// qualquer momento via URL (sem precisar de deploy). GET público (nota_luto_status)
// é lido por public/js/ovc-nota-luto.js. Toggle (nota_luto_toggle) exige &pass=.
const NOTA_LUTO_DEFAULT = {
  titulo: "Nota de pesar",
  texto: "O Valor Capital lamenta profundamente a morte do menino Gustavo Veloso Feitosa, de 3 anos, vítima de violência em Palmas (TO). Nossa solidariedade à família e a todos que lutam por justiça para as crianças vítimas de violência no Brasil.",
  imagem: "",
  link: ""
};
async function handleNotaLutoStatus(res) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  try {
    const { data } = await supabase.from("config")
      .select("key,value")
      .in("key", ["NOTA_LUTO_ATIVA", "NOTA_LUTO_TITULO", "NOTA_LUTO_TEXTO", "NOTA_LUTO_IMAGEM", "NOTA_LUTO_LINK"]);
    const map = {};
    (data || []).forEach(r => { map[r.key] = r.value; });
    const ativa = map.NOTA_LUTO_ATIVA === "on";
    return res.status(200).json({
      ok: true,
      ativa,
      titulo: map.NOTA_LUTO_TITULO || NOTA_LUTO_DEFAULT.titulo,
      texto: map.NOTA_LUTO_TEXTO || NOTA_LUTO_DEFAULT.texto,
      imagem: map.NOTA_LUTO_IMAGEM || NOTA_LUTO_DEFAULT.imagem,
      link: map.NOTA_LUTO_LINK || NOTA_LUTO_DEFAULT.link
    });
  } catch (_) {
    return res.status(200).json({ ok: true, ativa: false, ...NOTA_LUTO_DEFAULT });
  }
}
async function handleNotaLutoToggle(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(403).json({ error: "forbidden" });
  const on = String(req.query.on || "") === "1";
  const titulo = req.query.titulo != null ? String(req.query.titulo) : null;
  const texto = req.query.texto != null ? String(req.query.texto) : null;
  const imagem = req.query.imagem != null ? String(req.query.imagem) : null;
  const link = req.query.link != null ? String(req.query.link) : null;
  try {
    const rows = [{ key: "NOTA_LUTO_ATIVA", value: on ? "on" : "off", updated_at: new Date().toISOString() }];
    if (titulo) rows.push({ key: "NOTA_LUTO_TITULO", value: titulo, updated_at: new Date().toISOString() });
    if (texto) rows.push({ key: "NOTA_LUTO_TEXTO", value: texto, updated_at: new Date().toISOString() });
    if (imagem) rows.push({ key: "NOTA_LUTO_IMAGEM", value: imagem, updated_at: new Date().toISOString() });
    if (link) rows.push({ key: "NOTA_LUTO_LINK", value: link, updated_at: new Date().toISOString() });
    await supabase.from("config").upsert(rows, { onConflict: "key" });
    return res.status(200).json({ ok: true, ativa: on });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}

// ── Interruptores do Portal — família de cards liga/desliga, um POR CATEGORIA ──
// Pedido por Roberto Terrasan em 07/08/2026, refinado em 08/08/2026: "cada
// categoria deve ter estes cards interruptores independentes e eles nao devem
// aparecer em outras paginas" — ligar o card de Rail Lateral em Política NUNCA
// pode fazer esse mesmo card aparecer em Economia, Esportes etc. Por isso o
// slot é sempre {tipo}__{categoria} (ex: "rail_lateral__politica"), nunca só o
// tipo sozinho — cada combinação tipo×categoria tem seu próprio estado isolado
// em config (INTERRUPTOR_{TIPO}_{CATEGORIA}_*). Os widgets client-side leem a
// categoria da própria página (document.body.dataset.category ou
// window.__OVC_ARTICLE__.categoria) e montam o slot sozinhos — nenhum widget
// depende de outro (REGRA ZERO-I), só o transporte HTTP genérico é
// reaproveitado aqui.
function parseInterruptorSlot(slot) {
  const m = /^(rail_lateral|rodape|fim_artigo)__([a-z0-9-]{1,40})$/.exec(String(slot || ""));
  if (!m) return null;
  return { tipo: m[1], categoria: m[2] };
}
async function handleInterruptorStatus(req, res) {
  const parsed = parseInterruptorSlot(req.query.slot);
  if (!parsed) return res.status(400).json({ ok: false, error: "slot_invalido" });
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  const prefix = "INTERRUPTOR_" + parsed.tipo.toUpperCase() + "_" + parsed.categoria.toUpperCase().replace(/-/g, "_") + "_";
  try {
    const { data } = await supabase.from("config")
      .select("key,value")
      .in("key", [prefix + "ATIVA", prefix + "TITULO", prefix + "TEXTO", prefix + "IMAGEM", prefix + "LINK"]);
    const map = {};
    (data || []).forEach(r => { map[r.key] = r.value; });
    return res.status(200).json({
      ok: true,
      slot: parsed.tipo + "__" + parsed.categoria,
      ativa: map[prefix + "ATIVA"] === "on",
      titulo: map[prefix + "TITULO"] || "",
      texto: map[prefix + "TEXTO"] || "",
      imagem: map[prefix + "IMAGEM"] || "",
      link: map[prefix + "LINK"] || ""
    });
  } catch (_) {
    return res.status(200).json({ ok: true, slot: parsed.tipo + "__" + parsed.categoria, ativa: false, titulo: "", texto: "", imagem: "", link: "" });
  }
}
async function handleInterruptorToggle(req, res) {
  const parsed = parseInterruptorSlot(req.query.slot);
  if (!parsed) return res.status(400).json({ ok: false, error: "slot_invalido" });
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(403).json({ error: "forbidden" });
  const prefix = "INTERRUPTOR_" + parsed.tipo.toUpperCase() + "_" + parsed.categoria.toUpperCase().replace(/-/g, "_") + "_";
  const on = String(req.query.on || "") === "1";
  const titulo = req.query.titulo != null ? String(req.query.titulo) : null;
  const texto = req.query.texto != null ? String(req.query.texto) : null;
  const imagem = req.query.imagem != null ? String(req.query.imagem) : null;
  const link = req.query.link != null ? String(req.query.link) : null;
  try {
    const rows = [{ key: prefix + "ATIVA", value: on ? "on" : "off", updated_at: new Date().toISOString() }];
    if (titulo) rows.push({ key: prefix + "TITULO", value: titulo, updated_at: new Date().toISOString() });
    if (texto) rows.push({ key: prefix + "TEXTO", value: texto, updated_at: new Date().toISOString() });
    if (imagem) rows.push({ key: prefix + "IMAGEM", value: imagem, updated_at: new Date().toISOString() });
    if (link) rows.push({ key: prefix + "LINK", value: link, updated_at: new Date().toISOString() });
    await supabase.from("config").upsert(rows, { onConflict: "key" });
    return res.status(200).json({ ok: true, slot: parsed.tipo + "__" + parsed.categoria, ativa: on });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}

// ── Banners Lions Corretora — GET: retorna banners ativos filtrados por categoria ──
// data/banners.json era lido por ninguém (public/js/banners.js chamava esta action,
// que não existia — banners nunca apareciam em produção). Ver CLAUDE.md, sessão 29/07/2026.
let _bannersCache = null;
function loadBannersFile() {
  if (_bannersCache) return _bannersCache;
  try {
    _bannersCache = JSON.parse(readFileSync(join(process.cwd(), "data", "banners.json"), "utf8"));
  } catch (_) {
    _bannersCache = [];
  }
  return _bannersCache;
}
async function handleBanners(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  const cat = String(req.query.cat || "geral");
  const todos = loadBannersFile().filter(b => b.active !== false);
  let candidatos = todos.filter(b => Array.isArray(b.categories) && b.categories.includes(cat));
  if (!candidatos.length) candidatos = todos.filter(b => Array.isArray(b.categories) && b.categories.includes("geral"));
  candidatos.sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
  return res.status(200).json({ banners: candidatos });
}

// ── Pesquisa Eleitoral — GET: busca artigos recentes, extrai via Gemini, salva ──
// Busca RSS do Google News com dados de pesquisa eleitoral — fonte mais
// confiável que os artigos próprios do OVC pra números CONCRETOS e recentes.
async function _buscarGoogleNewsPesquisa() {
  const fonteUrl = "https://news.google.com/rss/search?q=pesquisa+eleitoral+2026+presidente+Datafolha+Quaest&hl=pt-BR&gl=BR&ceid=BR:pt-419";
  try {
    const feedRes = await fetch(fonteUrl, { signal: AbortSignal.timeout(5000) });
    const feedText = await feedRes.text();
    const items = [...feedText.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g)];
    if (!items.length) return "";
    return items.slice(0, 5).map(m => `TÍTULO: ${m[1]}\nRESUMO: ${m[2].replace(/<[^>]+>/g,'').slice(0,400)}`).join("\n\n---\n\n");
  } catch(_) { return ""; }
}

// 13/08/2026 — Roberto: "o grafico com os dados nem se mexe, desde maio".
// Causa raiz real (confirmada nos logs do workflow update-polls.yml,
// runs 07-12/08): a query OR usa keywords amplas demais (%eleit% casa com
// QUALQUER artigo sobre eleição, não só pesquisa) — sempre achava algum
// artigo do próprio pipeline (que gera até 80/dia) e por isso NUNCA caía
// no fallback do Google News (só disparava com artigos.length===0). A IA
// então corretamente dizia "sem_dados" porque os artigos achados não
// tinham percentual concreto — mas o fallback mais confiável nunca era
// tentado. Fix: tenta banco próprio primeiro; se vier "sem_dados",
// tenta o Google News como segunda chance na MESMA chamada, em vez de só
// pular o fallback quando a busca no banco retorna zero resultados.
async function handleUpdatePesquisa(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(403).json({ error: "forbidden" });

  try {
    // Busca artigos dos últimos 30 dias com keywords de pesquisa eleitoral (título OU corpo)
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: artigos } = await supabase.from("posts")
      .select("titulo,conteudo,published_at")
      .eq("status", "publicado")
      .gte("published_at", cutoff)
      .or("titulo.ilike.%pesquisa%,titulo.ilike.%datafolha%,titulo.ilike.%quaest%,titulo.ilike.%ipespe%,titulo.ilike.%poderdata%,titulo.ilike.%eleit%,titulo.ilike.%intenção de voto%,conteudo.ilike.%pesquisa eleitoral%,conteudo.ilike.%intenção de voto%,conteudo.ilike.%datafolha%,conteudo.ilike.%quaest%,conteudo.ilike.%ipespe%,conteudo.ilike.%poderdata%,conteudo.ilike.%sondagem%")
      .order("published_at", { ascending: false })
      .limit(10);

    // Tentativa 1: artigos próprios do OVC (se houver)
    if (artigos && artigos.length > 0) {
      const textos = artigos.map(a =>
        `TÍTULO: ${a.titulo}\nCONTEÚDO: ${(a.conteudo || '').replace(/<[^>]+>/g, '').slice(0, 800)}`
      ).join("\n\n---\n\n");
      const r1 = await _extrair(textos);
      if (r1.ok) return await _salvarPesquisa(r1.payload, res);
      // "sem_dados" no banco próprio — NÃO desistir, tenta a fonte externa abaixo
    }

    // Tentativa 2 (sempre, se a 1ª não deu resultado concreto): Google News RSS
    const textoFeed = await _buscarGoogleNewsPesquisa();
    if (textoFeed) {
      const r2 = await _extrair(textoFeed);
      if (r2.ok) return await _salvarPesquisa(r2.payload, res);
      return res.status(200).json({ ok: false, reason: r2.reason });
    }

    return res.status(200).json({ ok: false, reason: artigos?.length ? "sem_dados" : "no_poll_articles_found" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// 17/08/2026 — trocado de OpenAI (chave hardcoded confirmada REVOGADA — 401 —
// e a env var do Vercel sem crédito, mesmo estado documentado à exaustão na
// crise de 15-16/08 pro resto do pipeline) para Gemini, o mesmo motor já
// usado em core/ai_portal.js. api/manage.js não importa core/ai_portal.js
// (arquivos separados, Regra Zero-A não permite import cross-arquivo mudar
// contagem), então este é um helper mínimo e próprio aqui, mesmo padrão de
// _getGeminiKeys()/_callGeminiWithKey() do outro arquivo — sem gate de
// orçamento diário próprio porque este endpoint roda só 3x/semana (cron
// update-polls.yml) + acionamento manual raro, nunca vai perto do teto de
// 20/dia sozinho.
let _pesqGeminiKeysCache = null;
let _pesqGeminiKeysCacheTs = 0;
async function _getGeminiKeysPesquisa() {
  const now = Date.now();
  if (_pesqGeminiKeysCache && now - _pesqGeminiKeysCacheTs < 300000) return _pesqGeminiKeysCache;
  try {
    const { data } = await supabase.from("config").select("key,value").in("key", ["GEMINI_API_KEY", "GEMINI_API_KEY_2"]);
    const keys = {};
    (data || []).forEach(r => { keys[r.key] = r.value; });
    const list = [keys["GEMINI_API_KEY"], keys["GEMINI_API_KEY_2"]].filter(Boolean);
    if (list.length) { _pesqGeminiKeysCache = list; _pesqGeminiKeysCacheTs = now; return list; }
  } catch (_) {}
  return [];
}

async function _callGeminiPesquisa(prompt) {
  const keys = await _getGeminiKeysPesquisa();
  if (!keys.length) throw new Error("GEMINI_API_KEY não configurada no Supabase config");
  let lastErr;
  for (const key of keys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 400 }
        }),
        signal: AbortSignal.timeout(9000)
      });
      const data = await r.json();
      if (!r.ok) {
        const err = new Error(data?.error?.message || `Gemini HTTP ${r.status}`);
        err.status = r.status;
        throw err;
      }
      return (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    } catch (err) {
      lastErr = err;
      if (err.status === 429 || err.status === 503) continue; // tenta a outra chave
      throw err;
    }
  }
  throw lastErr || new Error("Gemini falhou");
}

// Chama a IA e faz só a extração/parse — sem gravar no banco (permite
// tentar duas fontes na mesma requisição antes de decidir salvar).
async function _extrair(textos) {
  const prompt = `Analise estes artigos sobre pesquisas eleitorais brasileiras para presidente 2026 e extraia os números de intenção de voto mais recentes.

${textos}

Responda APENAS com JSON válido neste formato exato, sem markdown, sem texto fora do JSON:
{"candidatos":[{"nome":"Lula","pct":37,"cor":"#e11d48"},{"nome":"Bolsonaro","pct":29,"cor":"#2563eb"},{"nome":"Outros","pct":34,"cor":"#94a3b8"}],"fonte":"Instituto — mês/ano"}

Regras:
- Use apenas dados encontrados nos artigos, não invente
- Se não encontrar dados concretos, responda: {"erro":"sem_dados"}
- Inclua apenas candidatos com percentual explícito no texto
- "Outros" = soma dos demais candidatos ou indecisos
- Cores: Lula=#e11d48, Bolsonaro=#2563eb, Terceiro candidato=#f59e0b, Outros=#94a3b8`;

  let raw;
  try {
    raw = await _callGeminiPesquisa(prompt);
  } catch (e) {
    return { ok: false, reason: "ai_erro: " + e.message };
  }
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) return { ok: false, reason: "ai_no_json" };

  let extraido;
  try { extraido = JSON.parse(match[0]); } catch (_) { return { ok: false, reason: "ai_json_invalido" }; }
  if (extraido.erro) return { ok: false, reason: extraido.erro };

  return { ok: true, payload: { ...extraido, atualizado: new Date().toISOString() } };
}

// 17/08/2026 — causa raiz real do "mai/2026" travado: .upsert({key:...}) SEM
// {onConflict:"key"} explícito cai no default do PostgREST (a PK real da
// tabela, um id auto-gerado) — na prática isso INSERE uma linha nova a cada
// chamada em vez de atualizar a existente (mesma classe de bug já confirmada
// e corrigida pro card Internacional em 13/08/2026, ver CLAUDE.md). Fix:
// update-se-existir-a-linha-senão-insert, não depende de nenhuma constraint
// unique no banco (a tabela config não tem uma na coluna key).
async function _salvarPesquisa(payload, res) {
  const value = JSON.stringify(payload);
  try {
    const { data: existing } = await supabase.from("config").select("key").eq("key", "PESQUISA_ELEITORAL").limit(1);
    if (existing && existing.length) {
      await supabase.from("config").update({ value }).eq("key", "PESQUISA_ELEITORAL");
    } else {
      await supabase.from("config").insert({ key: "PESQUISA_ELEITORAL", value });
    }
  } catch (_) {}
  return res.status(200).json({ ok: true, pesquisa: payload });
}

// 70 fontes aprovadas por Roberto Terrasan em 18/06/2026
const FONTES_APROVADAS_70 = [
  { url: "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml",             name: "Folha de S.Paulo",         categoria: "brasil-on" },
  { url: "https://www.estadao.com.br/arc/outbound/feed/rss/?outputType=xml",   name: "O Estado de S. Paulo",     categoria: "politica" },
  { url: "https://oglobo.globo.com/rss.xml",                                   name: "O Globo",                  categoria: "brasil-on" },
  { url: "https://g1.globo.com/rss/g1/",                                       name: "G1",                       categoria: "brasil-on" },
  { url: "https://noticias.uol.com.br/ultnot/rss/home.xml",                   name: "UOL Notícias",             categoria: "brasil-on" },
  { url: "https://www.cnnbrasil.com.br/feed/",                                 name: "CNN Brasil",               categoria: "brasil-on" },
  { url: "https://veja.abril.com.br/feed/",                                    name: "Veja",                     categoria: "politica" },
  { url: "https://istoe.com.br/feed/",                                         name: "IstoÉ",                    categoria: "brasil-on" },
  { url: "https://www.metropoles.com/feed",                                    name: "Metrópoles",               categoria: "brasil-on" },
  { url: "https://www.correiobraziliense.com.br/rss_feed/?tipo=1",             name: "Correio Braziliense",      categoria: "brasil-on" },
  { url: "https://agenciabrasil.ebc.com.br/feed.xml",                         name: "Agência Brasil",           categoria: "brasil-on" },
  { url: "https://noticias.r7.com/feed.xml",                                   name: "R7",                       categoria: "brasil-on" },
  { url: "https://www.valor.com.br/rss",                                       name: "Valor Econômico",          categoria: "economia" },
  { url: "https://exame.com/feed/",                                            name: "Exame",                    categoria: "negocios" },
  { url: "https://www.infomoney.com.br/feed/",                                 name: "InfoMoney",                categoria: "investimentos" },
  { url: "https://epocanegocios.globo.com/rss/",                               name: "Época Negócios",           categoria: "negocios" },
  { url: "https://forbes.com.br/feed/",                                        name: "Forbes Brasil",            categoria: "negocios" },
  { url: "https://istoedinheiro.com.br/feed/",                                 name: "IstoÉ Dinheiro",           categoria: "economia" },
  { url: "https://braziljournal.com/feed/",                                    name: "Brazil Journal",           categoria: "negocios" },
  { url: "https://neofeed.com.br/feed/",                                       name: "NeoFeed",                  categoria: "negocios" },
  { url: "https://www.moneytimes.com.br/feed/",                                name: "Money Times",              categoria: "investimentos" },
  { url: "https://www.bloomberglinea.com/rss/",                                name: "Bloomberg Línea",          categoria: "economia" },
  { url: "https://www.bbc.com/portuguese/index.xml",                           name: "BBC Brasil",               categoria: "internacional" },
  { url: "https://www.poder360.com.br/feed/",                                  name: "Poder360",                 categoria: "politica" },
  { url: "https://congressoemfoco.uol.com.br/feed/",                           name: "Congresso em Foco",        categoria: "politica" },
  { url: "https://www.jota.info/feed",                                         name: "JOTA",                     categoria: "tributos" },
  { url: "https://www.conjur.com.br/rss.xml",                                  name: "Conjur",                   categoria: "tributos" },
  { url: "https://www.migalhas.com.br/rss.aspx",                              name: "Migalhas",                 categoria: "tributos" },
  { url: "https://canaltech.com.br/rss/",                                      name: "Canaltech",                categoria: "tecnologia" },
  { url: "https://www.techtudo.com.br/rss.xml",                                name: "TechTudo",                 categoria: "tecnologia" },
  { url: "https://olhardigital.com.br/feed/",                                  name: "Olhar Digital",            categoria: "tecnologia" },
  { url: "https://tiinside.com.br/feed/",                                      name: "TI Inside",                categoria: "tecnologia" },
  { url: "https://ge.globo.com/rss/ge.xml",                                    name: "GE Globo",                 categoria: "esportes" },
  { url: "https://www.espn.com.br/rss/",                                       name: "ESPN Brasil",              categoria: "esportes" },
  { url: "https://www.lance.com.br/rss.xml",                                   name: "Lance!",                   categoria: "esportes" },
  { url: "https://saude.abril.com.br/feed/",                                   name: "Saúde (Abril)",            categoria: "saude" },
  { url: "https://vocesa.abril.com.br/feed/",                                  name: "Você S/A",                 categoria: "carreira" },
  { url: "https://crescer.globo.com/rss.xml",                                  name: "Crescer",                  categoria: "familia" },
  { url: "https://claudia.abril.com.br/feed/",                                 name: "Claudia",                  categoria: "familia" },
  { url: "https://www.zapimoveis.com.br/blog/feed/",                           name: "ZAP Imóveis",              categoria: "imoveis" },
  { url: "https://www.automotivebusiness.com.br/feed/",                        name: "Automotive Business",      categoria: "industria" },
  { url: "https://www.vaticannews.va/pt/rss.xml",                              name: "Vatican News Brasil",      categoria: "religiao" },
  { url: "https://www.gazetadopovo.com.br/feed/",                              name: "Gazeta do Povo",           categoria: "brasil-on" },
  { url: "https://gauchazh.clicrbs.com.br/rss.xml",                           name: "GaúchaZH",                 categoria: "brasil-on" },
  { url: "https://www.otempo.com.br/rss.xml",                                  name: "O Tempo",                  categoria: "brasil-on" },
  { url: "https://odia.ig.com.br/rss.xml",                                     name: "O Dia",                    categoria: "brasil-on" },
  { url: "https://diariodonordeste.verdesmares.com.br/rss.xml",                name: "Diário do Nordeste",       categoria: "brasil-on" },
  { url: "https://atarde.com.br/feed/",                                        name: "A Tarde",                  categoria: "brasil-on" },
  { url: "https://jc.ne10.uol.com.br/feed/",                                  name: "Jornal do Commercio",      categoria: "brasil-on" },
  { url: "https://feeds.reuters.com/reuters/topNews",                          name: "Reuters",                  categoria: "internacional" },
  { url: "https://feeds.bloomberg.com/markets/news.rss",                       name: "Bloomberg",                categoria: "economia" },
  { url: "https://www.ft.com/rss/home",                                        name: "Financial Times",          categoria: "economia" },
  { url: "https://feeds.wsj.com/xml/rss/3_7085.xml",                          name: "The Wall Street Journal",  categoria: "economia" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",            name: "The New York Times",       categoria: "internacional" },
  { url: "https://feeds.washingtonpost.com/rss/world",                         name: "The Washington Post",      categoria: "internacional" },
  { url: "https://www.theguardian.com/world/rss",                              name: "The Guardian",             categoria: "internacional" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml",                             name: "BBC News",                 categoria: "internacional" },
  { url: "http://rss.cnn.com/rss/edition.rss",                                name: "CNN International",        categoria: "internacional" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                         name: "Al Jazeera",               categoria: "internacional" },
  { url: "https://www.scmp.com/rss/91/feed",                                  name: "South China Morning Post", categoria: "internacional" },
  { url: "https://asia.nikkei.com/rss/feed/nar",                              name: "Nikkei Asia",              categoria: "economia" },
  { url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",  name: "El País",                  categoria: "internacional" },
  { url: "https://www.economist.com/rss.xml",                                  name: "The Economist",            categoria: "economia" },
  { url: "https://www.politico.com/rss/politicopicks.xml",                     name: "Politico",                 categoria: "internacional" },
  { url: "https://foreignpolicy.com/feed/",                                    name: "Foreign Policy",           categoria: "internacional" },
  { url: "https://api.axios.com/feed/",                                        name: "Axios",                    categoria: "internacional" },
  { url: "https://www.lemonde.fr/rss/une.xml",                                 name: "Le Monde",                 categoria: "internacional" },
];

// Limpeza retroativa de posts já publicados com tag <figure>/<img> espúria
// no meio do corpo — artefato de vazamento da IA (ver core/ai_portal.js,
// limparImagensEspurias(), criado 12/08/2026 após Roberto reportar print de
// matéria com <figure><img src="https://encrypted-tbn0.gstatic.com/..."></figure>
// aparecendo como texto visível no meio do artigo). Este endpoint só limpa
// o BANCO retroativamente; a correção que impede posts NOVOS de terem esse
// problema já está em core/ai_portal.js parse().
// Uso: GET /api/manage?action=limpar_imagens_espurias&pass=SENHA[&dry=1]
async function handleLimparImagensEspurias(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: "unauthorized" });
  const dry = String(req.query.dry || "") === "1";

  const limpar = (corpo) => {
    if (!corpo || typeof corpo !== "string") return corpo;
    return corpo
      .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id,conteudo")
      .or("conteudo.ilike.%<figure%,conteudo.ilike.%<img%")
      .limit(500);
    if (error) return res.status(500).json({ ok: false, error: error.message });

    const afetados = [];
    for (const post of data || []) {
      const original = post.conteudo || "";
      const limpo = limpar(original);
      if (limpo !== original) {
        afetados.push({ id: post.id, antes_chars: original.length, depois_chars: limpo.length });
        if (!dry) {
          const { error: updErr } = await supabase.from("posts").update({ conteudo: limpo }).eq("id", post.id);
          if (updErr) await writeLog("error", `[limpar_imagens_espurias] falhou id=${post.id}: ${updErr.message}`);
        }
      }
    }
    if (!dry && afetados.length) await writeLog("info", `[limpar_imagens_espurias] ${afetados.length} posts corrigidos`);
    return res.status(200).json({
      ok: true, dry,
      total_verificados: (data || []).length,
      total_corrigidos: afetados.length,
      afetados: afetados.slice(0, 50)
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}

async function handleArchiveOldRss(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: "unauthorized" });

  try {
    // 1. Arquivo todas as fontes existentes (active=false)
    const { error: archiveErr } = await supabase
      .from("rss_sources")
      .update({ active: false })
      .neq("active", false);

    if (archiveErr) return res.status(500).json({ ok: false, step: "archive", error: archiveErr.message });

    // 2. Verificar quais das 70 URLs já existem no banco
    const urls70 = FONTES_APROVADAS_70.map(f => f.url);
    const { data: existingRows } = await supabase
      .from("rss_sources")
      .select("url")
      .in("url", urls70);

    const existingUrls = new Set((existingRows || []).map(r => r.url));

    // 3. Reativar as que já existem
    if (existingUrls.size > 0) {
      const { error: updateErr } = await supabase
        .from("rss_sources")
        .update({ active: true })
        .in("url", [...existingUrls]);
      if (updateErr) return res.status(500).json({ ok: false, step: "update_existing", error: updateErr.message });
    }

    // 4. Inserir as que não existem ainda
    const toInsert = FONTES_APROVADAS_70
      .filter(f => !existingUrls.has(f.url))
      .map(f => ({ url: f.url, name: f.name, categoria: f.categoria, active: true }));

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from("rss_sources").insert(toInsert);
      if (insertErr) return res.status(500).json({ ok: false, step: "insert_new", error: insertErr.message });
    }

    return res.status(200).json({
      ok: true,
      arquivadas: "todas as fontes antigas marcadas como active=false",
      reativadas: existingUrls.size,
      inseridas: toInsert.length,
      total_aprovadas: FONTES_APROVADAS_70.length,
      fontes: FONTES_APROVADAS_70.map(f => f.name),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
