// Investigação urgente: Roberto viu, com print real, DUAS matérias
// completamente diferentes (helicóptero do Rick vs. dentista morto em
// Itu) com o EXATO MESMO vídeo anexado. Hipótese, por leitura de código:
// descobrirPaginaVideoBacci() (core/brasilon.js) varre o HTML INTEIRO da
// página com uma regex global, sem escopo — se a Bacci tem algum widget
// de "vídeos em alta"/relacionados que aparece em VÁRIAS páginas
// diferentes (inclusive artigos sem vídeo próprio), esse widget pode ser
// capturado como se fosse o vídeo DA matéria, em qualquer artigo.
// Usa buscarCandidatosBrasilOn() (a MESMA função real de produção) pra
// achar artigos reais e atuais — não reinventa extração de link.
import { buscarCandidatosBrasilOn, descobrirPaginaVideoBacci } from "../../core/brasilon.js";

console.log("=== Buscando candidatos reais e atuais via buscarCandidatosBrasilOn() (produção) ===");
const candidatos = await buscarCandidatosBrasilOn();
console.log("Total de candidatos:", candidatos.length);
console.log(JSON.stringify(candidatos.slice(0, 12).map(c => c.link), null, 2));

console.log("\n=== Testando descobrirPaginaVideoBacci() em cada um ===");
const resultados = [];
for (const c of candidatos.slice(0, 12)) {
  const v = await descobrirPaginaVideoBacci(c.link);
  resultados.push({ url: c.link, video: v });
  console.log(c.link, "->", JSON.stringify(v));
}

const ytIds = resultados.filter(r => r.video?.kind === "youtube").map(r => r.video.url);
const contagem = {};
for (const id of ytIds) contagem[id] = (contagem[id] || 0) + 1;
console.log("\n=== Contagem de vídeos repetidos entre artigos DIFERENTES ===");
console.log(JSON.stringify(contagem, null, 2));
const repetidos = Object.entries(contagem).filter(([, n]) => n > 1);
console.log("\n🔴 Vídeo(s) aparecendo em mais de 1 artigo diferente:", repetidos.length > 0 ? "SIM, CONFIRMADO — " + JSON.stringify(repetidos) : "não confirmado nesta amostra");
