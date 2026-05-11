import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "../core/scraper.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const GEMINI_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_KEY_2].filter(Boolean);
const GROQ_KEY   = process.env.GROQ_API_KEY   || "";
const GROK_KEY   = process.env.GROK_API_KEY   || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

const hoje = () => new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });

const COMPETITOR_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','globo.com','g1.globo.com','ge.globo.com',
  'oglobo.globo.com','extra.globo.com','valor.com.br','uol.com.br','folha.uol.com.br',
  'f.i.uol.com.br','imguol.i.uol.com.br','estadao.com.br','broadcast.com.br',
  'r7.com','record.com.br','sbt.com.br','jovempan.com.br','band.com.br',
  'cnnbrasil.com.br','assets.cnnbrasil.com.br','veja.com.br','abril.com.br',
  'exame.com','cartacapital.com.br','poder360.com.br','gazetadopovo.com.br',
  'metropoles.com','seudinheiro.com','infomoney.com.br','terra.com.br','ig.com.br',
  'agenciabrasil.ebc.com.br','imagens.ebc.com.br','reuters.com','ap.org',
  'canaltech.com.br','apublica.org','correiobraziliense.com.br',
]);

const CATS_VALIDAS_EDITOR = new Set([
  "politica","economia","negocios","investimentos","seguros","mercados",
  "educacao","industria","tecnologia","esportes","saude","familia",
  "tributacao","regulacao","parcerias","internacional","vc","colunistas",
  "variedades","investigativo","seguranca","cultura","profissoes",
  "vagas","concursos","imoveis","esg","defesa","religiao"
]);

function isCompetitorImage(url) {
  if (!url || url.length < 10) return false;
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_HOSTS].some(d => h === d || h.endsWith('.' + d));
  } catch(_) { return false; }
}

function buildPrompt(acao, promptLivre, data, texto, catAlvo = "", subcatAlvo = "") {
  const instrucao = {
    reescrever: "Você é redator sênior do portal O Valor Capital (OVC), especializado em jornalismo econômico e financeiro com foco em SEO. Reescreva a notícia abaixo com outras palavras, mantendo EXATAMENTE os mesmos fatos da fonte. NÃO invente nada.",
    melhorar:   "Você é redator sênior do portal O Valor Capital (OVC). Melhore o texto abaixo elevando a qualidade jornalística e otimizando para SEO, mantendo todos os fatos originais.",
    tema:       "Você é redator sênior do portal O Valor Capital (OVC). Crie uma matéria jornalística completa e otimizada para SEO sobre o tema abaixo, baseando-se apenas nas informações fornecidas.",
    livre:      `Você é redator sênior do portal O Valor Capital (OVC). ${promptLivre}`
  }[acao] || "Você é redator sênior do portal O Valor Capital (OVC). Reescreva no padrão OVC com SEO otimizado.";

  // Instrução de categoria/subcategoria forçada pelo admin — aparece no início e no fim do prompt
  const catInstrucao = catAlvo
    ? `ATENÇÃO — CATEGORIZAÇÃO OBRIGATÓRIA: Este artigo DEVE ser categorizado exatamente como:\nCATEGORIA: ${catAlvo}${subcatAlvo ? `\nSUBCATEGORIA: ${subcatAlvo}` : ''}\nNão use outra categoria ou subcategoria. O editor definiu isso.`
    : '';

  return `${instrucao}
${catInstrucao ? '\n' + catInstrucao + '\n' : ''}
FORMATO DE SAÍDA OBRIGATÓRIO — copie os rótulos exatamente:

TITULO: manchete entre 50 e 65 caracteres — palavra-chave principal no início, verbo obrigatório, factual, sem clickbait
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO
SLUG: 3 a 5 palavras-chave hifenizadas, sem acentos, sem artigos (ex: selic-sobe-inflacao-alta)
META_DESCRICAO: 145 a 160 caracteres — resumo factual com a palavra-chave principal integrada de forma natural
CATEGORIA: escolha exatamente uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | variedades | investigativo | seguranca | cultura | profissoes | vagas | concursos | imoveis | esg | defesa | religiao | vc | colunistas
SUBCATEGORIA: subcategoria específica dentro da categoria escolhida
CORPO:
Redação OVC — ${data}

[Parágrafo de abertura — 4 a 5 frases. Fato mais importante primeiro. Inclua a palavra-chave na primeira frase. Responda quem, o quê, quando, onde, por quê.]

## [Subheading H2 — variação da palavra-chave, factual, 4 a 7 palavras]

[Parágrafo — 4 frases. Contexto e desdobramentos com dados concretos.]

[Parágrafo — 4 frases. Números, datas, nomes verificáveis.]

## [Subheading H2 — impacto prático ou consequências]

[Parágrafo — 4 frases. Quem paga, quem ganha, quem perde. Impacto real para o brasileiro.]

[Parágrafo — 4 frases. Reações, declarações, posições diferentes.]

## [Subheading H2 — perspectiva histórica ou próximos passos]

[Parágrafo — 4 frases. Contexto histórico ou comparação relevante.]

[Parágrafo — 3 frases. Perspectiva ou próximos passos. Não conclua — deixe tensão em aberto.]

#hashtag_tema_1
#hashtag_tema_2
#hashtag_tema_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- CORPO mínimo 2.000 caracteres — parágrafos densos e completos
- Primeira linha do CORPO sempre: Redação OVC — ${data}
- Os subheadings ## aparecem exatamente como marcados (## espaço texto)
- TITULO entre 50 e 65 caracteres — conte e ajuste
- META_DESCRICAO entre 145 e 160 caracteres — conte e ajuste
- Linguagem direta e acessível, sem academicismo
- Voz informativa e factual — nunca panfletária
- NÃO comece com saudação, "Prezado", "Caro", "Olá" ou similar
- NÃO use: isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, blindar, catalisador, protagonista
${catInstrucao ? '\n' + catInstrucao : ''}
PAUTA EDITORIAL (tema, ângulo e contexto — reescreva com seu próprio estilo jornalístico):
---
${texto}
---`;
}

async function callGemini(prompt) {
  for (const key of GEMINI_KEYS) {
    if (!key) continue;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 8192 }
        })
      });
      const d = await res.json();
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text.length > 100) return text;
    } catch(e) { continue; }
  }
  throw new Error("Gemini indisponível. Tente em alguns minutos.");
}

async function callGroq(prompt) {
  if (!GROQ_KEY) throw new Error("Chave Groq não configurada nas variáveis de ambiente.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], max_tokens: 4000, temperature: 0.65 })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Groq ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

async function callGrok(prompt) {
  if (!GROK_KEY) throw new Error("Chave Grok não configurada nas variáveis de ambiente.");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROK_KEY}` },
    body: JSON.stringify({ model: "grok-3-fast", messages: [{ role: "user", content: prompt }], max_tokens: 4000, temperature: 0.65 })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Grok ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("Chave OpenAI não configurada nas variáveis de ambiente.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é redator jornalístico sênior de um portal de notícias brasileiro. Sua função é produzir matérias originais e completas a partir de pautas editoriais. O texto do usuário contém o TEMA e o ÂNGULO EDITORIAL — escreva com seu próprio estilo jornalístico, sem copiar frases da fonte. Siga rigorosamente o formato de saída solicitado." },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000,
      temperature: 0.65
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parse(raw) {
  if (!raw || raw.length < 50) return null;

  const lines = raw.split("\n");
  let titulo = "";
  let focoKeyword = "";
  let slug = "";
  let metaDescricao = "";
  let categoria = "geral";
  let subcategoria = "";
  let corpo = "";
  let inCorpo = false;

  for (const line of lines) {
    const t = line.trim();
    if (/^TITULO:/i.test(t)) {
      titulo = t.replace(/^TITULO:/i, "").trim();
    } else if (/^FOCO_KEYWORD:/i.test(t)) {
      focoKeyword = t.replace(/^FOCO_KEYWORD:/i, "").trim();
    } else if (/^SLUG:/i.test(t)) {
      slug = slugify(t.replace(/^SLUG:/i, "").trim());
    } else if (/^META_DESCRICAO:/i.test(t)) {
      metaDescricao = t.replace(/^META_DESCRICAO:/i, "").trim();
    } else if (/^SUBTITULO:/i.test(t)) {
      if (!metaDescricao) metaDescricao = t.replace(/^SUBTITULO:/i, "").trim();
    } else if (/^CATEGORIA:/i.test(t)) {
      categoria = t.replace(/^CATEGORIA:/i, "").trim().toLowerCase().replace(/[^a-z]/g, "").trim();
    } else if (/^SUBCATEGORIA:/i.test(t)) {
      subcategoria = t.replace(/^SUBCATEGORIA:/i, "").trim();
    } else if (/^CORPO:/i.test(t)) {
      inCorpo = true;
    } else if (inCorpo) {
      corpo += line + "\n";
    }
  }

  corpo = corpo.trim();

  if (!corpo && raw.length > 200) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = titulo || firstLine;
  }

  const catsValidas = [
    "politica","economia","negocios","investimentos","seguros","mercados",
    "educacao","industria","tecnologia","esportes","saude","familia",
    "tributacao","regulacao","parcerias","internacional","vc","colunistas",
    "variedades","investigativo","seguranca","cultura","profissoes",
    "vagas","concursos","imoveis","esg","defesa","religiao"
  ];
  if (!catsValidas.includes(categoria)) categoria = "geral";

  if (!slug && titulo) slug = slugify(titulo).split("-").slice(0, 5).join("-");

  return {
    titulo: titulo || "Matéria OVC",
    subtitulo: metaDescricao || "",
    meta_descricao: metaDescricao || "",
    foco_keyword: focoKeyword || "",
    slug,
    categoria,
    subcategoria: subcategoria || "",
    corpo
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const {
      url, texto, acao = "reescrever", promptLivre = "",
      ia = "openai", imagem = "", buscarImagem = false, publicar = false,
      categoria: catAlvo = "", subcategoria: subcatAlvo = ""
    } = req.body || {};

    if (!url && !texto) return res.status(400).json({ error: "Informe URL ou texto" });

    let sourceText = texto || "";
    let sourceTitle = "";
    let sourceImage = imagem || "";

    if (url && !texto) {
      const article = await scrape(url);
      if (!article.text || article.text.length < 50) {
        return res.status(400).json({ error: "Não foi possível extrair conteúdo desta URL. Tente colar o texto diretamente." });
      }
      sourceText = article.text;
      sourceTitle = article.title || "";
      if (!sourceImage) sourceImage = article.image || "";
    }

    if (isCompetitorImage(sourceImage)) sourceImage = "";

    if (!sourceText || sourceText.trim().length < 20) {
      return res.status(400).json({ error: "Texto muito curto para gerar matéria" });
    }

    if (buscarImagem && !sourceImage) {
      try {
        const words = (sourceTitle || sourceText).slice(0, 60).replace(/[^a-záàâãéêíóôõúç ]/gi, "").split(" ").filter(w => w.length > 3).slice(0, 3).join(" ");
        const q = encodeURIComponent(words);
        const imgRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=3&format=json&origin=*`, {
          headers: { "User-Agent": "OVCPortal/1.0" }, signal: AbortSignal.timeout(5000)
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const title = imgData?.query?.search?.[0]?.title;
          if (title) {
            const infoRes = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`);
            if (infoRes.ok) {
              const info = await infoRes.json();
              const pages = Object.values(info?.query?.pages || {});
              const imgUrl = pages[0]?.imageinfo?.[0]?.url;
              if (imgUrl && /\.(jpg|jpeg|png)/i.test(imgUrl) && !isCompetitorImage(imgUrl)) sourceImage = imgUrl;
            }
          }
        }
      } catch(_) {}
    }

    const prompt = buildPrompt(acao, promptLivre, hoje(), sourceText, catAlvo, subcatAlvo);
    let raw = "";

    if      (ia === "gemini") raw = await callGemini(prompt);
    else if (ia === "groq")   raw = await callGroq(prompt);
    else if (ia === "grok")   raw = await callGrok(prompt);
    else if (ia === "openai") raw = await callOpenAI(prompt);
    else                       raw = await callOpenAI(prompt);

    const content = parse(raw);
    if (!content || !content.corpo || content.corpo.length < 100) {
      throw new Error("A IA não gerou conteúdo suficiente. Tente com um texto mais longo.");
    }

    // Sobrescreve categoria e subcategoria se o admin especificou — não confiar na IA
    if (catAlvo && CATS_VALIDAS_EDITOR.has(catAlvo)) {
      content.categoria = catAlvo;
      if (subcatAlvo) {
        content.subcategoria = subcatAlvo;
      }
    }

    if (!publicar) {
      return res.status(200).json({
        ok: true, preview: true,
        titulo: content.titulo,
        subtitulo: content.subtitulo,
        meta_descricao: content.meta_descricao,
        foco_keyword: content.foco_keyword,
        slug: content.slug,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        corpo: content.corpo,
        imagem: sourceImage
      });
    }

    const hash = crypto.createHash("md5").update((url || texto || "").slice(0, 200) + "_editor_" + Date.now()).digest("hex");
    const status = "pendente";

    const { data: post, error } = await supabase.from("posts").insert({
      titulo: content.titulo,
      conteudo: content.corpo,
      comentario_fixado: content.meta_descricao || content.subtitulo || "",
      imagem: sourceImage || "",
      hash,
      status,
      approved: false,
      publish_method: "portal",
      published_at: null,
      user_tags: JSON.stringify([content.categoria || "geral"]),
      subcategoria: content.subcategoria || "",
      subcategoria_slug: slugify(content.subcategoria || ""),
      collaborators: "[]",
      metrics: {
        foco_keyword: content.foco_keyword || "",
        seo_slug: content.slug || "",
        meta_descricao: content.meta_descricao || ""
      },
      priority: 1,
      retry_count: 0,
      max_retries: 3
    }).select().single();

    if (error) throw new Error("Erro ao salvar: " + error.message);

    return res.status(200).json({
      ok: true, saved: true, status, id: post.id,
      titulo: content.titulo,
      subtitulo: content.subtitulo,
      meta_descricao: content.meta_descricao,
      foco_keyword: content.foco_keyword,
      slug: content.slug,
      categoria: content.categoria,
      subcategoria: content.subcategoria,
      corpo: content.corpo,
      imagem: sourceImage
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
