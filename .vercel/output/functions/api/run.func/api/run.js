import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewrite } from "../core/ai.js";
import { db } from "../core/db.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX = 300;

export default async function handler(req, res) {
  try {
    const { data } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!data || data.value !== "on") return res.status(200).json({ status: "automation_paused" });

    const count = await db.countToday();
    if (count >= MAX) return res.status(200).json({ status: "limit_reached", count });

    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    const item = news[0];
    const hash = crypto.createHash("md5").update(item.link).digest("hex");
    if (await db.exists(hash)) return res.status(200).json({ status: "duplicate" });

    const article = await scrape(item.link);
    if (!article.text) return res.status(200).json({ status: "scrape_failed" });

    const content = await rewrite(article.text);
    if (!content.text) return res.status(200).json({ status: "ai_failed" });

    const post = await db.insert({
      titulo: content.title,
      conteudo: content.text,
      comentario_fixado: content.comentario_fixado || "",
      imagem: article.image || "",
      hash,
      status: "pendente",
      user_tags: "[]",
      collaborators: "[]",
      metrics: {}
    });

    return res.status(200).json({ status: "pendente", titulo: content.title, id: post?.id });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}