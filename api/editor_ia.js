import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "../core/scraper.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const GEMINI_KEYS = [
  "AIzaSyDESwZ8GR_0BttpDCLrMkK-FobDfhYZZjI",
  "AIzaSyBnDSSU3UNbo9lrJClzXB0dslcR4pFcyFo",
];

// Slots preparados — ativar quando chaves estiverem disponíveis
const GROQ_KEY   = process.env.GROQ_API_KEY   || "";
const GROK_KEY   = process.env.GROK_API_KEY   || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

const hoje = () => new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });

function buildPrompt(acao, promptLivre, data, texto) {
  const BASE = `RETORNE APENAS JSON VÁLIDO sem markdown:
{"titulo":"manchete jornalística máx 8 palavras com verbo ou tensão","subtitulo":"frase objetiva até 100 chars","categoria":"politica|economia|negocios|investimentos|mercados|tributacao|regulacao|seguros|saude|familia|tecnologia|industria|educacao|esportes|cultura|patrimonio|internacional","corpo":"texto completo"}

REGRAS DO TÍTULO: máx 8 palavras, verbo obrigatório, específico (número/nome/lugar), PROIBIDO vagos ou caixa alta total.
EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed"

REGRAS DO CORPO:
1. Assinatura no INÍCIO: "Redação OVC — ${data}"
2. 1.500 a 2.000 caracteres
3. 8 parágrafos com espaço duplo entre eles
4. ABERTURA: primeira frase prende — dado chocante, contradição ou tensão real
5. RITMO: varie tamanho das frases. Curta. Média. Curta
6. ANCORAGEM: pelo menos um número, data ou nome verificável
7. VOZ: centro-direita, fiscalização do governo, liberdade econômica — no ângulo, nunca explícita
8. FECHAMENTO: deixa tensão, consequência futura ou questão implícita. Leitor termina pensando
9. Após fechamento: linha em branco + 4 hashtags em linhas separadas, última #ovalorcapital

PROIBIDO: "isso mostra","vale destacar","em meio a","diante disso","especialistas apontam","chama atenção","acende alerta","robusto","resiliente","ecossistema","disruptivo","paradigma","sinergia","blindar","muralhas","blueprint","catalisador","protagonista","desafios e oportunidades"`;

  if (acao === "reescrever") return `Você é diretor de jornalismo com 40 anos de experiência. Reescreva no padrão OVC.\n\n${BASE}\n\nTEXTO:\n${texto}`;
  if (acao === "melhorar")   return `Você é diretor de jornalismo com 40 anos de experiência. Melhore este texto mantendo os fatos, elevando a qualidade jornalística.\n\n${BASE}\n\nTEXTO:\n${texto}`;
  if (acao === "tema")       return `Você é diretor de jornalismo com 40 anos de experiência. Crie uma matéria completa sobre este tema.\n\n${BASE}\n\nTEMA:\n${texto}`;
  if (acao === "livre")      return `Você é diretor de jornalismo com 40 anos de experiência. ${promptLivre}\n\n${BASE}\n\nTEXTO:\n${texto}`;
  return `Você é diretor de jornalismo com 40 anos de experiência. Reescreva no padrão OVC.\n\n${BASE}\n\nTEXTO:\n${texto}`;
}

async function callGemini(prompt) {
  for (const key of GEMINI_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.65,maxOutputTokens:1800} })
      });
      const d = await res.json();
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message}`);
      return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch(e) { continue; }
  }
  throw new Error("Gemini indisponível no momento. Tente em alguns minutos.");
}

async function callGroq(prompt) {
  if (!GROQ_KEY) throw new Error("Chave Groq não configurada");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model:"llama-3.3-70b-versatile", messages:[{role:"user",content:prompt}], max_tokens:1800, temperature:0.65 })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Groq ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

async function callGrok(prompt) {
  if (!GROK_KEY) throw new Error("Chave Grok não configurada");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${GROK_KEY}` },
    body: JSON.stringify({ model:"grok-3-fast", messages:[{role:"user",content:prompt}], max_tokens:1800, temperature:0.65 })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`Grok ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("Chave OpenAI não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:"user",content:prompt}], max_tokens:1800, temperature:0.65 })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message}`);
  return d.choices?.[0]?.message?.content || "";
}

function parse(raw) {
  try {
    let s = raw.replace(/```json[\s\S]*?```/g, m=>m.slice(7,-3)).replace(/```/g,"").trim();
    try { return JSON.parse(s); } catch(_) {}
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    const get = k => { const r = s.match(new RegExp('"'+k+'"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"')); return r?r[1].replace(/\\n/g,"\n").replace(/\\"/g,'"'):""; };
    return { titulo:get("titulo"), subtitulo:get("subtitulo"), categoria:get("categoria")||"geral", corpo:get("corpo") };
  } catch(_) { return { titulo:"", subtitulo:"", categoria:"geral", corpo:raw.slice(0,2000) }; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});

  try {
    const { url, texto, acao="reescrever", promptLivre="", ia="gemini", imagem="", buscarImagem=false, publicar=false } = req.body||{};

    if (!url && !texto) return res.status(400).json({error:"Informe url ou texto"});

    // Extrair texto da URL se necessário
    let sourceText = texto || "";
    let sourceTitle = "";
    let sourceImage = imagem || "";

    if (url && !texto) {
      const article = await scrape(url);
      if (!article.text || article.text.length < 100) return res.status(400).json({error:"Não foi possível extrair conteúdo desta URL"});
      sourceText = article.text;
      sourceTitle = article.title || "";
      if (!sourceImage && !buscarImagem) sourceImage = article.image || "";
    }

    // Buscar imagem automaticamente se solicitado
    if (buscarImagem && !sourceImage) {
      try {
        const query = encodeURIComponent((sourceTitle || sourceText).slice(0,50));
        const imgRes = await fetch(`https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=demo`);
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          sourceImage = imgData?.urls?.regular || "";
        }
      } catch(_) {}
    }

    // Construir prompt
    const prompt = buildPrompt(acao, promptLivre, hoje(), sourceText);

    // Chamar a IA escolhida
    let raw = "";
    if (ia==="gemini")  raw = await callGemini(prompt);
    else if (ia==="groq")   raw = await callGroq(prompt);
    else if (ia==="grok")   raw = await callGrok(prompt);
    else if (ia==="openai") raw = await callOpenAI(prompt);
    else raw = await callGemini(prompt);

    const content = parse(raw);
    if (!content.corpo || content.corpo.length < 300) throw new Error("Conteúdo gerado insuficiente");

    // Se publicar=false, retorna só o resultado sem salvar
    if (!publicar && publicar !== "pendente") {
      return res.status(200).json({
        ok: true, preview: true,
        titulo: content.titulo, subtitulo: content.subtitulo,
        categoria: content.categoria, corpo: content.corpo, imagem: sourceImage
      });
    }

    // Salvar no banco
    const hash = crypto.createHash("md5").update((url||texto||"").slice(0,200)+"_editor").digest("hex");
    const status = publicar===true||publicar==="publicado" ? "publicado" : "pendente";
    const { data: post, error } = await supabase.from("posts").insert({
      titulo: content.titulo, conteudo: content.corpo,
      comentario_fixado: content.subtitulo||"", imagem: sourceImage,
      hash, status, approved: status==="publicado",
      publish_method: "portal",
      published_at: status==="publicado" ? new Date().toISOString() : null,
      user_tags: JSON.stringify([content.categoria||"geral"]),
      collaborators:"[]", metrics:{}, priority:1, retry_count:0, max_retries:3
    }).select().single();

    if (error) throw error;

    return res.status(200).json({
      ok:true, saved:true, status, id:post.id,
      titulo:content.titulo, subtitulo:content.subtitulo,
      categoria:content.categoria, corpo:content.corpo, imagem:sourceImage
    });

  } catch(e) {
    return res.status(500).json({error:e.message});
  }
}
