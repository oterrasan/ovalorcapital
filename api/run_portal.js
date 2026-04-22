import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX_DIA = 480; // 2 chaves x 250 req/dia com folga de segurança

// Faixas horárias BRT — retorna true se deve executar agora
function deveExecutar() {
  const agora = new Date();
  // Converter para horário de Brasília (UTC-3)
  const brt = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const hora = brt.getUTCHours();
  const min = brt.getUTCMinutes();

  // 00h–06h: apenas no minuto :00 de cada hora (1x/hora = 6/dia)
  if (hora >= 0 && hora < 6) return min === 0;

  // 06h–08h: a cada 15 min (4x/hora = 8/dia)
  if (hora >= 6 && hora < 8) return min % 15 === 0;

  // 08h–17h: a cada 5 min (12x/hora = 108/dia)
  if (hora >= 8 && hora < 17) return min % 5 === 0;

  // 17h–18h: a cada 3 min (20x/hora = 20/dia)
  if (hora >= 17 && hora < 18) return min % 3 === 0;

  // 18h–21h30: a cada 2 min (30x/hora = ~105/dia)
  if (hora >= 18 && (hora < 21 || (hora === 21 && min <= 30))) return min % 2 === 0;

  // 21h30–22h: a cada 3 min (10x)
  if (hora === 21 && min > 30) return min % 3 === 0;
  if (hora === 22 && min === 0) return true;

  // 22h–00h: a cada 10 min (12x/dia)
  if (hora >= 22) return min % 10 === 0;

  return false;
}

export default async function handler(req, res) {
  try {
    // Checar automação
    const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });

    // Checar faixa horária — se não é hora, pula sem consumir req da IA
    if (!deveExecutar()) return res.status(200).json({ status: "schedule_skip" });

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

      // Scrape — usa description do RSS como fallback se scraper falhar
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
        user_tags: JSON.stringify([content.categoria || "geral"]),
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) return res.status(200).json({ status: "db_error", error: error.message });

      return res.status(200).json({
        status: "ok",
        results: [{ status: "pendente", titulo: content.titulo, id: post?.id, categoria: content.categoria }]
      });
    }

    return res.status(200).json({ status: "all_skipped" });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
