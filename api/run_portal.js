import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// Filtro de qualidade — rejeita apenas erros técnicos de geração
function validarConteudo(content) {
  if (!content || !content.titulo) return false;
  const titulo = content.titulo.toLowerCase().trim();

  if (titulo.length < 15) return false;
  if (titulo.length > 120) return false;

  // Titulos claramente invalidos — IA falhou na geração
  if (/^(prezado|caro|ol[aá]|sem t[ií]tulo|t[ií]tulo:|headline:|assunto:|erro:|teste:|not[ií]cia:|texto:|mat[eé]ria:)/.test(titulo)) return false;

  // Corpo muito raso — IA gerou sem base suficiente
  if ((content.corpo || '').length < 800) return false;

  // Sem assinatura OVC no corpo
  if (!content.corpo.toLowerCase().includes("redação ovc")) return false;

  // Bloquear apenas padrões que indicam FALHA TÉCNICA da IA, não tema
  const falhasTecnicas = [
    /jornal da oeste|revista oeste/,
    /programa.{0,20}ao ar.*transmis/,
    /colunista.{0,10}folha|colunista.{0,10}globo/,
  ];
  const corpo = (content.corpo || '').toLowerCase().slice(0, 300);
  for (const r of falhasTecnicas) {
    if (r.test(titulo) || r.test(corpo)) return false;
  }

  return true;
}


export default async function handler(req, res) {
  const inicio = Date.now();

  // Número de artigos a gerar nesta chamada (padrão 1, máximo 4 por timeout)
  const body = req.body || {};
  const meta = req.query || {};
  const targetCount = Math.min(parseInt(meta.count || body.count || "1", 10), 4);

  try {
    // Checar automação — force=true ou batch=true ignoram a flag de automação
    if (!body.force && !body.batch) {
      const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
      if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });
    }

    // Limite diário só se aplica à automação — chamadas manuais (force/batch) ignoram
    if (!body.force && !body.batch) {
      const { data: cfgMax } = await supabase.from("config").select("value").eq("key","MAX_POSTS_DIA").single();
      const MAX_DIA = parseInt(cfgMax?.value || "300", 10);

      const agora = new Date();
      const inicioDiaBrasilia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()) + (agora.getUTCHours() < 3 ? -1 : 0) * 86400000 + 3 * 3600000);
      const { count } = await supabase.from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", inicioDiaBrasilia.toISOString())
        .eq("publish_method", "portal");
      if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: "limit_reached", count, max: MAX_DIA });
    }

    // Buscar notícias
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    const artigos = [];

    // Tentar cada notícia — gerar até targetCount artigos ou atingir timeout
    for (const item of news.slice(0, 40)) {
      // Verificar tempo restante — Vercel mata em 60s
      if (Date.now() - inicio > 50000) break;
      if (artigos.length >= targetCount) break;

      const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");

      // Checar duplicata
      const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).single();
      if (dup) continue;

      // Scrape
      const article = await scrape(item.link);
      // Exige conteúdo real — fallback raso causa títulos sem sentido
      const sourceText = (article.text && article.text.length >= 350)
        ? article.text
        : null;
      if (!sourceText) continue;

      // Reescrever no padrão OVC
      let content;
      try {
        content = await rewritePortal(sourceText, item.title);
      } catch(e) {
        continue; // tenta próxima
      }

      // Validar qualidade — rejeita lixo
      if (!validarConteudo(content)) continue;
      if (!content.categoria || content.categoria === "geral") continue;
      if (!content.subcategoria) {
        content.subcategoria = "Geral";
        content.subcategoria_slug = "geral";
      }

      // Imagem: tentar usar a original da fonte (processada/recortada), senão buscar banco
      let imagemFinal = null;
      if (article.image && article.image.length > 10) {
        // Usar imagem original — baixa, recorta marca d'água, salva no Supabase Storage
        const hashImg = hash.slice(0,12);
        imagemFinal = await processAndSaveImage(article.image, hashImg);
      }
      if (!imagemFinal) {
        // Fallback: buscar imagem relevante nos bancos
        imagemFinal = await findImage(content.titulo, content.categoria, "", article.image || "");
      }

      // Publicação automática — gerado e validado pelo sistema
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.meta_descricao || content.subtitulo || "",
        imagem: imagemFinal,
        hash,
        status: "pendente",
        approved: false,
        publish_method: "portal",
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: "[]",
        metrics: {
          foco_keyword: content.foco_keyword || "",
          seo_slug: content.slug || "",
          meta_descricao: content.meta_descricao || ""
        },
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) continue; // tenta próxima notícia

      artigos.push({
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        id: post?.id
      });
    }

    // Backfill SEO no tempo restante
    try { await seoBackfill(artigos.length > 0 ? 2 : 5); } catch(_) {}

    if (artigos.length > 0) {
      return res.status(200).json({
        status: "ok",
        artigos,
        total: artigos.length,
        // compat. com chamada single
        titulo: artigos[0].titulo,
        categoria: artigos[0].categoria,
        id: artigos[0].id
      });
    }
    return res.status(200).json({ status: "no_valid_news" });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}

// ── SEO BACKFILL — processa posts antigos sem SEO ─────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

function slugify(t) {
  return (t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-");
}

async function seoBackfill(limite) {
  if (!OPENAI_KEY) return;
  const { data: posts } = await supabase
    .from("posts")
    .select("id, titulo, conteudo, metrics")
    .eq("status", "publicado")
    .or("metrics.is.null,metrics->>seo_otimizado.neq.true")
    .order("created_at", { ascending: true })
    .limit(limite);

  if (!posts || !posts.length) return;

  for (const post of posts) {
    try {
      const prompt = `Gere SEO para este artigo do portal O Valor Capital.\nTÍTULO: ${post.titulo}\nCONTEÚDO: ${(post.conteudo||"").slice(0,600)}\n\nFormato exato:\nTITULO: manchete 50-65 chars\nFOCO_KEYWORD: 2-4 palavras\nSLUG: 3-5 palavras hifenizadas sem acentos\nMETA_DESCRICAO: 145-160 chars`;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 300 })
      });
      const d = await res.json();
      const raw = d.choices?.[0]?.message?.content || "";
      let novoTitulo = "", focoKeyword = "", slug = "", metaDescricao = "";
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (/^TITULO:/i.test(t))             novoTitulo    = t.replace(/^TITULO:/i,"").trim();
        else if (/^FOCO_KEYWORD:/i.test(t))  focoKeyword   = t.replace(/^FOCO_KEYWORD:/i,"").trim();
        else if (/^SLUG:/i.test(t))          slug          = slugify(t.replace(/^SLUG:/i,"").trim());
        else if (/^META_DESCRICAO:/i.test(t)) metaDescricao = t.replace(/^META_DESCRICAO:/i,"").trim();
      }
      if (!slug && novoTitulo) slug = slugify(novoTitulo).split("-").slice(0,5).join("-");
      const m = (typeof post.metrics === "object" && post.metrics) ? post.metrics : {};
      await supabase.from("posts").update({
        titulo: novoTitulo || post.titulo,
        comentario_fixado: metaDescricao || "",
        metrics: { ...m, foco_keyword: focoKeyword, seo_slug: slug, meta_descricao: metaDescricao, seo_otimizado: true }
      }).eq("id", post.id);
    } catch(_) {}
  }
}
