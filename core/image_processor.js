// image_processor.js — Download, análise Vision, crop, watermark OVC, upload Supabase
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const CROP_TOP_PCT    = 0.05;
const CROP_BOTTOM_PCT = 0.08;
const CROP_LEFT_PCT   = 0.03;
const CROP_RIGHT_PCT  = 0.03;

// Formato web 16:9 landscape — leve e rápido para portal e mobile
const OUT_WIDTH  = 1200;
const OUT_HEIGHT = 675;

// Marca d'água padrão OVC — parametrizável (ver buildWatermark) para portais
// irmãos (ex: Brasil ON) que precisam de marca própria ou nenhuma marca.
const OVC_WATERMARK_LABEL = "ovalorcapital.com.br";

// URLs de origem que nunca devem ser processadas — ícone GE do Google News, CDN Google, etc.
const _BAD_SRC_PATTERNS = [
  'googleusercontent.com','encrypted-tbn','ssl.gstatic','gstatic.com',
  'news.google.com','yt3.ggpht','googlelogo','google_logo','google-logo',
  'vector','ilustra','illustration','diagram','infograph','cartoon',
  'drawing','clipart','sketch','template','shutterstock','gettyimages',
];
function _isUrlBloqueada(url) {
  if (!url || url.length < 10) return true;
  const u = url.toLowerCase();
  return _BAD_SRC_PATTERNS.some(p => u.includes(p)) ||
    /\.(svg|gif|ico|bmp)(\?|$)/i.test(u) ||
    /\b(16|32|48|64)x(16|32|48|64)\b/.test(u);
}

// 31/08/2026 — analyzeImageVision() (GPT-4o-mini, OpenAI) removida por
// completo. Roberto Terrasan: "remova tudo que tiver de chaves, só devem
// ficar as do gemini, as outras nem usamos mais". A função já estava morta
// na prática havia semanas (OPENAI_API_KEY nunca configurada nesta parte do
// sistema desde a migração pra Gemini-only de 16-17/08/2026 — sem chave, a
// função sempre retornava null e o caminho ficava fail-open, ou seja, TODA
// imagem passava sem checagem nenhuma). O substituto real e funcional é
// analyzeImageVisionGemini() logo abaixo — usado explicitamente via
// opts.geminiVision:true (ver processAndSaveImage()).

// Cache local das chaves Gemini — duplicado de propósito, sem acoplar
// image_processor.js a ai_portal.js (mesma convenção já usada em
// api/manage.js pro mesmo motivo — ver histórico do projeto).
let _geminiKeysImgCache = null;
let _geminiKeysImgCacheTs = 0;
async function _getGeminiKeysImg() {
  const now = Date.now();
  if (_geminiKeysImgCache && now - _geminiKeysImgCacheTs < 300000) return _geminiKeysImgCache;
  try {
    const { data } = await supabase.from("config").select("key,value").in("key", ["GEMINI_API_KEY", "GEMINI_API_KEY_2"]);
    const keys = {};
    (data || []).forEach(r => { keys[r.key] = r.value; });
    const list = [keys.GEMINI_API_KEY, keys.GEMINI_API_KEY_2].filter(Boolean);
    if (list.length) { _geminiKeysImgCache = list; _geminiKeysImgCacheTs = now; return list; }
  } catch (_) {}
  return [];
}

// 25/08/2026 — Analisa imagem via Gemini Vision — rejeita QUALQUER marca/logo
// de veículo de forma GENÉRICA (não depende de lista fixa de nomes, ao
// contrário de analyzeImageVision() abaixo, que é GPT-4o-mini com lista
// fechada de portais). Criado especificamente pro canal de Fofocas/Giro
// (core/fofocas.js): achado real (25/08/2026) — imagem de matéria real da
// Leo Dias trazia a logo "LEO DIAS" bem visível na flâmula do microfone do
// repórter deles, mesmo a foto sendo de cobertura ao vivo/pessoal (não um
// screenshot óbvio). Roberto: "verifique se as imagens... sao plausiveis de
// raspar... nao podemos ter citacoes de outros portais, nome de jornalistas
// e nem logotipos etc" — este é o filtro que cumpre essa regra sem depender
// do OpenAI (Roberto pediu pra abandonar o OpenAI por completo em
// 16-17/08/2026 pra geração de texto; o filtro antigo baseado em GPT-4o-mini
// segue existindo só pro pipeline principal de matérias, fora do escopo
// desta mudança).
async function analyzeImageVisionGemini(buffer) {
  try {
    const keys = await _getGeminiKeysImg();
    if (!keys.length) return null;
    let mimeType = "image/jpeg";
    try {
      const meta = await sharp(buffer).metadata();
      if (meta.format) mimeType = `image/${meta.format === "jpg" ? "jpeg" : meta.format}`;
    } catch (_) {}
    const base64 = buffer.toString("base64");
    const prompt = 'Analyze this image, which will be published on a Brazilian news portal that must NEVER show another outlet\'s branding. Respond ONLY with valid JSON: {"has_logo_or_watermark":true/false,"is_illustration":true/false}\nhas_logo_or_watermark: true if there is ANY visible brand logo, watermark, channel/outlet name, magazine name, website name, or journalist/reporter credit anywhere in the image — including on microphones, backdrops, banners, lower-third graphics, or small corner watermarks — even if small or partial. False only if the photo has no visible media-outlet branding at all.\nis_illustration: true if this is a drawing, cartoon, graphic, or non-photographic artwork rather than a real photograph.';
    const body = {
      contents: [{ role: "user", parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64 } }
      ] }],
      generationConfig: { temperature: 0, maxOutputTokens: 100 }
    };
    for (const key of keys) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${key}`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        clearTimeout(timer);
        if (!res.ok) { if (res.status === 429 || res.status === 503) continue; return null; }
        const d = await res.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const m = text.match(/\{[^}]+\}/);
        if (!m) return null;
        return JSON.parse(m[0]);
      } catch (_) { continue; }
    }
    return null;
  } catch (_) {
    return null;
  }
}

// Gera overlay SVG com marca d'água (canto inferior direito) — label parametrizável
// para portais irmãos (ex: Brasil ON) que precisam de marca própria.
function buildWatermark(width, height, label) {
  const fontSize = Math.max(13, Math.floor(width * 0.017));
  const padding  = Math.floor(width * 0.014);
  const approxW  = label.length * fontSize * 0.58;
  const approxH  = fontSize + 6;
  const x = width  - Math.round(approxW) - padding;
  const y = height - Math.round(approxH) - padding;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x - 6}" y="${y - 3}" width="${Math.round(approxW) + 12}" height="${Math.round(approxH) + 8}" rx="3" fill="rgba(0,0,0,0.48)"/>
    <text x="${x}" y="${y + fontSize}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold" fill="rgba(255,255,255,0.88)" letter-spacing="0.4">${label}</text>
  </svg>`;
  return Buffer.from(svg);
}

async function downloadImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    // Referer da própria origem da imagem — vários CDNs (ex: Revista Oeste,
    // atrás de Cloudflare) bloqueiam com 403 downloads sem Referer do mesmo
    // domínio (proteção anti-hotlink). Investigado 11/08/2026: Bacci não tem
    // essa proteção (100% sucesso), Revista Oeste tinha ~12% de sucesso antes
    // deste fix.
    let referer;
    try { referer = new URL(url).origin + "/"; } catch (_) {}
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/jpeg,image/png,image/*",
        ...(referer ? { "Referer": referer } : {})
      }
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image")) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch(_) {
    clearTimeout(timer);
    return null;
  }
}

// opts: { outWidth, outHeight, watermarkLabel } — watermarkLabel null/'' = sem marca d'água
// (ex: Brasil ON usa a imagem original da fonte sem marca, ver core/brasilon.js).
async function processImage(buffer, opts = {}) {
  const outWidth  = opts.outWidth  || OUT_WIDTH;
  const outHeight = opts.outHeight || OUT_HEIGHT;
  const watermarkLabel = opts.watermarkLabel === undefined ? OVC_WATERMARK_LABEL : opts.watermarkLabel;
  try {
    const meta = await sharp(buffer).metadata();
    const { width, height } = meta;
    if (!width || !height || width < 200 || height < 150) return null;

    const cropTop    = Math.floor(height * CROP_TOP_PCT);
    const cropBottom = Math.floor(height * CROP_BOTTOM_PCT);
    const cropLeft   = Math.floor(width  * CROP_LEFT_PCT);
    const cropRight  = Math.floor(width  * CROP_RIGHT_PCT);

    const extractWidth  = width  - cropLeft - cropRight;
    const extractHeight = height - cropTop  - cropBottom;
    if (extractWidth < 100 || extractHeight < 80) return null;

    const processed = await sharp(buffer)
      .extract({ left: cropLeft, top: cropTop, width: extractWidth, height: extractHeight })
      .resize(outWidth, outHeight, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();

    if (!watermarkLabel) return processed;

    const watermark = buildWatermark(outWidth, outHeight, watermarkLabel);
    const final = await sharp(processed)
      .composite([{ input: watermark, blend: "over" }])
      .webp({ quality: 82 })
      .toBuffer();

    return final;
  } catch(_) {
    return null;
  }
}

async function uploadToSupabase(buffer, filename, bucket = "post-images", prefix = "imagens") {
  try {
    const path = `${prefix}/${filename}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000"
      });
    if (error) return null;
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return urlData?.publicUrl || null;
  } catch(_) {
    return null;
  }
}

// opts (todos opcionais, default = comportamento OVC original inalterado):
//   outWidth/outHeight — dimensão final (default 1200x675, 16:9)
//   watermarkLabel — texto da marca d'água, '' ou null para nenhuma (default "ovalorcapital.com.br")
//   bucket/prefix — destino no Supabase Storage (default "post-images"/"imagens")
//   skipVision — não tem mais nenhum efeito prático desde 31/08/2026 (a checagem
//   OpenAI que ele desligava já foi removida por completo — ver nota abaixo).
//   Mantido no parâmetro só por retrocompatibilidade com chamadas existentes
//   (Brasil ON/Jovem Pan/Internacional), sem quebrar nada.
//   geminiVision — true roda analyzeImageVisionGemini() pra rejeitar QUALQUER
//   logo/marca/watermark de forma genérica, fail-closed (rejeita se a análise
//   falhar, não só se detectar algo). Criado pro canal de Fofocas/Giro
//   (25/08/2026) — fontes de raspagem de celebridades podem ter foto de cobertura ao
//   vivo com a marca do próprio veículo visível (ex: flâmula de microfone), diferente
//   de Brasil ON/Jovem Pan/Internacional, cujas fontes foram confirmadas limpas.
//   31/08/2026 — Roberto: "remova tudo que tiver de chaves, só devem ficar as do
//   gemini". A checagem OpenAI (que rodava por padrão quando nem skipVision nem
//   geminiVision eram passados) foi removida por completo — ela já era um no-op
//   na prática (OPENAI_API_KEY nunca configurada aqui, sempre fail-open). Se algum
//   canal futuro quiser vision-check de verdade sem ser Fofocas/Giro, é só passar
//   geminiVision:true, mesmo padrão já usado ali.
export async function processAndSaveImage(sourceUrl, postId, startTime, opts = {}) {
  if (!sourceUrl || sourceUrl.length < 10) return null;
  // Rejeita URLs de origem ruins antes de qualquer download — ícone GE, CDN Google, etc.
  if (_isUrlBloqueada(sourceUrl)) return null;
  try {
    const buffer = await downloadImage(sourceUrl);
    if (!buffer || buffer.length < 5000) return null;

    if (opts.geminiVision) {
      // Sem gate de orçamento por elapsed — 25/08/2026, achado real com
      // evidência: usar o mesmo `startTime` (que é o início da FUNÇÃO
      // CHAMADORA inteira, ex: autoFofocas(), não deste item específico)
      // rejeitava sistematicamente o 2º/3º/4º/5º candidato de um lote por
      // "sem orçamento de tempo" — não por logo de verdade. Testado ao vivo:
      // uma imagem confirmada limpa (Gemini real, mesma chamada exata) voltou
      // has_logo_or_watermark:false, mas a produção rejeitava porque o gate de
      // 15s já tinha estourado antes de chegar nesse candidato (cada item
      // anterior gasta tempo com scrape + reescrita via Gemini). A própria
      // analyzeImageVisionGemini() já tem timeout de 4s por chave (~8s pior
      // caso com 2 chaves) — suficiente, e autoFofocas()/canais equivalentes já
      // têm seu próprio orçamento de loop (50s) que impede runaway total.
      const visionMetrics = await analyzeImageVisionGemini(buffer);
      // Fail-closed: rejeita se a análise não pôde ser feita (sem chave, timeout,
      // erro) OU se achou logo/marca/ilustração — aqui o risco de vazar marca de
      // fonte de raspagem é maior que perder uma imagem boa.
      if (!visionMetrics || visionMetrics.has_logo_or_watermark === true || visionMetrics.is_illustration === true) {
        return null;
      }
    }

    const processed = await processImage(buffer, opts);
    if (!processed) return null;

    const filename = `${postId || Date.now()}.webp`;
    return await uploadToSupabase(processed, filename, opts.bucket, opts.prefix);
  } catch(_) {
    return null;
  }
}
