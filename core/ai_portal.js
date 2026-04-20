const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const PROMPT_PORTAL = (data, text) => `Você é redator do portal O Valor Capital. Reescreva a notícia abaixo para publicação no portal de notícias.

RETORNE APENAS JSON VÁLIDO, sem markdown, sem texto fora do JSON:
{"titulo":"máximo 5 palavras, alto impacto","subtitulo":"1 frase objetiva até 120 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","tag_tema":"palavra-chave principal","corpo":"texto completo da matéria","search_query":"termos em inglês para buscar imagem de destaque"}

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. Mínimo 1.500 caracteres. Máximo 2.000 caracteres.
3. Exatamente 8 parágrafos separados por linha em branco.
4. Fluxo jornalístico: contexto → fato → dados → consequência → impacto → perspectiva → conclusão objetiva.
5. Linguagem direta, nível de rua. Zero jargão de IA.
6. SEM viés editorial. Apenas fatos. Viés é exclusivo de colunas opinativas.
7. Reescreve com palavras próprias — não copia frases da fonte.
8. Dados concretos quando existirem (números, datas, nomes).

PROIBIDO USAR: "isso mostra", "isso revela", "vale destacar", "vale ressaltar", "em meio a", "diante disso", "no cenário atual", "especialistas apontam", "chama atenção", "coloca em xeque", "acende alerta", "gera debate", "merece atenção", "não é à toa", "deixa claro", "traz à tona", "é um sinal de", "é um reflexo de", "historicamente", "cada vez mais", "em última análise", "de forma significativa", "é importante destacar", "cabe ressaltar"

TOM: jornalístico profissional, seco, isento. Sem opinião. Sem dramatismo.

NOTÍCIA:
${text}`;

function parsePortal(raw) {
  try {
    let clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7,-3)).replace(/```/g,'').trim();
    try { return JSON.parse(clean); } catch(_) {}
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch(_) {}
    const get = k => { const r = clean.match(new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)); return r ? r[1].replace(/\\n/g,'\n').replace(/\\"/g,'"') : ''; };
    return { titulo: get('titulo'), subtitulo: get('subtitulo'), categoria: get('categoria') || 'geral', tag_tema: get('tag_tema'), corpo: get('corpo'), search_query: get('search_query') };
  } catch(e) {
    return { titulo: '', subtitulo: '', categoria: 'geral', tag_tema: '', corpo: raw.slice(0,2000), search_query: '' };
  }
}

async function rewriteGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500, responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Gemini: " + (data.error?.message || JSON.stringify(data).slice(0,100)));
  return data.candidates[0].content.parts[0].text;
}

async function rewriteGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é redator jornalístico profissional. Responda APENAS com JSON válido, sem markdown." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq: " + (data.error?.message || JSON.stringify(data).slice(0,100)));
  return data.choices[0].message.content;
}

export async function rewritePortal(text) {
  const prompt = PROMPT_PORTAL(hoje(), text);
  const providers = [rewriteGemini, rewriteGroq];
  let lastErr;
  for (const fn of providers) {
    try {
      const output = await fn(prompt);
      const result = parsePortal(output);
      if (result.corpo && result.corpo.length > 500) return result;
    } catch(e) {
      lastErr = e;
      continue;
    }
  }
  throw new Error("IA portal falhou: " + (lastErr?.message || "erro desconhecido"));
}
