import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "../core/scraper.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const GEMINI_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_KEY_2].filter(Boolean);
const GROQ_KEY   = process.env.GROQ_API_KEY   || "";
const GROK_KEY   = process.env.GROK_API_KEY   || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

const hoje = () => new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });

// ── PROMPT — retorna texto estruturado com campos SEO completos
function buildPrompt(acao, promptLivre, data, texto) {
  const instrucao = {
    reescrever: "Você é redator sênior do portal O Valor Capital (OVC), especializado em jornalismo econômico e financeiro com foco em SEO. Reescreva a notícia abaixo com outras palavras, mantendo EXATAMENTE os mesmos fatos da fonte. NÃO invente nada.",
    melhorar:   "Você é redator sênior do portal O Valor Capital (OVC). Melhore o texto abaixo elevando a qualidade jornalística e otimizando para SEO, mantendo todos os fatos originais.",
    tema:       "Você é redator sênior do portal O Valor Capital (OVC). Crie uma matéria jornalística completa e otimizada para SEO sobre o tema abaixo, baseando-se apenas nas informações fornecidas.",
    livre:      `Você é redator sênior do portal O Valor Capital (OVC). ${promptLivre}`
  }[acao] || "Você é redator sênior do portal O Valor Capital (OVC). Reescreva no padrão OVC com SEO otimizado.";

  return `${instrucao}

FORMATO DE SAÍDA OBRIGATÓRIO — copie os rótulos exatamente:

TITULO: manchete entre 50 e 65 caracteres — palavra-chave principal no início, verbo obrigatório, factual, sem clickbait
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO
SLUG: 3 a 5 palavras-chave hifenizadas, sem acentos, sem artigos (ex: selic-sobe-inflacao-alta)
META_DESCRICAO: 145 a 160 caracteres — resumo factual com a palavra-chave principal integrada de forma natural
CATEGORIA: escolha exatamente uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | vc | colunistas
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

TEXTO FONTE:
${texto}`;
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
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 4000, temperature: 0.65 })
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

// Parser robusto — lê formato de texto estruturado com campos SEO
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

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao","parcerias","internacional","vc","colunistas"];
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
      ia = "openai", imagem = "", buscarImagem = false, publicar = false
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
              if (imgUrl && /\.(jpg|jpeg|png)/i.test(imgUrl)) sourceImage = imgUrl;
            }
          }
        }
      } catch(_) {}
    }

    const prompt = buildPrompt(acao, promptLivre, hoje(), sourceText);
    let raw = "";

    if      (ia === "gemini") raw = await callGemini(prompt);
    else if (ia === "groq")   raw = await callGroq(prompt);
    else if (ia === "grok")   raw = await callGrok(prompt);
    else if (ia === "openai") raw = await callOpenAI(prompt);
    else                       raw = await callGemini(prompt);

    const content = parse(raw);
    if (!content || !content.corpo || content.corpo.length < 100) {
      throw new Error("A IA não gerou conteúdo suficiente. Tente com um texto mais longo.");
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
    const status = publicar === true || publicar === "publicado" ? "publicado" : "pendente";

    const { data: post, error } = await supabase.from("posts").insert({
      titulo: content.titulo,
      conteudo: content.corpo,
      comentario_fixado: content.meta_descricao || content.subtitulo || "",
      imagem: sourceImage || "",
      hash,
      status,
      approved: status === "publicado",
      publish_method: "portal",
      published_at: status === "publicado" ? new Date().toISOString() : null,
      user_tags: JSON.stringify([content.categoria || "geral"]),
      subcategoria: content.subcategoria || "",
      subcategoria_slug: "",
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
