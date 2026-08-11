import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria, buscarFeedsEspecificos, FONTES_APROVADAS_URLS } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { findImage, findImageFutebol } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";
import { rewritePortal, rewriteEsportes, auditarArtigo, rewriteBrasilOn } from "../core/ai_portal.js";
import { buscarCandidatosBrasilOn } from "../core/brasilon.js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

async function log(level, message) {
  try {
    await supabase.from("logs").insert({ level, message });
  } catch (_) {}
}


const CATS = new Set(["brasil-on","politica","economia","financas","negocios","tecnologia","internacional","industria","familia","esportes","colunistas","vc"]);
const PRIORIDADE_PESOS = {
  "politica":15,"economia":12,"brasil-on":10,
  "financas":10,"negocios":8,"internacional":7,"tecnologia":7,
  "esportes":6,"industria":5,"familia":5
};
const PRIORIDADE = Object.entries(PRIORIDADE_PESOS).flatMap(([cat,n]) => Array(n).fill(cat));
const SUBCAT = { "brasil-on":"Notícias do Brasil", politica:"Governo Federal", economia:"Política Econômica", financas:"Renda Fixa", negocios:"Empresas & Corporações", tecnologia:"Inteligência Artificial", internacional:"Relações Exteriores", industria:"Agronegócio", familia:"Educação dos Filhos", esportes:"Futebol", colunistas:"Opinião", vc:"Institucional" };
const RECORRENTES = new Set(["lula","bolsonaro","moraes","alexandre","dino","trump","putin","haddad","stf","congresso","senado","camara","governo","presidente","ministro","deputado","senador","pcc","policia","federal","dolar","selic","ipca","copom","ibovespa","brasil","eua","china","russia"]);
const STOP = new Set(["para","pelo","pela","pelos","pelas","como","mais","sobre","apos","entre","nova","novo","novas","novos","com","sem","que","uma","uns","umas","dos","das","nos","nas","aos","seu","sua","seus","suas","sera","antes","nao","nem","mas","ate","alem","desde","isso","esta","este","esse","essa","onde","quando","qual","quais","fica","faz","fez","foi","sao","tem","ter","pode","deve","diz","disse","afirma","anuncia","revela","aponta","destaca","alerta"]);
const EVENTO = new Set(["aprova","aprovacao","vota","votacao","sanciona","veto","decide","decisao","prende","prisao","operacao","bloqueia","bloqueio","investiga","denuncia","condena","absolve","autoriza","suspende","aumenta","reduz","corta","eleva","queda","alta","lanca","anuncia","acordo","cobra","multa","reforma","projeto","relatorio","pesquisa","levantamento","resultado","balanco"]);
const VICIO_IA = ["vale destacar","cabe ressaltar","nesse contexto","diante desse cenário","diante desse cenario","sob essa ótica","sob essa otica","nesse sentido","em suma","por fim","considerações finais","consideracoes finais","reflexões finais","reflexoes finais","perspectiva estratégica","perspectiva estrategica","leitura de segunda ordem","impactos não óbvios","impactos nao obvios","ecossistema","disruptivo","sinergia","catalisador","robusto","robusta","robustos","robustas","nova era"];
const STOCK_IMAGE_CATS = new Set(["economia","negocios","financas","industria","tecnologia","familia"]);
const SENSITIVE_IMAGE_RE = /(agress|acus|crime|prisao|morte|morre|ferid|violencia|guerra|ataque|terror|homicidio|assassin|queda|aviao|acidente|sequest|abuso|denuncia|corrup|operacao|policia|policial|manifest|protest|pcc|comando vermelho|comando-vermelho|faccao|fac-cao)/i;

async function automacaoAtiva() { try { const { data } = await supabase.from("config").select("value").eq("key", "AUTOMATION").single(); return data?.value === "on"; } catch (_) { return false; } }
async function contarHoje() {
  try {
    // Meia-noite BRT = 03:00 UTC
    const agora = new Date();
    const inicioHoje = new Date(agora);
    inicioHoje.setUTCHours(3, 0, 0, 0);
    if (agora.getUTCHours() < 3) inicioHoje.setUTCDate(inicioHoje.getUTCDate() - 1);
    const { count } = await supabase.from("posts").select("id", { count: "exact", head: true })
      .eq("publish_method", "portal").gte("created_at", inicioHoje.toISOString());
    return count || 0;
  } catch (_) { return 0; }
}
function slugify(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"); }
function stripTitle(t) { return (t || "").replace(/<[^>]+>/g, "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(); }
function plain(html = "") { return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function field(raw, name) { const rx = new RegExp(`^${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|\\nCORPO:|$)`, "mi"); return (raw.match(rx)?.[1] || "").trim(); }
function normalizeGeminiXml(s) {
  if (!/<T[IÍ]TULO\b/i.test(s) && !/<CORPO\b/i.test(s)) return s;
  return s
    .replace(/<T[IÍ]TULO[^>]*>([\s\S]*?)<\/T[IÍ]TULO>/gi, (_, v) => `TITULO: ${v.trim()}`)
    .replace(/<META[\s_]TITLE[^>]*>([\s\S]*?)<\/META[\s_]TITLE>/gi, (_, v) => `META_TITLE: ${v.trim()}`)
    .replace(/<FOCO[\s_]KEYWORD[^>]*>([\s\S]*?)<\/FOCO[\s_]KEYWORD>/gi, (_, v) => `FOCO_KEYWORD: ${v.trim()}`)
    .replace(/<SLUG[^>]*>([\s\S]*?)<\/SLUG>/gi, (_, v) => `SLUG: ${v.trim()}`)
    .replace(/<META[\s_]DESCRI[CÇ][AÃ]O[^>]*>([\s\S]*?)<\/META[\s_]DESCRI[CÇ][AÃ]O>/gi, (_, v) => `META_DESCRICAO: ${v.trim()}`)
    .replace(/<CATEGORIA[^>]*>([\s\S]*?)<\/CATEGORIA>/gi, (_, v) => `CATEGORIA: ${v.trim()}`)
    .replace(/<SUBCATEGORIA[^>]*>([\s\S]*?)<\/SUBCATEGORIA>/gi, (_, v) => `SUBCATEGORIA: ${v.trim()}`)
    .replace(/<CORPO\b[^>]*>([\s\S]*?)<\/CORPO[^>]*>/gi, (_, v) => `CORPO:\n${v.trim()}`);
}
function parseOVC(raw) { const txt = normalizeGeminiXml(String(raw || "").replace(/```(?:html|json)?/gi, "").replace(/```/g, "").trim()); return { titulo: field(txt, "TITULO"), meta_title: field(txt, "META_TITLE"), foco_keyword: field(txt, "FOCO_KEYWORD"), slug: field(txt, "SLUG"), meta_descricao: field(txt, "META_DESCRICAO"), categoria: field(txt, "CATEGORIA").toLowerCase(), subcategoria: field(txt, "SUBCATEGORIA"), corpo: (txt.match(/CORPO:\s*([\s\S]*)$/i)?.[1] || "").trim() }; }
function palavras(titulo = "") { return titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 5 && !STOP.has(w) && !RECORRENTES.has(w)).slice(0, 10); }
function pautaParecida(titulo, recentes) {
  const novo = new Set(palavras(titulo));
  if (novo.size < 3) return false;
  return (recentes || []).some(t => {
    const antigo = new Set(palavras(t));
    if (antigo.size < 3) return false;
    const inter = [...novo].filter(w => antigo.has(w));
    if (inter.length < 3) return false;
    const jaccard = inter.length / Math.min(novo.size, antigo.size);
    // Dedup com palavra de ação (política/economia): threshold menor
    if (inter.some(w => EVENTO.has(w)) && jaccard >= 0.62) return true;
    // Dedup geral: 3+ palavras comuns com alta sobreposição (inter.length >= 3 cobre artigos curtos)
    if (inter.length >= 3 && jaccard >= 0.75) return true;
    return false;
  });
}
function janelaOk() { const br = new Date(Date.now() - 3 * 3600000); const minutos = br.getUTCHours() * 60 + br.getUTCMinutes(); return minutos >= 420 || minutos <= 30; }
function badSourceImageUrl(url) {
  if (!url || url.length < 12) return true;
  const u = url.toLowerCase();
  if (/autor|author|avatar|perfil|profile|headshot|logo|favicon|sprite|icon|placeholder|watermark/.test(u)) return true;
  if (/vector|illustration|ilustra|diagram|infograph|cartoon|drawing|clipart|sketch|template/.test(u)) return true;
  if (/\.(svg|gif|ico|bmp|tiff)(\?|$)/i.test(u)) return true;
  if (/\b(16|32|48|64)x(16|32|48|64)\b/.test(u)) return true;
  return false;
}
function canUseStockImageSearch(titulo, categoria) {
  const cat = slugify(categoria || "");
  const tituloSeguro = slugify(titulo || "").replace(/-/g, " ");
  return STOCK_IMAGE_CATS.has(cat) && !SENSITIVE_IMAGE_RE.test(tituloSeguro);
}
function sourceImageHostSeguro(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const allowed = [
      'supabase.co',
      'wikimedia.org',
      'wikipedia.org',
      'agenciabrasil.ebc.com.br',
      'imagens.ebc.com.br',
      'gov.br',
      'camara.leg.br',
      'senado.leg.br',
      'bcb.gov.br',
      'stf.jus.br',
      'tse.jus.br',
      'whitehouse.gov',
      'pexels.com',
      'pixabay.com',
      'staticflickr.com',
      'flickr.com'
    ];
    return allowed.some(d => host === d || host.endsWith('.' + d));
  } catch (_) {
    return false;
  }
}
function absolutizeImageUrl(src, base) {
  if (!src) return "";
  try {
    if (src.startsWith("http")) return src;
    const u = new URL(base);
    if (src.startsWith("//")) return u.protocol + src;
    if (src.startsWith("/")) return u.origin + src;
    return new URL(src, u.origin + "/").toString();
  } catch (_) {
    return src || "";
  }
}
async function extractSourceImage(url) {
  if (!url) return "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    const candidates = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i
    ].map(rx => absolutizeImageUrl(html.match(rx)?.[1] || "", url));
    return candidates.find(img => img && !badSourceImageUrl(img)) || "";
  } catch (_) {
    return "";
  }
}

function validar(content) {
  const erros = [];
  if (!content?.titulo || !content?.corpo) return ["estrutura ausente"];
  if (content?.auditoria_ovc?.startsWith('INCONSISTENCIA')) return ['auditoria reprovada: ' + content.auditoria_ovc];
  content.titulo = stripTitle(content.titulo);
  const corpo = String(content.corpo || "").trim();
  const texto = plain(corpo);
  if (content.titulo.length < 35 || content.titulo.length > 115) erros.push("titulo fora da faixa");
  if (/nova era|desafio[s]? de|impactos de|futuro de/i.test(content.titulo)) erros.push("titulo generico");
  const tcat = `${content.titulo} ${texto}`.toLowerCase();
  if (content.categoria !== "esportes" && /roland garros|futebol|tenis|tênis|campeonato|copa do mundo|libertadores|formula 1|fórmula 1/.test(tcat)) erros.push("categoria incoerente");
  if (texto.length < 2000) erros.push("texto curto");
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|FOCO_KEYWORD:|META_DESCRICAO:/m.test(corpo)) erros.push("markdown/metadados no corpo");
  const ps = [...corpo.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => plain(m[1]));
  if (ps.length < 5) erros.push("poucos paragrafos");
  if (ps.some(p => p.length > 700)) erros.push("paragrafo longo");
  const baixa = texto.toLowerCase();
  if (VICIO_IA.filter(t => baixa.includes(t)).length > 2) erros.push("cadencia de ia");
  if (/não foi possível|conteúdo insuficiente|não há informações suficientes/i.test(texto)) erros.push("recusa vazou");
  return erros;
}

async function recentes() {
  try {
    const { data } = await supabase.from("posts").select("titulo,metrics,user_tags").gte("created_at", new Date(Date.now() - 48 * 3600000).toISOString()).order("created_at", { ascending: false }).limit(250);
    const titulos = (data || []).map(p => p.titulo).filter(Boolean);
    const sourceTitulos = (data || []).map(p => p.metrics?.source_title).filter(Boolean);
    const kws = (data || []).map(p => p.metrics?.foco_keyword).filter(Boolean).slice(0, 20);
    return { titulos, sourceTitulos, contexto: `Títulos recentes a evitar: ${titulos.slice(0, 25).join(" | ")}\nKeywords recentes: ${kws.join(", ")}` };
  } catch (_) { return { titulos: [], sourceTitulos: [], contexto: "" }; }
}

const CAT_REMAP = {
  tributacao:"economia", tributos:"economia", regulacao:"economia",
  variedades:"brasil-on", seguranca:"brasil-on", defesa:"brasil-on",
  educacao:"brasil-on", investigativo:"brasil-on",
  mercados:"financas", investimentos:"financas", seguros:"financas",
  saude:"brasil-on", carreira:"brasil-on", imoveis:"brasil-on",
  cultura:"brasil-on", religiao:"brasil-on",
  parcerias:"negocios"
};
function remapCat(content) { if (content?.categoria && CAT_REMAP[content.categoria]) content.categoria = CAT_REMAP[content.categoria]; return content; }

async function resolverImagem(content, articleImage, hash, start) {
  const sourceImage = !badSourceImageUrl(articleImage) && sourceImageHostSeguro(articleImage) ? articleImage : "";
  if (sourceImage) {
    try {
      const saved = await processAndSaveImage(sourceImage, hash.slice(0, 12), start);
      if (saved) return { url: saved, source: "source_article", original: sourceImage };
    } catch (_) {}
  }
  try {
    if (!canUseStockImageSearch(content.titulo, content.categoria || "")) return { url: null, source: "none", original: "" };
    const found = await findImage(content.titulo, content.categoria || "");
    return { url: found || null, source: found ? "resolver_fallback" : "none", original: "" };
  } catch (_) {
    return { url: null, source: "none", original: "" };
  }
}

async function cleanupTitles(res, body) {
  if (!body.force) return res.status(403).json({ error: "requires force:true" });
  const { data } = await supabase.from("posts").select("id,titulo").like("titulo", "%**%").limit(500);
  let fixedTitles = 0;
  for (const p of data || []) { const clean = stripTitle(p.titulo); if (clean !== p.titulo) { await supabase.from("posts").update({ titulo: clean }).eq("id", p.id); fixedTitles++; } }
  return res.status(200).json({ status: "ok", fixedTitles, fixedContent: 0 });
}

async function saveCurtinha(content, hash, cat, tipo, img = null, subcategoriaOverride = null) {
  const catFinal = CATS.has(content.categoria) ? content.categoria : (CATS.has(cat) ? cat : "politica");
  const subcat = subcategoriaOverride || SUBCAT[catFinal] || "Geral";
  const { data, error } = await supabase.from("posts").insert({
    titulo: stripTitle(content.titulo), conteudo: content.corpo,
    comentario_fixado: (content.meta_descricao||"").trim(), imagem: img || null, hash,
    status: "publicado", approved: true, publish_method: "portal",
    published_at: new Date().toISOString(),
    user_tags: JSON.stringify([catFinal]), subcategoria: subcat,
    subcategoria_slug: slugify(subcat), collaborators: "[]",
    tipo_conteudo: tipo, metrics: { foco_keyword: content.foco_keyword||"", tipo },
    priority: 0, retry_count: 0, max_retries: 3
  }).select("id").single();
  if (error) return null;
  return { id: data.id, categoria: catFinal, titulo: stripTitle(content.titulo) };
}

// URL canônica de um post recém-salvo — mesmo esquema de api/article.js (categoria/slug-id8/)
function buildCurtinhaUrl(post) {
  if (!post?.id) return null;
  const id8 = String(post.id).slice(0, 8);
  const slug = slugify(post.titulo || "").slice(0, 55);
  return `https://www.ovalorcapital.com.br/${post.categoria}/${slug}-${id8}/`;
}

// ─── GOOGLE INDEXING API — best-effort, silencioso se GOOGLE_INDEXING_SA_JSON ausente ───
// Nunca lança exceção, nunca bloqueia o pipeline. Roberto precisa adicionar a env var
// GOOGLE_INDEXING_SA_JSON no Vercel (JSON da service account) para isto ativar de fato.
function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function _getIndexingToken() {
  const raw = process.env.GOOGLE_INDEXING_SA_JSON;
  if (!raw) return null;
  let sa;
  try { sa = JSON.parse(raw); } catch (_) { return null; }
  if (!sa.client_email || !sa.private_key) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64url(Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600
  })));
  const signingInput = `${header}.${claims}`;
  const signature = base64url(crypto.createSign("RSA-SHA256").update(signingInput).sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
    signal: AbortSignal.timeout(4000)
  });
  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  return tokenData.access_token || null;
}
async function pingGoogleIndexing(url) {
  if (!url) return;
  try {
    const token = await _getIndexingToken();
    if (!token) return;
    await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
      signal: AbortSignal.timeout(4000)
    });
  } catch (_) { /* best-effort — nunca quebra o pipeline */ }
}

async function inserir(content, hash, img, tipo = "padrao", extraMetrics = {}) {
  const metaDesc = (content.meta_descricao || "").replace(/\*\*/g, "").trim();
  const cat = CATS.has(content.categoria) ? content.categoria : "economia";
  const sub = content.subcategoria || SUBCAT[cat] || "Geral";
  const { data, error } = await supabase.from("posts").insert({
    titulo: stripTitle(content.titulo), conteudo: content.corpo, comentario_fixado: metaDesc, imagem: img, hash,
    status: "pendente", approved: false, publish_method: "portal", published_at: null,
    user_tags: JSON.stringify([cat]), subcategoria: sub, subcategoria_slug: slugify(sub), collaborators: "[]",
    metrics: { foco_keyword: content.foco_keyword || "", seo_slug: content.slug || "", meta_descricao: metaDesc, meta_title: stripTitle(content.meta_title || content.titulo), tipo_conteudo: tipo, ...extraMetrics },
    priority: tipo === "manual" ? 1 : 0, retry_count: 0, max_retries: 3
  }).select().single();
  if (error) throw error;
  return data;
}

async function manual(req, res, rec) {
  const { url, texto, categoria = "economia", subcategoria = "", image_url, image_query } = req.body || {};
  let sourceText = texto || "", sourceTitle = "", articleImage = "";
  if (url) { const a = await scrape(url); sourceText = a.text || ""; sourceTitle = a.title || ""; articleImage = a.image || await extractSourceImage(url); }
  if (!sourceText || sourceText.length < 300) return res.status(400).json({ error: "Fonte curta demais para reescrita editorial segura" });
  const cat = CATS.has(categoria) ? categoria : "economia";
  const content = remapCat(await rewritePortal(sourceText, sourceTitle, rec.contexto));
  content.categoria = cat;
  content.subcategoria = subcategoria || SUBCAT[cat] || "Geral";
  const erros = validar(content);
  if (erros.length) return res.status(422).json({ status: "reprovado", generated: 0, erros });
  const hash = crypto.createHash("md5").update((url || texto).slice(0, 300) + "_manual").digest("hex");
  const resolvedImage = image_url
    ? { url: image_url, source: "manual_url", original: image_url }
    : await resolverImagem(content, articleImage, hash, Date.now());
  let img = resolvedImage.url;
  if (!img && image_query && canUseStockImageSearch(image_query, cat)) img = await findImage(image_query, cat);
  const post = await inserir(content, hash, img, "manual", {
    source_url: url || "",
    source_title: sourceTitle || "",
    source_image_url: articleImage || "",
    image_strategy: img ? (resolvedImage.source || "query_fallback") : "none",
    image_original_url: resolvedImage.original || ""
  });
  return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: post.titulo, modo: "manual_pendente" });
}

async function autoMaterias(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  // Limite diário de 80 conteúdos (excluindo curtinhas/copa que têm fluxo próprio)
  const MAX_DIA = 80;
  const hoje = await contarHoje();
  if (hoje >= MAX_DIA) return res.status(200).json({ status: "limite_diario_atingido", limite: MAX_DIA, hoje, generated: 0 });
  const cat = CATS.has(String(body.categoria || "").toLowerCase()) ? String(body.categoria).toLowerCase() : PRIORIDADE[Math.floor(Math.random() * PRIORIDADE.length)];
  const [prio, geral] = await Promise.all([getNewsByCategoria(cat), getNews()]);
  const seen = new Set();
  const baseNews = prio.length ? prio : geral;
  const news = baseNews.filter(i => i?.link && !seen.has(i.link) && seen.add(i.link)).slice(0, 40);
  // Batch hash check (Bug #51 fix) — 1 query for all news instead of 1 per article
  const allHashes = news.map(i => crypto.createHash("md5").update(i.link + "_portal").digest("hex"));
  const existingHashes = new Set();
  for (let i = 0; i < allHashes.length; i += 100) {
    const chunk = allHashes.slice(i, i + 100);
    const { data: batchDup } = await supabase.from("posts").select("hash").in("hash", chunk);
    (batchDup || []).forEach(p => existingHashes.add(p.hash));
  }
  const debug = { sem_fonte: 0, duplicado: 0, reprovado: 0, erro: 0, erros: [] };
  for (let ni = 0; ni < news.length; ni++) {
    const item = news[ni];
    if (Date.now() - start > 8500) break;
    const hash = allHashes[ni];
    if (existingHashes.has(hash)) { debug.duplicado++; continue; }
    // Dedup de fonte: bloqueia mesmo evento de fontes diferentes antes de scrape+IA
    if (pautaParecida(item.title || "", rec.sourceTitulos)) { debug.duplicado++; continue; }
    try {
      const a = await scrape(item.link);
      const sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 400) { debug.sem_fonte++; continue; }
      const gerador = cat === "esportes" ? rewriteEsportes : rewritePortal;
      const content = remapCat(await gerador(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) { debug.reprovado++; if (debug.erros.length < 5) debug.erros.push(erros.join(", ")); continue; }
      if (pautaParecida(content.titulo, rec.titulos)) { debug.duplicado++; continue; }
      // Anti-race: verifica títulos salvos nos últimos 10min (race condition entre Rodada 1 e Rodada 2)
      try {
        const { data: freshTits } = await supabase.from("posts").select("titulo").gte("created_at", new Date(Date.now() - 10 * 60000).toISOString());
        if (freshTits?.length && pautaParecida(content.titulo, freshTits.map(p => p.titulo))) { debug.duplicado++; continue; }
      } catch (_) {}
      const auditResult = auditarArtigo(content.titulo, content.corpo, content.categoria);
      if (!auditResult.aprovado) { debug.reprovado++; if (debug.erros.length < 5) debug.erros.push(`auditoria(${auditResult.nota}): ${auditResult.violacoes.join("; ")}`); continue; }
      const sourceImage = a.image || await extractSourceImage(item.link);
      const resolvedImage = await resolverImagem(content, sourceImage, hash, start);
      const img = resolvedImage.url;
      const post = await inserir(content, hash, img, "padrao", {
        source_url: item.link || "",
        source_title: item.title || a.title || "",
        source_image_url: sourceImage || "",
        image_strategy: img ? resolvedImage.source : "none",
        image_original_url: resolvedImage.original || ""
      });
      await log("info", `[materias] gerado: ${content.titulo?.slice(0,60)} | cat:${content.categoria} | img:${!!img}`);
      return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: post.titulo, categoria: content.categoria, subcategoria: content.subcategoria, imagem: !!img });
    } catch (e) { debug.erro++; if (debug.erros.length < 5) debug.erros.push(e.message); }
  }
  return res.status(200).json({ status: "no_valid_news", generated: 0, categoria: cat, debug });
}

// tipo_conteudo="radar" na categoria esportes é EXCLUSIVAMENTE futebol (Regra Zero-I,
// documentado desde 31/07/2026 — ver public/js/ovc-radar-widget.js). autoFutebolCurtinhas()
// e autoCopaCurtinhas() sempre respeitaram isso (geram só a partir de itens já filtrados por
// palavra-chave de futebol). autoCurtinhas() NÃO respeitava — decidia o tipo só pela categoria,
// então qualquer esporte (automobilismo, basquete, tênis...) virava "radar" e contaminava
// /radar-da-bola/, que exibe tudo com esse tipo sem filtro próprio. Fix 03/08/2026.
const RADAR_ESPORTES_FUTEBOL_KW = [
  'futebol', 'campeonato brasileiro', 'brasileirão', 'brasileirao', 'série a', 'serie a',
  'série b', 'serie b', 'libertadores', 'sul-americana', 'sulamericana',
  'copa sul-americana', 'copa libertadores', 'copa do mundo', 'world cup', 'mundial 2026',
  'fifa', 'seleção brasileira', 'selecao brasileira', 'champions league', 'liga dos campeões',
  'liga dos campeoes', 'premier league', 'la liga', 'bundesliga', 'calcio', 'ligue 1',
  'mercado da bola', 'janela de transferências', 'janela de transferencias'
];
function pareceFutebol(texto) {
  const t = String(texto || "").toLowerCase();
  return RADAR_ESPORTES_FUTEBOL_KW.some(kw => t.includes(kw));
}

async function autoCurtinhas(req, res, rec) {
  const start = Date.now();
  const news = await getNews();
  const seen = new Set();
  const items = news.filter(i => i?.link && !seen.has(i.link) && seen.add(i.link)).slice(0, 25);
  let generated = 0;
  for (const item of items) {
    if (Date.now() - start > 50000 || generated >= 4) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) continue;
    let a, sourceText;
    try {
      a = await scrape(item.link);
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 300) continue;
    } catch(e) { continue; }
    if (/\b2023\b/.test(sourceText) && !/\b2026\b/.test(sourceText)) continue;
    const hash = crypto.createHash("md5").update(item.link + "_jornal").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) continue;
    try {
      const content = remapCat(await rewritePortal(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) continue;
      if (pautaParecida(content.titulo, rec.titulos)) continue;
      const cat = CATS.has(content.categoria) ? content.categoria : "politica";
      let tipo = ["politica","esportes","internacional","brasil-on"].includes(cat) ? "radar"
               : ["economia","negocios","investimentos","tributos","tecnologia","industria","imoveis","seguros","carreira"].includes(cat) ? "minuto"
               : "pilula";
      // esportes só vira "radar" se for de fato futebol — outro esporte (automobilismo,
      // basquete, tênis, mma, vôlei, nfl) cai pra "pilula" (nicho genérico, sem essa exigência).
      if (cat === "esportes" && tipo === "radar" && !pareceFutebol(content.titulo + " " + (content.meta_descricao || ""))) {
        tipo = "pilula";
      }
      await saveCurtinha(content, hash, cat, tipo);
      await log("info", `[jornal] ${tipo}: ${content.titulo?.slice(0,50)}`);
      generated++;
    } catch(e) { /* ignorado */ }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "jornal" });
}

// MINUTO OVC — reativado 31/07/2026 a pedido de Roberto: SOMENTE fontes de finanças/economia
// extremamente confiáveis (subconjunto curado das 70 fontes aprovadas), sem mistura com o pool geral.
const MINUTO_FONTES_CONFIAVEIS = new Set([
  "Valor Econômico", "InfoMoney", "Money Times", "Bloomberg Línea",
  "Brazil Journal", "IstoÉ Dinheiro", "Bloomberg", "Financial Times",
  "The Wall Street Journal", "The Economist", "Reuters", "Exame"
]);
// Reuters/FT/The Economist usam feed geral (capa do site), não exclusivo de economia — por isso
// é obrigatório filtrar por assunto também, não só por fonte confiável.
const MINUTO_ASSUNTO_KW = [
  "juros","selic","copom","inflação","inflacao","ipca","igp-m","pib","câmbio","cambio","dólar","dolar",
  "bolsa","ibovespa","b3","ações","acoes","mercado financeiro","banco central","bacen","fed","federal reserve",
  "fiscal","déficit","deficit","superávit","superavit","dívida pública","divida publica","orçamento","orcamento",
  "investimento","investidor","renda fixa","renda variável","renda variavel","fundo imobiliário","fundo imobiliario",
  "tesouro direto","commodities","recessão","recessao","crescimento econômico","crescimento economico",
  "balanço","balanco","lucro líquido","lucro liquido","receita líquida","receita liquida","faturamento",
  "ipo","fusão","fusao","aquisição","aquisicao","m&a","startup","unicórnio","unicornio",
  "tarifa","tarifaço","tarifaco","importação","importacao","exportação","exportacao","balança comercial","balanca comercial",
  "crédito","credito","dívida","divida","tributário","tributario","imposto","reforma tributária","reforma tributaria",
  "wall street","nasdaq","s&p 500","dow jones","commodity","varejo","agronegócio","agronegocio","emprego","desemprego",
  "salário mínimo","salario minimo","caged","pmi","gdp","inflation","interest rate","stock market","earnings"
];
function assuntoFinanceiro(item) {
  const t = ((item.title || "") + " " + (item.description || "")).toLowerCase();
  return MINUTO_ASSUNTO_KW.some(kw => t.includes(kw));
}

// Filtro de idade PRÓPRIO do Minuto OVC — NUNCA usar isRecente() (48h) aqui.
// Minuto publica direto, sem revisão humana (Regra Zero-I) — precisa de janela
// muito mais estrita que as matérias normais, que ficam pendentes de aprovação.
// Roberto, 01/08/2026: "passou de 59 minutos que a noticia foi publicada, descarta".
// AJUSTADO 02/08/2026: 59min zerava o Minuto quase sempre — logs do pipeline
// confirmaram (descartadosPorIdade:20 de 20 candidatos) que o cron real do
// GitHub Actions dispara a cada ~60min (não a cada 15min como configurado no
// YAML — throttling de plataforma para schedules frequentes), então um item
// com <59min no fetch já nasce velho demais até a próxima rodada rodar. Subiu
// para 3h para sobreviver ao intervalo real entre execuções, mantendo o
// espírito de "só notícia fresca" sem zerar o recurso inteiro.
const MINUTO_MAX_IDADE_MS = 180 * 60 * 1000;
function isUltimaHora(item) {
  const dateStr = item?.pubDate;
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return false;
  return (Date.now() - t) < MINUTO_MAX_IDADE_MS;
}

async function autoMinutoOVC(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const count = Math.min(parseInt(body.count) || 2, 4);
  const fontes = FONTES_APROVADAS_URLS.filter(f => MINUTO_FONTES_CONFIAVEIS.has(f.name)).map(f => ({ url: f.url, name: f.name }));
  const news = await buscarFeedsEspecificos(fontes);
  const seen = new Set();
  const financeiros = news.filter(i => i?.link && !seen.has(i.link) && seen.add(i.link) && assuntoFinanceiro(i));
  const items = financeiros.filter(isUltimaHora).slice(0, 25);
  if (!items.length) {
    return res.status(200).json({
      status: "ok", generated: 0, tipo: "minuto", candidates: 0,
      info: "no_minuto_news",
      stats: { totalFeed: news.length, financeiros: financeiros.length, descartadosPorIdade: financeiros.length - items.length }
    });
  }
  let generated = 0;
  for (const item of items) {
    if (Date.now() - start > 50000 || generated >= count) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) continue;
    let a, sourceText;
    try {
      a = await scrape(item.link);
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 300) continue;
    } catch (_) { continue; }
    const hash = crypto.createHash("md5").update(item.link + "_minuto").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) continue;
    try {
      const content = remapCat(await rewritePortal(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) continue;
      if (pautaParecida(content.titulo, rec.titulos)) continue;
      // Nunca forçar categoria — se a própria IA não classificou como finanças/economia, descarta.
      if (!["economia", "financas", "negocios"].includes(content.categoria)) continue;
      const post = await saveCurtinha(content, hash, content.categoria, "minuto");
      await log("info", `[minuto] ${content.titulo?.slice(0, 50)} | fonte:${item.source}`);
      if (post) await pingGoogleIndexing(buildCurtinhaUrl(post));
      generated++;
    } catch (_) { continue; }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "minuto", candidates: items.length });
}

// DESATIVADO — 28/07/2026 — Roberto: Copa do Mundo 2026 encerrada, radar desligado.
// Função mantida como histórico/referência, mas nunca mais é chamada pelo dispatcher.
async function autoCopaCurtinhas(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const count = Math.min(parseInt(body.count) || 2, 4);
  // Filtro estrito: apenas termos que inequivocamente se referem à Copa do Mundo FIFA 2026
  const COPA_KW = [
    'copa do mundo', 'copa do mundo 2026', 'world cup', 'world cup 2026',
    'mundial 2026', 'fifa 2026', 'fifa world cup', 'copa 2026',
    'oitavas da copa', 'quartas da copa', 'semifinal da copa', 'final da copa',
    'fase de grupos da copa', 'tabela da copa', 'grupo da copa',
    'artilheiro da copa', 'escalação da copa', 'jogo da copa',
    'seleção na copa', 'brasil na copa', 'seleção brasileira na copa',
    'eliminado da copa', 'classificado para a copa',
    'concacaf 2026', 'usmnt', 'canada soccer 2026', 'mexico soccer 2026',
    'marrocos copa', 'portugal copa', 'argentina copa',
    'france world cup', 'germany world cup', 'spain world cup', 'england world cup'
  ];
  const [esportes, geral] = await Promise.all([getNewsByCategoria("esportes"), getNews()]);
  const seen = new Set();
  const allNews = [...esportes, ...geral].filter(i => i?.link && !seen.has(i.link) && seen.add(i.link));
  const copaItems = allNews.filter(i => {
    const t = ((i.title || "") + " " + (i.description || "")).toLowerCase();
    return COPA_KW.some(kw => t.includes(kw));
  }).slice(0, 20);
  if (!copaItems.length) {
    return res.status(200).json({ status: "ok", generated: 0, tipo: "copa_jornal", candidates: 0, info: "no_copa_news" });
  }
  let generated = 0;
  for (const item of copaItems) {
    if (Date.now() - start > 50000 || generated >= count) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) continue;
    let a, sourceText;
    try {
      a = await scrape(item.link);
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 300) continue;
    } catch(_) { continue; }
    const hash = crypto.createHash("md5").update(item.link + "_copa_jornal").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) continue;
    try {
      const content = remapCat(await rewriteEsportes(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) continue;
      await saveCurtinha(content, hash, "esportes", "radar");
      await log("info", `[copa-jornal] ${content.titulo?.slice(0,50)}`);
      generated++;
    } catch(_) { continue; }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "copa_jornal", candidates: copaItems.length });
}

// ATIVADO — 28/07/2026 — Roberto: Radar do Futebol (Brasileirão A/B, Libertadores, Sul-Americana)
// Substitui o Radar da Copa, mesmo padrão automático de geração.
// FONTE_FUTEBOL — 08/08/2026 — Roberto: "EU NAO QUERO FONTES MISTURADAS, PARA NAO HAVER
// DUPLICACOES. QUIERO FONTE ESPECIFICA DAQUELE ESPORTE PLUIGADA EM CADA UM". Antes deste fix
// o pool de candidatos era [esportes (34 fontes, incluindo as 30 dedicadas aos OUTROS 6
// esportes) + geral (getNews(), TODO o portal — Folha, G1, Estadão, sites de tecnologia etc.)]
// filtrado só por keyword. Ou seja: qualquer fonte do portal inteiro podia virar "notícia de
// futebol" bastasse mencionar "Brasileirão" de passagem, e as fontes dedicadas de outros
// esportes (NBA.com, Motorsport.com F1...) entravam no mesmo pool. Fix: restringe o pool de
// futebol às 4 fontes historicamente dominadas por futebol na prática (ver comentário em
// core/rss.js linha ~115) — nenhuma fonte de fora dessa lista específica de futebol entra.
const FONTE_FUTEBOL = new Set(["GE Globo", "ESPN Brasil", "Lance!", "GaúchaZH"]);
async function autoFutebolCurtinhas(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const count = Math.min(parseInt(body.count) || 2, 4);
  const FUTEBOL_KW = [
    'campeonato brasileiro', 'brasileirão', 'brasileirao', 'série a', 'serie a',
    'série b', 'serie b', 'libertadores', 'sul-americana', 'sulamericana',
    'copa sul-americana', 'copa libertadores', 'rodada do brasileirão',
    'tabela do brasileirão', 'artilheiro do brasileirão', 'copa libertadores da américa'
  ];
  // Bug real confirmado 08/08/2026 (Roberto flagrou 3 posts "Flamengo Conquista Hexacampeonato..."):
  // o post nem era de futebol, era de GINÁSTICA ARTÍSTICA ("...no Brasileiro de Ginástica
  // Artística Feminina") — mas "campeonato brasileiro"/"brasileiro" são termos genéricos que
  // QUALQUER modalidade usa para nomear seu campeonato nacional, não são exclusivos de futebol.
  // Fix: exclui explicitamente qualquer item que mencione outra modalidade, mesmo que também
  // bata uma keyword de futebol — sem isso, "Campeonato Brasileiro de X" pra qualquer X vazava
  // pro Radar do Futebol (que por design — Regra Zero-I — é EXCLUSIVO de futebol).
  const NAO_FUTEBOL_KW = [
    'ginástica', 'ginastica', 'atletismo', 'natação', 'natacao', 'judô', 'judo',
    'basquete', 'basketball', 'nba', 'vôlei', 'volei', 'tênis', 'tenis', 'mma', 'ufc',
    'nfl', 'fórmula 1', 'formula 1', 'automobilismo', 'handebol', 'ciclismo',
    'boxe', 'xadrez', 'surfe', 'skate', 'ginastas'
  ];
  const esportes = await getNewsByCategoria("esportes");
  const seen = new Set();
  const allNews = esportes.filter(i => i?.link && FONTE_FUTEBOL.has(i.source) && !seen.has(i.link) && seen.add(i.link));
  const futebolItems = allNews.filter(i => {
    const t = ((i.title || "") + " " + (i.description || "")).toLowerCase();
    if (NAO_FUTEBOL_KW.some(kw => t.includes(kw))) return false;
    return FUTEBOL_KW.some(kw => t.includes(kw));
  }).slice(0, 20);
  if (!futebolItems.length) {
    return res.status(200).json({ status: "ok", generated: 0, tipo: "futebol_jornal", candidates: 0, info: "no_futebol_news" });
  }
  let generated = 0;
  // Bug #confirmado 08/08/2026 (Roberto flagrou 3 posts idênticos "Flamengo Conquista
  // Hexacampeonato..." seguidos no Radar do Esporte): o dedup abaixo só comparava o
  // título BRUTO da fonte (item.title) contra sourceTitulos — nunca o título FINAL
  // gerado pela IA contra os títulos já publicados. Para um evento grande e óbvio,
  // fontes diferentes com títulos brutos diferentes o bastante para passar no primeiro
  // filtro convergiam pra manchetes finais quase idênticas depois da reescrita, e nada
  // barrava isso. geradosAgora cobre ainda o caso de duas fontes do MESMO evento serem
  // processadas na MESMA chamada (rec.titulos só reflete o banco no início da chamada).
  const geradosAgora = [];
  for (const item of futebolItems) {
    if (Date.now() - start > 50000 || generated >= count) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) continue;
    let a, sourceText;
    try {
      a = await scrape(item.link);
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 300) continue;
    } catch(_) { continue; }
    const hash = crypto.createHash("md5").update(item.link + "_futebol_jornal").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) continue;
    try {
      const content = remapCat(await rewriteEsportes(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) continue;
      if (pautaParecida(content.titulo, rec.titulos.concat(geradosAgora))) continue;
      const img = Date.now() - start < 40000 ? await findImageFutebol(content.titulo, content.corpo) : null;
      await saveCurtinha(content, hash, "esportes", "radar", img);
      await log("info", `[futebol-jornal] ${content.titulo?.slice(0,50)} | img:${!!img}`);
      geradosAgora.push(content.titulo);
      generated++;
    } catch(_) { continue; }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "futebol_jornal", candidates: futebolItems.length });
}

// ATIVADO — 04/08/2026 — Roberto: "quero o radar do esporte 24horas operando e com conteudo
// em todos os esportes". autoFutebolCurtinhas() só cobre futebol; autoCurtinhas() genérica está
// pausada desde 14/06/2026. Sem nenhum job 24h dedicado, Basquete/Motor/Tênis/MMA/Vôlei/NFL só
// podiam nascer via autoMaterias() (janela 07:00-00:30 BRT, categoria "esportes" sorteada por
// peso entre outras 9 categorias — frequência baixíssima). Mesmo padrão de autoFutebolCurtinhas,
// mas para os OUTROS 6 esportes oficiais (SUBCATS.esportes no admin / SPORTS em
// ovc-radar-esporte.js — precisam ficar em sincronia com esse arquivo).
// tipo_conteudo="pilula" (nunca "radar" — Radar OVC é exclusividade de futebol, ver comentário
// acima de autoCurtinhas). subcategoria gravada explicitamente por esporte (em vez do default
// "Futebol" de SUBCAT.esportes) para que ovc-radar-esporte.js classifique certo de cara.
const OUTROS_ESPORTES = [
  { key: "basquete", label: "Basquete", keywords: ["nba","nbb","basquete","basketball"] },
  { key: "motor",    label: "Motor",    keywords: ["fórmula 1","formula 1","f1","grande prêmio","grande premio","gp de","stock car","motogp","indycar","automobilismo"] },
  { key: "tenis",    label: "Tênis",    keywords: ["tênis","tenis","atp","wta","wimbledon","roland garros","australian open","us open de tênis","grand slam"] },
  { key: "mma",      label: "MMA",      keywords: ["mma","ufc","octógono","octogono","artes marciais mistas"] },
  { key: "volei",    label: "Vôlei",    keywords: ["vôlei","volei","superliga","fivb","vôlei de praia","volei de praia"] },
  { key: "nfl",      label: "NFL",      keywords: ["nfl","super bowl","futebol americano"] }
];
// Bug real encontrado 08/08/2026, revisão pedida por Roberto após o fix de round-robin:
// classificarOutroEsporte() só olhava palavra-chave no TÍTULO/descrição — mas fontes
// dedicadas de um único esporte (ex: NBA.com) raramente repetem "NBA" em toda manchete
// ("Doncic marca 40 pontos" não tem nenhuma keyword da lista acima). Resultado: itens de
// fontes 100% corretas para aquele esporte eram descartados silenciosamente por não
// baterem keyword nenhuma. Fix: mapear a FONTE (item.source, já vem de core/rss.js) direto
// pro esporte — é um sinal muito mais confiável que keyword-no-título pra essas fontes
// dedicadas. Precisa ficar em sincronia com core/rss.js sempre que uma fonte for
// adicionada/removida/renomeada.
const FONTE_PARA_ESPORTE = {
  "NBA.com": "basquete", "ESPN NBA": "basquete", "Basquete Brasil (GN)": "basquete",
  "HoopsHype": "basquete", "Eurohoops": "basquete",
  "Motorsport.com F1": "motor", "Autosport F1": "motor", "Grande Prêmio (UOL)": "motor",
  "Formula1.com": "motor", "RaceFans.net": "motor",
  "BBC Sport Tênis": "tenis", "ESPN Tênis": "tenis", "Tennis.com": "tenis",
  "Tennis Majors": "tenis", "UBITENNIS": "tenis",
  "Sherdog": "mma", "MMA Fighting": "mma", "MMA Junkie (USA Today)": "mma",
  "MMA Mania": "mma", "Bloody Elbow": "mma",
  "Vôlei Brasil (GN)": "volei", "FIVB Volleyball (GN)": "volei", "Vôlei de Praia (GN)": "volei",
  "VolleyMob": "volei", "Volleyballmag": "volei",
  "NFL.com": "nfl", "ESPN NFL": "nfl", "Pro Football Talk (NBC)": "nfl",
  "CBS Sports NFL": "nfl", "Yahoo Sports NFL": "nfl"
};
const OUTROS_ESPORTES_POR_KEY = Object.fromEntries(OUTROS_ESPORTES.map(s => [s.key, s]));
// Fallback por keyword REMOVIDO — 08/08/2026, Roberto: "EU NAO QUERO FONTES MISTURADAS,
// PARA NAO HAVER DUPLICACOES. QUIERO FONTE ESPECIFICA DAQUELE ESPORTE PLUIGADA EM CADA UM".
// O fallback por keyword no título/descrição (removido abaixo) podia classificar itens das
// 4 fontes GERAIS de esportes (GE Globo/ESPN Brasil/Lance!/GaúchaZH — cobrem todo tipo de
// esporte misturado) para dentro de um esporte específico só por bater uma palavra-chave —
// exatamente a "mistura de fontes" que Roberto vetou. Agora classificarOutroEsporte() só
// aceita item cuja FONTE está exatamente mapeada em FONTE_PARA_ESPORTE (as 30 fontes
// dedicadas). Qualquer outra fonte (inclusive as 4 gerais) é ignorada para estes 6 esportes —
// elas continuam alimentando exclusivamente o Radar do Futebol (ver FONTE_FUTEBOL acima).
function classificarOutroEsporte(fonte) {
  const porFonte = FONTE_PARA_ESPORTE[fonte];
  return porFonte ? OUTROS_ESPORTES_POR_KEY[porFonte] : null;
}

// Distribui os candidatos em round-robin por esporte antes de cortar em N —
// sem isso, um esporte com fontes mais prolíficas (ex: NBA) preenchia sozinho
// os primeiros 25 candidatos e os outros nunca chegavam a ser tentados na
// rodada. Fix 08/08/2026 — Roberto: "tem esportes la que nunca tiveram
// nenhum conteudo e os radares estao construidos ha mais de uma semana".
function distribuirRoundRobin(candidatos) {
  const porEsporte = {};
  for (const c of candidatos) {
    (porEsporte[c.sport.key] = porEsporte[c.sport.key] || []).push(c);
  }
  const filas = Object.values(porEsporte);
  const resultado = [];
  let i = 0;
  while (resultado.length < candidatos.length) {
    let algumaFilaTemItem = false;
    for (const fila of filas) {
      if (fila[i]) { resultado.push(fila[i]); algumaFilaTemItem = true; }
    }
    if (!algumaFilaTemItem) break;
    i++;
  }
  return resultado;
}

async function autoOutrosEsportesCurtinhas(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const count = Math.min(parseInt(body.count) || 3, 6);
  const esportes = await getNewsByCategoria("esportes");
  const seen = new Set();
  const candidatosBrutos = [];
  for (const item of esportes) {
    if (!item?.link || seen.has(item.link)) continue;
    seen.add(item.link);
    const sport = classificarOutroEsporte(item.source);
    if (sport) candidatosBrutos.push({ item, sport });
  }
  if (!candidatosBrutos.length) {
    await log("warn", "[outros-esportes-jornal] 0 candidatos após classificação — nenhuma das 30 fontes dedicadas (FONTE_PARA_ESPORTE) retornou item novo nesta rodada");
    return res.status(200).json({ status: "ok", generated: 0, tipo: "outros_esportes_jornal", candidates: 0, info: "no_outros_esportes_news" });
  }
  const candidatos = distribuirRoundRobin(candidatosBrutos);
  const distribuicaoBruta = {};
  candidatosBrutos.forEach(c => { distribuicaoBruta[c.sport.key] = (distribuicaoBruta[c.sport.key] || 0) + 1; });
  let generated = 0;
  const porEsporte = {};
  const falhas = {}; // motivo -> contagem, para diagnóstico no log final
  const registrarFalha = (motivo) => { falhas[motivo] = (falhas[motivo] || 0) + 1; };
  // Mesmo fix do Bug de duplicidade encontrado em autoFutebolCurtinhas (08/08/2026) —
  // dedup também precisa comparar o título FINAL gerado pela IA, não só o título bruto
  // da fonte antes da reescrita.
  const geradosAgora = [];
  for (const { item, sport } of candidatos.slice(0, 25)) {
    if (Date.now() - start > 50000 || generated >= count) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) { registrarFalha("dedup_titulo_fonte"); continue; }
    let a, sourceText;
    try {
      a = await scrape(item.link);
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 300) { registrarFalha("scrape_curto"); continue; }
    } catch (_) { registrarFalha("scrape_erro"); continue; }
    const hash = crypto.createHash("md5").update(item.link + "_outros_esportes_jornal").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) { registrarFalha("hash_duplicado"); continue; }
    try {
      const content = remapCat(await rewriteEsportes(sourceText, item.title || a.title || "", rec.contexto));
      const erros = validar(content);
      if (erros.length) { registrarFalha("validar:" + erros[0]); continue; }
      if (pautaParecida(content.titulo, rec.titulos.concat(geradosAgora))) { registrarFalha("dedup_titulo_final"); continue; }
      const img = Date.now() - start < 40000 ? await findImage(content.titulo, "esportes") : null;
      await saveCurtinha(content, hash, "esportes", "pilula", img, sport.label);
      await log("info", `[outros-esportes-jornal] ${sport.label}: ${content.titulo?.slice(0,50)}`);
      porEsporte[sport.key] = (porEsporte[sport.key] || 0) + 1;
      geradosAgora.push(content.titulo);
      generated++;
    } catch (e) { registrarFalha("excecao:" + String(e?.message || e).slice(0, 60)); continue; }
  }
  if (Object.keys(falhas).length) {
    await log("info", `[outros-esportes-jornal] resumo da rodada — gerados:${generated} distribuicao_bruta:${JSON.stringify(distribuicaoBruta)} falhas:${JSON.stringify(falhas)}`);
  }
  return res.status(200).json({ status: "ok", generated, tipo: "outros_esportes_jornal", candidates: candidatos.length, porEsporte, distribuicaoBruta, falhas });
}

// ═══════════════════════════════════════════════════════════════════════════
// BRASIL ON — 11/08/2026, Roberto Terrasan: divisão popular do OVC. Reescrita
// 100% de um número pequeno de perfis/sites monitorados, quase instantânea,
// publicação 24h sem aprovação no admin (mesma lógica de saveCurtinha — sem
// fila, sem janela de horário). Categoria "brasil-on", publish_method="brasilon"
// para rastreabilidade/futuro domínio próprio. Fontes em core/brasilon.js —
// NUNCA adicionar fonte sem aprovação explícita de Roberto.
//
// Reescrita: rewriteBrasilOn() — kernel PRÓPRIO (não é o MASTER_PROMPT, ver
// core/ai_portal.js), porque o conteúdo-fonte (Bacci, Revista Oeste) é tabloide/
// curto (ex real usado por Roberto: matéria de 2 frases sobre uma babá presa) —
// o MASTER_PROMPT exige mínimo 2.500-4.000 chars e devolveria INCONSISTENCIA ou
// inflaria o texto. Roberto, 11/08/2026, com exemplo real: "é só reescrever
// corretamente de maneira simples com o padrao ovc" — reescrita fiel ao TAMANHO
// da fonte, sem inflar.
//
// Imagem: SEMPRE a da própria matéria (og:image via scrape()), via
// processAndSaveImage() SEM marca d'água OVC (watermarkLabel: '') e SEM o filtro
// Vision (skipVision: true) — Roberto confirmou 11/08/2026 que Bacci/Revista
// Oeste não têm marca d'água nem nada que impeça reaproveitamento direto, então
// o filtro anti-logo/gráfico/ilustração do OVC (pensado pro pool de 1000+ fontes
// RSS) é desnecessário aqui. Proporção de recorte (1200x675, 16:9) segue sendo
// o padrão OVC — ainda não trocado por falta de recorte customizado de Roberto.
//
// Dedup: 4 camadas, todas herdadas do resto do pipeline (nada exclusivo daqui) —
// (1) Set de link único dentro do próprio lote de candidatos, (2) pautaParecida()
// do título-fonte contra rec.sourceTitulos, (3) hash exato de link+"_brasilon"
// contra o banco (nunca republica a mesma URL), (4) pautaParecida() do título
// FINAL (já reescrito) contra rec.titulos (últimas 48h, banco inteiro) + títulos
// já gerados nesta mesma chamada. rec vem de recentes() — ver essa função acima.
async function salvarBrasilOn(content, hash, img, fonte) {
  const { data, error } = await supabase.from("posts").insert({
    titulo: stripTitle(content.titulo), conteudo: content.corpo,
    comentario_fixado: (content.meta_descricao || "").trim(), imagem: img || null, hash,
    status: "publicado", approved: true, publish_method: "brasilon",
    published_at: new Date().toISOString(),
    user_tags: JSON.stringify(["brasil-on"]), subcategoria: "Brasil ON",
    subcategoria_slug: "brasil-on", collaborators: "[]",
    tipo_conteudo: "padrao",
    metrics: { foco_keyword: content.foco_keyword || "", meta_title: stripTitle(content.meta_title || content.titulo), fonte_brasilon: fonte || "" },
    priority: 0, retry_count: 0, max_retries: 3
  }).select("id").single();
  if (error) return null;
  return { id: data.id, titulo: stripTitle(content.titulo) };
}

// Validação leve para Brasil ON — NÃO reusa validar() (mínimo 2000 chars, 5
// parágrafos, etc — pensado pra matéria longa padrão OVC). Conteúdo-fonte aqui
// é tabloide/curto, frequentemente 2-3 frases (ex real de Roberto, 11/08/2026).
// Checa só o essencial: estrutura presente, título numa faixa sadia, corpo em
// HTML de verdade, sem markdown/metadados vazando, sem recusa da IA vazando.
function validarBrasilOn(content) {
  const erros = [];
  if (!content?.titulo || !content?.corpo) return ["estrutura ausente"];
  content.titulo = stripTitle(content.titulo);
  const corpo = String(content.corpo || "").trim();
  const texto = plain(corpo);
  if (content.titulo.length < 20 || content.titulo.length > 120) erros.push("titulo fora da faixa");
  if (texto.length < 60) erros.push("texto curto demais");
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|META_DESCRICAO:/m.test(corpo)) erros.push("markdown/metadados no corpo");
  if (!/<p\b/i.test(corpo)) erros.push("sem paragrafo html");
  if (/não foi possível|conteúdo insuficiente|não há informações suficientes|inconsistencia/i.test(texto)) erros.push("recusa vazou");
  return erros;
}

async function autoBrasilOn(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const count = Math.min(parseInt(body.count) || 2, 4);
  const candidatos = await buscarCandidatosBrasilOn();
  const seen = new Set();
  const items = candidatos.filter(i => i?.link && !seen.has(i.link) && seen.add(i.link)).slice(0, 20);
  if (!items.length) {
    return res.status(200).json({ status: "ok", generated: 0, tipo: "brasilon", candidates: 0, info: "no_brasilon_news" });
  }
  let generated = 0;
  const geradosAgora = [];
  for (const item of items) {
    if (Date.now() - start > 50000 || generated >= count) break;
    if (pautaParecida(item.title || "", rec.sourceTitulos)) continue;
    let a, sourceText;
    try {
      a = await scrape(item.link);
      // Piso baixo (100, não 300) — fonte é tabloide/curta de propósito, uma
      // matéria real de 2 frases (~180 chars de corpo) não pode ser descartada.
      sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 100) continue;
    } catch (_) { continue; }
    const hash = crypto.createHash("md5").update(item.link + "_brasilon").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) continue;
    try {
      const content = await rewriteBrasilOn(sourceText, item.title || a.title || "", rec.contexto);
      content.categoria = "brasil-on";
      content.subcategoria = "Brasil ON";
      const erros = validarBrasilOn(content);
      if (erros.length) continue;
      if (pautaParecida(content.titulo, rec.titulos.concat(geradosAgora))) continue;
      const sourceImage = a.image || "";
      const img = sourceImage
        ? await processAndSaveImage(sourceImage, hash.slice(0, 12), start, { watermarkLabel: "", skipVision: true })
        : null;
      const post = await salvarBrasilOn(content, hash, img, item.source);
      if (!post) continue;
      // Log diagnóstico TEMPORÁRIO (11/08/2026) — Roberto reportou posts sem
      // imagem. Inclui sourceImage bruto pra distinguir "og:image não
      // encontrada na fonte" de "encontrada mas processAndSaveImage falhou".
      // Remover depois que a causa for confirmada e corrigida.
      await log("info", `[brasilon] ${item.source}: ${content.titulo?.slice(0, 50)} | sourceImage:${sourceImage || "(vazio)"} | img:${img || "(falhou)"}`);
      geradosAgora.push(content.titulo);
      generated++;
    } catch (_) { continue; }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "brasilon", candidates: items.length });
}

export default async function handler(req, res) {
  const body = req.body || {};
  const meta = req.query || {};
  if (meta.action === "buscar_imagem") {
    const q = String(meta.q || "").trim();
    const cat = String(meta.categoria || meta.cat || "").trim();
    if (!q) return res.status(400).json({ error: "q obrigatorio" });
    if (!canUseStockImageSearch(q, cat)) return res.status(200).json({ url: null, categoria: cat || null });
    const url = await findImage(q, cat, "", "");
    return res.status(200).json({ url: url || null, categoria: cat || null });
  }
  if (body.action === "cleanup_titles") return cleanupTitles(res, body);
  if (req.method !== "POST") return res.status(200).json({ status: "ready", message: "Funil editorial OVC ativo, aguardando POST controlado." });
  const override = body.override_pause === "OVC_TESTE_EDITORIAL";
  if (!(await automacaoAtiva())) return res.status(200).json({ status: "pipeline_pausado", message: "AUTOMATION=off. Nenhum conteudo foi gerado.", generated: 0 });
  if (!body.force && !janelaOk()) return res.status(200).json({ status: "fora_horario", janela: "07:00-00:30 BRT", generated: 0 });
  const rec = await recentes();
  try {
    if (body.url || body.texto) return manual(req, res, rec);
    // AUTOGERAÇÃO PAUSADA — 14/06/2026 — aguardando implementação dois passes + prompt esportes
    // if (body.tipo === "curtinhas") return autoCurtinhas(req, res, rec);
    // COPA DESATIVADA — 28/07/2026 — torneio encerrado, substituída pelo Radar do Futebol
    if (body.tipo === "copa") return res.status(200).json({ status: "ok", generated: 0, tipo: "copa_desativado", info: "Radar da Copa desativado — torneio encerrado" });
    if (body.tipo === "futebol") return autoFutebolCurtinhas(req, res, rec);
    if (body.tipo === "outros_esportes") return autoOutrosEsportesCurtinhas(req, res, rec);
    if (body.tipo === "minuto") return autoMinutoOVC(req, res, rec);
    if (body.tipo === "brasilon") return autoBrasilOn(req, res, rec);
    return autoMaterias(req, res, rec);
  }
  catch (e) { await log("error", `[pipeline] erro crítico: ${e.message?.slice(0,200)}`);
  return res.status(500).json({ status: "error", error: e.message, generated: 0 }); }
}
