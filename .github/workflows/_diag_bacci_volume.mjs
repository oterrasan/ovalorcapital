// Diagnóstico único — deletar após uso. Investiga a alegação de Roberto
// (23/09/2026): "o bacci posta 100 videos todo santo dia" vs. nosso volume
// real de captura (posts brasil-on/dia, video-detection/dia), e verifica
// se o volume REAL do Bacci bate com a claim, usando as funções reais do
// pipeline (nada reimplementado).
import { buscarCandidatosBrasilOn, descobrirPaginaVideoBacci } from "../../core/brasilon.js";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function brtDay(iso) {
  const d = new Date(/[Z+-]\d{0,2}:?\d{0,2}$/.test(iso) ? iso : iso + "Z");
  const brt = new Date(d.getTime() - 3 * 3600 * 1000);
  return brt.toISOString().slice(0, 10);
}

async function main() {
  console.log("=== 1) VOLUME REAL DO BACCI (sitemap ao vivo, agora) ===");
  const idxRes = await axios.get("https://baccinoticias.com.br/sitemap_index.xml", { timeout: 10000, headers: { "User-Agent": UA } });
  const idxXml = String(idxRes.data || "");
  const locs = [...idxXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const postSitemaps = locs.filter((l) => /\/post-sitemap\d*\.xml$/.test(l));
  console.log(`post-sitemaps encontrados: ${postSitemaps.length} | último (chunk ativo): ${postSitemaps[postSitemaps.length - 1]}`);
  const chunkAtual = postSitemaps[postSitemaps.length - 1];
  const smRes = await axios.get(chunkAtual, { timeout: 10000, headers: { "User-Agent": UA } });
  const smXml = String(smRes.data || "");
  const blocos = [...smXml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  const entradas = blocos.map((b) => {
    const loc = (b[1].match(/<loc>(.*?)<\/loc>/) || [])[1] || "";
    const lastmod = (b[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || "";
    return { loc, lastmod };
  }).filter((e) => e.loc && e.lastmod);
  entradas.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
  console.log(`total de URLs no chunk atual: ${entradas.length}`);
  console.log(`mais recente: ${entradas[0]?.lastmod} | mais antiga do chunk: ${entradas[entradas.length - 1]?.lastmod}`);

  const now = Date.now();
  const janelas = [1, 4, 8, 24, 48].map((h) => {
    const corte = now - h * 3600 * 1000;
    const n = entradas.filter((e) => new Date(e.lastmod).getTime() >= corte).length;
    return `últimas ${h}h: ${n}`;
  });
  console.log(janelas.join(" | "));

  console.log("\n=== 2) CANDIDATOS REAIS QUE buscarCandidatosBrasilOn() DEVOLVE AGORA ===");
  const candidatos = await buscarCandidatosBrasilOn();
  console.log(`candidatos devolvidos: ${candidatos.length}`);
  candidatos.slice(0, 5).forEach((c) => console.log(`  - ${c.pubDate} | ${c.link}`));

  console.log("\n=== 3) VÍDEO — amostra real dos 15 artigos mais recentes do sitemap ===");
  const amostra = entradas.slice(0, 15);
  let comVideo = 0, semVideo = 0, erro = 0;
  const detalhes = [];
  for (const e of amostra) {
    try {
      const v = await descobrirPaginaVideoBacci(e.loc);
      if (v) { comVideo++; detalhes.push(`VIDEO(${v.kind}) | ${e.lastmod} | ${e.loc}`); }
      else { semVideo++; detalhes.push(`sem video   | ${e.lastmod} | ${e.loc}`); }
    } catch (err) { erro++; detalhes.push(`ERRO: ${err.message} | ${e.loc}`); }
  }
  console.log(`com vídeo: ${comVideo} / sem vídeo: ${semVideo} / erro: ${erro} (de ${amostra.length} testados)`);
  detalhes.forEach((d) => console.log(`  ${d}`));

  console.log("\n=== 4) NOSSO BANCO — posts brasil-on reais por dia (BRT), últimos 3 dias ===");
  const desde = new Date(now - 3 * 24 * 3600 * 1000).toISOString();
  let all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, titulo, created_at, published_at, metrics")
      .eq("publish_method", "brasilon")
      .gte("created_at", desde)
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) { console.log("ERRO query posts:", error.message); break; }
    if (!data || !data.length) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`total de posts brasil-on nos últimos 3 dias: ${all.length}`);
  const porDia = {};
  const comVideoPorDia = {};
  for (const p of all) {
    const dia = brtDay(p.created_at || p.published_at);
    porDia[dia] = (porDia[dia] || 0) + 1;
    const m = typeof p.metrics === "object" && p.metrics ? p.metrics : {};
    if (m.instagram_reel_template) comVideoPorDia[dia] = (comVideoPorDia[dia] || 0) + 1;
  }
  console.log("posts/dia (total):", JSON.stringify(porDia));
  console.log("posts/dia (com video detectado):", JSON.stringify(comVideoPorDia));

  console.log("\n=== 5) ÚLTIMOS 8 POSTS BRASIL-ON REAIS (pra ver o ritmo de geração) ===");
  all.slice(0, 8).forEach((p) => {
    const m = typeof p.metrics === "object" && p.metrics ? p.metrics : {};
    console.log(`  ${p.created_at} | video:${!!m.instagram_reel_template} | ${p.titulo?.slice(0, 60)}`);
  });
}

main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
