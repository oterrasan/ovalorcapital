import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let keyIndex = 0;
function nextKey() {
  const k = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
  keyIndex++;
  return k;
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
        })
      });
      const d = await res.json();
      if (res.status === 429) { continue; }
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 100) return text;
    } catch(e) {
      if (i === GEMINI_KEYS.length - 1) throw e;
    }
  }
  throw new Error("Gemini indisponível");
}

function detectCategoria(texto) {
  const t = texto.toLowerCase();
  if (/lula|stf|congresso|câmara|senado|governo federal|ministro|presidente|reforma|judiciário|partido|eleição|política/.test(t)) return "politica";
  if (/ibovespa|bolsa|dólar|pib|inflação|selic|copom|juros|banco central|economia|fiscal|orçamento|déficit/.test(t)) return "economia";
  if (/empresa|negócio|startup|mercado|empreend|fusão|aquisição|corporat/.test(t)) return "negocios";
  if (/investimento|ação|fundo|bolsa|cripto|bitcoin|cdi|tesouro|renda fixa/.test(t)) return "investimentos";
  if (/imposto|tributação|ir 2026|irpf|receita federal|tributário/.test(t)) return "tributacao";
  if (/regulação|anatel|anvisa|susep|ans|bacen|cvm|regulatório/.test(t)) return "regulacao";
  if (/seguro|proteção|apólice|sinistro|previdência/.test(t)) return "seguros";
  if (/saúde|médico|hospital|vacina|doença|tratamento|sus|plano de saúde/.test(t)) return "saude";
  if (/família|filho|educação|escola|criança|adolescente/.test(t)) return "familia";
  if (/tecnologia|inteligência artificial|ia|tech|software|hardware|iphone|samsung/.test(t)) return "tecnologia";
  if (/indústria|manufatura|produção|fábrica|industrial/.test(t)) return "industria";
  if (/futebol|nba|esporte|campeonato|clube|jogo|partida|atleta|olimpíada/.test(t)) return "esportes";
  if (/cultura|arte|música|cinema|livro|teatro|show/.test(t)) return "cultura";
  if (/eua|estados unidos|china|europa|guerra|ucrânia|israel|internacional|trump|biden/.test(t)) return "internacional";
  return "geral";
}

const PROMPT = (data, text) => `Você é o diretor de jornalismo do portal O Valor Capital, com 40 anos de experiência. Reescreva esta notícia em padrão jornalístico profissional.

FORMATO DE RESPOSTA — use exatamente estes marcadores:
TITULO: [manchete com máx 8 palavras, verbo obrigatório, específico]
SUBTITULO: [frase objetiva até 100 caracteres]
CORPO:
[texto completo aqui]

REGRAS DO TÍTULO:
- Máx 8 palavras com verbo ou tensão
- Específico: número, nome ou lugar quando disponível
- PROIBIDO: vagos, caixa alta total
- EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed"

REGRAS DO CORPO:
- Primeira linha OBRIGATÓRIA: "Redação OVC — ${data}"
- Mínimo 1.500 caracteres
- 8 parágrafos separados por linha em branco
- Primeira frase prende: dado chocante, contradição ou tensão real
- Ritmo variado: frase curta. parágrafo médio. frase curta
- Pelo menos um número, data ou nome verificável
- Voz centro-direita, fiscalização do governo — no ângulo, nunca explícita
- Último parágrafo: deixa tensão ou questão implícita, leitor termina pensando
- Após o corpo: linha em branco + 4 hashtags em linhas separadas, última sempre #ovalorcapital

PROIBIDO: "isso mostra", "vale destacar", "em meio a", "diante disso", "especialistas apontam", "chama atenção", "acende alerta", "robusto", "resiliente", "ecossistema", "disruptivo", "paradigma", "sinergia", "catalisador", "protagonista", "desafios e oportunidades"

NOTÍCIA:
${text}`;

function parse(raw) {
  if (!raw) return { titulo: "Sem título", subtitulo: "", categoria: "geral", corpo: "" };

  const lines = raw.split("\n");
  let titulo = "";
  let subtitulo = "";
  let corpo = "";
  let inCorpo = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed)) {
      titulo = trimmed.replace(/^TITULO:/i, "").trim();
    } else if (/^SUBTITULO:/i.test(trimmed)) {
      subtitulo = trimmed.replace(/^SUBTITULO:/i, "").trim();
    } else if (/^CORPO:/i.test(trimmed)) {
      inCorpo = true;
    } else if (inCorpo) {
      corpo += line + "\n";
    }
  }

  corpo = corpo.trim();

  // Fallback: se não achou marcadores, usar raw completo
  if (!corpo) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = firstLine;
  }

  // Se corpo começa com "Redação OVC" mas não tem título, extrair da primeira linha não-assinatura
  if (!titulo || titulo === "Sem título") {
    const bodyLines = corpo.split("\n").filter(l => l.trim());
    for (const bl of bodyLines) {
      if (!bl.includes("Redação OVC") && bl.length > 10 && bl.length < 120) {
        titulo = bl.trim();
        break;
      }
    }
  }

  return {
    titulo: titulo || "Sem título",
    subtitulo: subtitulo || "",
    categoria: detectCategoria(titulo + " " + corpo),
    corpo
  };
}

export async function rewritePortal(text, title) {
  const prompt = PROMPT(hoje(), text);
  const raw = await callGemini(prompt);
  const result = parse(raw);
  if (!result.corpo || result.corpo.length < 100) {
    throw new Error("Conteúdo gerado insuficiente: " + result.corpo.length + " chars");
  }
  return result;
}

export async function rewriteTitle(titulo, corpo) {
  const prompt = `Crie uma manchete jornalística profissional. Máx 8 palavras. Verbo obrigatório. Específico.
EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed"
TÍTULO ATUAL (ruim): ${titulo}
TRECHO: ${(corpo||"").slice(0,300)}
Responda APENAS com o novo título, sem explicação.`;
  const raw = await callGemini(prompt);
  const novo = raw.split("\n")[0].trim().replace(/^["']+|["']+$/g,"");
  return novo.length > 5 ? novo : titulo;
}

