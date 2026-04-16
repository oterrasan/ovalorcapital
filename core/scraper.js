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
    
    const image = $('meta[property="og:image"]').attr("content") || 
                  $('meta[name="twitter:image"]').attr("content") || "";
    
    const text = $("p").map((_, el) => $(el).text()).get().join("\n").slice(0, 3000);
    
    // Extrair título da página para usar como fallback de busca de imagem
    const title = $('meta[property="og:title"]').attr("content") || 
                  $("title").text() || "";
    
    return { text: text || "", image, title };
  } catch(e) {
    return { text: "", image: "", title: "" };
  }
}
