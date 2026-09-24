// Diagnóstico único — deletar após uso. Roberto reportou: 2 links de
// Instagram DIFERENTES deram resultado IDÊNTICO ("Instagram passa por
// instabilidade nesta data") na Reescrita por Link — suspeita real: o
// scrape() não está pegando o conteúdo do Reel, está pegando uma página
// genérica de erro/bloqueio do próprio Instagram, sempre igual. Testa a
// MESMA função de produção (scrape(), core/scraper.js) contra o link real
// que ele mandou, sem suposição.
import { scrape } from "../../core/scraper.js";

const LINK = "https://www.instagram.com/reel/DdpXVP0v-Mf/?utm_source=ig_web_copy_link&stkn=NTc4MTIwNjQ2YQ==";

async function main() {
  console.log("=== scrape() direto (allowCompetitorImage:true, timeout:10000 — mesmos parametros de handleLinkManual) ===");
  const a = await scrape(LINK, { allowCompetitorImage: true, timeout: 10000 });
  console.log("title:", JSON.stringify(a.title));
  console.log("image:", JSON.stringify(a.image));
  console.log("text (primeiros 500 chars):", JSON.stringify((a.text || "").slice(0, 500)));
  console.log("text length total:", (a.text || "").length);

  console.log("\n=== fetch cru do HTML (pra ver o que o Instagram de fato devolve pro nosso IP/UA) ===");
  const axios = (await import("axios")).default;
  try {
    const res = await axios.get(LINK, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      maxRedirects: 5,
    });
    console.log("HTTP status:", res.status);
    console.log("tamanho do HTML:", String(res.data || "").length);
    const html = String(res.data || "");
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
    const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);
    const title = html.match(/<title>([^<]*)<\/title>/i);
    console.log("og:title:", ogTitle?.[1]);
    console.log("og:description:", ogDesc?.[1]?.slice(0, 300));
    console.log("og:image:", ogImage?.[1]);
    console.log("<title>:", title?.[1]);
    console.log("\nPrimeiros 800 chars do HTML bruto:");
    console.log(html.slice(0, 800));
  } catch (e) {
    console.log("FALHA no fetch cru:", e.message);
    if (e.response) {
      console.log("HTTP status do erro:", e.response.status);
      console.log("Primeiros 500 chars do corpo de erro:", String(e.response.data || "").slice(0, 500));
    }
  }
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
