import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const log = [];
  try {
    const { data } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!data || data.value !== "on") return res.status(200).json({ status: "automation_paused" });
    log.push("automation: on");

    log.push("importing rss...");
    const { getNews } = await import("../core/rss.js");
    log.push("rss: ok");

    log.push("getting news...");
    const news = await getNews();
    log.push("news: " + news.length);
    if (!news.length) return res.status(200).json({ status: "no_news", log });

    log.push("importing scraper...");
    const { scrape } = await import("../core/scraper.js");
    log.push("scraper: ok");

    const item = news[0];
    log.push("scraping: " + item.link);
    const article = await scrape(item.link);
    log.push("article text: " + article.text.length + " chars");

    log.push("importing ai...");
    const { rewrite } = await import("../core/ai.js");
    log.push("ai: ok");

    log.push("rewriting...");
    const content = await rewrite(article.text);
    log.push("content title: " + content.title);

    log.push("importing db...");
    const { db } = await import("../core/db.js");
    log.push("db: ok");

    const post = await db.insert({
      titulo: content.title,
      conteudo: content.text,
      comentario_fixado: content.comentario_fixado || "",
      imagem: article.image || "",
      hash: Date.now().toString(),
      status: "pendente",
      user_tags: "[]",
      collaborators: "[]",
      metrics: {}
    });
    log.push("inserted: " + post.id);

    return res.status(200).json({ status: "pendente", titulo: content.title, log });
  } catch(e) {
    return res.status(200).json({ error: e.message, stack: e.stack?.split("\n").slice(0,8), log });
  }
}