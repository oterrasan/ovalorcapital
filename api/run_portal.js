import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";
import { rewritePortal, rewriteEsportes, auditarArtigo } from "../core/ai_portal.js";

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

async function saveCurtinha(content, hash, cat, tipo) {
  const catFinal = CATS.has(content.categoria) ? content.categoria : (CATS.has(cat) ? cat : "politica");
  await supabase.from("posts").insert({
    titulo: stripTitle(content.titulo), conteudo: content.corpo,
    comentario_fixado: (content.meta_descricao||"").trim(), imagem: null, hash,
    status: "publicado", approved: true, publish_method: "portal",
    published_at: new Date().toISOString(),
    user_tags: JSON.stringify([catFinal]), subcategoria: SUBCAT[catFinal]||"Geral",
    subcategoria_slug: slugify(SUBCAT[catFinal]||"geral"), collaborators: "[]",
    tipo_conteudo: tipo, metrics: { foco_keyword: content.foco_keyword||"", tipo },
    priority: 0, retry_count: 0, max_retries: 3
  });
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
      const tipo = ["politica","esportes","internacional","brasil-on"].includes(cat) ? "radar"
                 : ["economia","negocios","investimentos","tributos","tecnologia","industria","imoveis","seguros","carreira"].includes(cat) ? "minuto"
                 : "pilula";
      await saveCurtinha(content, hash, cat, tipo);
      await log("info", `[jornal] ${tipo}: ${content.titulo?.slice(0,50)}`);
      generated++;
    } catch(e) { /* ignorado */ }
  }
  return res.status(200).json({ status: "ok", generated, tipo: "jornal" });
}

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
    if (body.tipo === "copa") return autoCopaCurtinhas(req, res, rec);
    return autoMaterias(req, res, rec);
  }
  catch (e) { await log("error", `[pipeline] erro crítico: ${e.message?.slice(0,200)}`);
  return res.status(500).json({ status: "error", error: e.message, generated: 0 }); }
}
