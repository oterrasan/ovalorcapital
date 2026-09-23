// Diagnóstico real e profundo do "ProcessingFailedError" da Meta — sem
// suposição: inspeciona bytes de verdade (ffprobe completo) do vídeo
// FONTE e do vídeo FINAL renderizado, antes de tentar reproduzir o erro
// de novo com detalhe máximo da resposta da Meta (corpo + headers).
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { writeFileSync, statSync, existsSync } from "node:fs";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (c) => stdout.push(c));
    child.stderr.on("data", (c) => stderr.push(c));
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
  });
}

console.log("=== 1) Localizando o post real que falhou ===");
const { data: posts, error } = await sb
  .from("posts")
  .select("id,titulo,conteudo,metrics,updated_at")
  .not("metrics->instagram_reel_template", "is", null)
  .order("updated_at", { ascending: false })
  .limit(30);
if (error) { console.log("ERRO consultando posts:", error.message); process.exit(1); }

let target = null;
for (const p of posts) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : (p.metrics || {});
  const t = m.instagram_reel_template;
  if (t && t.status === "error" && String(t.last_error || "").includes("ProcessingFailedError")) {
    target = { post: p, template: t };
    break;
  }
}
if (!target) {
  console.log("Nenhum post com ProcessingFailedError encontrado nos 30 mais recentes com reel_template.");
  for (const p of posts.slice(0, 5)) {
    const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : (p.metrics || {});
    console.log("-", p.id, p.titulo, "| status:", m.instagram_reel_template?.status, "| last_error:", m.instagram_reel_template?.last_error);
  }
  process.exit(1);
}
console.log("Post encontrado:", target.post.id, "-", target.post.titulo);
console.log("source_url:", target.template.source_url);
console.log("last_error real:", target.template.last_error);

const sourceUrl = target.template.source_url;

console.log("\n=== 2) Baixando o vídeo fonte (mesma lógica de produção) ===");
if (/youtube\.com|youtu\.be/.test(sourceUrl)) {
  await run("pip", ["install", "--quiet", "--break-system-packages", "-U", "yt-dlp"]);
  const dl = await run("yt-dlp", ["--no-progress", "-f", "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best", "--merge-output-format", "mp4", "-o", "reel-source", sourceUrl]);
  console.log("yt-dlp exit:", dl.code);
  if (dl.code !== 0) { console.log("yt-dlp stderr:", dl.stderr.slice(-800)); process.exit(1); }
} else {
  const dl = await run("curl", ["--fail", "--location", "-sS", sourceUrl, "--max-time", "300", "-o", "reel-source"]);
  console.log("curl exit:", dl.code);
  if (dl.code !== 0) { console.log("curl stderr:", dl.stderr.slice(-800)); process.exit(1); }
}
console.log("Tamanho do arquivo fonte:", statSync("reel-source").size, "bytes");

console.log("\n=== 3) ffprobe COMPLETO do vídeo FONTE (bruto, como baixado) ===");
const probeSource = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", "reel-source"]);
console.log(probeSource.stdout);
if (probeSource.stderr) console.log("ffprobe stderr (fonte):", probeSource.stderr);

console.log("\n=== 4) Renderizando com o script real de produção ===");
writeFileSync("render-job.json", JSON.stringify({
  job: {
    post_id: target.post.id,
    claim_id: "diag-" + Date.now(),
    title: target.post.titulo || "",
    body: (target.post.conteudo || "").replace(/<[^>]+>/g, " "),
    source_url: sourceUrl,
    template_version: target.template.version || "ovc-reels-2026-09-v2"
  }
}));
const render = await run("node", ["scripts/render-instagram-reel.mjs", "render-job.json", "reel-source", "reel-final.mp4", "reel-overlay.png"]);
console.log("render exit:", render.code);
console.log("render stdout:", render.stdout);
if (render.stderr) console.log("render stderr:", render.stderr.slice(-1500));
if (render.code !== 0 || !existsSync("reel-final.mp4")) { console.log("Render falhou — abortando aqui."); process.exit(1); }
console.log("Tamanho do arquivo final:", statSync("reel-final.mp4").size, "bytes");

console.log("\n=== 5) ffprobe COMPLETO do vídeo FINAL (pós-render, o que seria enviado pra Meta) ===");
const probeFinal = await run("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", "reel-final.mp4"]);
console.log(probeFinal.stdout);
if (probeFinal.stderr) console.log("ffprobe stderr (final):", probeFinal.stderr);

console.log("\n=== 6) Tentando de novo — container novo + upload, com corpo E headers completos da resposta da Meta ===");
const instagram = await import("../../core/instagram.js");
let container;
try {
  container = await instagram.createReelContainerResumable("[diagnóstico — nunca será publicado]", null);
  console.log("Container criado:", container.creation_id, "| conta:", container.username);
} catch (e) {
  console.log("ERRO criando container:", e.message);
  process.exit(1);
}

const fileBuffer = await import("node:fs/promises").then(fs => fs.readFile("reel-final.mp4"));
const uploadRes = await fetch(container.upload_url, {
  method: "POST",
  headers: {
    "Authorization": `OAuth ${container.upload_token}`,
    "offset": "0",
    "file_size": String(fileBuffer.length),
    "Content-Type": "application/octet-stream"
  },
  body: fileBuffer
});
console.log("HTTP do upload:", uploadRes.status);
console.log("Headers da resposta:");
for (const [k, v] of uploadRes.headers.entries()) console.log(`  ${k}: ${v}`);
const uploadText = await uploadRes.text();
console.log("Corpo da resposta:", uploadText);

console.log("\n=== FIM DO DIAGNÓSTICO ===");
