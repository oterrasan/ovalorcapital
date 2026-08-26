import crypto from "crypto";
import { readFileSync } from "fs";
import sharp from "sharp";

const W = 1080;
const H = 1350;
const BUCKET = "post-images";
const PREFIX = "instagram";
const OVERLAY_PATH = new URL("../public/assets/ig-overlay-ovc-canva.png", import.meta.url);

async function downloadImage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let referer;
    try { referer = new URL(url).origin + "/"; } catch (_) {}
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/avif,image/webp,image/jpeg,image/png,image/*",
        ...(referer ? { "Referer": referer } : {})
      }
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`download_image_http_${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image")) throw new Error("download_not_image");
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export async function buildInstagramImageBuffer(sourceUrl) {
  const source = await downloadImage(sourceUrl);
  const base = await sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const overlay = await sharp(readFileSync(OVERLAY_PATH))
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export async function prepareInstagramImage({ sourceUrl, postId, supabase }) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) throw new Error("instagram_source_image_invalid");
  if (!postId) throw new Error("instagram_post_id_missing");

  const buffer = await buildInstagramImageBuffer(sourceUrl);
  const hash = crypto.createHash("sha1").update(String(sourceUrl)).digest("hex").slice(0, 10);
  const path = `${PREFIX}/${postId}-${hash}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true
  });
  if (error) throw new Error("instagram_image_upload_failed: " + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error("instagram_image_public_url_missing");
  return { url, path };
}
