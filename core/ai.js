import { createClient } from "@supabase/supabase-js";
const _sb = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");
async function _getKeys() {
  try {
    const { data } = await _sb.from("config").select("key,value").in("key", ["GEMINI_API_KEY","GROQ_API_KEY"]);
    const m = {}; (data||[]).forEach(r => m[r.key]=r.value);
    return { gemini: m.GEMINI_API_KEY||process.env.GEMINI_API_KEY||"", groq: m.GROQ_API_KEY||process.env.GROQ_API_KEY||"" };
  } catch(_) { return { gemini: process.env.GEMINI_API_KEY||"", groq: process.env.GROQ_API_KEY||"" }; }
}

const PROMPT_BASE = (hoje, text) => `Você é redator do portal O Valor Capital. Reescreva a notícia abaixo para Instagram.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"tag_texto":"até 4 palavras, forte e direto","tag_tema":"politica|crime|justica|corrupcao|economia|financas|mercado|sociedade|cultura|saude|educacao","resumo_card":"até 10 palavras em caixa alta","post":"texto completo","comentario_fixado":"pergunta ou provocação até 200 chars","search_query":"termos em inglês para buscar imagem"}

REGRAS DO POST:
1. Primeira linha: fato principal em CAIXA ALTA. Máximo 1 linha. Sem efeito dramático.
2. Segundo parágrafo: contexto objetivo. Dados concretos se existirem. Sem adjetivos.
3. Terceiro parágrafo: consequência direta. O que muda. Para quem.
4. Máximo 1.500 caracteres no total.
5. Assinatura: Redação OVC — ${hoje}
6. Hashtags: 4 linhas separadas, última sempre #ovalorcapital

PROIBIDO USAR: "isso mostra", "isso revela", "isso evidencia", "isso reforça", "o caso mostra", "vale destacar", "vale ressaltar", "em meio a", "diante disso", "no cenário atual", "especialistas apontam", "chama atenção", "coloca em xeque", "acende alerta", "gera debate", "merece atenção", "é preocupante", "não é à toa", "não por acaso", "deixa claro", "traz à tona", "é um sinal de", "é um reflexo de", "ao longo dos anos", "historicamente", "cada vez mais", "em última análise", "em suma", "de forma significativa"

TOM: jornalístico, seco, direto. Sem opinião. Sem dramatismo. Sem clichê de IA.
CADA TEXTO DEVE SER DIFERENTE DO ANTERIOR. Não repita estruturas.

NOTÍCIA:
${text}`;

function parseOutput(raw) {
  try {
    let clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7,-3))
                   .replace(/```/g, '')
                   .trim();
    try {
      const p = JSON.parse(clean);
      return buildResult(p);
    } catch(_) {}
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const p = JSON.parse(match[0]);
        return buildResult(p);
      } catch(_) {}
    }
    const get = (key) => {
      const m = clean.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"` ));
      return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
    };
    return {
      title: get('tag_texto') || 'Post OVC',
      text: get('post') || clean.slice(0, 1500),
      comentario_fixado: get('comentario_fixado') || '',
      tag_texto: get('tag_texto') || '',
      tag_tema: get('tag_tema') || 'sociedade',
      resumo_card: get('resumo_card') || '',
      search_query: get('search_query') || ''
    };
  } catch(e) {
    return { title: 'Post OVC', text: raw.slice(0, 1500), comentario_fixado: '', tag_texto: '', tag_tema: 'sociedade', resumo_card: '', search_query: '' };
  }
}

function buildResult(p) {
  return {
    title: p.tag_texto || 'Post OVC',
    text: p.post || '',
    comentario_fixado: p.comentario_fixado || '',
    tag_texto: p.tag_texto || '',
    tag_tema: p.tag_tema || 'sociedade',
    resumo_card: p.resumo_card || '',
    search_query: p.search_query || ''
  };
}

async function rewriteGemini(prompt, key) {
  // 17/08/2026 — mesmo fix de core/ai_portal.js: gemini-flash-latest (hoje
  // gemini-3.7-flash) tem o mesmo teto de 20 req/dia/projeto do free tier,
  // confirmado com 429 real do Google. Trocado para gemini-flash-lite-latest
  // (hoje gemini-3.5-flash-lite) — quota SEPARADA, testada ao vivo com 44
  // chamadas reais sem bater nenhum 429 diário (teto exato ainda desconhecido,
  // só confirmado > 44). Este arquivo hoje não é chamado por nenhum outro
  // (código morto), mas mantido em sincronia para não confundir sessão futura
  // que reative o Instagram.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 1000, responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Gemini: " + (data.error?.message || JSON.stringify(data).slice(0,100)));
  return data.candidates[0].content.parts[0].text;
}

async function rewriteGroq(prompt, key) {
  // 17/08/2026 — mesmo fix de core/ai_portal.js: "llama-3.3-70b-versatile"
  // foi removido do catálogo do Groq (404 confirmado ao vivo, lista real de
  // modelos da conta não tem mais nenhum Llama de chat). Trocado pra
  // "openai/gpt-oss-120b" (testado ao vivo no outro arquivo). Este arquivo
  // continua código morto (sem caller ativo), mantido em sincronia por
  // convenção pra não confundir sessão futura que reative o Instagram.
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "Você é redator jornalístico. Responda APENAS com JSON válido, sem markdown." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.85,
      response_format: { type: "json_object" }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq: " + (data.error?.message || JSON.stringify(data).slice(0,100)));
  return data.choices[0].message.content;
}

export async function rewrite(text, provider = "auto") {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const prompt = PROMPT_BASE(hoje, text);
  const { gemini, groq } = await _getKeys();

  const pairs = provider === "groq"
    ? [[rewriteGroq, groq], [rewriteGemini, gemini]]
    : [[rewriteGemini, gemini], [rewriteGroq, groq]];

  let lastErr;
  for (const [fn, key] of pairs) {
    if (!key) continue;
    try {
      const output = await fn(prompt, key);
      const result = parseOutput(output);
      if (result.text && result.text.length > 50) return result;
    } catch(e) {
      lastErr = e;
      continue;
    }
  }
  throw new Error("IA falhou: " + (lastErr?.message || "erro desconhecido"));
}
