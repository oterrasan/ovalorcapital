import axios from "axios";
import * as cheerioModule from "cheerio";
const cheerio = cheerioModule.default || cheerioModule;

export async function scrape(url) {
  try {
    const html = (await axios.get(url, { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } })).data;
    const $ = cheerio.load(html);
    const image = $("meta[property=\"og:image\"]").attr("content") || "";
    const text = $("p").map((_, el) => $(el).text()).get().join("
").slice(0, 3000);
    return { text: text || "", image };
  } catch(e) {
    return { text: "", image: "" };
  }
}
