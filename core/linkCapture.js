// core/linkCapture.js — Engrenagem de Reescrita por Link (24/09/2026)
//
// Roberto Terrasan, 24/09/2026: "Quero que voce construa uma engrenagem para
// que eu insira um link de instagram ou de site, a engrenagem deve ser capaz
// de capturar imagem e o video e fazer o processo que ja temos para os reels
// de instagram. esta engrenagem deve nao apenas fazer isso, mas ler e
// reescrever a materia, nao importa o tipo ou o tamanho." + "nesta nova
// ferramenta quem determina o que vai, é apenas EU, nao havera automacao de
// sistema buscando nada. só ira confeccionar o que eu mandar e inserir de
// link."
//
// Diferente de core/brasilon.js (que RASPA uma fonte fixa sozinha, sem
// intervenção humana por matéria), este módulo nunca decide sozinho o que
// processar — só reage a UM link que o próprio Roberto cola no admin, um de
// cada vez. Sem cron, sem descoberta de candidatos, sem sitemap. Ver
// handleLinkManual() em api/run_portal.js pro fluxo completo (scrape →
// reescrita → salvar pendente → enfileirar Reel).
//
// TEXTO/IMAGEM: quem chama reaproveita scrape() (core/scraper.js) pra AMBOS
// os casos (Instagram e site genérico) — já cobre Instagram de graça:
// páginas públicas do Instagram continuam emitindo og:title/og:description/
// og:image renderizados no HTML server-side mesmo sem JS, e o fallback
// "Tentativa 3" de scrape() (og:title+og:description quando o texto
// extraído por seletor de artigo é curto demais) é exatamente o caminho que
// toda página do Instagram cai — nenhuma lógica de scraping nova precisa
// existir aqui só pra isso.
//
// VÍDEO: o arquivo de vídeo em si do Instagram/YouTube não dá pra extrair
// com scraping simples (precisa de yt-dlp, que só roda no runner do GitHub
// Actions — mesma cautela já documentada em core/storage.js contra binário
// nativo dentro da function serverless, ver instagram-auto.yml). Pra link
// direto do Instagram/YouTube, só devolvemos o próprio link como
// source_url — quem baixa de fato é o runner. Pra site genérico (nem
// Instagram nem YouTube), procuramos um vídeo embutido na própria página —
// YouTube embutido (mesmo padrão de core/brasilon.js's
// descobrirPaginaVideoBacci) ou um arquivo de vídeo direto (og:video/
// <video src>/<source src>) — e re-hospedamos no nosso Storage do mesmo
// jeito que o Bacci "bunny" já faz (downloadAndUploadVideo, chamado por
// quem invoca este módulo).
import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export function ehInstagram(url) {
  try { return /(^|\.)instagram\.com$/i.test(new URL(url).hostname.replace(/^www\./, "")); } catch (_) { return false; }
}
export function ehYoutube(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h === "youtube.com" || h === "youtu.be" || h === "m.youtube.com";
  } catch (_) { return false; }
}

// 26/09/2026 — Roberto: "sua prioridade é fazer isso funcionar - capturar os
// videos ... instagram, tiktok, youtube, ou sites com mascara de protecao
// como globo". Testado de verdade no runner do GitHub (sem login):
//   - Globo: yt-dlp "globo:<id>" baixa o vídeo inteiro (2/2 matérias do g1).
//     O id vem da própria página da matéria.
//   - TikTok: yt-dlp falha; a API pública do tikwm devolve o mp4.
//   - YouTube: yt-dlp funciona para parte dos vídeos; outros pedem login.
//   - Instagram: tudo sem login falha (inclusive a conexão oficial da Meta,
//     que não tem permissão pra ler post de terceiros).
export function ehTiktok(url) {
  try { return /(^|\.)tiktok\.com$/i.test(new URL(url).hostname); } catch (_) { return false; }
}
export function ehGlobo(url) {
  try { return /(^|\.)(globo\.com|globoplay\.globo\.com)$/i.test(new URL(url).hostname); } catch (_) { return false; }
}
// Links que só o runner consegue baixar (precisam de yt-dlp/tikwm/login).
export function precisaDoRunner(url) {
  return ehInstagram(url) || ehYoutube(url) || ehTiktok(url);
}
// Acha o código do vídeo da Globo dentro da página da matéria (g1, ge, etc).
export async function descobrirVideoGlobo(url) {
  try {
    const m = String(url).match(/globoplay\.globo\.com\/v\/(\d{6,9})/);
    if (m) return { kind: "globo", url: `https://globoplay.globo.com/v/${m[1]}/` };
    const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": UA } });
    const html = String(res.data || "");
    const ids = [...html.matchAll(/"videoId":"?(\d{6,9})|data-video-id="(\d{6,9})"|globoplay\.globo\.com\/v\/(\d{6,9})/g)]
      .map((x) => x[1] || x[2] || x[3]).filter(Boolean);
    return ids.length ? { kind: "globo", url: `https://globoplay.globo.com/v/${ids[0]}/` } : null;
  } catch (_) {
    return null;
  }
}

// Mesmo padrão de exclusão do live_stream já confirmado necessário em
// core/brasilon.js (21/09/2026) — "live_stream" tem 11 chars (igual todo ID
// real de vídeo do YouTube) e é o valor literal e especial que o YouTube usa
// pra "transmita a live atual deste canal (se houver)", não um vídeo.
const _YOUTUBE_EMBED_RE = /(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})(?![a-zA-Z0-9_-])/gi;
const _OG_VIDEO_RE = /<meta\s+property="og:video(?::secure_url|:url)?"\s+content="([^"]+)"/i;
const _VIDEO_TAG_SRC_RE = /<video\b[^>]*\bsrc="([^"]+)"/i;
const _VIDEO_SOURCE_TAG_RE = /<source\b[^>]*\bsrc="([^"]+\.mp4[^"]*)"/i;

function resolverUrl(possivelRelativa, base) {
  try { return new URL(possivelRelativa.replace(/&amp;/g, "&"), base).href; } catch (_) { return null; }
}

// Descobre vídeo embutido numa página GENÉRICA (nem Instagram, nem YouTube
// direto) — mesma filosofia de core/brasilon.js's descobrirPaginaVideoBacci,
// mas sem nenhuma suposição de estrutura específica de um site só (Bacci é
// uma fonte fixa e conhecida; aqui pode ser qualquer site que Roberto cole).
export async function descobrirVideoGenerico(url) {
  try {
    const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": UA } });
    const html = String(res.data || "");

    const ytIds = [...html.matchAll(_YOUTUBE_EMBED_RE)].map((m) => m[1]);
    const ytIdValido = ytIds.find((id) => id.toLowerCase() !== "live_stream");
    if (ytIdValido) return { kind: "youtube", url: `https://www.youtube.com/watch?v=${ytIdValido}` };

    const ogVideo = html.match(_OG_VIDEO_RE);
    if (ogVideo?.[1]) {
      const resolved = resolverUrl(ogVideo[1], url);
      if (resolved) return { kind: "direct", url: resolved };
    }

    const videoTag = html.match(_VIDEO_TAG_SRC_RE) || html.match(_VIDEO_SOURCE_TAG_RE);
    if (videoTag?.[1]) {
      const resolved = resolverUrl(videoTag[1], url);
      if (resolved) return { kind: "direct", url: resolved };
    }

    return null;
  } catch (_) {
    return null;
  }
}
