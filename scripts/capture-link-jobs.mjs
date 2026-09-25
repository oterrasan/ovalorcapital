// scripts/capture-link-jobs.mjs — captura automática de links do Instagram/YouTube
//
// 25/09/2026 — Roberto: "vamos criar ambas as opcoes... eu crio uma conta
// secundaria com um outro e-mail". Roda SÓ no runner do GitHub Actions
// (instagram-auto.yml, job capturar_links), nunca na Vercel.
//
// Fluxo por pedido (config LINK_JOB__*, criado por handleLinkManual em
// api/run_portal.js quando Roberto cola link do Instagram/YouTube sem texto):
//   1. yt-dlp -J (com cookies da conta de apoio) -> título, legenda, capa
//   2. yt-dlp baixa o vídeo (mp4); se passar de 45 MB, ffmpeg reduz
//   3. PUT do vídeo na URL assinada do nosso Storage
//   4. POST link_manual com job_key + texto + vídeo hospedado -> o servidor
//      reescreve, salva pendente e enfileira o Reel (e apaga o pedido)
// Qualquer falha -> link_job_falhou com o motivo real (aparece no admin).
import { execFileSync } from "node:child_process";
import { existsSync, statSync, readFileSync, rmSync } from "node:fs";

const API = "https://www.ovalorcapital.com.br/api/run_portal";
const TOKEN = process.env.OVC_ADMIN_TOKEN || "";
const COOKIES = process.env.YTDLP_COOKIES_FILE && existsSync(process.env.YTDLP_COOKIES_FILE) ? process.env.YTDLP_COOKIES_FILE : "";
const MAX_BYTES = 45 * 1024 * 1024;

async function api(body) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000)
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch (_) { return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` }; }
}

function ytdlp(args, timeoutMs) {
  const base = ["--no-warnings", "--no-progress"];
  if (COOKIES) base.push("--cookies", COOKIES);
  return execFileSync("yt-dlp", [...base, ...args], { encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function erroLegivel(e) {
  const raw = String(e?.stderr || e?.message || e).replace(/\s+/g, " ").trim();
  if (/not a bot|Sign in to confirm/i.test(raw)) return "YouTube bloqueou o servidor (pediu login). Confira/renove os cookies da conta de apoio (YTDLP_COOKIES). Detalhe: " + raw.slice(0, 200);
  if (/empty media response|login required|rate-limit|checkpoint/i.test(raw)) return "Instagram exigiu login ou bloqueou a conta de apoio. Confira/renove os cookies (YTDLP_COOKIES). Detalhe: " + raw.slice(0, 200);
  return raw.slice(0, 350);
}

async function processar(job) {
  const video = `link-${job.key.replace(/[^a-zA-Z0-9_-]/g, "")}.mp4`;
  try {
    const meta = JSON.parse(ytdlp(["-J", job.link], 120000));
    const titulo = String(meta.title || "").trim();
    const texto = String(meta.description || "").trim();
    const capa = String(meta.thumbnail || "").trim();
    if (texto.length < 60 && titulo.length < 60) {
      throw new Error("legenda/texto do post tem menos de 60 caracteres — cole o texto manualmente no admin.");
    }

    let videoHospedado = "";
    if (job.upload_url && job.public_url) {
      try {
        ytdlp(["-f", "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best", "--merge-output-format", "mp4", "-o", video, job.link], 300000);
        if (statSync(video).size > MAX_BYTES) {
          const menor = video.replace(/\.mp4$/, "-720.mp4");
          execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", menor], { timeout: 300000 });
          rmSync(video, { force: true });
          execFileSync("mv", [menor, video]);
        }
        if (statSync(video).size <= MAX_BYTES) {
          const put = await fetch(job.upload_url, {
            method: "PUT",
            headers: { "Content-Type": "video/mp4", "x-upsert": "true", "Cache-Control": "max-age=3600" },
            body: readFileSync(video),
            signal: AbortSignal.timeout(180000)
          });
          if (put.ok) videoHospedado = job.public_url;
          else console.log(`[${job.key}] upload do vídeo recusado: HTTP ${put.status}`);
        } else {
          console.log(`[${job.key}] vídeo continua acima de 45 MB mesmo reduzido — segue só com texto/capa.`);
        }
      } catch (e) {
        console.log(`[${job.key}] vídeo não baixado (segue só com texto/capa): ${erroLegivel(e)}`);
      }
    }

    const resp = await api({
      action: "link_manual", token: TOKEN, job_key: job.key, link: job.link, categoria: job.categoria,
      texto: texto || titulo, titulo_fonte: titulo, imagem_url: capa, video_hospedado: videoHospedado
    });
    console.log(`[${job.key}] resultado: ${JSON.stringify(resp).slice(0, 300)}`);
  } catch (e) {
    const motivo = erroLegivel(e);
    console.log(`[${job.key}] FALHOU: ${motivo}`);
    await api({ action: "link_job_falhou", token: TOKEN, job_key: job.key, error: motivo });
  } finally {
    rmSync(video, { force: true });
  }
}

if (!TOKEN) { console.log("OVC_ADMIN_TOKEN ausente"); process.exit(1); }
if (!COOKIES) console.log("⚠️ Sem cookies da conta de apoio (secret YTDLP_COOKIES) — Instagram/YouTube provavelmente vão recusar.");
const lista = await api({ action: "link_jobs_pendentes", token: TOKEN });
if (!lista.ok) { console.log("Falha ao listar pedidos:", lista.error); process.exit(1); }
console.log(`Pedidos a processar: ${lista.jobs.length}`);
for (const job of lista.jobs) await processar(job);
