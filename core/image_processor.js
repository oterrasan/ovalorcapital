// image_processor.js — Download, análise Vision, crop, watermark OVC, upload Supabase
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const CROP_TOP_PCT    = 0.05;
const CROP_BOTTOM_PCT = 0.08;
const CROP_LEFT_PCT   = 0.03;
const CROP_RIGHT_PCT  = 0.03;

// Formato Instagram Feed portrait 4:5 — funciona no portal (float esquerda) e no IG
const OUT_WIDTH  = 1080;
const OUT_HEIGHT = 1350;

// Analisa imagem via GPT-4o Vision — rejeita logos de concorrentes, gráficos e ilustrações
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
        max_tokens: 80,
        temperature: 0,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this image. Respond ONLY with valid JSON: {"has_competitor_logo":true/false,"is_chart_or_table":true/false,"is_illustration":true/false}\nhas_competitor_logo: true if logos/watermarks from G1, UOL, Estadão, CNN Brasil, Folha, Globo, Band, Record, SBT, R7, Jovem Pan, Veja, Exame, Reuters, AP.\nis_chart_or_table: true if image is a chart, graph, infographic, map, table, or has critical readable text/numbers.\nis_illustration: true if image is a drawing, cartoon, illustration, clipart, painting, animation, or any non-photographic artwork — NOT a real photograph of a person, place or event.'
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

// Gera overlay SVG com marca d'água OVC (canto inferior direito) — será substituído por logomarca oficial
function buildWatermark(width, height) {
  const fontSize = Math.max(13, Math.floor(width * 0.017));
  const padding  = Math.floor(width * 0.014);
  const label    = "ovalorcapital.com.br";
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
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/jpeg,image/png,image/*"
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

async function processImage(buffer) {
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
      .resize(OUT_WIDTH, OUT_HEIGHT, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();

    // Watermark OVC — será substituído por logomarca oficial quando fornecida
    const watermark = buildWatermark(OUT_WIDTH, OUT_HEIGHT);
    const final = await sharp(processed)
      .composite([{ input: watermark, blend: "over" }])
      .webp({ quality: 82 })
      .toBuffer();

    return final;
  } catch(_) {
    return null;
  }
}

async function uploadToSupabase(buffer, filename) {
  try {
    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(`imagens/${filename}`, buffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000"
      });
    if (error) return null;
    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(`imagens/${filename}`);
    return urlData?.publicUrl || null;
  } catch(_) {
    return null;
  }
}

export async function processAndSaveImage(sourceUrl, postId, startTime) {
  if (!sourceUrl || sourceUrl.length < 10) return null;
  try {
    const buffer = await downloadImage(sourceUrl);
    if (!buffer || buffer.length < 5000) return null;

    // Chama Vision só se há orçamento de tempo (< 5s decorridos desde início da request)
    const elapsed = startTime ? Date.now() - startTime : 0;
    let visionMetrics = null;
    if (elapsed < 5000) {
      visionMetrics = await analyzeImageVision(buffer);
    }

    // Rejeita: logo de concorrente, gráfico/tabela, ou ilustração/desenho
    if (visionMetrics?.has_competitor_logo === true) return null;
    if (visionMetrics?.is_chart_or_table === true) return null;
    if (visionMetrics?.is_illustration === true) return null;

    const processed = await processImage(buffer);
    if (!processed) return null;

    const filename = `${postId || Date.now()}.webp`;
    return await uploadToSupabase(processed, filename);
  } catch(_) {
    return null;
  }
}
