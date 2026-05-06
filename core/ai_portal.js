import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let geminiKeyIndex = 0;
function nextGeminiKey() {
  const k = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return k;
}

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é redator jornalístico sênior de um portal de notícias brasileiro. Sua função é produzir matérias originais e completas a partir de pautas editoriais. O texto do usuário contém o TEMA e o ÂNGULO EDITORIAL — escreva com seu próprio estilo jornalístico, sem copiar frases da fonte." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 8192
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ""}`);
  const text = d.choices?.[0]?.message?.content;
  if (text && text.length > 100) return text;
  throw new Error("OpenAI retornou resposta vazia ou muito curta");
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextGeminiKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
      });
      const d = await res.json();
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 100) return text;
    } catch(e) {
      if (i === GEMINI_KEYS.length - 1) throw e;
    }
  }
  throw new Error("Gemini indisponível");
}

// ══════════════════════════════════════════════════════════════════
// PROMPT — PRODUÇÃO JORNALÍSTICA OVC COM ANTI-PLÁGIO
// ══════════════════════════════════════════════════════════════════

const PROMPT = (data, text) => `Você é redator sênior do portal O Valor Capital (OVC). Sua tarefa é produzir uma matéria jornalística ORIGINAL sobre o tema do texto fonte abaixo.

REGRAS ANTI-PLÁGIO — INVIOLÁVEIS:
- Use o texto fonte APENAS como referência de pauta (fatos, dados, datas, nomes verificáveis)
- A estrutura, a ordem das informações, as frases e os parágrafos devem ser 100% seus — NUNCA copie frases ou trechos da fonte
- Se o texto fonte for satírico, irônico ou humorístico, trate o tema com seriedade jornalística
- NUNCA mencione o veículo de origem
- NÃO invente fatos que não estão na fonte

FORMATO DE SAÍDA OBRIGATÓRIO — copie os rótulos exatamente:

TITULO: manchete entre 50 e 65 caracteres — palavra-chave principal no início, verbo obrigatório, factual, sem clickbait
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO (ex: taxa selic, reforma tributária, dólar bolsa)
SLUG: 3 a 5 palavras-chave do título em português, hifenizadas, sem acentos, sem artigos (ex: selic-sobe-inflacao-alta)
META_DESCRICAO: 145 a 160 caracteres — resumo factual com a palavra-chave principal integrada de forma natural, sem cortar no meio
CATEGORIA: escolha exatamente uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | vc | colunistas | variedades
SUBCATEGORIA: subcategoria específica dentro da categoria escolhida
CORPO:
Redação OVC — ${data}

[Parágrafo de abertura — 4 a 5 frases. Responda quem, o quê, quando, onde e por quê usando os fatos da fonte. Inclua a palavra-chave principal na primeira frase. Este parágrafo é o mais importante para SEO.]

## [Subheading H2 — variação natural da palavra-chave, factual, 4 a 7 palavras]

[Parágrafo — 4 frases. Desdobramentos e contexto que estão NA FONTE.]

[Parágrafo — 4 frases. Dados, números e nomes presentes NA FONTE.]

## [Subheading H2 — impacto ou consequências práticas, factual]

[Parágrafo — 4 frases. Impacto concreto para o leitor, usando os fatos da fonte.]

[Parágrafo — 4 frases. Quem é afetado, como e por quê — somente o que a fonte diz.]

## [Subheading H2 — perspectiva ou próximos passos, factual]

[Parágrafo — 3 a 4 frases. Próximos passos ou perspectivas mencionados NA FONTE. Não conclua além do que a fonte informa.]

#hashtag_tema_1
#hashtag_tema_2
#hashtag_tema_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- CORPO mínimo 2.000 caracteres — escreva parágrafos densos e completos
- Use SOMENTE fatos do texto fonte. Se não está na fonte, não escreva.
- NUNCA invente nomes de pessoas, empresas, valores, datas ou declarações.
- NUNCA adicione contexto histórico que não está na fonte.
- NUNCA mencione o veículo de origem.
- Primeira linha do CORPO sempre: Redação OVC — ${data}
- Os subheadings ## devem aparecer exatamente como marcados (## seguido de espaço e texto)
- TITULO deve ter entre 50 e 65 caracteres — conte e ajuste
- META_DESCRICAO deve ter entre 145 e 160 caracteres — conte e ajuste
- Linguagem direta e acessível, sem academicismo
- NÃO comece com saudação, "Prezado", "Caro", "Olá" ou similar
- NÃO use: isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista, blindar

PAUTA EDITORIAL (tema, ângulo e contexto fornecidos pelo editor — use como referência jornalística e reescreva com seu próprio estilo):
---
${text}
---`;

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
  if (!raw) return null;

  const lines = raw.split("\n");
  let titulo = "";
  let focoKeyword = "";
  let slug = "";
  let metaDescricao = "";
  let categoriaRaw = "";
  let subcategoriaRaw = "";
  let corpo = "";
  let inCorpo = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed)) {
      titulo = trimmed.replace(/^TITULO:/i, "").trim();
    } else if (/^FOCO_KEYWORD:/i.test(trimmed)) {
      focoKeyword = trimmed.replace(/^FOCO_KEYWORD:/i, "").trim();
    } else if (/^SLUG:/i.test(trimmed)) {
      slug = slugify(trimmed.replace(/^SLUG:/i, "").trim());
    } else if (/^META_DESCRICAO:/i.test(trimmed)) {
      metaDescricao = trimmed.replace(/^META_DESCRICAO:/i, "").trim();
    } else if (/^SUBTITULO:/i.test(trimmed)) {
      if (!metaDescricao) metaDescricao = trimmed.replace(/^SUBTITULO:/i, "").trim();
    } else if (/^CATEGORIA:/i.test(trimmed)) {
      categoriaRaw = trimmed.replace(/^CATEGORIA:/i, "").trim().toLowerCase();
    } else if (/^SUBCATEGORIA:/i.test(trimmed)) {
      subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    } else if (/^CORPO:/i.test(trimmed)) {
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

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao","parcerias","internacional","vc","colunistas","variedades"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "geral";

  if (!slug && titulo) {
    slug = slugify(titulo).split("-").slice(0, 5).join("-");
  }

  return {
    titulo: titulo || "Sem título",
    subtitulo: metaDescricao || "",
    meta_descricao: metaDescricao || "",
    foco_keyword: focoKeyword || "",
    slug,
    categoria: categoriaRaw,
    subcategoria: subcategoriaRaw || "Geral",
    subcategoria_slug: slugify(subcategoriaRaw || "geral"),
    corpo
  };
}

export async function rewritePortal(text, title, useGemini = false) {
  const prompt = PROMPT(hoje(), (title ? title + "\n\n" : "") + text);

  const raw = await callOpenAI(prompt);
  const result = parse(raw);

  if (!result || !result.corpo || result.corpo.length < 800) {
    throw new Error("Conteúdo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }

  const tituloLower = (result.titulo || "").toLowerCase().trim();
  const corpoInicio = result.corpo.slice(0, 100).toLowerCase();
  const proibidos = ["prezado", "caro usuário", "olá,", "atenção:", "dear", "editor(a)", "redator-chefe"];
  if (proibidos.some(p => tituloLower.startsWith(p) || corpoInicio.includes(p))) {
    throw new Error("Conteúdo rejeitado — título ou abertura inválida");
  }

  if (!result.corpo.toLowerCase().includes("redação ovc")) {
    throw new Error("Conteúdo rejeitado — sem assinatura Redação OVC");
  }

  return result;
}
