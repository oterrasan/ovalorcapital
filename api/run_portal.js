import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria, FAMILIA_CAT } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal, rewritePortalManual, buildDynamicContext } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CATS_VALIDAS = new Set([
  "politica","economia","negocios","investimentos","seguros","mercados",
  "educacao","industria","tecnologia","esportes","saude","familia",
  "tributacao","regulacao","parcerias","internacional","variedades",
  "investigativo","seguranca","cultura","profissoes","vagas","concursos",
  "imoveis","esg","defesa","religiao","radar"
]);

const PRIORIDADE = [
  "politica","economia","internacional","tecnologia","negocios",
  "investimentos","mercados","esportes","saude","radar"
];

const STOPWORDS = new Set([
  "para","pelo","pela","pelos","pelas","como","mais","sobre","apos","entre",
  "nova","novo","novas","novos","com","sem","que","uma","uns","umas","dos",
  "das","nos","nas","aos","seu","sua","seus","suas","sera","antes","nao",
  "nem","mas","ate","alem","desde","isso","esta","este","esse","essa","onde",
  "quando","qual","quais","fica","faz","fez","foi","sao","tem","ter","pode",
  "deve","diz","disse","afirma","anuncia","revela","aponta","destaca","alerta"
]);

const TERMOS_RECORRENTES = new Set([
  "lula","bolsonaro","moraes","alexandre","dino","trump","putin","haddad",
  "stf","congresso","senado","camara","governo","presidente","ministro",
  "deputado","senador","pcc","policia","federal","dolar","selic","ipca",
  "copom","ibovespa","brasil","eua","china","russia"
]);

const TERMOS_EVENTO = new Set([
  "aprova","aprovacao","vota","votacao","sanciona","veto","decide","decisao",
  "prende","prisao","operacao","bloqueia","bloqueio","investiga","denuncia",
  "condena","absolve","autoriza","suspende","aumenta","reduz","corta","eleva",
  "queda","alta","lanca","anuncia","acordo","cobra","multa","reforma","projeto",
  "relatorio","pesquisa","levantamento","resultado","balanco"
]);

const BLACKLIST_IA = [
  "vale destacar","cabe ressaltar","nesse contexto","diante desse cenário",
  "diante desse cenario","sob essa ótica","sob essa otica","nesse sentido",
  "em suma","por fim","considerações finais","consideracoes finais",
  "reflexões finais","reflexoes finais","perspectiva estratégica",
  "perspectiva estrategica","leitura de segunda ordem","impactos não óbvios",
  "impactos nao obvios","ecossistema","disruptivo","sinergia","catalisador"
];

const COMPETITOR_IMG_HOSTS = new Set([
  "glbimg.com","globo.com","g1.globo.com","ge.globo.com","valor.com.br",
  "uol.com.br","folha.uol.com.br","estadao.com.br","r7.com","sbt.com.br",
  "jovempan.com.br","band.com.br","cnnbrasil.com.br","veja.com.br",
  "abril.com.br","exame.com","cartacapital.com.br","poder360.com.br",
  "gazetadopovo.com.br","metropoles.com","infomoney.com.br","terra.com.br",
  "agenciabrasil.ebc.com.br","reuters.com","investing.com","ap.org"
]);

const SUBCAT_DEFAULT = {
  politica:"Governo Federal", economia:"Política Econômica", negocios:"Empresas & Corporações",
  investimentos:"Bolsa de Valores", seguros:"Seguro de Vida", mercados:"Commodities",
  educacao:"Ensino Superior", industria:"Agronegócio", tecnologia:"Inteligência Artificial",
  esportes:"Futebol", saude:"Medicina & Tratamentos", familia:"Educação dos Filhos",
  tributacao:"IRPF", regulacao:"BACEN", parcerias:"Acordos Comerciais",
  internacional:"Relações Exteriores", variedades:"Comportamento", investigativo:"Corrupção",
  seguranca:"Segurança Pública", cultura:"Cinema", profissoes:"Medicina",
  vagas:"Oportunidades CLT", concursos:"Concursos Federais", imoveis:"Mercado Imobiliário",
  esg:"Sustentabilidade", defesa:"Forças Armadas", religiao:"Evangelicalismo", radar:"Radar OVC"
};

async function automacaoAtiva() {
  try {
    const { data } = await supabase.from("config").select("value").eq("key", "AUTOMATION").single();
    return data?.value === "on";
  } catch (_) {
    return false;
  }
}

function slugify(t) {
  return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

function stripTitle(t) {
  return (t || "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
}

function textoPlano(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function isCompetitorDomain(url) {
  if (!url || url.length < 10) return false;
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return [...COMPETITOR_IMG_HOSTS].some(d => h === d || h.endsWith("." + d));
  } catch (_) {
    return false;
  }
}

function palavrasTopico(titulo = "") {
  return titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w.length >= 5 && !STOPWORDS.has(w) && !TERMOS_RECORRENTES.has(w))
    .slice(0, 10);
}

function pautaMuitoParecida(novoTitulo, titulosRecentes) {
  const novo = new Set(palavrasTopico(novoTitulo));
  if (novo.size < 3) return false;
  return (titulosRecentes || []).some(titulo => {
    const antigo = new Set(palavrasTopico(titulo));
    if (antigo.size < 3) return false;
    const inter = [...novo].filter(w => antigo.has(w));
    const temEvento = inter.some(w => TERMOS_EVENTO.has(w));
    return temEvento && inter.length >= 3 && inter.length / Math.min(novo.size, antigo.size) >= 0.62;
  });
}

function dentroHorarioEditorial() {
  const agoraBR = new Date(Date.now() - 3 * 3600000);
  const h = agoraBR.getUTCHours();
  const m = agoraBR.getUTCMinutes();
  const minutos = h * 60 + m;
  return minutos >= 7 * 60 || minutos <= 30;
}

function validarConteudoOVC(content, { manual = false } = {}) {
  const erros = [];
  if (!content || !content.titulo || !content.corpo) return ["estrutura ausente"];

  content.titulo = stripTitle(content.titulo);
  const titulo = content.titulo.trim();
  const corpo = String(content.corpo || "").trim();
  const plano = textoPlano(corpo);

  if (titulo.length < 35 || titulo.length > 115) erros.push("titulo fora da faixa");
  if (/^(prezado|caro|ol[aá]|sem t[ií]tulo|headline|assunto|erro|teste)[:\s]/i.test(titulo)) erros.push("titulo artificial");
  if (plano.length < 2000) erros.push("texto curto");
  if (!/<p>\s*<strong>Reda(?:ç|c)(?:ã|a)o OVC<\/strong>\s*—/i.test(corpo)) erros.push("assinatura ausente");
  if (!/<h2\b[^>]*>/i.test(corpo)) erros.push("subtitulos ausentes");
  if (!/Conclus(?:ã|a)o OVC|Leitura OVC|Fechamento OVC|Síntese OVC|Sintese OVC/i.test(corpo)) erros.push("fechamento editorial ausente");
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|FOCO_KEYWORD:|META_DESCRICAO:/m.test(corpo)) erros.push("metadados ou markdown vazando");

  const paragrafos = [...corpo.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => textoPlano(m[1]));
  if (paragrafos.length < 8) erros.push("poucos paragrafos");
  if (paragrafos.some(p => p.length > 700)) erros.push("paragrafo longo");

  const baixa = plano.toLowerCase();
  const vicios = BLACKLIST_IA.filter(t => baixa.includes(t));
  if (vicios.length > 2) erros.push("cadencia de ia perceptivel");
  if (!manual && /não foi possível|conteúdo insuficiente|não há informações suficientes/i.test(plano)) erros.push("recusa da ia vazou");

  return erros;
}

async function buscarContextoRecente() {
  try {
    const { data } = await supabase.from("posts")
      .select("titulo,user_tags,metrics")
      .gte("created_at", new Date(Date.now() - 4 * 3600000).toISOString())
      .order("created_at", { ascending: false })
      .limit(250);
    const rows = data || [];
    const recentTitles = rows.map(p => p.titulo).filter(Boolean);
    const recentKeywords = rows.map(p => p.metrics?.foco_keyword).filter(Boolean);
    const recentCategories = [...new Set(rows.map(p => {
      try { return JSON.parse(p.user_tags || "[]")[0]; } catch (_) { return null; }
    }).filter(Boolean))];
    return { recentTitles, dynamicContext: buildDynamicContext({ recentTitles: recentTitles.slice(0, 25), recentKeywords, recentCategories }) };
  } catch (_) {
    return { recentTitles: [], dynamicContext: "" };
  }
}

async function imagemParaPost(content, articleImage, hash, inicio) {
  const aprovada = articleImage && !isCompetitorDomain(articleImage) ? articleImage : null;
  if (aprovada) {
    try {
      const saved = await processAndSaveImage(aprovada, hash.slice(0, 12), inicio);
      if (saved) return saved;
    } catch (_) {}
  }
  try {
    return await findImage(content.titulo, content.categoria || "");
  } catch (_) {
    return null;
  }
}

async function cleanupTitles(res, body) {
  if (!body.force) return res.status(403).json({ error: "requires force:true" });
  try {
    const { data: dirty } = await supabase.from("posts").select("id,titulo").like("titulo", "%**%").limit(500);
    let fixedTitles = 0;
    for (const p of dirty || []) {
      const clean = stripTitle(p.titulo);
      if (clean !== p.titulo) {
        await supabase.from("posts").update({ titulo: clean }).eq("id", p.id);
        fixedTitles++;
      }
    }
    return res.status(200).json({ status: "ok", fixedTitles, fixedContent: 0 });
  } catch (e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}

async function handleManualPost(req, res, contexto) {
  const { url, texto, categoria = "", subcategoria = "", image_url, image_query } = req.body || {};
  if (!url && !texto) return res.status(400).json({ error: "Informe url ou texto" });

  let sourceText = "";
  let sourceTitle = "";
  let articleImage = "";
  if (url) {
    const article = await scrape(url);
    sourceText = article.text || "";
    sourceTitle = article.title || "";
    articleImage = article.image || "";
  } else {
    sourceText = texto;
  }
  if (!sourceText || sourceText.length < 300) {
    return res.status(400).json({ error: "Fonte curta demais para reescrita editorial segura" });
  }

  const content = await rewritePortalManual(sourceText, sourceTitle, contexto.dynamicContext);
  if (categoria && CATS_VALIDAS.has(categoria)) content.categoria = categoria;
  if (subcategoria) {
    content.subcategoria = subcategoria;
    content.subcategoria_slug = slugify(subcategoria);
  }

  const erros = validarConteudoOVC(content, { manual: true });
  if (erros.length) return res.status(422).json({ status: "reprovado", erros });

  const hash = crypto.createHash("md5").update((url || texto).slice(0, 300) + "_manual").digest("hex");
  let imagemFinal = image_url || await imagemParaPost(content, articleImage, hash, Date.now());
  if (!imagemFinal && image_query) imagemFinal = await findImage(image_query, content.categoria || "");

  const metaDesc = (content.meta_descricao || content.subtitulo || "").replace(/\*\*/g, "").trim();
  const { data: post, error } = await supabase.from("posts").insert({
    titulo: content.titulo,
    conteudo: content.corpo,
    comentario_fixado: metaDesc,
    imagem: imagemFinal,
    hash,
    status: "pendente",
    approved: false,
    publish_method: "portal",
    published_at: null,
    user_tags: JSON.stringify([content.categoria || "geral"]),
    subcategoria: content.subcategoria || SUBCAT_DEFAULT[content.categoria] || "Geral",
    subcategoria_slug: content.subcategoria_slug || slugify(content.subcategoria || SUBCAT_DEFAULT[content.categoria] || "Geral"),
    collaborators: "[]",
    metrics: {
      foco_keyword: content.foco_keyword || "",
      seo_slug: content.slug || "",
      meta_descricao: metaDesc,
      meta_title: stripTitle(content.meta_title || content.titulo),
      tipo_conteudo: "manual"
    },
    priority: 1,
    retry_count: 0,
    max_retries: 3
  }).select().single();
  if (error) throw error;
  return res.status(200).json({ status: "ok", generated: 1, id: post.id, titulo: content.titulo, modo: "manual_pendente" });
}

async function gerarUmaMateria(req, res, contexto) {
  const inicio = Date.now();
  const body = req.body || {};
  const catPedida = String(body.categoria || "").trim().toLowerCase();
  const catBase = CATS_VALIDAS.has(catPedida)
    ? catPedida
    : PRIORIDADE[Math.floor(Math.random() * PRIORIDADE.length)];

  const [prioritarias, gerais] = await Promise.all([
    getNewsByCategoria(catBase),
    getNews()
  ]);
  const vistos = new Set();
  const news = [...prioritarias, ...gerais].filter(item => {
    if (!item?.link || vistos.has(item.link)) return false;
    vistos.add(item.link);
    return true;
  }).slice(0, 40);

  if (!news.length) return res.status(200).json({ status: "no_news", generated: 0, categoria: catBase });

  const hashes = news.map(item => crypto.createHash("md5").update(item.link + "_portal").digest("hex"));
  const existentes = new Set();
  try {
    const { data } = await supabase.from("posts").select("hash").in("hash", hashes);
    (data || []).forEach(p => existentes.add(p.hash));
  } catch (_) {}

  const debug = { sem_fonte: 0, duplicado: 0, reprovado: 0, erro_ia: 0, erros: [] };

  for (let i = 0; i < news.length && Date.now() - inicio < 50000; i++) {
    const item = news[i];
    const hash = hashes[i];
    if (existentes.has(hash)) {
      debug.duplicado++;
      continue;
    }

    try {
      const article = await scrape(item.link);
      const sourceText = [article.text, item.description, item.title].filter(Boolean).join("\n\n").trim();
      if (sourceText.length < 400) {
        debug.sem_fonte++;
        continue;
      }

      const content = await rewritePortal(sourceText, item.title || article.title || "", contexto.dynamicContext);
      if (!content.categoria || !CATS_VALIDAS.has(content.categoria)) content.categoria = catBase;
      if (catPedida && CATS_VALIDAS.has(catPedida)) {
        const famPedida = FAMILIA_CAT[catPedida];
        const famConteudo = FAMILIA_CAT[content.categoria];
        if (!famPedida || !famConteudo || famPedida === famConteudo) content.categoria = catPedida;
      }
      if (!content.subcategoria) content.subcategoria = SUBCAT_DEFAULT[content.categoria] || "Geral";
      content.subcategoria_slug = content.subcategoria_slug || slugify(content.subcategoria);

      const erros = validarConteudoOVC(content);
      if (erros.length) {
        debug.reprovado++;
        if (debug.erros.length < 5) debug.erros.push(erros.join(", "));
        continue;
      }

      if (pautaMuitoParecida(content.titulo, contexto.recentTitles)) {
        debug.duplicado++;
        continue;
      }

      const imagemFinal = await imagemParaPost(content, article.image || "", hash, inicio);
      const metaDesc = (content.meta_descricao || content.subtitulo || "").replace(/\*\*/g, "").trim();
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: metaDesc,
        imagem: imagemFinal,
        hash,
        status: "pendente",
        approved: false,
        publish_method: "portal",
        published_at: null,
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: "[]",
        metrics: {
          foco_keyword: content.foco_keyword || "",
          seo_slug: content.slug || "",
          meta_descricao: metaDesc,
          meta_title: stripTitle(content.meta_title || content.titulo),
          tipo_conteudo: "padrao"
        },
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();
      if (error) throw error;
      return res.status(200).json({
        status: "ok",
        generated: 1,
        id: post.id,
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        imagem: !!imagemFinal
      });
    } catch (e) {
      debug.erro_ia++;
      if (debug.erros.length < 5) debug.erros.push(e.message);
    }
  }

  return res.status(200).json({ status: "no_valid_news", generated: 0, categoria: catBase, debug });
}

export default async function handler(req, res) {
  const body = req.body || {};
  const meta = req.query || {};

  if (meta.action === "buscar_imagem") {
    const q = String(meta.q || "").trim();
    if (!q) return res.status(400).json({ error: "q obrigatorio" });
    try {
      const url = await findImage(q, "", "", "");
      return res.status(200).json({ url: url || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (body.action === "cleanup_titles") return cleanupTitles(res, body);

  if (req.method !== "POST") {
    return res.status(200).json({ status: "ready", message: "Funil editorial OVC ativo, aguardando POST controlado." });
  }

  const overrideTeste = body.override_pause === "OVC_TESTE_EDITORIAL";
  if (!overrideTeste && !(await automacaoAtiva())) {
    return res.status(200).json({
      status: "pipeline_pausado",
      message: "Pipeline OVC pausado no controle central. Nenhum conteudo foi gerado.",
      generated: 0
    });
  }

  if (!body.force && !dentroHorarioEditorial()) {
    return res.status(200).json({ status: "fora_horario", janela: "07:00-00:30 BRT", generated: 0 });
  }

  const contexto = await buscarContextoRecente();

  try {
    if (body.url || body.texto) return handleManualPost(req, res, contexto);
    return gerarUmaMateria(req, res, contexto);
  } catch (e) {
    return res.status(500).json({ status: "error", error: e.message, generated: 0 });
  }
}
