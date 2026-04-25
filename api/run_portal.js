import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX_DIA = 1440;

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
    if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: "limit_reached", count });

    // Buscar notícias
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    // Tentar cada candidata até uma funcionar
    for (const item of news.slice(0, 10)) {
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
        return res.status(200).json({ status: "ai_failed", error: e.message });
      }

      if (!content.corpo || content.corpo.length < 500) continue;

      // REGRA INVIOLÁVEL: categoria "geral" não entra
      if (!content.categoria || content.categoria === "geral") continue;

      // GARANTIA: subcategoria obrigatória
      if (!content.subcategoria) {
        content.subcategoria = "Geral";
        content.subcategoria_slug = "geral";
      }

      // REGRA INVIOLÁVEL DE IMAGEM:
      // A URL da imagem da fonte (article.image) é passada como proibida.
      // findImage NUNCA retorna essa URL — busca sempre uma imagem diferente.
      const urlProibida = article.image || "";
      const imagemFinal = await findImage(content.titulo, content.categoria, urlProibida);

      // Salvar como pendente
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem: imagemFinal,
        hash,
        status: "pendente",
        approved: false,
        publish_method: "portal",
        user_tags: JSON.stringify([content.categoria || "geral"]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) return res.status(200).json({ status: "db_error", error: error.message });

      return res.status(200).json({
        status: "ok",
        results: [{
          status: "pendente",
          titulo: content.titulo,
          id: post?.id,
          categoria: content.categoria,
          subcategoria: content.subcategoria,
          imagem_usada: imagemFinal,
          imagem_fonte_bloqueada: urlProibida
        }]
      });
    }

    return res.status(200).json({ status: "no_valid_news" });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
