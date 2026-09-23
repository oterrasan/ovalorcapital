// Rounds 1-4 (todos confirmados, HTTP 200/FINISHED): conta/token,
// codec/bitrate/level, overlay/composição real, e ausência de áudio —
// NENHUM reproduziu o ProcessingFailedError real de produção. Round 5:
// baixa um vídeo REAL de uma matéria REAL e recente da Bacci (yt-dlp,
// igual ao runner real faz) e roda através do MESMO script de produção
// sem modificação nenhuma — única variável ainda não isolada é o
// conteúdo real baixado em si.
import { execSync } from "node:child_process";
import { createReelContainerResumable, checkReelStatus } from "../../core/instagram.js";
import { writeFileSync } from "node:fs";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const accRes = await fetch(`${SUPABASE_URL}/rest/v1/ig_accounts?select=id,username,active,token&username=eq.ovalorcapital&limit=1`, { headers: H });
const [account] = await accRes.json();
if (!account) { console.log("CONTA_NAO_ENCONTRADA"); process.exit(1); }

console.log("=== Achando um post REAL recente com template de Reel (pra pegar o source_url real) ===");
const postsRes = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,metrics&metrics->instagram_reel_template=not.is.null&order=updated_at.desc&limit=300`,
  { headers: H }
);
const posts = await postsRes.json();
console.log("Posts com template de Reel encontrados:", Array.isArray(posts) ? posts.length : "ERRO: " + JSON.stringify(posts));
let realSourceUrl = null;
let realTitle = null;
for (const p of posts) {
  const t = p.metrics?.instagram_reel_template;
  console.log("-", p.titulo, "| status:", t?.status, "| kind:", t?.source_kind, "| url:", t?.source_url);
  if (!realSourceUrl && t?.source_url && /youtube\.com|youtu\.be/.test(t.source_url)) {
    realSourceUrl = t.source_url;
    realTitle = p.titulo;
  }
}
if (!realSourceUrl) { console.log("NENHUM_SOURCE_URL_DO_YOUTUBE_ENTRE_OS_ENCONTRADOS"); process.exit(1); }
console.log("Post real:", realTitle);
console.log("source_url real:", realSourceUrl);

console.log("\n=== Baixando o vídeo REAL via yt-dlp (mesmo comando exato do runner real) ===");
execSync("pip install --quiet --break-system-packages -U yt-dlp", { stdio: "inherit" });
execSync(
  `yt-dlp --no-progress -f "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best" ` +
  `--merge-output-format mp4 -o reel-source.mp4 "${realSourceUrl}"`,
  { stdio: "inherit" }
);
execSync(`ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt -of json reel-source.mp4`, { stdio: "inherit" });

console.log("\n=== Criando container resumível real ===");
const container = await createReelContainerResumable("Teste técnico isolado — nunca publicado.", account.id, {});
console.log(JSON.stringify(container, null, 2));

console.log("\n=== Rodando o SCRIPT REAL de produção contra o vídeo REAL baixado ===");
writeFileSync("render-job.json", JSON.stringify({
  job: {
    title: realTitle || "Teste técnico isolado",
    body: "<p>Texto de teste pra composição do overlay real.</p>",
    source_url: realSourceUrl,
    template_version: "ovc-reels-2026-09-v2"
  }
}));
execSync(
  "node scripts/render-instagram-reel.mjs render-job.json reel-source.mp4 reel-final.mp4 reel-overlay.png > render-result.json",
  { stdio: "inherit" }
);
console.log(execSync("cat render-result.json").toString());
execSync(`ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,profile,level -of json reel-final.mp4`, { stdio: "inherit" });

const fileSize = execSync("stat -c%s reel-final.mp4").toString().trim();
console.log("Tamanho do render final (conteúdo real):", fileSize, "bytes");

console.log("\n=== Upload resumível pra Meta (render REAL, conteúdo REAL baixado da Bacci) ===");
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
