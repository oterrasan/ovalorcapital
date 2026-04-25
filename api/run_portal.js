import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX_DIA = 1440;
const POSTS_POR_CHAMADA = 5; // Gera até 5 posts por execução

export default async function handler(req, res) {
  try {
    // Checar automação
    const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });

    // Checar limite diário
    const hoje = new Date().toISOString().slice(0,10);
    const { count } = await supabase.from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hoje + "T00:00:00")
      .eq("publish_method", "portal");
    const countHoje = count || 0;
    if (countHoje >= MAX_DIA) return res.status(200).json({ status: "limit_reached", count: countHoje });

    // Buscar notícias — pegar mais para ter material suficiente
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    const results = [];
    const errors = [];
    let tentativas = 0;

    // Processar até gerar POSTS_POR_CHAMADA posts ou esgotar as notícias
    for (const item of news.slice(0, 20)) {
      if (results.length >= POSTS_POR_CHAMADA) break;
      if (countHoje + results.length >= MAX_DIA) break;

      tentativas++;
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

      // Reescrever no padrão OVC
      let content;
      try {
        content = await rewritePortal(sourceText, item.title);
      } catch(e) {
        errors.push({ link: item.link, error: e.message });
        continue; // Não para — tenta a próxima notícia
      }

      if (!content || !content.corpo || content.corpo.length < 500) continue;
      if (!content.categoria || content.categoria === "geral") continue;

      if (!content.subcategoria) {
        content.subcategoria = "Geral";
        content.subcategoria_slug = "geral";
      }

      // Imagem sempre diferente da fonte
      const urlProibida = article.image || "";
      const imagemFinal = await findImage(content.titulo, content.categoria, urlProibida);

      // Salvar — status pendente, publicação automática
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

      if (error) {
        errors.push({ link: item.link, error: error.message });
        continue;
      }

      results.push({
        id: post?.id,
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        imagem: imagemFinal
      });
    }

    return res.status(200).json({
      status: results.length > 0 ? "ok" : "no_valid_news",
      gerados: results.length,
      tentativas,
      total_hoje: countHoje + results.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
