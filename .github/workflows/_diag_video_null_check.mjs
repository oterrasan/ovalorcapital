// Comparação de CONTEÚDO real: os dois vídeos (Rick-corpo-liberado vs
// dentista-Itu) têm video_url DIFERENTE no banco — mas podem ser o
// MESMO vídeo baixado duas vezes (mesma fonte na Bacci, ex: widget
// genérico). Baixa os dois arquivos reais e compara tamanho + hash +
// extrai um frame de cada pra inspeção visual.
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

const URLS = {
  rick: "https://yntwvfcxjardzafdqanj.supabase.co/storage/v1/object/public/post-videos/videos/1790160750529-07552822b845.mp4",
  dentista: "https://yntwvfcxjardzafdqanj.supabase.co/storage/v1/object/public/post-videos/videos/1790155943517-fdf124597f9d.mp4"
};

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (err += c));
    child.on("exit", (code) => resolve({ code, out, err }));
  });
}

for (const [nome, url] of Object.entries(URLS)) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${nome}.mp4`, buf);
  const hash = createHash("sha256").update(buf).digest("hex");
  console.log(`${nome}: ${buf.length} bytes | sha256: ${hash}`);
  await run("ffmpeg", ["-y", "-i", `${nome}.mp4`, "-ss", "00:00:01", "-vframes", "1", `${nome}-frame.jpg`]);
}

console.log("\n=== ffprobe de cada vídeo (duração, resolução, codec) ===");
for (const nome of Object.keys(URLS)) {
  const p = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height", "-of", "json", `${nome}.mp4`]);
  console.log(nome, p.out.trim());
}
