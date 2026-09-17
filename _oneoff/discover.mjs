import axios from "axios";
import * as cheerioModule from "cheerio";
const cheerio = cheerioModule.default || cheerioModule;

const url = "https://www.cnnbrasil.com.br/internacional/no-equador-piloto-controla-aviao-e-segue-voando-apos-ser-atingido-por-ave-veja-video/";

const res = await axios.get(url, {
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
});
const $ = cheerio.load(res.data);

console.log("TITLE:", $("h1").first().text().trim());
console.log("OG_IMAGE:", $('meta[property="og:image"]').attr("content"));
console.log("META_DESC:", $('meta[name="description"]').attr("content"));
console.log("PUBLISHED_TIME:", $('meta[property="article:published_time"]').attr("content"));

const seen = new Set();
const imgs = [];
$("article img, figure img, .content img, main img").each((i, el) => {
  const src = $(el).attr("src") || $(el).attr("data-src") || "";
  const alt = $(el).attr("alt") || "";
  const fig = $(el).closest("figure").find("figcaption").text().trim();
  if (src && !seen.has(src)) { seen.add(src); imgs.push({ src, alt, fig }); }
});
console.log("IMAGENS_ENCONTRADAS:", JSON.stringify(imgs, null, 2));

const paras = $("article p, .content p, main p").map((i, el) => $(el).text().trim()).get().filter(t => t.length > 20);
console.log("PARAGRAFOS_REAIS (primeiros 6):");
paras.slice(0, 6).forEach((p, i) => console.log(`  [${i}] ${p}`));
