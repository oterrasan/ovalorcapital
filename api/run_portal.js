import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const CATS = new Set(["politica","economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao","parcerias","internacional","variedades","investigativo","seguranca","cultura","profissoes","vagas","concursos","imoveis","esg","defesa","religiao","radar"]);
const PRIORIDADE = ["politica","economia","internacional","tecnologia","negocios","investimentos","mercados","esportes","saude","radar"];
const SUBCAT = { politica:"Governo Federal", economia:"Política Econômica", negocios:"Empresas & Corporações", investimentos:"Bolsa de Valores", seguros:"Seguro de Vida", mercados:"Commodities", educacao:"Ensino Superior", industria:"Agronegócio", tecnologia:"Inteligência Artificial", esportes:"Futebol", saude:"Medicina & Tratamentos", familia:"Educação dos Filhos", tributacao:"IRPF", regulacao:"BACEN", parcerias:"Acordos Comerciais", internacional:"Relações Exteriores", variedades:"Comportamento", investigativo:"Corrupção", seguranca:"Segurança Pública", cultura:"Cinema", profissoes:"Medicina", vagas:"Oportunidades CLT", concursos:"Concursos Federais", imoveis:"Mercado Imobiliário", esg:"Sustentabilidade", defesa:"Forças Armadas", religiao:"Evangelicalismo", radar:"Radar OVC" };
const RECORRENTES = new Set(["lula","bolsonaro","moraes","alexandre","dino","trump","putin","haddad","stf","congresso","senado","camara","governo","presidente","ministro","deputado","senador","pcc","policia","federal","dolar","selic","ipca","copom","ibovespa","brasil","eua","china","russia"]);
const STOP = new Set(["para","pelo","pela","pelos","pelas","como","mais","sobre","apos","entre","nova","novo","novas","novos","com","sem","que","uma","uns","umas","dos","das","nos","nas","aos","seu","sua","seus","suas","sera","antes","nao","nem","mas","ate","alem","desde","isso","esta","este","esse","essa","onde","quando","qual","quais","fica","faz","fez","foi","sao","tem","ter","pode","deve","diz","disse","afirma","anuncia","revela","aponta","destaca","alerta"]);
const EVENTO = new Set(["aprova","aprovacao","vota","votacao","sanciona","veto","decide","decisao","prende","prisao","operacao","bloqueia","bloqueio","investiga","denuncia","condena","absolve","autoriza","suspende","aumenta","reduz","corta","eleva","queda","alta","lanca","anuncia","acordo","cobra","multa","reforma","projeto","relatorio","pesquisa","levantamento","resultado","balanco"]);
const VICIO_IA = ["vale destacar","cabe ressaltar","nesse contexto","diante desse cenário","diante desse cenario","sob essa ótica","sob essa otica","nesse sentido","em suma","por fim","considerações finais","consideracoes finais","reflexões finais","reflexoes finais","perspectiva estratégica","perspectiva estrategica","leitura de segunda ordem","impactos não óbvios","impactos nao obvios","ecossistema","disruptivo","sinergia","catalisador","robusto","robusta","robustos","robustas","nova era"];
const IMG_HOSTS = new Set(["glbimg.com","globo.com","g1.globo.com","ge.globo.com","valor.com.br","uol.com.br","folha.uol.com.br","estadao.com.br","r7.com","sbt.com.br","jovempan.com.br","band.com.br","cnnbrasil.com.br","veja.com.br","abril.com.br","exame.com","cartacapital.com.br","poder360.com.br","gazetadopovo.com.br","metropoles.com","infomoney.com.br","terra.com.br","agenciabrasil.ebc.com.br","reuters.com","investing.com","ap.org"]);

async function automacaoAtiva() { try { const { data } = await supabase.from("config").select("value").eq("key", "AUTOMATION").single(); return data?.value === "on"; } catch (_) { return false; } }
function slugify(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"); }
function stripTitle(t) { return (t || "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(); }
function plain(html = "") { return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function field(raw, name) { const rx = new RegExp(`^${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|\\nCORPO:|$)`, "mi"); return (raw.match(rx)?.[1] || "").trim(); }
function parseOVC(raw) { const txt = String(raw || "").replace(/```(?:html|json)?/gi, "").replace(/```/g, "").trim(); return { titulo: field(txt, "TITULO"), meta_title: field(txt, "META_TITLE"), foco_keyword: field(txt, "FOCO_KEYWORD"), slug: field(txt, "SLUG"), meta_descricao: field(txt, "META_DESCRICAO"), categoria: field(txt, "CATEGORIA").toLowerCase(), subcategoria: field(txt, "SUBCATEGORIA"), corpo: (txt.match(/CORPO:\s*([\s\S]*)$/i)?.[1] || "").trim() }; }
function palavras(titulo = "") { return titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 5 && !STOP.has(w) && !RECORRENTES.has(w)).slice(0, 10); }
function pautaParecida(titulo, recentes) { const novo = new Set(palavras(titulo)); if (novo.size < 3) return false; return (recentes || []).some(t => { const antigo = new Set(palavras(t)); if (antigo.size < 3) return false; const inter = [...novo].filter(w => antigo.has(w)); return inter.some(w => EVENTO.has(w)) && inter.length >= 3 && inter.length / Math.min(novo.size, antigo.size) >= 0.62; }); }
function competitorImage(url) { if (!url) return false; try { const h = new URL(url).hostname.replace(/^www\./, ""); return [...IMG_HOSTS].some(d => h === d || h.endsWith("." + d)); } catch (_) { return false; } }
function janelaOk() { const br = new Date(Date.now() - 3 * 3600000); const minutos = br.getUTCHours() * 60 + br.getUTCMinutes(); return minutos >= 420 || minutos <= 30; }

function validar(content) {
  const erros = [];
  if (!content?.titulo || !content?.corpo) return ["estrutura ausente"];
  content.titulo = stripTitle(content.titulo);
  const corpo = String(content.corpo || "").trim();
  const texto = plain(corpo);
  if (content.titulo.length < 35 || content.titulo.length > 115) erros.push("titulo fora da faixa");
  if (/nova era|desafio[s]? de|impactos de|futuro de/i.test(content.titulo)) erros.push("titulo generico");
  const tcat = `${content.titulo} ${texto}`.toLowerCase();
  if (content.categoria !== "esportes" && /roland garros|futebol|tenis|tênis|campeonato|copa do mundo|libertadores|formula 1|fórmula 1/.test(tcat)) erros.push("categoria incoerente");
  if (texto.length < 2000) erros.push("texto curto");
  if (!/<p>\s*<strong>Reda(?:ç|c)(?:ã|a)o OVC<\/strong>\s*—/i.test(corpo)) erros.push("assinatura ausente");
  if (!/<h2\b[^>]*>/i.test(corpo)) erros.push("subtitulos ausentes");
  if (!/Conclus(?:ã|a)o OVC|Leitura OVC|Fechamento OVC|Síntese OVC|Sintese OVC/i.test(corpo)) erros.push("fechamento editorial ausente");
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|FOCO_KEYWORD:|META_DESCRICAO:/m.test(corpo)) erros.push("markdown/metadados no corpo");
  const ps = [...corpo.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => plain(m[1]));
  if (ps.length < 8) erros.push("poucos paragrafos");
  if (ps.some(p => p.length > 700)) erros.push("paragrafo longo");
  const baixa = texto.toLowerCase();
  if (VICIO_IA.filter(t => baixa.includes(t)).length > 2) erros.push("cadencia de ia");
  if (/não foi possível|conteúdo insuficiente|não há informações suficientes/i.test(texto)) erros.push("recusa vazou");
  return erros;
}

async function recentes() {
  try {
    const { data } = await supabase.from("posts").select("titulo,metrics,user_tags").gte("created_at", new Date(Date.now() - 4 * 3600000).toISOString()).order("created_at", { ascending: false }).limit(250);
    const titulos = (data || []).map(p => p.titulo).filter(Boolean);
    const kws = (data || []).map(p => p.metrics?.foco_keyword).filter(Boolean).slice(0, 20);
    return { titulos, contexto: `Títulos recentes a evitar: ${titulos.slice(0, 25).join(" | ")}\nKeywords recentes: ${kws.join(", ")}` };
  } catch (_) { return { titulos: [], contexto: "" }; }
}

async function gerarOVC(sourceText, sourceTitle, contexto, categoria) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY ausente");
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const prompt = `Você é a redação sênior do portal O Valor Capital.

Produza uma matéria jornalística OVC em português brasileiro formal, com SEO orgânico e aparência humana. O texto deve ser diferente da fonte: novo ângulo, nova abertura, nova estrutura e análise própria.

Segurança factual: não inventar fatos, datas, valores, fontes, acusações, crimes, intenções ou declarações. Quando houver incerteza, use [VERIFICAR]. Números e declarações precisam de atribuição contextual. Não copiar a fonte.

Anti-IA: evitar fórmulas repetidas como vale destacar, cabe ressaltar, nesse contexto, diante desse cenário, em suma, por fim, sob essa ótica e nesse sentido. Proibido usar robusto, robusta, ecossistema, disruptivo, sinergia, catalisador e títulos genéricos como "nova era", "desafios de" ou "impactos de". FAQ é opcional; use apenas se o tema realmente pedir dúvidas práticas. O encerramento é obrigatório, mas pode variar entre Conclusão OVC, Leitura OVC, Fechamento OVC ou Síntese OVC.

Formato: 2.000 a 4.500 caracteres no CORPO; 8 a 12 parágrafos curtos; usar <h2>; começar o CORPO exatamente com <p><strong>Redação OVC</strong> — ${hoje}</p>; usar só <p>, <h2>, <strong>, <ul>, <li>; proibido markdown.

Retorne exatamente:
TITULO: [55 a 75 caracteres]
META_TITLE: [até 55 caracteres]
FOCO_KEYWORD: [2 a 4 palavras]
SLUG: [3 a 5 palavras hifenizadas sem acento]
META_DESCRICAO: [141 a 155 caracteres]
CATEGORIA: [${categoria}]
SUBCATEGORIA: [subcategoria específica]
CORPO:
[HTML completo]

Contexto recente:
${contexto || "Sem contexto."}

Fonte:
${sourceTitle ? sourceTitle + "\n\n" : ""}${sourceText.slice(0, 9000)}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` }, body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.55, max_tokens: 5200, messages: [{ role: "system", content: "Você é um editor jornalístico sênior. Responda apenas no formato pedido." }, { role: "user", content: prompt }] }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Erro OpenAI");
  return parseOVC(d.choices?.[0]?.message?.content || "");
}

async function imagem(content, articleImage, hash, start) {
  const okSource = articleImage && !competitorImage(articleImage) ? articleImage : null;
  if (okSource) { try { const saved = await processAndSaveImage(okSource, hash.slice(0, 12), start); if (saved) return saved; } catch (_) {} }
  try { return await findImage(content.titulo, content.categoria || ""); } catch (_) { return null; }
}

async function cleanupTitles(res, body) {
  if (!body.force) return res.status(403).json({ error: "requires force:true" });
  const { data } = await supabase.from("posts").select("id,titulo").like("titulo", "%**%").limit(500);
  let fixedTitles = 0;
  for (const p of data || []) { const clean = stripTitle(p.titulo); if (clean !== p.titulo) { await supabase.from("posts").update({ titulo: clean }).eq("id", p.id); fixedTitles++; } }
  return res.status(200).json({ status: "ok", fixedTitles, fixedContent: 0 });
}

async function inserir(content, hash, img, tipo = "padrao") {
  const metaDesc = (content.meta_descricao || "").replace(/\*\*/g, "").trim();
  const cat = CATS.has(content.categoria) ? content.categoria : "economia";
  const sub = content.subcategoria || SUBCAT[cat] || "Geral";
  const { data, error } = await supabase.from("posts").insert({
    titulo: stripTitle(content.titulo), conteudo: content.corpo, comentario_fixado: metaDesc, imagem: img, hash,
    status: "pendente", approved: false, publish_method: "portal", published_at: null,
    user_tags: JSON.stringify([cat]), subcategoria: sub, subcategoria_slug: slugify(sub), collaborators: "[]",
    metrics: { foco_keyword: content.foco_keyword || "", seo_slug: content.slug || "", meta_descricao: metaDesc, meta_title: stripTitle(content.meta_title || content.titulo), tipo_conteudo: tipo },
    priority: tipo === "manual" ? 1 : 0, retry_count: 0, max_retries: 3
  }).select().single();
  if (error) throw error;
  return data;
}

async function manual(req, res, rec) {
  const { url, texto, categoria = "economia", subcategoria = "", image_url, image_query } = req.body || {};
  let sourceText = texto || "", sourceTitle = "", articleImage = "";
  if (url) { const a = await scrape(url); sourceText = a.text || ""; sourceTitle = a.title || ""; articleImage = a.image || ""; }
  if (!sourceText || sourceText.length < 300) return res.status(400).json({ error: "Fonte curta demais para reescrita editorial segura" });
  const cat = CATS.has(categoria) ? categoria : "economia";
  const content = await gerarOVC(sourceText, sourceTitle, rec.contexto, cat);
  content.categoria = cat;
  content.subcategoria = subcategoria || SUBCAT[cat] || "Geral";
  const erros = validar(content);
  if (erros.length) return res.status(422).json({ status: "reprovado", generated: 0, erros });
  const hash = crypto.createHash("md5").update((url || texto).slice(0, 300) + "_manual").digest("hex");
  let img = image_url || await imagem(content, articleImage, hash, Date.now());
  if (!img && image_query) img = await findImage(image_query, cat);
  const post = await inserir(content, hash, img, "manual");
  return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: post.titulo, modo: "manual_pendente" });
}

async function auto(req, res, rec) {
  const start = Date.now();
  const body = req.body || {};
  const cat = CATS.has(String(body.categoria || "").toLowerCase()) ? String(body.categoria).toLowerCase() : PRIORIDADE[Math.floor(Math.random() * PRIORIDADE.length)];
  const [prio, geral] = await Promise.all([getNewsByCategoria(cat), getNews()]);
  const seen = new Set();
  const baseNews = prio.length ? prio : geral;
  const news = baseNews.filter(i => i?.link && !seen.has(i.link) && seen.add(i.link)).slice(0, 40);
  const debug = { sem_fonte: 0, duplicado: 0, reprovado: 0, erro: 0, erros: [] };
  for (const item of news) {
    if (Date.now() - start > 52000) break;
    const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");
    const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
    if (dup) { debug.duplicado++; continue; }
    try {
      const a = await scrape(item.link);
      const sourceText = [a.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 400) { debug.sem_fonte++; continue; }
      const content = await gerarOVC(sourceText, item.title || a.title || "", rec.contexto, cat);
      content.categoria = cat;
      content.subcategoria = SUBCAT[cat] || "Geral";
      const erros = validar(content);
      if (erros.length) { debug.reprovado++; if (debug.erros.length < 5) debug.erros.push(erros.join(", ")); continue; }
      if (pautaParecida(content.titulo, rec.titulos)) { debug.duplicado++; continue; }
      const img = await imagem(content, a.image || "", hash, start);
      const post = await inserir(content, hash, img, "padrao");
      return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: post.titulo, categoria: content.categoria, subcategoria: content.subcategoria, imagem: !!img });
    } catch (e) { debug.erro++; if (debug.erros.length < 5) debug.erros.push(e.message); }
  }
  return res.status(200).json({ status: "no_valid_news", generated: 0, categoria: cat, debug });
}

export default async function handler(req, res) {
  const body = req.body || {};
  const meta = req.query || {};
  if (meta.action === "buscar_imagem") { const q = String(meta.q || "").trim(); if (!q) return res.status(400).json({ error: "q obrigatorio" }); const url = await findImage(q, "", "", ""); return res.status(200).json({ url: url || null }); }
  if (body.action === "cleanup_titles") return cleanupTitles(res, body);
  if (req.method !== "POST") return res.status(200).json({ status: "ready", message: "Funil editorial OVC ativo, aguardando POST controlado." });
  const override = body.override_pause === "OVC_TESTE_EDITORIAL";
  if (!override && !(await automacaoAtiva())) return res.status(200).json({ status: "pipeline_pausado", message: "Pipeline OVC pausado no controle central. Nenhum conteudo foi gerado.", generated: 0 });
  if (!body.force && !janelaOk()) return res.status(200).json({ status: "fora_horario", janela: "07:00-00:30 BRT", generated: 0 });
  const rec = await recentes();
  try { if (body.url || body.texto) return manual(req, res, rec); return auto(req, res, rec); }
  catch (e) { return res.status(500).json({ status: "error", error: e.message, generated: 0 }); }
}
