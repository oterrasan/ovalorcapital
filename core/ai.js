const PROMPT_BASE = (hoje, text) => `Você é redator sênior do portal O Valor Capital, veículo jornalístico brasileiro de alto nível. Reescreva a notícia abaixo no padrão OVC para Instagram.

RETORNE APENAS UM JSON VÁLIDO com esta estrutura exata, sem markdown, sem explicações:
{"tag_texto":"chamada hard em até 4 palavras","tag_tema":"um de: politica, crime, justica, corrupcao, economia, financas, mercado, sociedade, cultura, saude, educacao","resumo_card":"resumo breve em até 12 palavras","post":"texto completo do post","comentario_fixado":"comentário agressivo máximo 200 chars","search_query":"termos em inglês para buscar imagem"}

REGRAS DO POST:
1. Hook em CAIXA ALTA na primeira linha. Curto. Provocador.
2. Corpo: prosa jornalística. Isenta. Sem opinião. Fatos verificados. Parágrafos curtos.
3. Máximo 1.500 caracteres no total.
4. Assinatura: Redação OVC — ${hoje}
5. Hashtags: não óbvias, cada uma em linha separada, terminando com #ovalorcapital. Mínimo 4, máximo 6.

TERMOS PROIBIDOS: comente aqui, comenta, isso reforça, isso expõe, isso mostra, isso revela, isso evidencia, isso demonstra, o fato expõe, o fato mostra, o caso expõe, expõe a fragilidade, vale ressaltar, vale destacar, vale lembrar, é importante destacar, é importante ressaltar, é fundamental, no contexto atual, no cenário atual, diante disso, diante desse cenário, em meio a, especialistas apontam, especialistas alertam, a situação evidencia, não é à toa, não por acaso, chama atenção, deixa claro, deixa evidente, traz à tona, coloca em xeque, acende um alerta, é um sinal de, é um reflexo de, merece atenção, provoca debate, gera debate, impacta diretamente, é preocupante, é alarmante, a medida visa, segue sendo, continua sendo, ao longo dos anos, historicamente, de forma significativa, cada vez mais, muito além, em última análise, em suma, em resumo

NOTÍCIA:
${text}`;

function parseOutput(raw) {
  try {
    // Remove markdown e limpa
    let clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7,-3))
                   .replace(/```/g, '')
                   .trim();
    
    // Tenta parse direto
    try {
      const p = JSON.parse(clean);
      return buildResult(p);
    } catch(_) {}
    
    // Tenta extrair JSON do meio do texto
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const p = JSON.parse(match[0]);
        return buildResult(p);
      } catch(_) {}
    }
    
    // Extração por regex como último recurso
    const get = (key) => {
      const m = clean.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
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

async function rewriteGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000, responseMimeType: "application/json" }
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
        { role: "system", content: "Você é um redator jornalístico. Responda APENAS com JSON válido, sem markdown." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
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

  const providers = provider === "groq"
    ? [rewriteGroq, rewriteGemini]
    : [rewriteGemini, rewriteGroq];

  let lastErr;
  for (const fn of providers) {
    try {
      const output = await fn(prompt);
      const result = parseOutput(output);
      if (result.text && result.text.length > 50) return result;
    } catch(e) {
      lastErr = e;
      continue;
    }
  }
  throw new Error("IA falhou: " + (lastErr?.message || "erro desconhecido"));
}
