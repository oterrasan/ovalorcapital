import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function validarConteudo(content) {
  if (!content || !content.titulo || !content.corpo) return false;
  const titulo = content.titulo.toLowerCase().trim();
  const corpo = content.corpo.toLowerCase();
  const proibidos = ["prezado", "caro usuário", "olá,", "atenção:", "dear", "editor(a)"];
  if (proibidos.some(p => titulo.startsWith(p) || corpo.slice(0,100).includes(p))) return false;
  if (content.corpo.length < 500) return false;
  if (!corpo.includes("redação ovc")) return false;
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const { quantidade = 1, categorias = [] } = req.body || {};

    const qtd = Math.min(Math.max(parseInt(quantidade) || 1, 1), 50);
    const catsFiltro = Array.isArray(categorias) && categorias.length > 0 ? categorias : null;

    // Buscar notícias
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news", gerados: 0 });

    const gerados = [];
    const erros = [];
    const inicio = Date.now();

    for (const item of news.slice(0, 80)) {
      if (gerados.length >= qtd) break;
      // Timeout preventivo 50s
      if (Date.now() - inicio > 50000) break;

      const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");

      // Checar duplicata
      const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).single();
      if (dup) continue;

      // Scrape
      const article = await scrape(item.link);
      const sourceText = (article.text && article.text.length >= 100)
        ? article.text
        : (item.description && item.description.length >= 50)
          ? item.title + ". " + item.description
          : null;
      if (!sourceText) continue;

      // Gerar
      let content;
      try {
        content = await rewritePortal(sourceText, item.title);
      } catch(e) {
        erros.push(e.message);
        continue;
      }

      if (!validarConteudo(content)) continue;

      // Filtrar por categoria se especificado
      if (catsFiltro && !catsFiltro.includes(content.categoria)) continue;

      if (!content.subcategoria) {
        content.subcategoria = "Geral";
        content.subcategoria_slug = "geral";
      }

      const urlProibida = article.image || "";
      const imagemFinal = await findImage(content.titulo, content.categoria, urlProibida);

      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem: imagemFinal,
        hash,
        status: "publicado",
        approved: true,
        publish_method: "portal",
        published_at: new Date().toISOString(),
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) { erros.push(error.message); continue; }

      gerados.push({
        id: post?.id,
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria
      });
    }

    return res.status(200).json({
      status: gerados.length > 0 ? "ok" : "no_valid_news",
      solicitado: qtd,
      gerados: gerados.length,
      categorias_filtro: catsFiltro || "todas",
      posts: gerados,
      erros: erros.length > 0 ? erros.slice(0,5) : undefined
    });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
