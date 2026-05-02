import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");
  
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 8192
      })
    });
    
    const d = await res.json();
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ""}`);
    
    const text = d.choices?.[0]?.message?.content;
    if (text && text.length > 100) return text;
    throw new Error("OpenAI retornou resposta vazia ou muito curta");
  } catch(e) {
    throw e;
  }
}

// ══════════════════════════════════════════════════════════════════
// PROMPT — REESCRITA FIEL. NUNCA INVENTA. NUNCA PESQUISA.
// ══════════════════════════════════════════════════════════════════

const PROMPT = (data, text) => `Você é redator do portal O Valor Capital (OVC). Sua tarefa é REESCREVER a notícia abaixo com outras palavras, mantendo EXATAMENTE os mesmos fatos, números, nomes e informações da fonte. Você NÃO pode inventar nada. Você NÃO pode adicionar contexto que não está na fonte. Você NÃO pode pesquisar informações externas. Se a fonte não informa algo, você simplesmente não informa.

REGRA ABSOLUTA: Use APENAS as informações que estão no texto fonte abaixo. Nada mais.

FORMATO DE SAÍDA — copie exatamente:

TITULO: manchete direta com máximo 8 palavras e verbo obrigatório, baseada nos fatos da fonte
SUBTITULO: frase objetiva de até 100 caracteres com os fatos principais da fonte
CATEGORIA: escolha exatamente uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional
SUBCATEGORIA: subcategoria específica da categoria escolhida
CORPO:
Redação OVC — ${data}

[Parágrafo 1 — mínimo 4 frases: reescreva com outras palavras o fato principal da fonte]

[Parágrafo 2 — mínimo 4 frases: reescreva com outras palavras os desdobramentos ou contexto que está NA FONTE]

[Parágrafo 3 — mínimo 4 frases: reescreva com outras palavras os dados, números e nomes que estão NA FONTE]

[Parágrafo 4 — mínimo 4 frases: reescreva com outras palavras outras informações que estão NA FONTE]

[Parágrafo 5 — mínimo 3 frases: reescreva com outras palavras as declarações ou posições que estão NA FONTE]

[Parágrafo 6 — mínimo 3 frases: reescreva com outras palavras o impacto ou consequências mencionados NA FONTE]

[Parágrafo 7 — mínimo 3 frases: encerre com os próximos passos ou perspectivas mencionados NA FONTE]

#hashtag_do_tema_1
#hashtag_do_tema_2
#hashtag_do_tema_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- Use SOMENTE informações do texto fonte. Se não está na fonte, não escreva.
- NUNCA invente nomes de pessoas, empresas, valores, datas ou fatos.
- NUNCA adicione contexto histórico ou comparações que não estão na fonte.
- NUNCA mencione o veículo de origem.
- Linguagem direta, sem academicismo.
- Primeira linha do CORPO sempre: Redação OVC — ${data}
- CORPO com mínimo 1.000 caracteres.
- NÃO comece com "Prezado", "Caro", "Olá", "Atenção" ou qualquer saudação.
- NÃO use: isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista

NOTÍCIA FONTE:
${text}`;

function parse(raw) {
  if (!raw) return null;

  const lines = raw.split("\n");
  let titulo = "";
  let subtitulo = "";
  let categoriaRaw = "";
  let subcategoriaRaw = "";
  let corpo = "";
  let inCorpo = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed)) {
      titulo = trimmed.replace(/^TITULO:/i, "").trim();
    } else if (/^SUBTITULO:/i.test(trimmed)) {
      subtitulo = trimmed.replace(/^SUBTITULO:/i, "").trim();
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

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados","educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao","parcerias","internacional"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "geral";

  return {
    titulo: titulo || "Sem título",
    subtitulo: subtitulo || "",
    categoria: categoriaRaw,
    subcategoria: subcategoriaRaw || "Geral",
    subcategoria_slug: (subcategoriaRaw || "geral").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-"),
    corpo
  };
}

export async function rewritePortal(text, title) {
  const prompt = PROMPT(hoje(), (title ? title + "\n\n" : "") + text);
  const raw = await callOpenAI(prompt);
  const result = parse(raw);

  if (!result || !result.corpo || result.corpo.length < 500) {
    throw new Error("Conteúdo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }

  // Rejeitar lixo de saudação
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
