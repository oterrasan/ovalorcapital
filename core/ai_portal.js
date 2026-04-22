import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

// 5 chaves Gemini em rotação — quando uma atinge limite, passa para a próxima
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  "AIzaSyCwreCfwhzdV_s6Xu-ooQgZkl2fUXe0_-w",
  "AIzaSyCGWcYunuiDyBfoRwTfGxt1hRRyNtEKFOw",
  "AIzaSyAkh4HUFlhQi2xVV8dJTE9HSTOHDwl4SzE",
  "AIzaSyCz2NnKvjObbWTUM1w_O3fsAYVyc1HKOS8",
  "AIzaSyDK3iHpVI1rHlJGclRS2lCbxog8673oD9g",
].filter(Boolean);

// Controle de erros por chave (em memória por instância)
const keyErrors = {};

function getNextKey() {
  // Ordenar por menos erros recentes
  return GEMINI_KEYS.find(k => !keyErrors[k] || keyErrors[k] < 3) || GEMINI_KEYS[0];
}

function markError(key) {
  keyErrors[key] = (keyErrors[key] || 0) + 1;
  // Reset após 1 hora (3600000ms)
  setTimeout(() => { delete keyErrors[key]; }, 3600000);
}

const PROMPT = (data, title, text) => `Você é o diretor de jornalismo do portal O Valor Capital, com 40 anos de experiência em grandes redações brasileiras. Reescreva a notícia abaixo com rigor jornalístico absoluto.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"titulo":"manchete jornalística de alto impacto","subtitulo":"frase objetiva até 100 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","corpo":"texto completo"}

REGRAS DO TÍTULO:
- Máximo 8 palavras
- Deve ter verbo ou tensão — algo aconteceu ou está acontecendo
- Específico: número, nome ou lugar quando disponível na notícia
- Funciona sozinho, sem precisar ler o texto
- PROIBIDO: títulos vagos, duas palavras jogadas, caixa alta total
- EXEMPLOS CORRETOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed" | "STF suspende votação sobre Orçamento"

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. Mínimo 1.500 caracteres. Máximo 2.000 caracteres.
3. 8 parágrafos separados por linha em branco.
4. ABERTURA: primeira frase prende — dado chocante, contradição ou tensão. Nunca genérica.
5. RITMO: varie o tamanho das frases. Frase curta. Parágrafo médio. Frase curta de novo.
6. ANCORAGEM: pelo menos um número, data ou nome próprio verificável no texto.
7. VOZ EDITORIAL: centro-direita, fiscalização do governo, liberdade econômica. Presente no ângulo e nas escolhas — nunca explícita, nunca panfletária.
8. FECHAMENTO: último parágrafo amarra o assunto — deixa tensão, consequência futura ou questão implícita. O leitor termina pensando. Sem "conclusão", sem moral explícita.
9. Português brasileiro correto. Linguagem jornalística profissional. Natural quando lida em voz alta.
10. Após o fechamento, linha em branco, depois 4 hashtags cada uma em linha separada, última sempre #ovalorcapital

PROIBIDO ABSOLUTAMENTE:
"isso mostra", "vale destacar", "vale ressaltar", "em meio a", "diante disso", "especialistas apontam", "chama atenção", "acende alerta", "não é à toa", "deixa claro", "é importante destacar", "no cenário", "robusto", "resiliente", "ecossistema", "disruptivo", "paradigma", "sinergia", "blindar", "muralhas", "blueprint", "catalisador", "protagonista", "desafios", "oportunidades"

TÍTULO ORIGINAL DA NOTÍCIA: ${title}

NOTÍCIA:
${text}`;

async function callGemini(prompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.65, maxOutputTokens: 1800, responseMimeType: "application/json" }
    })
  });
  const d = await res.json();
  if (!res.ok) {
    const msg = d.error?.message || JSON.stringify(d).slice(0, 100);
    // Rate limit ou quota — marcar erro nesta chave
    if (res.status === 429 || msg.includes("quota") || msg.includes("limit")) {
      markError(key);
    }
    throw new Error(`Gemini ${res.status}: ${msg}`);
  }
  return d.candidates[0].content.parts[0].text;
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

  // Tentar todas as chaves em sequência
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const key = getNextKey();
    try {
      const raw = await callGemini(prompt, key);
      const result = parse(raw);
      if (result.corpo && result.corpo.length > 300) return result;
    } catch(e) {
      lastErr = e;
      // Se for rate limit, tenta próxima imediatamente
      // Se for outro erro, aguarda 1s
      if (!e.message.includes("429") && !e.message.includes("quota")) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw new Error("Todas as chaves Gemini falharam: " + (lastErr?.message || "erro desconhecido"));
}

// Função auxiliar para reescrever apenas o título (usada pela API de correção)
export async function rewriteTitle(titulo, corpo) {
  const promptTitulo = `Você é diretor de jornalismo com 40 anos de experiência. Crie uma manchete jornalística profissional para esta notícia.

REGRAS:
- Máximo 8 palavras
- Deve ter verbo ou tensão
- Específico: use número, nome ou lugar se disponível no texto
- Funciona sozinho sem precisar ler o texto
- PROIBIDO: títulos vagos, palavras jogadas, caixa alta total
- EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed" | "STF suspende votação sobre Orçamento"

RETORNE APENAS O TÍTULO, sem aspas, sem explicação.

TÍTULO ATUAL (péssimo, mude completamente): ${titulo}
CORPO DA NOTÍCIA: ${(corpo||"").slice(0,500)}`;

  let lastErr;
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = getNextKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptTitulo }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 50 }
        })
      });
      const d = await res.json();
      if (!res.ok) { markError(key); throw new Error(`${res.status}`); }
      const novoTitulo = d.candidates[0].content.parts[0].text.trim()
        .replace(/^["']|["']$/g, "").replace(/\n.*/g, "").trim();
      if (novoTitulo && novoTitulo.length > 5) return novoTitulo;
    } catch(e) { lastErr = e; }
  }
  return titulo; // mantém o original se tudo falhar
}
