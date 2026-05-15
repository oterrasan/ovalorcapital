// image_processor.js — Baixa imagem da fonte, recorta, espelha e salva no Supabase Storage
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Recorte: remove bordas com logos e marcas d'água
const CROP_TOP_PCT    = 0.08;
const CROP_BOTTOM_PCT = 0.13;
const CROP_LEFT_PCT   = 0.02;
const CROP_RIGHT_PCT  = 0.02;

// Dimensão final: 1200x675 (16:9)
const OUT_WIDTH  = 1200;
const OUT_HEIGHT = 675;

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

    // Recortar, espelhar horizontalmente, redimensionar para 1200x675 e salvar como WebP
    const processed = await sharp(buffer)
      .extract({ left: cropLeft, top: cropTop, width: extractWidth, height: extractHeight })
      .flop()
      .resize(OUT_WIDTH, OUT_HEIGHT, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();

    return processed;
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

export async function processAndSaveImage(sourceUrl, postId) {
  if (!sourceUrl || sourceUrl.length < 10) return null;

  try {
    const buffer = await downloadImage(sourceUrl);
    if (!buffer || buffer.length < 5000) return null;

    const processed = await processImage(buffer);
    if (!processed) return null;

    const filename = `${postId || Date.now()}.webp`;
    const publicUrl = await uploadToSupabase(processed, filename);

    return publicUrl;
  } catch(_) {
    return null;
  }
}
