// Round 1 (confirmado): clipe simples (crf20/level4.1, sem overlay) foi
// ACEITO pela Meta — descarta conta/token/permissão como causa.
// Round 2 (confirmado): mesmo clipe com os parâmetros EXATOS de produção
// (crf16/level5.1/maxrate8M) — TAMBÉM aceito — descarta codec/bitrate/
// level como causa.
// Round 3 (este): roda o script REAL de produção,
// scripts/render-instagram-reel.mjs, SEM NENHUMA modificação — mesma
// composição de overlay (buildOverlay + filter_complex ... overlay), só
// trocando a fonte (vídeo baixado real do Bacci) por um clipe sintético
// local — isola se o overlay/composição é a causa, sem depender de
// nenhum download externo.
import { execSync } from "node:child_process";
import { createReelContainerResumable, checkReelStatus } from "../../core/instagram.js";
import { writeFileSync } from "node:fs";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const accRes = await fetch(`${SUPABASE_URL}/rest/v1/ig_accounts?select=id,username,active,token&username=eq.ovalorcapital&limit=1`, { headers: H });
const [account] = await accRes.json();
if (!account) { console.log("CONTA_NAO_ENCONTRADA"); process.exit(1); }
console.log("Conta real:", account.username, "id:", account.id);

console.log("\n=== Criando container resumível real ===");
const container = await createReelContainerResumable("Teste técnico isolado — nunca publicado.", account.id, {});
console.log(JSON.stringify(container, null, 2));

// Round 3 (já confirmado, HTTP 200/FINISHED): script real de produção
// completo (overlay incluso) contra fonte sintética COM áudio — também
// passou. Isso descarta overlay/composição/encode como causa. Única
// variável real ainda não testada: fonte SEM NENHUMA faixa de áudio —
// hipótese real (não suposição vazia — WebSearch confirmou que a Meta
// documenta requisito de áudio pra Reels via API) é que vídeos do Bacci/
// YouTube às vezes não têm áudio, e -map 0:a? (opcional) produziria um
// MP4 final sem nenhuma faixa de áudio — Meta pode rejeitar isso.
console.log("\n=== Gerando fonte sintética SEM ÁUDIO (só vídeo — testa a hipótese de áudio ausente) ===");
execSync(
  `ffmpeg -hide_banner -loglevel error -y ` +
  `-f lavfi -i "testsrc2=size=512x640:rate=30:duration=10" ` +
  `-c:v libx264 -crf 18 -an reel-source.mp4`,
  { stdio: "inherit" }
);
execSync(`ffprobe -v error -show_entries stream=codec_type,codec_name -of json reel-source.mp4`, { stdio: "inherit" });

console.log("\n=== Rodando o SCRIPT REAL de produção (render-instagram-reel.mjs, sem nenhuma modificação) ===");
writeFileSync("render-job.json", JSON.stringify({
  job: {
    title: "Teste técnico isolado",
    body: "<p>Texto de teste pra composição do overlay real.</p>",
    source_url: "local://synthetic",
    template_version: "ovc-reels-2026-09-v2"
  }
}));
execSync(
  "node scripts/render-instagram-reel.mjs render-job.json reel-source.mp4 reel-final.mp4 reel-overlay.png > render-result.json",
  { stdio: "inherit" }
);
console.log(execSync("cat render-result.json").toString());

const fileSize = execSync("stat -c%s reel-final.mp4").toString().trim();
console.log("Tamanho do render final (com overlay real):", fileSize, "bytes");

console.log("\n=== Upload resumível pra Meta (render REAL, com overlay, fonte sintética) ===");
const uploadRes = execSync(
  `curl -sS -o /tmp/upload-response.json -w "%{http_code}" -X POST "${container.upload_url}" ` +
  `-H "Authorization: OAuth ${container.upload_token}" ` +
  `-H "offset: 0" -H "file_size: ${fileSize}" ` +
  `-H "Content-Type: application/octet-stream" --data-binary @reel-final.mp4 --max-time 300`
).toString().trim();
console.log("HTTP do upload:", uploadRes);
console.log(execSync("cat /tmp/upload-response.json").toString());

if (uploadRes === "200") {
  console.log("\n=== Upload aceito — checando status na Meta (sem publicar) ===");
  for (let i = 0; i < 5; i++) {
    const status = await checkReelStatus(container.creation_id, account.id);
    console.log(JSON.stringify(status, null, 2));
    if (status?.status_code === "FINISHED" || status?.status_code === "ERROR") break;
    await new Promise((r) => setTimeout(r, 15000));
  }
}
console.log("\nDONE — container nunca publicado, expira sozinho na Meta.");
