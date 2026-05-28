import { createClient } from "@supabase/supabase-js";

const _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function _getKeys() {
  try {
    const { data } = await _sb.from("config").select("key,value").in("key", ["GEMINI_API_KEY","GROQ_API_KEY"]);
    const m = {};
    (data || []).forEach(r => m[r.key] = r.value);
    return { gemini: m.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "", groq: m.GROQ_API_KEY || process.env.GROQ_API_KEY || "" };
  } catch (_) {
    return { gemini: process.env.GEMINI_API_KEY || "", groq: process.env.GROQ_API_KEY || "" };
  }
}

async function callGemini(prompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Gemini: " + (data.error?.message || "erro desconhecido"));
  return data.candidates[0].content.parts[0].text;
}

async function callGroq(system, user, key) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Groq: " + (data.error?.message || "erro desconhecido"));
  return data.choices[0].message.content;
}

async function callAI(prompt, system, keys) {
  if (keys.gemini) {
    try { return await callGemini(prompt, keys.gemini); } catch (e) { console.error("[inteligencia] Gemini falhou:", e.message); }
  }
  if (keys.groq) {
    return await callGroq(system, prompt, keys.groq);
  }
  throw new Error("Nenhuma chave de IA configurada no sistema");
}

const LANGS = { pt: "Português", en: "Inglês", es: "Espanhol", fr: "Francês", de: "Alemão", it: "Italiano", ja: "Japonês", zh: "Chinês", ar: "Árabe", ru: "Russo" };

const TOOLS = {
  reescrever: {
    system: "Você é especialista em reescrita de textos em português brasileiro. Retorne APENAS o texto reescrito, sem explicações.",
    buildPrompt: (text) =>
      `Reescreva o texto abaixo usando palavras e construções diferentes, mantendo o sentido original. Varie o vocabulário e o ritmo das frases. Retorne APENAS o texto reescrito.\n\nTEXTO:\n${text}`
  },
  corretor: {
    system: "Você é um corretor ortográfico e gramatical especialista em português brasileiro. Retorne APENAS o texto corrigido, sem comentários.",
    buildPrompt: (text) =>
      `Corrija todos os erros de ortografia, gramática, acentuação e pontuação do texto abaixo. Mantenha o conteúdo e o estilo originais. Retorne APENAS o texto corrigido, sem nenhuma explicação.\n\nTEXTO:\n${text}`
  },
  "detector-ia": {
    system: "Você é especialista em detectar textos gerados por Inteligência Artificial. Responda APENAS com JSON válido.",
    buildPrompt: (text) =>
      `Analise o texto abaixo e estime a probabilidade de ter sido gerado por IA. Considere: repetição de padrões, vocabulário excessivamente formal, estrutura simétrica demais, ausência de erros naturais, frases genéricas, conclusões previsíveis.\n\nRetorne APENAS este JSON (sem markdown):\n{"percentage": 75, "reason": "explicação curta em 1 frase"}\n\nTEXTO:\n${text}`
  },
  humanizar: {
    system: "Você é especialista em tornar textos de IA mais naturais e humanos. Retorne APENAS o texto humanizado.",
    buildPrompt: (text) =>
      `Reescreva o texto abaixo para soar mais natural e humano. Adicione variações de ritmo, expressões mais espontâneas e remova padrões típicos de IA (introduções padronizadas, paralelismos excessivos, conclusões genéricas). Mantenha o sentido. Retorne APENAS o texto humanizado.\n\nTEXTO:\n${text}`
  },
  tradutor: {
    system: "Você é um tradutor profissional especializado em múltiplos idiomas. Retorne APENAS a tradução, sem explicações.",
    buildPrompt: (text, options) => {
      const src = LANGS[options?.sourceLang] || options?.sourceLang || "Português";
      const tgt = LANGS[options?.targetLang] || options?.targetLang || "Inglês";
      return `Traduza o texto abaixo de ${src} para ${tgt}. Mantenha o tom e a formatação originais. Retorne APENAS a tradução.\n\nTEXTO:\n${text}`;
    }
  },
  resumidor: {
    system: "Você é especialista em criar resumos objetivos em português brasileiro. Retorne APENAS o resumo.",
    buildPrompt: (text) =>
      `Crie um resumo claro e objetivo do texto abaixo, capturando os pontos principais. O resumo deve ter no máximo 30% do tamanho original. Não comece com \"O texto fala sobre\" ou \"Este artigo\". Retorne APENAS o resumo.\n\nTEXTO:\n${text}`
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { tool, text, options } = req.body || {};

  if (!tool || !text?.trim()) {
    return res.status(400).json({ error: "Informe tool e text" });
  }

  const cfg = TOOLS[tool];
  if (!cfg) return res.status(400).json({ error: "Ferramenta desconhecida: " + tool });

  try {
    const keys = await _getKeys();
    const prompt = cfg.buildPrompt(text.trim(), options);
    const raw = await callAI(prompt, cfg.system, keys);

    if (tool === "detector-ia") {
      try {
        const clean = raw.replace(/```json?\s?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return res.status(200).json({
          ok: true,
          percentage: Math.min(100, Math.max(0, parseInt(parsed.percentage) || 50)),
          reason: parsed.reason || ""
        });
      } catch (_) {
        const m = raw.match(/\d+/);
        return res.status(200).json({
          ok: true,
          percentage: m ? Math.min(100, parseInt(m[0])) : 50,
          reason: raw.slice(0, 200)
        });
      }
    }

    return res.status(200).json({ ok: true, result: raw.trim() });
  } catch (err) {
    console.error("[api/inteligencia]", err);
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
}
