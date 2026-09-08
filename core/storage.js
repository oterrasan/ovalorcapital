// storage.js — Upload de VÍDEO para matérias do portal (01/09/2026).
//
// Deliberadamente SEM ffmpeg/transcodificação/overlay "queimado" no arquivo:
// dependência nativa pesada rodando dentro de uma serverless function já
// causou um incidente real e grave neste projeto (31/08/2026 — `sharp`,
// import estático, crash de api/manage.js inteiro em TODA ação sem nenhum
// deploy novo, admin em tela preta + automação de Instagram parada por
// horas). Vídeo é a mesma classe de risco, só que pior (ffmpeg é um binário
// MUITO mais pesado que sharp).
//
// Upload manual (arquivo escolhido no admin) NÃO passa por este arquivo —
// o admin já tem um client Supabase com acesso total no browser (`sb`, ver
// public/admin/index.html), então o upload vai direto do navegador pro
// Storage, sem limite de payload da function. Este módulo só cobre o caso
// que TEM que rodar no servidor: baixar um vídeo já hospedado numa URL
// externa e reenviar os bytes crus pro nosso Storage (sem decodificar/
// reencodar nada) — usado tanto pra "colar link de vídeo" no admin quanto,
// no futuro, pela raspagem automática de fontes de vídeo.
//
// O overlay de título visto no vídeo de referência do Roberto (barra
// branca + texto sobre o vídeo) é feito em CSS/HTML por cima do <video>
// no player do site (public/js/internal-page-v2.js) — nunca gravado no
// arquivo de vídeo em si. Reversível, barato, sem risco de binário nativo.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VIDEO_BUCKET = "post-videos";
const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150MB — teto de segurança, não limite real do plano
const EXT_CONTENT_TYPE = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/x-m4v" };

let _bucketReady = false;
export async function ensureVideoBucket() {
  if (_bucketReady) return;
  try {
    await supabase.storage.createBucket(VIDEO_BUCKET, {
      public: true,
      fileSizeLimit: MAX_VIDEO_BYTES
    });
  } catch (_) {
    // já existe — ok, segue.
  }
  _bucketReady = true;
}

function randomName(ext) {
  return `videos/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
}

async function _fetchComTimeout(url, timeoutMs, accept) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let referer;
    try { referer = new URL(url).origin + "/"; } catch (_) {}
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": accept,
        ...(referer ? { "Referer": referer } : {})
      }
    });
    return res;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// 08/09/2026 — Roberto testou colar o link de uma MATÉRIA do G1 (a página
// da notícia, não o arquivo de vídeo) e o sistema recusou. Confirmado com
// a página real: portais como G1 não expõem o vídeo como link direto —
// o mp4 real fica embutido no HTML da própria página (achado real: G1
// tem exatamente 1 URL .mp4 solta no HTML, servida por
// vodstreaming01.video.globo.com — não é um padrão formal tipo schema.org
// VideoObject, mas é único e confiável o bastante pra extrair por regex,
// mesmo princípio já usado pra imagem em core/image_finder.js/scraper.js).
// Se o link colado não for vídeo direto mas FOR uma página HTML, tenta
// achar um .mp4 embutido nela antes de desistir.
function _extrairMp4DoHtml(html) {
  const m = String(html || "").match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
  return m ? m[0].replace(/&amp;/g, "&") : null;
}

// Baixa um vídeo de uma URL externa e reenvia os bytes crus pro nosso
// Storage — sem decodificar, sem reencodar, sem overlay. Usado tanto pra
// "colar link de vídeo" no admin quanto (futuro) pela raspagem automática.
export async function downloadAndUploadVideo(sourceUrl) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) return null;
  await ensureVideoBucket();

  let res = await _fetchComTimeout(sourceUrl, 20000, "video/mp4,video/webm,video/*,text/html,*/*");
  if (!res || !res.ok) return null;

  let finalUrl = sourceUrl;
  let ct = (res.headers.get("content-type") || "").toLowerCase();
  const pareceVideo = (url, contentType) =>
    contentType.includes("video") || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

  if (!pareceVideo(sourceUrl, ct)) {
    // Não é vídeo direto. Se for uma página HTML, tenta achar um .mp4
    // embutido nela (caso real: link de matéria do G1) antes de desistir.
    if (!ct.includes("html")) return null;
    let html;
    try { html = await res.text(); } catch (_) { return null; }
    const mp4Url = _extrairMp4DoHtml(html);
    if (!mp4Url) return null;
    res = await _fetchComTimeout(mp4Url, 20000, "video/mp4,video/webm,video/*,*/*");
    if (!res || !res.ok) return null;
    finalUrl = mp4Url;
    ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!pareceVideo(mp4Url, ct)) return null;
  }

  const lenHeader = Number(res.headers.get("content-length") || 0);
  if (lenHeader && lenHeader > MAX_VIDEO_BYTES) return null;

  let buf;
  try {
    const ab = await res.arrayBuffer();
    buf = Buffer.from(ab);
  } catch (_) {
    return null;
  }
  if (!buf || buf.length < 2000 || buf.length > MAX_VIDEO_BYTES) return null;

  let ext = "mp4";
  if (ct.includes("webm")) ext = "webm";
  else if (ct.includes("quicktime")) ext = "mov";
  else {
    const m = finalUrl.match(/\.(mp4|webm|mov|m4v)(\?|$)/i);
    if (m) ext = m[1].toLowerCase();
  }
  const path = randomName(ext);
  const contentType = EXT_CONTENT_TYPE[ext] || "video/mp4";

  const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, buf, {
    contentType,
    upsert: true,
    cacheControl: "31536000"
  });
  if (error) return null;

  const { data: pub } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
  return pub?.publicUrl || null;
}
