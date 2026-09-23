// Teste mais decisivo possível: gera um vídeo SINTÉTICO (nada a ver com
// a matéria real, sem nenhum conteúdo/imagem/legenda "sensível"), roda
// pelo MESMO pipeline de render + MESMO código de upload real. Se ESSE
// publicar normal, prova que o código está correto — o problema é
// específico do arquivo/conteúdo daquela notícia, não do sistema. Se
// ESSE também falhar com o erro idêntico, o problema é genuinamente no
// código/protocolo de upload, não no conteúdo — aí sim parto pra testar
// upload em chunks reais.
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

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

console.log("=== Gerando vídeo sintético de teste (barras coloridas + tom, 20s, 360x640) ===");
const gen = await run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-i", "testsrc2=size=360x640:rate=30:duration=20",
  "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=20",
  "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "128k",
  "-movflags", "+faststart",
  "-f", "mp4",
  "reel-source"
]);
console.log("gerar fonte sintética — exit:", gen.code, gen.stderr.slice(-500));

console.log("\n=== Renderizando com o template real do OVC ===");
writeFileSync("render-job.json", JSON.stringify({
  job: {
    post_id: "diag-synthetic",
    claim_id: "diag-" + Date.now(),
    title: "Video de teste sintetico gerado localmente",
    body: "Conteudo de teste sem nenhuma relacao com noticia real, gerado por ffmpeg testsrc2 para diagnostico.",
    source_url: "diag://synthetic",
    template_version: "ovc-reels-2026-09-v2"
  }
}));
const render = await run("node", ["scripts/render-instagram-reel.mjs", "render-job.json", "reel-source", "reel-final.mp4", "reel-overlay.png"]);
console.log("render exit:", render.code, "| stdout:", render.stdout.trim());
if (render.code !== 0) { console.log("render stderr:", render.stderr.slice(-1000)); process.exit(1); }

const instagram = await import("../../core/instagram.js");

console.log("\n=== Tentando upload real do vídeo sintético ===");
let container;
try {
  container = await instagram.createReelContainerResumable("teste diagnostico sintetico ovc", null);
  console.log("Container criado:", container.creation_id);
} catch (e) {
  console.log("ERRO criando container:", e.message);
  process.exit(1);
}
const buf = readFileSync("reel-final.mp4");
console.log("Tamanho do arquivo:", buf.length, "bytes");
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

if (res.status === 200) {
  console.log("\n=== Checando status de processamento na Meta (sem publicar) ===");
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await instagram.checkReelStatus(container.creation_id, container.account_id);
    console.log("status_code:", status.status_code, "| status:", status.status);
    if (status.status_code === "FINISHED") break;
  }
}

console.log("\n=== FIM ===");
