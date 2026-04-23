import axios from "axios";
import * as cheerioModule from "cheerio";
const cheerio = cheerioModule.default || cheerioModule;

// Padrões de imagem inválida — repórter, âncora, ícone, logo de veículo
const BLOCKED_IMG = [
  /perfil/i,/author/i,/avatar/i,/reporter/i,/jornalista/i,
  /apresentador/i,/anchor/i,/staff/i,/\/autores?\//i,/\/pessoas?\//i,
  /foto-de-perfil/i,/profile/i,/headshot/i,/foto_autor/i,/\/time\//i,
  /icon/i,/logo/i,/favicon/i,/sprite/i,
  /\.svg$/i,/\.gif$/i,/\.ico$/i
];

function isValidImage(url) {
  if (!url || url.length < 10) return false;
  return !BLOCKED_IMG.some(p => p.test(url));
}

export async function scrape(url) {
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    const $ = cheerio.load(res.data);

    // Candidatas a imagem em ordem de prioridade
    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[property="og:image:url"]').attr("content"),
      $('meta[itemprop="image"]').attr("content"),
      $("article img").first().attr("src"),
      $(".post-thumbnail img, .featured-image img, .entry-thumbnail img").first().attr("src"),
    ].map(s => normalizeUrl(s, url)).filter(Boolean);

    // Primeira imagem válida (não é repórter/ícone)
    const imageUrl = candidates.find(c => isValidImage(c)) || "";

    $("script, style, nav, footer, header, aside, .sidebar, .menu, .ad, .advertisement").remove();

    const text = $("article p, .content p, .entry-content p, main p, p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 30)
      .join("\n")
      .slice(0, 3000);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim() || "";

    return { text: text || "", image: imageUrl, title };
  } catch(e) {
    return { text: "", image: "", title: "" };
  }
}

function normalizeUrl(src, base) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  try {
    const u = new URL(base);
    if (src.startsWith("//")) return u.protocol + src;
    if (src.startsWith("/")) return u.origin + src;
    return u.origin + "/" + src;
  } catch(_) { return src; }
}
