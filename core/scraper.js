import axios from "axios";
import * as cheerioModule from "cheerio";
const cheerio = cheerioModule.default || cheerioModule;

export async function scrape(url) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OVCBot/1.0)" }
    });
    const $ = cheerio.load(res.data);
    const image = $('meta[property="og:image"]').attr("content") || "";
    const text = $("p").map((_, el) => $(el).text()).get().join("\n").slice(0, 3000);
    return { text: text || "", image };
  } catch(e) {
    return { text: "", image: "" };
  }
}
