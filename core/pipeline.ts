import crypto from "crypto";
import { getNews } from "./rss";
import { scrape } from "./scraper";
import { rewrite } from "./ai";
import { generateCard } from "./card";
import { publish } from "./instagram";
import { db } from "./db";

const MAX_POSTS_DIA = 60;

export async function run_pipeline() {
  const count = await db.countToday();
  if (count >= MAX_POSTS_DIA) return { status: "limit_reached" };

  const news = await getNews();
  if (!news.length) return { status: "no_news" };

  const item = news[0];
  const hash = crypto.createHash("md5").update(item.link).digest("hex");

  if (await db.exists(hash)) return { status: "duplicate" };

  const article = await scrape(item.link);
  const content = await rewrite(article.text);
  const image = await generateCard(article.image, content.title);
  const ig = await publish(image, content.text);

  await db.insert({
    titulo: content.title,
    hash,
    status: "success"
  });

  return { status: "success", id: ig.id };
}
