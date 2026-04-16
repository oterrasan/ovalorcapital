import crypto from "crypto";
import { getNews } from "./rss.js";
import { scrape } from "./scraper.js";
import { rewrite } from "./ai.js";
import { generateCard } from "./card.js";
import { uploadImage } from "./storage.js";
import { db } from "./db.js";

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

  // Gerar card com layout OVC
  const cardBuffer = await generateCard({
    imageUrl: article.image,
    tagText: content.tag_texto,
    tagTema: content.tag_tema,
    resumo: content.resumo_card,
    searchQuery: content.search_query
  });

  // Fazer upload do card e obter URL pública
  const cardUrl = await uploadImage(cardBuffer, hash);

  await db.insert({
    titulo: content.title,
    conteudo: content.text,
    comentario_fixado: content.comentario_fixado,
    imagem: cardUrl,
    hash,
    status: "pendente"
  });

  return { status: "pendente", titulo: content.title };
}
