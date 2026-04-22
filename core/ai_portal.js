import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  "AIzaSyCwreCfwhzdV_s6Xu-ooQgZkl2fUXe0_-w",
  "AIzaSyCGWcYunuiDyBfoRwTfGxt1hRRyNtEKFOw",
  "AIzaSyAkh4HUFlhQi2xVV8dJTE9HSTOHDwl4SzE",
  "AIzaSyCz2NnKvjObbWTUM1w_O3fsAYVyc1HKOS8",
  "AIzaSyDK3iHpVI1rHlJGclRS2lCbxog8673oD9g",
].filter(Boolean);

// Modelos em ordem de preferencia
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-pro"];

const keyErrors = {};

function getAvailableKey() {
  return GEMINI_KEYS.find(k => (keyErrors[k] || 0) < 3) || GEMINI_KEYS[0];
}

function markError(key) {
  keyErrors[key] = (keyErrors[key] || 0) + 1;
  setTimeout(() => { delete keyErrors[key]; }, 3600000);
}

const PROMPT = (data, title, text) => `Você é o diretor de jornalismo do portal O Valor Capital, com 40 anos de experiência em grandes redações brasileiras. Reescreva a notícia abaixo com rigor jornalístico absoluto.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"titulo":"manchete jornalística","subtitulo":"frase objetiva até 100 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","corpo":"texto completo"}

REGRAS DO TÍTULO:
- Máximo 8 palavras com verbo ou tensão
- Específico: número, nome ou lugar quando disponível
- PROIBIDO: títulos vagos, duas palavras soltas, caixa alta total
- EXEMPLOS CERTOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed"

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. Entre 1.500 e 2.000 caracteres
3. 8 parágrafos separados por linha em branco
4. ABERTURA: primeira frase prende — dado chocante, contradição ou tensão real
5. RITMO: varie tamanho das frases. Curta. Média. Curta
6. ANCORAGEM: pelo menos um número, data ou nome verificável
7. VOZ: centro-direita, fiscalização do governo, liberdade econômica — no ângulo, não explícita
8. FECHAMENTO: último parágrafo deixa tensão, consequência futura ou questão implícita. Leitor termina pensando
9. Após o fechamento: linha em branco, 4 hashtags cada uma em linha separada, última sempre #ovalorcapital

PROIBIDO: "isso mostra", "vale destacar", "em meio a", "diante disso", "especialistas apontam", "chama atenção", "acende alerta", "robusto", "resiliente", "ecossistema", "disruptivo", "paradigma", "sinergia", "blindar", "muralhas", "blueprint", "catalisador", "protagonista", "desafios e oportunidades"

TÍTULO ORIGINAL: ${title}
NOTÍCIA: ${text}`;

const PROMPT_TITULO = (titulo, trecho) => `Você é diretor de jornalismo com 40 anos de experiência. Crie UMA manchete jornalística profissional.

REGRAS:
- Máximo 8 palavras
- Verbo ou tensão obrigatório
- Específico: use número, nome ou lugar se disponível
- PROIBIDO: vagos, palavras soltas, caixa alta total
- BOM: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed" | "Apple demite 200 após saída de Tim Cook"

TÍTULO ATUAL (mude completamente): ${titulo}
TRECHO DA NOTÍCIA: ${trecho}

Responda APENAS com o título, sem aspas, sem explicação.`;

async function callGemini(prompt, key, maxTokens = 1800) {
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: maxTokens }
        })
      });
      const d = await res.json();
      if (res.status === 429 || (d.error?.message || "").includes("quota")) {
        markError(key);
        throw new Error(`rate_limit`);
      }
      if (!res.ok) throw new Error(`${model} ${res.status}: ${d.error?.message || ""}`);
      return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch(e) {
      if (e.message === "rate_limit") throw e;
      // Modelo não disponível, tenta próximo
      continue;
    }
  }
  throw new Error("Nenhum modelo Gemini disponível");
}

function parse(raw) {
  try {
    let s = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7,-3)).replace(/```/g,"").trim();
    try { return JSON.parse(s); } catch(_) {}
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    const get = k => {
      const r = s.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
      return r ? r[1].replace(/\\n/g,"\n").replace(/\\"/g,'"') : "";
    };
    return { titulo: get("titulo"), subtitulo: get("subtitulo"), categoria: get("categoria")||"geral", corpo: get("corpo") };
  } catch(_) {
    return { titulo:"", subtitulo:"", categoria:"geral", corpo: raw.slice(0,2000) };
  }
}

export async function rewritePortal(text, title) {
  const prompt = PROMPT(hoje(), title || "", text);
  let lastErr;
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = getAvailableKey();
    try {
      const raw = await callGemini(prompt, key, 1800);
      const result = parse(raw);
      if (result.corpo && result.corpo.length > 300) return result;
    } catch(e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error("Todas as chaves Gemini falharam: " + (lastErr?.message || "erro"));
}

export async function rewriteTitle(titulo, corpo) {
  const trecho = (corpo || "").slice(0, 600);
  const prompt = PROMPT_TITULO(titulo, trecho);
  for (const key of GEMINI_KEYS) {
    try {
      const raw = await callGemini(prompt, key, 60);
      const novo = raw.trim().replace(/^["'\n]+|["'\n]+$/g,"").split("\n")[0].trim();
      if (novo && novo.length > 5 && novo.length < 100) return novo;
    } catch(e) {
      continue;
    }
  }
  return titulo;
}
