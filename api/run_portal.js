import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX = 1440; // 1 por minuto x 60min x 24h

export default async function handler(req, res) {
  try {
    // Checar se automação está ligada
    const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });

    // Checar limite diário
    const hoje = new Date().toISOString().slice(0,10);
    const { count } = await supabase.from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hoje + "T00:00:00")
      .eq("publish_method", "portal");
    if ((count || 0) >= MAX) return res.status(200).json({ status: "limit_reached", count });

    // Buscar notícias — pega até 10 candidatas
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    // Tentar cada candidata até uma funcionar
    for (const item of news.slice(0, 10)) {
      const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");

      // Checar duplicata
      const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).single();
      if (dup) continue;

      // Scrape — se falhar, tenta próxima
      const article = await scrape(item.link);
      if (!article.text || article.text.length < 150) continue;

      // Reescrita no Padrão OVC
      let content;
      try {
        content = await rewritePortal(article.text, item.title);
      } catch(e) {
        return res.status(200).json({ status: "ai_failed", error: e.message });
      }

      if (!content.corpo || content.corpo.length < 500) continue;

      // Imagem: prioridade à da notícia original
      const imagem = article.image || "";

      // Salvar como pendente
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem,
        hash,
        status: "pendente",
        approved: false,
        publish_method: "portal",
        user_tags: JSON.stringify([content.categoria || "geral"]),
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) {
        return res.status(200).json({ status: "db_error", error: error.message });
      }

      return res.status(200).json({
        status: "ok",
        processed: 1,
        results: [{ status: "pendente", titulo: content.titulo, id: post?.id, categoria: content.categoria, imagem: !!imagem }]
      });
    }

    return res.status(200).json({ status: "all_failed_or_duplicate", tried: Math.min(news.length, 10) });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
