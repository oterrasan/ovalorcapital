// Teste decisivo, não teoria: pega o MESMO vídeo que já falhou de
// verdade (Esposa de Rick), renderiza com o template real do OVC (o
// mesmo artefato exato que a produção tenta subir), e tenta o upload
// 2 vezes — uma com a legenda REAL (a que o sistema sempre usa) e outra
// com uma legenda neutra de teste. Se só a legenda real falhar, o
// problema é algo no texto barrando no ingest da Meta — achável e
// corrigível no código. Se as duas falharem igual, a legenda não é o
// motivo e o problema está no arquivo em si.
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

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

const POST_ID = "4a3ad811-346c-4132-ab9c-8a21bf43ef02"; // Esposa de Rick — já confirmado falhando 2x
const { data: post } = await sb.from("posts").select("id,titulo,conteudo,metrics").eq("id", POST_ID).maybeSingle();
const m = typeof post.metrics === "string" ? JSON.parse(post.metrics) : post.metrics;
const sourceUrl = m.instagram_reel_template.source_url;
console.log("Post:", post.titulo);
console.log("source_url (bruto, pré-render):", sourceUrl);

console.log("\n=== Baixando o vídeo bruto ===");
const dl = await run("curl", ["--fail", "--location", "-sS", sourceUrl, "--max-time", "300", "-o", "reel-source"]);
console.log("curl exit:", dl.code);

console.log("\n=== Renderizando com o template real do OVC (mesmo artefato que a produção tenta subir) ===");
writeFileSync("render-job.json", JSON.stringify({
  job: {
    post_id: post.id,
    claim_id: "diag-" + Date.now(),
    title: post.titulo || "",
    body: (post.conteudo || "").replace(/<[^>]+>/g, " "),
    source_url: sourceUrl,
    template_version: m.instagram_reel_template.version || "ovc-reels-2026-09-v2"
  }
}));
const render = await run("node", ["scripts/render-instagram-reel.mjs", "render-job.json", "reel-source", "reel-final.mp4", "reel-overlay.png"]);
console.log("render exit:", render.code, "| stdout:", render.stdout.trim());
if (render.code !== 0) { console.log("render stderr:", render.stderr.slice(-1000)); process.exit(1); }

const instagram = await import("../../core/instagram.js");

async function tentarUpload(caption, label) {
  console.log(`\n=== Tentativa: ${label} ===`);
  console.log("Legenda usada (primeiros 80 chars):", JSON.stringify(caption.slice(0, 80)));
  let container;
  try {
    container = await instagram.createReelContainerResumable(caption, null);
    console.log("Container criado:", container.creation_id);
  } catch (e) {
    console.log("ERRO criando container:", e.message);
    return;
  }
  const buf = readFileSync("reel-final.mp4");
  const res = await fetch(container.upload_url, {
    method: "POST",
    headers: {
      "Authorization": `OAuth ${container.upload_token}`,
      "offset": "0",
      "file_size": String(buf.length),
      "Content-Type": "application/octet-stream"
    },
    body: buf
  });
  const text = await res.text();
  console.log("HTTP:", res.status, "| corpo:", text);
}

const stripHtml = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const realCaption = `${(post.titulo || "").toUpperCase()}\n\n${stripHtml(post.conteudo).slice(0, 300)}`;
await tentarUpload(realCaption, "LEGENDA REAL (a que o sistema sempre usa)");

console.log("\n--- aguardando 5s antes da segunda tentativa ---\n");
await new Promise((r) => setTimeout(r, 5000));

await tentarUpload("teste diagnostico neutro sem nenhuma palavra sensivel", "LEGENDA NEUTRA DE TESTE");

console.log("\n=== FIM ===");
