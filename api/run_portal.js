import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

async function log(level, message) {
  try {
    await supabase.from("logs").insert({ level, message });
  } catch (_) {}
}

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const CATS = new Set(["politica","economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao","parcerias","internacional","variedades","investigativo","seguranca","cultura","profissoes","vagas","concursos","imoveis","esg","defesa","religiao","radar"]);
const PRIORIDADE = ["politica","economia","internacional","tecnologia","negocios","investimentos","mercados","esportes","saude","radar"];
const SUBCAT = { politica:"Governo Federal", economia:"Política Econômica", negocios:"Empresas & Corporações", investimentos:"Bolsa de Valores", seguros:"Seguro de Vida", mercados:"Commodities", educacao:"Ensino Superior", industria:"Agronegócio", tecnologia:"Inteligência Artificial", esportes:"Futebol", saude:"Medicina & Tratamentos", familia:"Educação dos Filhos", tributacao:"IRPF", regulacao:"BACEN", parcerias:"Acordos Comerciais", internacional:"Relações Exteriores", variedades:"Comportamento", investigativo:"Corrupção", seguranca:"Segurança Pública", cultura:"Cinema", profissoes:"Medicina", vagas:"Oportunidades CLT", concursos:"Concursos Federais", imoveis:"Mercado Imobiliário", esg:"Sustentabilidade", defesa:"Forças Armadas", religiao:"Evangelicalismo", radar:"Radar OVC" };
const RECORRENTES = new Set(["lula","bolsonaro","moraes","alexandre","dino","trump","putin","haddad","stf","congresso","senado","camara","governo","presidente","ministro","deputado","senador","pcc","policia","federal","dolar","selic","ipca","copom","ibovespa","brasil","eua","china","russia"]);
const STOP = new Set(["para","pelo","pela","pelos","pelas","como","mais","sobre","apos","entre","nova","novo","novas","novos","com","sem","que","uma","uns","umas","dos","das","nos","nas","aos","seu","sua","seus","suas","sera","antes","nao","nem","mas","ate","alem","desde","isso","esta","este","esse","essa","onde","quando","qual","quais","fica","faz","fez","foi","sao","tem","ter","pode","deve","diz","disse","afirma","anuncia","revela","aponta","destaca","alerta"]);
const EVENTO = new Set(["aprova","aprovacao","vota","votacao","sanciona","veto","decide","decisao","prende","prisao","operacao","bloqueia","bloqueio","investiga","denuncia","condena","absolve","autoriza","suspende","aumenta","reduz","corta","eleva","queda","alta","lanca","anuncia","acordo","cobra","multa","reforma","projeto","relatorio","pesquisa","levantamento","resultado","balanco"]);
const VICIO_IA = ["vale destacar","cabe ressaltar","nesse contexto","diante desse cenário","diante desse cenario","sob essa ótica","sob essa otica","nesse sentido","em suma","por fim","considerações finais","consideracoes finais","reflexões finais","reflexoes finais","perspectiva estratégica","perspectiva estrategica","leitura de segunda ordem","impactos não óbvios","impactos nao obvios","ecossistema","disruptivo","sinergia","catalisador","robusto","robusta","robustos","robustas","nova era"];
const STOCK_IMAGE_CATS = new Set(["economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","saude","familia","tributacao","regulacao","parcerias","variedades","cultura","profissoes","vagas","concursos","imoveis","esg","religiao","radar"]);
const SENSITIVE_IMAGE_RE = /(agress|acus|crime|prisao|morte|morre|ferid|violencia|guerra|ataque|terror|homicidio|assassin|queda|aviao|acidente|sequest|abuso|denuncia|corrup|operacao|policia|policial|manifest|protest|pcc|comando vermelho|comando-vermelho|faccao|fac-cao)/i;

async function automacaoAtiva() { try { const { data } = await supabase.from("config").select("value").eq("key", "AUTOMATION").single(); return data?.value === "on"; } catch (_) { return false; } }
function slugify(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"); }
function stripTitle(t) { return (t || "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(); }
function plain(html = "") { return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function field(raw, name) { const rx = new RegExp(`^${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|\\nCORPO:|$)`, "mi"); return (raw.match(rx)?.[1] || "").trim(); }
function parseOVC(raw) { const txt = String(raw || "").replace(/```(?:html|json)?/gi, "").replace(/```/g, "").trim(); return { titulo: field(txt, "TITULO"), meta_title: field(txt, "META_TITLE"), foco_keyword: field(txt, "FOCO_KEYWORD"), slug: field(txt, "SLUG"), meta_descricao: field(txt, "META_DESCRICAO"), categoria: field(txt, "CATEGORIA").toLowerCase(), subcategoria: field(txt, "SUBCATEGORIA"), corpo: (txt.match(/CORPO:\s*([\s\S]*)$/i)?.[1] || "").trim() }; }
function palavras(titulo = "") { return titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 5 && !STOP.has(w) && !RECORRENTES.has(w)).slice(0, 10); }
function pautaParecida(titulo, recentes) { const novo = new Set(palavras(titulo)); if (novo.size < 3) return false; return (recentes || []).some(t => { const antigo = new Set(palavras(t)); if (antigo.size < 3) return false; const inter = [...novo].filter(w => antigo.has(w)); return inter.some(w => EVENTO.has(w)) && inter.length >= 3 && inter.length / Math.min(novo.size, antigo.size) >= 0.62; }); }
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
  const content = await gerarOVC(sourceText, sourceTitle, rec.contexto, cat);
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

async function gerarPilula(sourceText, sourceTitle, contexto, categoria) {
  const prompt = `Você é redator de pílulas do portal O Valor Capital (OVC), viés centro-direita liberal.
MISSÃO: transformar o fato abaixo numa nota rápida e objetiva para a seção de cada categoria do portal.
REGRA EDITORIAL: pílulas cobrem fatos do dia de QUALQUER categoria — política, saúde, tecnologia, cultura, esportes, variedades. São o registro factual do que aconteceu, sem análise profunda.
REGRA DE EXCLUSÃO: NÃO gere pílula se o fato for de grande repercussão nacional como eleição, Copa ou decisão histórica do STF — esses temas pertencem ao Radar OVC.
LINGUAGEM: direta, acessível, sem jargão. Máximo 3 frases por parágrafo.
PROIBIDO: vale destacar | cabe ressaltar | nesse contexto | acende alerta | especialistas apontam | é importante destacar.
Formato OBRIGATÓRIO:
TITULO: [manchete direta — 45 a 65 caracteres]
FOCO_KEYWORD: [2 a 3 palavras]
META_DESCRICAO: [120 a 155 caracteres]
CATEGORIA: [uma de: politica|economia|negocios|investimentos|tecnologia|internacional|saude|tributos|carreira|imoveis|seguros|industria|familia|esportes|cultura|religiao|brasil-on]
CORPO:
<p><strong>Redação OVC</strong> — ${new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}</p>
[2 parágrafos curtos em HTML, 250 a 500 caracteres total, sem h2, sem imagem]
Fonte: ${sourceTitle ? sourceTitle + "\n\n" : ""}${sourceText.slice(0, 3000)}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 800, temperature: 0.7 })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Erro OpenAI pilula");
  return parseOVC(d.choices?.[0]?.message?.content || "");
}


async function gerarRadar(sourceText, sourceTitle, categoria) {
  const prompt = `Você é repórter do Radar OVC, seção de cobertura em tempo real de grandes eventos do portal O Valor Capital (centro-direita liberal).
MISSÃO: cobrir em tempo real fatos de alto impacto nacional ou internacional.
REGRA EDITORIAL ABSOLUTA: SOMENTE gere se o fato for de grande repercussão — eleições, Copa do Mundo, votações decisivas no Congresso, crises políticas, decisões históricas do STF, grandes catástrofes, conflitos internacionais.
REGRA DE EXCLUSÃO: NÃO gere para notas de empresa, produtos, curiosidades, saúde rotineira, tecnologia comum, cultura ou entretenimento. Prefira não gerar a gerar conteúdo raso.
EXEMPLOS QUE COBRE: eleição presidencial, jogo da Copa, STF decide sobre Bolsonaro, Congresso aprova reforma, terremoto, conflito armado.
EXEMPLOS QUE NAO COBRE: lançamento de produto, pesquisa de saúde, evento cultural, nota de empresa.
LINGUAGEM: urgente, factual, seco. Tom de agência de notícias. Sem adjetivos desnecessários.
PROIBIDO: vale destacar | cabe ressaltar | nesse contexto | acende alerta | é importante destacar.
Formato OBRIGATÓRIO:
TITULO: [manchete urgente — 45 a 65 caracteres]
FOCO_KEYWORD: [2 a 3 palavras]
META_DESCRICAO: [120 a 155 caracteres]
CATEGORIA: [uma de: politica|esportes|internacional|brasil-on]
CORPO:
<p><strong>Radar OVC</strong> — ${new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}</p>
[2 parágrafos curtos em HTML, 200 a 350 caracteres total, sem h2, sem imagem]
Fonte: ${sourceTitle ? sourceTitle + "\n\n" : ""}${sourceText.slice(0, 2500)}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 600, temperature: 0.6 })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Erro OpenAI radar");
  return parseOVC(d.choices?.[0]?.message?.content || "");
}

async function gerarMinuto(sourceText, sourceTitle, categoria) {
  const prompt = `Você é redator do Minuto OVC, seção de resumos executivos do portal O Valor Capital (centro-direita liberal).
MISSÃO: transformar o fato em resumo de 1 minuto de leitura para o leitor executivo — empresário, investidor, profissional liberal.
REGRA EDITORIAL: cobre EXCLUSIVAMENTE economia, negócios, mercado financeiro, investimentos, tributos, regulação, política econômica e tecnologia aplicada a negócios.
REGRA DE EXCLUSÃO: NÃO gere se o fato não tiver impacto direto para quem toma decisões de negócio ou investimento. NÃO cobre esportes, cultura, celebridades, variedades, saúde pública geral ou política eleitoral.
EXEMPLOS QUE COBRE: IPCA, Selic, dólar, resultado de empresa, fusão, regulação do Banco Central, reforma tributária, PIB, bolsa, startup, política econômica.
EXEMPLOS QUE NAO COBRE: Copa do Mundo, eleição, entretenimento, saúde sem impacto econômico, esportes.
LINGUAGEM: seco, preciso, sem rodeios. Tom do Valor Econômico e da Reuters Brasil. Sem adjetivos emocionais.
PROIBIDO: vale destacar | cabe ressaltar | nesse contexto | acende alerta | é importante destacar | mercado preocupado.
Formato OBRIGATÓRIO:
TITULO: [manchete executiva — 45 a 65 caracteres]
FOCO_KEYWORD: [2 a 3 palavras]
META_DESCRICAO: [120 a 155 caracteres]
CATEGORIA: [uma de: economia|negocios|investimentos|tributos|tecnologia|industria|imoveis|seguros|carreira]
CORPO:
<p><strong>Minuto OVC</strong> — ${new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"})}</p>
[3 parágrafos curtos em HTML, 400 a 650 caracteres total, sem h2, sem imagem]
Fonte: ${sourceTitle ? sourceTitle + "\n\n" : ""}${sourceText.slice(0, 2500)}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 800, temperature: 0.6 })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || "Erro OpenAI minuto");
  return parseOVC(d.choices?.[0]?.message?.content || "");
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
      await log("info", `[pipeline] gerado: ${content.titulo?.slice(0,60)} | cat:${content.categoria} | img:${!!img}`);
      // Gerar pílula paralela — publica direto, sem imagem
      try {
        const hashP = crypto.createHash("md5").update(item.link + "_pilula").digest("hex");
        const { data: dupP } = await supabase.from("posts").select("id").eq("hash", hashP).maybeSingle();
        if (!dupP) {
          const pilula = await gerarPilula(sourceText, item.title || a.title || "", rec.contexto, cat);
          if (pilula && pilula.titulo && pilula.corpo && pilula.corpo.length >= 300) {
            const catP = CATS.has(pilula.categoria) ? pilula.categoria : cat;
            await supabase.from("posts").insert({
              titulo: stripTitle(pilula.titulo), conteudo: pilula.corpo,
              comentario_fixado: (pilula.meta_descricao||"").trim(), imagem: null, hash: hashP,
              status: "publicado", approved: true, publish_method: "portal",
              published_at: new Date().toISOString(),
              user_tags: JSON.stringify([catP]), subcategoria: SUBCAT[catP]||"Geral",
              subcategoria_slug: slugify(SUBCAT[catP]||"geral"), collaborators: "[]",
              tipo_conteudo: "pilula", metrics: { foco_keyword: pilula.foco_keyword||"", tipo:"pilula" },
              priority: 0, retry_count: 0, max_retries: 3
            });
            await log("info", `[pipeline] pilula: ${pilula.titulo?.slice(0,50)} | cat:${catP}`);
          }
        }
      } catch(eP) { await log("warn", `[pipeline] falha pilula: ${eP.message?.slice(0,80)}`); }

        // Gerar Radar OVC (para categorias: politica, esportes, internacional)
        const CATS_RADAR = ["politica", "esportes", "internacional", "brasil-on"];
        if (CATS_RADAR.includes(cat)) {
          try {
            const hashR = crypto.createHash("md5").update(item.link + "_radar").digest("hex");
            const { data: dupR } = await supabase.from("posts").select("id").eq("hash", hashR).maybeSingle();
            if (!dupR) {
              const radar = await gerarRadar(sourceText, item.title || a.title || "", cat);
              if (radar && radar.titulo && radar.corpo && radar.corpo.length >= 150) {
                const catR = CATS.has(radar.categoria) ? radar.categoria : cat;
                await supabase.from("posts").insert({
                  titulo: stripTitle(radar.titulo), conteudo: radar.corpo,
                  comentario_fixado: (radar.meta_descricao||"").trim(), imagem: null, hash: hashR,
                  status: "publicado", approved: true, publish_method: "portal",
                  user_tags: JSON.stringify([catR]), published_at: new Date().toISOString(),
                  tipo_conteudo: "radar", metrics: { foco_keyword: radar.foco_keyword||"", tipo:"radar" }
                });
                await log("info", `[pipeline] radar: ${radar.titulo?.slice(0,50)} | cat:${catR}`);
              }
            }
          } catch(eR) { await log("warn", `[pipeline] falha radar: ${eR.message?.slice(0,80)}`); }
        }

        // Gerar Minuto OVC (para todas as categorias, 1 em cada 3 artigos)
        try {
          const hashM = crypto.createHash("md5").update(item.link + "_minuto").digest("hex");
          const { data: dupM } = await supabase.from("posts").select("id").eq("hash", hashM).maybeSingle();
          if (!dupM) {
            const minuto = await gerarMinuto(sourceText, item.title || a.title || "", cat);
            if (minuto && minuto.titulo && minuto.corpo && minuto.corpo.length >= 300) {
              const catM = CATS.has(minuto.categoria) ? minuto.categoria : cat;
              await supabase.from("posts").insert({
                titulo: stripTitle(minuto.titulo), conteudo: minuto.corpo,
                comentario_fixado: (minuto.meta_descricao||"").trim(), imagem: null, hash: hashM,
                status: "publicado", approved: true, publish_method: "portal",
                user_tags: JSON.stringify([catM]), published_at: new Date().toISOString(),
                tipo_conteudo: "minuto", metrics: { foco_keyword: minuto.foco_keyword||"", tipo:"minuto" }
              });
              await log("info", `[pipeline] minuto: ${minuto.titulo?.slice(0,50)} | cat:${catM}`);
            }
          }
        } catch(eM) { await log("warn", `[pipeline] falha minuto: ${eM.message?.slice(0,80)}`); }
      return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: post.titulo, categoria: content.categoria, subcategoria: content.subcategoria, imagem: !!img });
    } catch (e) { debug.erro++; if (debug.erros.length < 5) debug.erros.push(e.message); }
  }
  return res.status(200).json({ status: "no_valid_news", generated: 0, categoria: cat, debug });
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
  try { if (body.url || body.texto) return manual(req, res, rec); return auto(req, res, rec); }
  catch (e) { await log("error", `[pipeline] erro crítico: ${e.message?.slice(0,200)}`);
  return res.status(500).json({ status: "error", error: e.message, generated: 0 }); }
}
