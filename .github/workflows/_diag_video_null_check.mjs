// Investigação urgente: Roberto viu, com print real, DUAS matérias
// completamente diferentes (helicóptero do Rick vs. dentista morto em
// Itu) com o EXATO MESMO vídeo anexado. Hipótese, por leitura de código:
// descobrirPaginaVideoBacci() (core/brasilon.js) varre o HTML INTEIRO da
// página com uma regex global, sem escopo — se a Bacci tem algum widget
// de "vídeos em alta"/relacionados que aparece em VÁRIAS páginas
// diferentes (inclusive artigos sem vídeo próprio), esse widget pode ser
// capturado como se fosse o vídeo DA matéria, em qualquer artigo.
// Testa contra artigos reais e atuais da Bacci pra confirmar ou refutar.
import { descobrirPaginaVideoBacci } from "../../core/brasilon.js";
import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

console.log("=== Buscando artigos reais e atuais da Bacci (homepage) ===");
const home = await axios.get("https://baccinoticias.com.br/", { timeout: 10000, headers: { "User-Agent": UA } });
const html = String(home.data || "");
const linkRe = /https:\/\/baccinoticias\.com\.br\/(?!videos\/|estatico\/|categoria\/|tag\/|autor\/|pagina\/)[a-z0-9-]+\/?/gi;
const links = [...new Set([...html.matchAll(linkRe)].map(m => m[0]))].filter(u => u.split("/").filter(Boolean).length >= 3).slice(0, 8);
console.log("Artigos encontrados na home:", links.length);
console.log(JSON.stringify(links, null, 2));

console.log("\n=== Testando descobrirPaginaVideoBacci() em cada um ===");
const resultados = [];
for (const url of links) {
  const v = await descobrirPaginaVideoBacci(url);
  resultados.push({ url, video: v });
  console.log(url, "->", JSON.stringify(v));
}

const ytIds = resultados.filter(r => r.video?.kind === "youtube").map(r => r.video.url);
const contagem = {};
for (const id of ytIds) contagem[id] = (contagem[id] || 0) + 1;
console.log("\n=== Contagem de vídeos repetidos entre artigos DIFERENTES ===");
console.log(JSON.stringify(contagem, null, 2));
const repetidos = Object.entries(contagem).filter(([, n]) => n > 1);
console.log("\n🔴 Vídeo(s) aparecendo em mais de 1 artigo diferente:", repetidos.length > 0 ? "SIM, CONFIRMADO" : "não confirmado nesta amostra");
