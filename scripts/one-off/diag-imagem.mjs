import axios from "axios";

const UA_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const UA_WIKI = "OVaC-portal-bot/1.0 (https://www.ovalorcapital.com.br; contato@ovalorcapital.com.br) axios";

async function tenta(label, url, headers) {
  try {
    const r = await axios.get(url, { timeout: 10000, headers, validateStatus: () => true });
    console.log(`[${label}]`, url.slice(0, 90), "-> status:", r.status, "| bytes:", (r.data ? String(r.data).length : 0));
    return r;
  } catch (e) {
    console.log(`[${label}]`, url.slice(0, 90), "-> ERRO:", e?.message || e);
    return null;
  }
}

console.log("=== TSE com UA Chrome real ===");
const r1 = await tenta("tse-chrome-ua", "https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/tse-concentra-esforcos-para-garantir-o-funcionamento-do-e-titulo-no-dia-da-eleicao", { "User-Agent": UA_CHROME, "Accept": "text/html" });
if (r1 && r1.status === 200) {
  const html = String(r1.data);
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
  console.log("  og:image:", og ? og[0] : "(nao encontrada)");
}

console.log("\n=== Sem headers nenhum (baseline) ===");
await tenta("sem-headers", "https://www.google.com", {});

console.log("\n=== Wikimedia Commons API com UA proprio ===");
const apiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=" +
  encodeURIComponent("Urna eletrônica Brasil") + "&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size&format=json&origin=*";
const r2 = await tenta("wikimedia-ua-proprio", apiUrl, { "User-Agent": UA_WIKI });
if (r2 && r2.status === 200) {
  const pages = r2.data?.query?.pages;
  console.log("  pages:", pages ? Object.keys(pages).length : 0);
  if (pages) for (const p of Object.values(pages).slice(0, 3)) console.log("  ", p.title, "->", p.imageinfo?.[0]?.url);
}

console.log("\n=== Wikimedia Commons API SEM headers ===");
await tenta("wikimedia-sem-headers", apiUrl, {});

console.log("\n=== Wikipedia REST API (pageimages, usada por findImage no core) ===");
const wpUrl = "https://pt.wikipedia.org/api/rest_v1/page/summary/Urna_eletr%C3%B4nica";
await tenta("wikipedia-rest", wpUrl, { "User-Agent": UA_WIKI });
