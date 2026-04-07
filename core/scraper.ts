import axios from "axios";
import * as cheerio from "cheerio";

export async function scrape(url: string) {
  const html = (await axios.get(url)).data;
  const $ = cheerio.load(html);

  const image = $('meta[property="og:image"]').attr("content");

  const text = $("p")
    .map((_, el) => $(el).text())
    .get()
    .join("\n")
    .slice(0, 2000);

  return { text, image };
}
