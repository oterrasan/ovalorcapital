// scripts/capture-link-jobs.mjs — captura automática de links (Instagram,
// YouTube, TikTok). Roda SÓ no runner do GitHub Actions (instagram-auto.yml,
// job capturar_links), nunca na Vercel.
//
// 26/09/2026 — Roberto: "sua prioridade é fazer isso funcionar - capturar os
// videos ... instagram, tiktok, youtube". Métodos testados de verdade no
// runner antes de escolher:
//   - TikTok: yt-dlp falha; API pública do tikwm devolve texto, capa e mp4.
//   - YouTube: yt-dlp + servidor de token (bgutil, container Docker subido
//     no workflow) + runtime JS (Deno). Alguns vídeos ainda pedem login.
//   - Instagram: nada funciona sem login. Usamos a conta de captura
//     cadastrada no admin (config IG_CAPTURA_CONTA, usuário/senha digitados
//     por Roberto) via instagram-private-api; a sessão fica salva em
//     config IG_CAPTURA_SESSAO pra não precisar logar toda vez.
//
// Fluxo por pedido (config LINK_JOB__*, criado por handleLinkManual):
//   1. lê texto/título/capa e baixa o vídeo pelo método do site
//   2. se passar de 45 MB, ffmpeg reduz
//   3. PUT do vídeo na URL assinada do nosso Storage
//   4. POST link_manual com job_key + texto + vídeo -> servidor reescreve,
//      salva pendente, enfileira o Reel e apaga o pedido
// Qualquer falha -> link_job_falhou com o motivo real (aparece no admin).
import { execFileSync } from "node:child_process";
import { existsSync, statSync, readFileSync, writeFileSync, rmSync } from "node:fs";

const API = "https://www.ovalorcapital.com.br/api/run_portal";
const TOKEN = process.env.OVC_ADMIN_TOKEN || "";
const COOKIES = process.env.YTDLP_COOKIES_FILE && existsSync(process.env.YTDLP_COOKIES_FILE) ? process.env.YTDLP_COOKIES_FILE : "";
const MAX_BYTES = 45 * 1024 * 1024;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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

function ytdlp(args, timeoutMs, cookies = COOKIES) {
  const base = ["--no-warnings", "--no-progress"];
  if (cookies) base.push("--cookies", cookies);
  return execFileSync("yt-dlp", [...base, ...args], { encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function erroLegivel(e) {
  const raw = String(e?.stderr || e?.message || e).replace(/\s+/g, " ").trim();
  if (/IP address is blocked/i.test(raw)) return "TikTok bloqueia este vídeo para o nosso servidor (restrição de região). Baixe o vídeo e suba manualmente. Detalhe: " + raw.slice(0, 160);
  if (/not a bot|Sign in to confirm/i.test(raw)) return "YouTube pediu login para este vídeo específico. Cole o texto e suba o vídeo manualmente. Detalhe: " + raw.slice(0, 200);
  if (/checkpoint|challenge/i.test(raw)) return "Instagram pediu verificação da conta de captura (abra o app nessa conta e confirme que foi você). Detalhe: " + raw.slice(0, 200);
  return raw.slice(0, 350);
}

const ehInstagram = (u) => /(^|\.)instagram\.com$/i.test(new URL(u).hostname);
const ehTiktok = (u) => /(^|\.)tiktok\.com$/i.test(new URL(u).hostname);

async function baixarArquivo(url, destino, headers = {}) {
  const r = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(240000), redirect: "follow" });
  if (!r.ok) throw new Error(`download do vídeo recusado: HTTP ${r.status}`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

// ── TikTok (tikwm; se falhar, yt-dlp) ─────────────────────────────────
// tikwm tem limite de 1 pedido por segundo (resposta "Free Api Limit") —
// testado no runner: o mesmo link falha e passa segundos depois. Até 3
// tentativas com pausa; se continuar sem dados, yt-dlp (também testado,
// baixou o vídeo). Post com restrição de região ("Your IP address is
// blocked from accessing this post") não tem saída sem outra rede.
async function capturarTiktok(link, arquivo) {
  let v = null, msg = "";
  for (let t = 0; t < 3 && !v; t++) {
    if (t) await new Promise((r) => setTimeout(r, 2500));
    try {
      const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(link)}&hd=1`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      const d = await r.json().catch(() => ({}));
      if (d.code === 0 && d.data) v = d.data; else msg = d.msg || "sem dados";
    } catch (e) { msg = e.message; }
  }
  if (v) {
    const videoUrl = v.hdplay || v.play;
    let temVideo = false;
    if (videoUrl) { try { await baixarArquivo(videoUrl, arquivo); temVideo = true; } catch (e) { console.log(`tikwm: download falhou (${e.message}), tentando yt-dlp`); } }
    if (!temVideo) {
      try { ytdlp(["--impersonate", "chrome", "-f", "b[ext=mp4]/best", "-o", arquivo, link], 180000, ""); temVideo = existsSync(arquivo); } catch (_) {}
    }
    const autor = v.author?.nickname ? `Publicado por ${v.author.nickname} no TikTok. ` : "";
    return { titulo: String(v.title || "").slice(0, 200), texto: autor + String(v.title || ""), capa: v.origin_cover || v.cover || "", temVideo };
  }
  console.log(`tikwm sem resposta (${msg}) — tentando yt-dlp`);
  // 26/09/2026 — TikTok recusa o yt-dlp sem imitar um navegador (teste real
  // no runner); com curl-cffi instalado, --impersonate chrome resolve.
  const meta = JSON.parse(ytdlp(["--impersonate", "chrome", "-J", link], 120000, ""));
  ytdlp(["--impersonate", "chrome", "-f", "b[ext=mp4]/best", "-o", arquivo, link], 180000, "");
  const autor = meta.uploader ? `Publicado por ${meta.uploader} no TikTok. ` : "";
  return { titulo: String(meta.title || "").slice(0, 200), texto: autor + String(meta.description || meta.title || ""), capa: String(meta.thumbnail || ""), temVideo: existsSync(arquivo) };
}

// ── YouTube (yt-dlp + servidor de token) ───────────────────────────────
async function capturarYoutube(link, arquivo) {
  let meta = null, ultimoErro = null;
  for (const tentativa of [1, 2]) {
    try { meta = JSON.parse(ytdlp(["-J", link], 120000)); break; }
    catch (e) { ultimoErro = e; if (tentativa === 1) await new Promise((r) => setTimeout(r, 8000)); }
  }
  if (!meta) throw ultimoErro;
  const out = { titulo: String(meta.title || "").trim(), texto: String(meta.description || "").trim(), capa: String(meta.thumbnail || "").trim(), temVideo: false };
  try {
    ytdlp(["-f", "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best", "--merge-output-format", "mp4", "-o", arquivo, link], 300000);
    out.temVideo = existsSync(arquivo);
  } catch (e) { console.log(`vídeo do YouTube não baixado: ${erroLegivel(e)}`); }
  return out;
}

// ── Instagram (conta de captura, login) ────────────────────────────────
const IG_ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function shortcodeParaId(sc) {
  let id = 0n;
  for (const c of sc) id = id * 64n + BigInt(IG_ALFABETO.indexOf(c));
  return id.toString();
}
let _ig = null;
async function igCliente() {
  if (_ig) return _ig;
  const conta = await api({ action: "link_captura_conta" });
  if (!conta.ok || !conta.username || !conta.password) {
    throw new Error("Nenhuma conta de captura do Instagram cadastrada. Admin → Reescrita por Link → Conta de captura do Instagram.");
  }
  const { IgApiClient } = await import("instagram-private-api");
  const ig = new IgApiClient();
  ig.state.generateDevice(conta.username);
  let logado = false;
  if (conta.session) {
    try { await ig.state.deserialize(conta.session); await ig.account.currentUser(); logado = true; }
    catch (_) { console.log("sessão salva expirou — fazendo login de novo"); }
  }
  if (!logado) {
    await ig.account.login(conta.username, conta.password);
    const estado = await ig.state.serialize();
    delete estado.constants;
    await api({ action: "link_captura_sessao", session: estado });
  }
  _ig = ig;
  return ig;
}
async function capturarInstagram(link, arquivo) {
  const sc = (new URL(link).pathname.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!sc) throw new Error("link do Instagram sem código de post/reel (precisa ser /p/... ou /reel/...)");
  const ig = await igCliente();
  const info = await ig.media.info(shortcodeParaId(sc));
  let item = info.items?.[0];
  if (!item) throw new Error("Instagram não devolveu esse post (privado ou apagado)");
  if (item.carousel_media?.length) item = item.carousel_media.find((m) => m.video_versions?.length) || item.carousel_media[0];
  const legenda = String(info.items[0].caption?.text || "").trim();
  const capa = item.image_versions2?.candidates?.[0]?.url || "";
  const videoUrl = item.video_versions?.[0]?.url || "";
  if (videoUrl) await baixarArquivo(videoUrl, arquivo, { Referer: "https://www.instagram.com/" });
  const autor = info.items[0].user?.username ? `Publicado por @${info.items[0].user.username} no Instagram. ` : "";
  return { titulo: legenda.split("\n")[0].slice(0, 200), texto: autor + legenda, capa, temVideo: !!videoUrl };
}

async function processar(job) {
  const video = `link-${job.key.replace(/[^a-zA-Z0-9_-]/g, "")}.mp4`;
  try {
    const cap = ehTiktok(job.link) ? await capturarTiktok(job.link, video)
      : ehInstagram(job.link) ? await capturarInstagram(job.link, video)
      : await capturarYoutube(job.link, video);
    const texto = String(cap.texto || "").trim();
    const titulo = String(cap.titulo || "").trim();
    if (texto.length < 60 && titulo.length < 60) {
      throw new Error("legenda/texto do post tem menos de 60 caracteres — cole o texto manualmente no admin.");
    }

    let videoHospedado = "";
    if (cap.temVideo && existsSync(video) && job.upload_url && job.public_url) {
      try {
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
        console.log(`[${job.key}] vídeo não enviado (segue só com texto/capa): ${erroLegivel(e)}`);
      }
    }
    console.log(`[${job.key}] capturado: texto=${texto.length} chars, video=${videoHospedado ? "sim" : "não"}`);

    const resp = await api({
      action: "link_manual", token: TOKEN, job_key: job.key, link: job.link, categoria: job.categoria,
      texto: texto || titulo, titulo_fonte: titulo, imagem_url: cap.capa, video_hospedado: videoHospedado
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
const lista = await api({ action: "link_jobs_pendentes", token: TOKEN });
if (!lista.ok) { console.log("Falha ao listar pedidos:", lista.error); process.exit(1); }
console.log(`Pedidos a processar: ${lista.jobs.length}`);
for (const job of lista.jobs) await processar(job);
