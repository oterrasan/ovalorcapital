// Diagnóstico único, 24/09/2026 — Roberto pediu pra achar sites/portais
// com vídeo em quantidade (Instagram não dá pra raspar; Bacci sozinho não
// tem o volume que eles têm no IG — ~100/dia). Testa candidatos reais com
// requisição HTTP de verdade (este sandbox local não tem rede pra sites
// externos — só o runner do GitHub Actions tem) e reaproveita a MESMA
// função de detecção de vídeo (descobrirVideoGenerico) que a "Reescrita
// por Link" já usa em produção, pra dar um número real e representativo,
// não um chute.
import axios from "axios";
import * as cheerio from "cheerio";
import { descobrirVideoGenerico } from "../../core/linkCapture.js";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function tentarSitemap(base) {
  try {
    const res = await axios.get(`${base}/sitemap_index.xml`, { timeout: 8000, headers: { "User-Agent": UA } });
    const xml = String(res.data || "");
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    const postSitemaps = locs.filter((l) => /post-sitemap/i.test(l));
    if (!postSitemaps.length) return null;
    const smRes = await axios.get(postSitemaps[postSitemaps.length - 1], { timeout: 8000, headers: { "User-Agent": UA } });
    const smXml = String(smRes.data || "");
    const urls = [...smXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    return urls.slice(-10);
  } catch (_) {
    return null;
  }
}

async function tentarFeed(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": UA } });
    const xml = String(res.data || "");
    const links = [...xml.matchAll(/<link>(.*?)<\/link>/g)].map((m) => m[1]).filter((l) => l && !l.includes("/feed"));
    return links.length ? links.slice(0, 10) : null;
  } catch (_) {
    return null;
  }
}

async function scrapeLinksGenerico(url, hostname) {
  try {
    const res = await axios.get(url, { timeout: 10000, headers: { "User-Agent": UA } });
    const $ = cheerio.load(String(res.data || ""));
    const links = new Set();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      try {
        const u = new URL(href, url);
        if (u.hostname.replace(/^www\./, "") !== hostname.replace(/^www\./, "")) return;
        const path = u.pathname;
        // heurística: parece matéria — tem número (id) ou slug comprido
        if (/\/\d{4,}/.test(path) || path.split("-").length >= 4) links.add(u.href.split("?")[0]);
      } catch (_) {}
    });
    return [...links].slice(0, 10);
  } catch (e) {
    console.log(`  [erro ao raspar homepage] ${e?.message || e}`);
    return [];
  }
}

async function testarCandidato(nome, base, hostname, feedUrls) {
  console.log(`\n=== ${nome} (${base}) ===`);
  let urls = await tentarSitemap(base);
  let origem = "sitemap";
  if (!urls) {
    for (const f of feedUrls) {
      urls = await tentarFeed(f);
      if (urls) { origem = `feed:${f}`; break; }
    }
  }
  if (!urls) {
    urls = await scrapeLinksGenerico(base, hostname);
    origem = "scrape_homepage";
  }
  if (!urls || !urls.length) {
    console.log("  FALHOU — nenhum método achou links de matéria.");
    return;
  }
  console.log(`  método: ${origem} — ${urls.length} URLs de amostra`);
  let comVideo = 0;
  const kinds = {};
  for (const u of urls.slice(0, 8)) {
    try {
      const v = await descobrirVideoGenerico(u);
      if (v) {
        comVideo++;
        kinds[v.kind] = (kinds[v.kind] || 0) + 1;
        console.log(`  [VIDEO:${v.kind}] ${u}`);
      } else {
        console.log(`  [sem video] ${u}`);
      }
    } catch (e) {
      console.log(`  [erro] ${u} — ${e?.message || e}`);
    }
  }
  console.log(`  RESULTADO: ${comVideo}/${Math.min(urls.length, 8)} artigos com vídeo detectável — kinds: ${JSON.stringify(kinds)}`);
}

async function main() {
  // 1) Bacci /bntv/ — existe volume extra aí além do que já capturamos?
  console.log("\n########## BACCI /bntv/ ##########");
  try {
    const res = await axios.get("https://baccinoticias.com.br/bntv/", { timeout: 10000, headers: { "User-Agent": UA } });
    const html = String(res.data || "");
    const ytEmbeds = [...html.matchAll(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi)];
    const iframes = (html.match(/<iframe/gi) || []).length;
    console.log(`  tamanho HTML: ${html.length} bytes | <iframe> encontrados: ${iframes} | embeds YouTube diretos: ${ytEmbeds.length}`);
    const bntvLinks = [...html.matchAll(/href="(https:\/\/(?:www\.)?youtube\.com\/[^"]+)"/gi)].map((m) => m[1]);
    console.log(`  links pro youtube.com na página: ${[...new Set(bntvLinks)].length}`, [...new Set(bntvLinks)].slice(0, 5));
  } catch (e) {
    console.log(`  erro: ${e?.message || e}`);
  }

  // 2) Candidatos — portais brasileiros de notícia com viés de vídeo/viral,
  // testados com dado real, nunca assumidos.
  await testarCandidato("Portal do Holanda", "https://portaldoholanda.com.br", "portaldoholanda.com.br", [
    "https://portaldoholanda.com.br/feed/"
  ]);
  await testarCandidato("Metrópoles", "https://www.metropoles.com", "www.metropoles.com", [
    "https://www.metropoles.com/feed"
  ]);
  await testarCandidato("R7", "https://noticias.r7.com", "noticias.r7.com", []);
  await testarCandidato("Terra Vídeos", "https://www.terra.com.br/noticias/videos/", "www.terra.com.br", []);
  await testarCandidato("CNN Brasil", "https://www.cnnbrasil.com.br", "www.cnnbrasil.com.br", [
    "https://www.cnnbrasil.com.br/feed/"
  ]);
  await testarCandidato("iG Último Segundo", "https://ultimosegundo.ig.com.br", "ultimosegundo.ig.com.br", []);
  await testarCandidato("UOL Notícias", "https://noticias.uol.com.br", "noticias.uol.com.br", []);
  await testarCandidato("G1", "https://g1.globo.com", "g1.globo.com", [
    "https://g1.globo.com/rss/g1/"
  ]);
}

main().then(() => console.log("\nDONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
