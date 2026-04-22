import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

// Apenas as 2 chaves válidas confirmadas em teste
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextKey() {
  const key = GEMINI_KEYS[currentKeyIndex % GEMINI_KEYS.length];
  currentKeyIndex++;
  return key;
}

async function callGemini(prompt, maxTokens) {
  const tried = new Set();
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = getNextKey();
    if (tried.has(key)) continue;
    tried.add(key);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: maxTokens }
        })
      });
      const d = await res.json();
      if (res.status === 429) { continue; } // rate limit — tenta próxima
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch(e) {
      if (i < GEMINI_KEYS.length - 1) continue;
      throw e;
    }
  }
  throw new Error("Todas as chaves Gemini atingiram limite. Tente em alguns minutos.");
}

const PROMPT = (data, title, text) => `Você é o diretor de jornalismo do portal O Valor Capital, com 40 anos de experiência em grandes redações brasileiras. Reescreva a notícia abaixo com rigor jornalístico absoluto.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"titulo":"manchete jornalística","subtitulo":"frase objetiva até 100 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","corpo":"texto completo"}

REGRAS DO TÍTULO:
- Máximo 8 palavras com verbo ou tensão obrigatório
- Específico: número, nome ou lugar quando disponível na notícia
- PROIBIDO: títulos vagos, duas palavras soltas, caixa alta total
- EXEMPLOS CERTOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed" | "STF suspende votação e mercado reage"

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. Entre 1.500 e 2.000 caracteres
3. 8 parágrafos separados por linha em branco
4. ABERTURA: primeira frase prende — dado chocante, contradição ou tensão real. Nunca genérica
5. RITMO: varie o tamanho das frases. Curta. Parágrafo médio. Curta novamente
6. ANCORAGEM: pelo menos um número, data ou nome próprio verificável no texto
7. VOZ EDITORIAL: centro-direita, fiscalização do governo, liberdade econômica — presente no ângulo e nas escolhas de palavras, nunca explícita, nunca panfletária
8. FECHAMENTO: o último parágrafo deixa algo na cabeça do leitor — tensão que continua, consequência que vem aí, questão implícita. Sem "conclusão", sem moral da história
9. Após o fechamento: linha em branco, depois 4 hashtags, cada uma em linha separada, última sempre #ovalorcapital

PROIBIDO ABSOLUTAMENTE: "isso mostra", "vale destacar", "vale ressaltar", "em meio a", "diante disso", "especialistas apontam", "chama atenção", "acende alerta", "não é à toa", "deixa claro", "é importante destacar", "no cenário atual", "robusto", "resiliente", "ecossistema", "disruptivo", "paradigma", "sinergia", "blindar", "muralhas", "blueprint", "catalisador", "protagonista", "desafios e oportunidades", "num contexto de"

TÍTULO ORIGINAL DA NOTÍCIA (para referência de tema): ${title}

NOTÍCIA:
${text}`;

const PROMPT_TITULO = (titulo, trecho) => `Você é diretor de jornalismo com 40 anos de experiência. Crie UMA manchete jornalística profissional para esta notícia.

REGRAS:
- Máximo 8 palavras
- Verbo ou tensão obrigatório
- Específico: número, nome ou lugar se disponível
- PROIBIDO: vagos, palavras soltas, caixa alta total
- EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed" | "Apple demite 200 após saída de Tim Cook"

TÍTULO ATUAL (ruim, mude completamente): ${titulo}
TRECHO DA NOTÍCIA: ${trecho}

Responda APENAS com o novo título. Sem aspas. Sem explicação.`;

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
  const raw = await callGemini(prompt, 1800);
  const result = parse(raw);
  if (!result.corpo || result.corpo.length < 300) throw new Error("Conteúdo gerado muito curto");
  return result;
}

export async function rewriteTitle(titulo, corpo) {
  const trecho = (corpo || "").slice(0, 600);
  const prompt = PROMPT_TITULO(titulo, trecho);
  const raw = await callGemini(prompt, 60);
  const novo = raw.trim().replace(/^["'\n]+|["'\n]+$/g,"").split("\n")[0].trim();
  if (novo && novo.length > 5 && novo.length < 100) return novo;
  return titulo;
}
