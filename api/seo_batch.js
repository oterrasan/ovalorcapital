import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildSeoPrompt(titulo, conteudo) {
  const fonte = `TÍTULO ORIGINAL: ${titulo}\n\nCONTEÚDO:\n${(conteudo || "").slice(0, 800)}`;
  return `Você é especialista em SEO para o portal O Valor Capital (OVC), portal de jornalismo econômico e financeiro brasileiro. Com base no título e conteúdo abaixo, gere os campos SEO otimizados.

${fonte}

FORMATO DE SAÍDA — copie os rótulos exatamente:

TITULO: manchete entre 50 e 65 caracteres — palavra-chave principal no início, verbo obrigatório, factual
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO
SLUG: 3 a 5 palavras-chave hifenizadas, sem acentos, sem artigos
META_DESCRICAO: 145 a 160 caracteres — resumo factual com a palavra-chave integrada naturalmente

REGRAS:
- TITULO deve ter entre 50 e 65 caracteres exatos — conte e ajuste
- META_DESCRICAO deve ter entre 145 e 160 caracteres exatos — conte e ajuste
- Baseie-se APENAS no conteúdo fornecido
- Linguagem direta, sem academicismo
- NÃO use: isso mostra, vale destacar, em meio a, diante disso, acende alerta`;
}

async function gerarSeo(titulo, conteudo) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildSeoPrompt(titulo, conteudo) }],
      temperature: 0.2,
      max_tokens: 512
    })
  });

  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message}`);

  const raw = d.choices?.[0]?.message?.content || "";
  const lines = raw.split("\n");

  let novoTitulo = "", focoKeyword = "", slug = "", metaDescricao = "";
  for (const line of lines) {
    const t = line.trim();
    if (/^TITULO:/i.test(t))          novoTitulo   = t.replace(/^TITULO:/i, "").trim();
    else if (/^FOCO_KEYWORD:/i.test(t)) focoKeyword = t.replace(/^FOCO_KEYWORD:/i, "").trim();
    else if (/^SLUG:/i.test(t))         slug        = slugify(t.replace(/^SLUG:/i, "").trim());
    else if (/^META_DESCRICAO:/i.test(t)) metaDescricao = t.replace(/^META_DESCRICAO:/i, "").trim();
  }

  if (!slug && novoTitulo) slug = slugify(novoTitulo).split("-").slice(0, 5).join("-");

  return { novoTitulo, focoKeyword, slug, metaDescricao };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const offset = parseInt(req.query.offset || req.body?.offset || "0");
    const limit  = Math.min(parseInt(req.query.limit  || req.body?.limit  || "5"), 8);

    // Buscar total de posts sem SEO completo
    const { count: total } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "publicado");

    // Buscar lote de posts
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, titulo, conteudo, metrics")
      .eq("status", "publicado")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    if (!posts || posts.length === 0) {
      return res.status(200).json({ status: "done", processados: 0, total, nextOffset: null });
    }

    const resultados = [];
    for (const post of posts) {
      try {
        const { novoTitulo, focoKeyword, slug, metaDescricao } = await gerarSeo(post.titulo, post.conteudo);

        const metricsAtual = (typeof post.metrics === "object" && post.metrics) ? post.metrics : {};
        await supabase.from("posts").update({
          titulo: novoTitulo || post.titulo,
          comentario_fixado: metaDescricao || "",
          metrics: {
            ...metricsAtual,
            foco_keyword: focoKeyword,
            seo_slug: slug,
            meta_descricao: metaDescricao,
            seo_otimizado: true
          }
        }).eq("id", post.id);

        resultados.push({ id: post.id, titulo: novoTitulo, ok: true });
      } catch(e) {
        resultados.push({ id: post.id, titulo: post.titulo, ok: false, erro: e.message });
      }
    }

    const nextOffset = offset + posts.length;
    const hasMore = nextOffset < total;

    return res.status(200).json({
      status: hasMore ? "parcial" : "done",
      processados: resultados.length,
      total,
      offset,
      nextOffset: hasMore ? nextOffset : null,
      resultados
    });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
