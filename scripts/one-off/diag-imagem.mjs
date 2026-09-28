import axios from "axios";

const urls = [
  "https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/tse-concentra-esforcos-para-garantir-o-funcionamento-do-e-titulo-no-dia-da-eleicao",
];

for (const url of urls) {
  try {
    const r = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OVCBot/1.0)" },
      validateStatus: () => true,
    });
    console.log(url, "-> status:", r.status, "| bytes:", (r.data || "").length);
    const html = String(r.data || "");
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
    console.log("  og:image tag:", ogMatch ? ogMatch[0] : "(nao encontrada)");
  } catch (e) {
    console.log(url, "-> ERRO:", e?.message || e);
  }
}

console.log("\n--- Testando Wikimedia Commons diretamente ---");
const queries = ["Urna eletrônica", "Tribunal Superior Eleitoral", "Eleições no Brasil"];
for (const q of queries) {
  try {
    const apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
      `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
    const r = await axios.get(apiUrl, { timeout: 10000, validateStatus: () => true });
    const pages = r.data?.query?.pages;
    console.log(`q="${q}" -> status:${r.status} pages:`, pages ? Object.keys(pages).length : 0);
    if (pages) {
      for (const p of Object.values(pages).slice(0, 3)) {
        console.log("  ", p.title, "->", p.imageinfo?.[0]?.url);
      }
    }
  } catch (e) {
    console.log(`q="${q}" -> ERRO:`, e?.message || e);
  }
}
