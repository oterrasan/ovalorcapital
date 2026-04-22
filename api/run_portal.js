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

    // Buscar notícias
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    const results = [];
    const batch = news.slice(0, 1); // 1 matéria por chamada = 1/minuto

    for (const item of batch) {
      const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");

      // Checar duplicata
      const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).single();
      if (dup) { results.push({ status: "duplicate", link: item.link }); continue; }

      // Scrape
      const article = await scrape(item.link);
      if (!article.text || article.text.length < 100) {
        results.push({ status: "scrape_failed", link: item.link });
        continue;
      }

      // Reescrita no Padrão OVC para portal
      let content;
      try {
        content = await rewritePortal(article.text);
      } catch(e) {
        results.push({ status: "ai_failed", error: e.message });
        continue;
      }

      if (!content.corpo || content.corpo.length < 500) {
        results.push({ status: "ai_short", link: item.link });
        continue;
      }

      // Salvar como pendente
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem: article.image || "",
        hash,
        status: "pendente",
        approved: false,
        publish_method: "portal",
        user_tags: JSON.stringify([content.categoria || "geral", content.tag_tema || ""]),
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) {
        results.push({ status: "db_error", error: error.message });
      } else {
        results.push({ status: "pendente", titulo: content.titulo, id: post?.id, categoria: content.categoria });
      }
    }

    return res.status(200).json({ status: "ok", processed: results.length, results });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
