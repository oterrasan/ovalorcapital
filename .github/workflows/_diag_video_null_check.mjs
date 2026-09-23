// Achar a causa raiz de verdade: buscar as URLs reais na Bacci das 2
// matérias implicadas (dentista/Itu, Rick corpo liberado) e inspecionar o
// HTML bruto ao redor de cada "estatico/bacci.php?video=ID" encontrado —
// pra confirmar se é um widget sitewide (sidebar/relacionados) ou
// realmente o vídeo do próprio artigo.
import axios from "axios";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function buscarSitemapCompleto() {
  const idx = await axios.get("https://baccinoticias.com.br/sitemap_index.xml", { headers: { "User-Agent": UA } });
  const locs = [...String(idx.data).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).filter(l => /post-sitemap\d*\.xml$/.test(l));
  let todos = [];
  for (const l of locs.slice(-3)) {
    const sm = await axios.get(l, { headers: { "User-Agent": UA } });
    const urls = [...String(sm.data).matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    todos = todos.concat(urls);
  }
  return todos;
}

const todos = await buscarSitemapCompleto();
console.log("Total de URLs nos ultimos 3 chunks do sitemap:", todos.length);

const candidatosDentista = todos.filter(u => /dentista/i.test(u) && /itu/i.test(u));
const candidatosRick = todos.filter(u => /rick/i.test(u) && (/liberad/i.test(u) || /corpo/i.test(u) || /velorio/i.test(u)));
console.log("Candidatos dentista/Itu:", JSON.stringify(candidatosDentista, null, 2));
console.log("Candidatos Rick liberado/corpo:", JSON.stringify(candidatosRick, null, 2));

async function inspecionar(url) {
  console.log(`\n=== Inspecionando ${url} ===`);
  const res = await axios.get(url, { headers: { "User-Agent": UA } });
  const html = String(res.data || "");
  const matches = [...html.matchAll(/estatico\/bacci\.php\?video=(\d+)[^"'\s<>]*/gi)];
  console.log("Ocorrencias de estatico/bacci.php?video=:", matches.length);
  for (const m of matches) {
    const idx = m.index;
    const contexto = html.slice(Math.max(0, idx - 400), idx + 200);
    console.log(`--- video=${m[1]} em offset ${idx} ---`);
    console.log(contexto.replace(/\s+/g, " "));
  }
}

for (const url of [...candidatosDentista, ...candidatosRick]) {
  await inspecionar(url);
}
