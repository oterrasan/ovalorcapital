import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const PROMPT = (data, text) => `Você é redator do portal O Valor Capital. Reescreva a notícia abaixo para publicação no portal.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"titulo":"máximo 5 palavras, alto impacto","subtitulo":"1 frase objetiva até 120 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","corpo":"texto completo da matéria"}

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. Mínimo 1.500 caracteres. Máximo 2.000 caracteres.
3. 8 parágrafos separados por linha em branco.
4. Fluxo: contexto → fato → dados → consequência → impacto → perspectiva → conclusão.
5. Linguagem direta, nível de rua. Zero jargão de IA.
6. SEM viés editorial. Apenas fatos.

PROIBIDO: "isso mostra", "vale destacar", "vale ressaltar", "em meio a", "diante disso", "especialistas apontam", "chama atenção", "acende alerta", "não é à toa", "deixa claro", "é importante destacar"

NOTÍCIA:
${text}`;

async function getKeys() {
  try {
    const { data } = await supabase.from("config").select("key,value").in("key", ["GEMINI_API_KEY","GROQ_API_KEY"]);
    const map = {};
    (data || []).forEach(r => map[r.key] = r.value);
    return {
      gemini: map.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
      groq: map.GROQ_API_KEY || process.env.GROQ_API_KEY || ""
    };
  } catch(_) {
    return { gemini: process.env.GEMINI_API_KEY || "", groq: process.env.GROQ_API_KEY || "" };
  }
}

function parse(raw) {
  try {
    let s = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7,-3)).replace(/```/g,"").trim();
    try { return JSON.parse(s); } catch(_) {}
    const m = s.match(/\{[\s\S]*\}/);
    if(m) try { return JSON.parse(m[0]); } catch(_) {}
    const get = k => { const r = s.match(new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)); return r ? r[1].replace(/\\n/g,"\n").replace(/\\"/g,'"') : ""; };
    return { titulo: get("titulo"), subtitulo: get("subtitulo"), categoria: get("categoria")||"geral", corpo: get("corpo") };
  } catch(_) { return { titulo:"", subtitulo:"", categoria:"geral", corpo: raw.slice(0,2000) }; }
}

async function callGemini(prompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:1500,responseMimeType:"application/json"} })
  });
  const d = await res.json();
  if(!res.ok) throw new Error("Gemini: "+(d.error?.message||JSON.stringify(d).slice(0,100)));
  return d.candidates[0].content.parts[0].text;
}

async function callGroq(prompt, key) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
    body: JSON.stringify({
      model:"llama-3.3-70b-versatile",
      messages:[{role:"system",content:"Redator jornalístico. Responda APENAS com JSON válido."},{role:"user",content:prompt}],
      max_tokens:1500, temperature:0.7, response_format:{type:"json_object"}
    })
  });
  const d = await res.json();
  if(!res.ok) throw new Error("Groq: "+(d.error?.message||JSON.stringify(d).slice(0,100)));
  return d.choices[0].message.content;
}

export async function rewritePortal(text) {
  const { gemini, groq } = await getKeys();
  const prompt = PROMPT(hoje(), text);
  const fns = [];
  if(gemini) fns.push(() => callGemini(prompt, gemini));
  if(groq) fns.push(() => callGroq(prompt, groq));
  if(!fns.length) throw new Error("Nenhuma chave de IA configurada. Adicione GEMINI_API_KEY ou GROQ_API_KEY no admin em Configurações.");

  let lastErr;
  for(const fn of fns) {
    try {
      const raw = await fn();
      const result = parse(raw);
      if(result.corpo && result.corpo.length > 300) return result;
    } catch(e) { lastErr = e; }
  }
  throw new Error("IA falhou: " + (lastErr?.message || "erro desconhecido"));
}
