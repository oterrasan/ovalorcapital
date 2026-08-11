// image_processor.js — Download, análise Vision, crop, watermark OVC, upload Supabase
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");
const OPENAI_KEY = process.env.OPENAI_API_KEY;

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

// Analisa imagem via GPT-4o Vision — rejeita logos, gráficos, ilustrações e concorrentes
async function analyzeImageVision(buffer) {
  if (!OPENAI_KEY) return null;
  try {
    const base64 = buffer.toString("base64");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 120,
        temperature: 0,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this image. Respond ONLY with valid JSON: {"has_competitor_logo":true/false,"is_chart_or_table":true/false,"is_illustration":true/false,"is_logo":true/false,"is_tourist_landmark":true/false}\nhas_competitor_logo: true if logos/watermarks from G1, UOL, Estadão, CNN Brasil, Folha, Globo, Band, Record, SBT, R7, Jovem Pan, Veja, Exame, Reuters, AP.\nis_chart_or_table: true if image is a chart, graph, infographic, map, table, or has critical readable text/numbers.\nis_illustration: true if image is a drawing, cartoon, illustration, clipart, painting, animation, or any non-photographic artwork — NOT a real photograph of a person, place or event.\nis_logo: true if image is primarily a brand logo, company symbol, product icon, app icon, or corporate identity — examples: Google logo, Apple logo, government seal, party symbol, team badge. False if the logo is small/secondary in a real photograph.\nis_tourist_landmark: true if image shows ONLY a tourist attraction, historic monument, temple, pagoda, castle, church exterior, famous building, or scenic landscape with NO people or news context — i.e. a generic travel/stock photo of a place. False if there are people, protest, event, or clear news context.'
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "low" }
            }
          ]
        }]
      })
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const d = await res.json();
    const text = (d.choices?.[0]?.message?.content || "").trim();
    const m = text.match(/\{[^}]+\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch(_) {
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
//   skipVision — true pula a análise Vision (logo/gráfico/ilustração/ponto turístico/
//   concorrente) inteira, sem gastar chamada de IA nem tempo. Usado pelo Brasil ON:
//   Roberto Terrasan confirmou 11/08/2026 que as fontes aprovadas (Bacci Notícias,
//   Revista Oeste) não têm marca d'água nem nada que impeça reaproveitamento direto
//   da imagem — o filtro do OVC (pensado pro pool de 1000+ fontes RSS) é desnecessário
//   ali. Imagem sempre vem da própria matéria (og:image), nunca de outro lugar.
export async function processAndSaveImage(sourceUrl, postId, startTime, opts = {}) {
  if (!sourceUrl || sourceUrl.length < 10) return null;
  // Rejeita URLs de origem ruins antes de qualquer download — ícone GE, CDN Google, etc.
  if (_isUrlBloqueada(sourceUrl)) return null;
  try {
    const buffer = await downloadImage(sourceUrl);
    if (!buffer || buffer.length < 5000) return null;

    let visionMetrics = null;
    if (!opts.skipVision) {
      // Chama Vision só se há orçamento de tempo (< 5s decorridos desde início da request)
      const elapsed = startTime ? Date.now() - startTime : 0;
      if (elapsed < 5000) {
        visionMetrics = await analyzeImageVision(buffer);
      }
    }

    // Rejeita: logo, ponto turístico genérico, logo concorrente, gráfico/tabela, ilustração
    if (visionMetrics?.is_logo === true) return null;
    if (visionMetrics?.is_tourist_landmark === true) return null;
    if (visionMetrics?.has_competitor_logo === true) return null;
    if (visionMetrics?.is_chart_or_table === true) return null;
    if (visionMetrics?.is_illustration === true) return null;

    const processed = await processImage(buffer, opts);
    if (!processed) return null;

    const filename = `${postId || Date.now()}.webp`;
    return await uploadToSupabase(processed, filename, opts.bucket, opts.prefix);
  } catch(_) {
    return null;
  }
}
