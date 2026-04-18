import crypto from "crypto";
import { getNews } from "./rss.js";
import { scrape } from "./scraper.js";
import { rewrite } from "./ai.js";
import { db } from "./db.js";

const MAX_POSTS_DIA = 300;

export async function run_pipeline() {
  const count = await db.countToday();
  if (count >= MAX_POSTS_DIA) return { status: "limit_reached" };

  const news = await getNews();
  if (!news.length) return { status: "no_news" };

  const item = news[0];
  const hash = crypto.createHash("md5").update(item.link).digest("hex");

  if (await db.exists(hash)) return { status: "duplicate" };

  const article = await scrape(item.link);
  if (!article.text) return { status: "scrape_failed" };

  const content = await rewrite(article.text);
  if (!content.text) return { status: "ai_failed" };

  const base = "https://www.ovalorcapital.com.br";
  const searchQ = content.search_query || content.tag_texto || content.tag_tema || "news brazil";

  const cardUrl = `${base}/api/card?tag=${encodeURIComponent(content.tag_texto)}&tema=${encodeURIComponent(content.tag_tema)}&resumo=${encodeURIComponent(content.resumo_card)}&img=${encodeURIComponent(article.image || "")}&q=${encodeURIComponent(searchQ)}`;

  const post = await db.insert({
    titulo: content.title,
    conteudo: content.text,
    comentario_fixado: content.comentario_fixado || "",
    imagem: cardUrl,
    image_override: null,
    hash,
    status: "pendente",
    user_tags: "[]",
    collaborators: "[]",
    metrics: {}
  });

  return { status: "pendente", titulo: content.title, id: post?.id };
}
