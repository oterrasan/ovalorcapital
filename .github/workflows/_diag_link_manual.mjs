import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { descobrirPaginaVideoBacci } from "../../core/brasilon.js";
import { descobrirVideoGenerico } from "../../core/linkCapture.js";
import { scrape } from "../../core/scraper.js";
const src = readFileSync("api/manage.js", "utf8");
const key = src.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"]+/)[0];
const sb = createClient("https://yntwvfcxjardzafdqanj.supabase.co", key);

// 1) Status real dos templates de Reel por tipo de fonte (ultimos 300 com template)
const { data } = await sb.from("posts").select("id,created_at,metrics").not("metrics->instagram_reel_template", "is", null).order("created_at", { ascending: false }).limit(300);
const stats = {}; const exemplos = {}; const erros = {};
for (const p of data || []) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : p.metrics;
  const t = m.instagram_reel_template; const k = t.source_kind || (/(youtube|youtu\.be)/.test(t.source_url||"") ? "youtube?" : "outro");
  stats[k] = stats[k] || {}; stats[k][t.status] = (stats[k][t.status] || 0) + 1;
  if (!exemplos[k]) exemplos[k] = t.source_url;
  if (t.last_error) { erros[k] = erros[k] || []; if (erros[k].length < 4) erros[k].push(String(t.last_error).slice(0, 220)); }
}
console.log("STATS", JSON.stringify(stats)); console.log("EXEMPLOS", JSON.stringify(exemplos)); console.log("ERROS", JSON.stringify(erros, null, 1));

// 2) Bacci link que ficou sem video
const bacci = "https://baccinoticias.com.br/videos/esposa-abre-o-coracao-em-despedida-de-empresario-bruno-avelar-ira-deixar-um-legado-muito-grande_99306";
console.log("BACCI generico:", JSON.stringify(await descobrirVideoGenerico(bacci)));
console.log("BACCI especifico:", JSON.stringify(await descobrirPaginaVideoBacci(bacci).catch(e => "ERR " + e.message)));

// 3) scrape() de YouTube e Instagram (o que a tela faz hoje)
const yt = exemplos.youtube || "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const ig = exemplos.instagram || "https://www.instagram.com/reel/DOaJ4n0DfNV/";
for (const u of [yt, ig]) {
  const a = await scrape(u, { allowCompetitorImage: true, timeout: 10000 }).catch(e => ({ err: e.message }));
  console.log("SCRAPE", u, JSON.stringify({ title: a.title, textLen: (a.text || "").length, text: (a.text || "").slice(0, 160), image: !!a.image, err: a.err }));
}

// 4) yt-dlp (o que so o runner tem) — metadados e download
execSync("pip install --quiet --break-system-packages -U yt-dlp", { stdio: "inherit" });
for (const u of [yt, ig]) {
  try {
    const out = execSync(`yt-dlp --no-warnings -J "${u}"`, { encoding: "utf8", timeout: 90000, stdio: ["ignore", "pipe", "pipe"] });
    const j = JSON.parse(out);
    console.log("YTDLP OK", u, JSON.stringify({ title: j.title, descLen: (j.description || "").length, desc: (j.description || "").slice(0, 160), thumb: !!j.thumbnail, dur: j.duration }));
  } catch (e) { console.log("YTDLP FALHOU", u, String(e.stderr || e.message).slice(0, 400)); }
}
