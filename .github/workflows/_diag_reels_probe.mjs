// Teste isolado, real, sem tocar em nenhum post: cria um container Reels
// resumível de verdade (mesma função de produção, core/instagram.js) e
// sobe um clipe SINTÉTICO mínimo, 100% dentro de toda spec documentada
// (H264 yuv420p, AAC 48kHz stereo, closed GOP, faststart, 1080x1920,
// 30fps, 5s) — pra isolar se o "ProcessingFailedError" real (confirmado
// hoje em ~20 tentativas reais, sempre o mesmo erro genérico) vem do
// conteúdo/encode específico dos vídeos do Bacci, ou de algo sistêmico
// (conta/token/permissão) que rejeitaria QUALQUER upload, mesmo um
// perfeito. NUNCA chama publish — só create+upload+status.
import { execSync } from "node:child_process";
// core/instagram.js já tem a mesma chave real como default hardcoded —
// não precisa (e não adiantaria, ESM resolve imports antes do resto do
// módulo rodar) setar env var aqui antes do import.
import { createReelContainerResumable, checkReelStatus } from "../../core/instagram.js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const accRes = await fetch(`${SUPABASE_URL}/rest/v1/ig_accounts?select=id,username,active,token&username=eq.ovalorcapital&limit=1`, { headers: H });
const [account] = await accRes.json();
if (!account) { console.log("CONTA_NAO_ENCONTRADA"); process.exit(1); }
console.log("Conta real:", account.username, "id:", account.id, "token presente:", !!account.token);

console.log("\n=== Criando container resumível real (Graph API de verdade) ===");
const container = await createReelContainerResumable("Teste técnico isolado — nunca publicado.", account.id, {});
console.log(JSON.stringify(container, null, 2));

// 1ª rodada (já confirmada em execução anterior deste mesmo probe):
// clipe simples (crf 20, level 4.1, sem overlay, 5s) foi ACEITO pela
// Meta (HTTP 200 + FINISHED em segundos) — descarta conta/token/
// permissão como causa. Agora testa com os PARÂMETROS EXATOS de
// produção (render-instagram-reel.mjs: crf 16, level 5.1, maxrate 8M/
// bufsize 16M) mas ainda SEM overlay/conteúdo real — se isso também
// passar, isola ainda mais a causa pro overlay (composição via
// filter_complex) ou pro conteúdo/upscale real do Bacci, não pro
// codec/bitrate em si.
console.log("\n=== Gerando clipe com os PARÂMETROS EXATOS de produção (crf16, level5.1, maxrate8M) ===");
execSync(
  `ffmpeg -hide_banner -loglevel error -y ` +
  `-f lavfi -i "testsrc2=size=1080x1920:rate=30:duration=5" ` +
  `-f lavfi -i "sine=frequency=440:sample_rate=48000:duration=5" ` +
  `-c:v libx264 -preset medium -crf 16 -maxrate 8M -bufsize 16M ` +
  `-x264-params "scenecut=0:open_gop=0:keyint=60:min-keyint=60" ` +
  `-profile:v high -level 5.1 -pix_fmt yuv420p ` +
  `-c:a aac -b:a 128k -ar 48000 -ac 2 -movflags +faststart -fps_mode cfr synth.mp4`,
  { stdio: "inherit" }
);
const fileSize = execSync("stat -c%s synth.mp4").toString().trim();
console.log("Tamanho do clipe:", fileSize, "bytes");
execSync(`ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt,profile,level,r_frame_rate -of json synth.mp4`, { stdio: "inherit" });

console.log("\n=== Upload resumível direto pra Meta (bytes sintéticos, spec perfeita) ===");
const uploadRes = execSync(
  `curl -sS -o /tmp/upload-response.json -w "%{http_code}" -X POST "${container.upload_url}" ` +
  `-H "Authorization: OAuth ${container.upload_token}" ` +
  `-H "offset: 0" -H "file_size: ${fileSize}" ` +
  `-H "Content-Type: application/octet-stream" --data-binary @synth.mp4 --max-time 120`
).toString().trim();
console.log("HTTP do upload:", uploadRes);
console.log(execSync("cat /tmp/upload-response.json").toString());

if (uploadRes === "200") {
  console.log("\n=== Upload aceito — checando status na Meta (sem publicar) ===");
  for (let i = 0; i < 3; i++) {
    const status = await checkReelStatus(container.creation_id, account.id);
    console.log(JSON.stringify(status, null, 2));
    if (status?.status_code === "FINISHED" || status?.status_code === "ERROR") break;
    await new Promise((r) => setTimeout(r, 15000));
  }
}
console.log("\nDONE — container nunca publicado, expira sozinho na Meta.");
