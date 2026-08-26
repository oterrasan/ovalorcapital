import crypto from "crypto";
import { readFileSync } from "fs";
import sharp from "sharp";

const W = 1080;
const H = 1350;
const BUCKET = "post-images";
const PREFIX = "instagram";
const OVERLAY_PATH = new URL("../public/assets/ig-overlay-ovc-canva.png", import.meta.url);
const HEADLINE_VERSION = "canva-headline-v2";
const HEADLINE_BOX = {
  x: 80,
  y: 700,
  width: 920,
  maxLines: 4,
  maxFontSize: 62,
  minFontSize: 44,
  lineHeight: 1.1
};

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function estimateTextWidth(text, fontSize) {
  let units = 0;
  for (const ch of String(text || "")) {
    if (ch === " ") units += 0.28;
    else if ("IÍÌÎÏ!.,:;|".includes(ch)) units += 0.32;
    else if ("MWÁÀÂÃÄÓÒÔÕÖÚÙÛÜÇQ".includes(ch)) units += 0.82;
    else units += 0.58;
  }
  return units * fontSize;
}

function truncateLine(line, fontSize, maxWidth) {
  let value = String(line || "").trim();
  while (value.length > 1 && estimateTextWidth(value + "…", fontSize) > maxWidth) {
    value = value.replace(/\s+\S*$/, "").trim() || value.slice(0, -1).trim();
  }
  return value ? value + "…" : "";
}

function wrapHeadline(text, fontSize, maxWidth, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = truncateLine(
    [clipped[maxLines - 1], ...lines.slice(maxLines)].join(" "),
    fontSize,
    maxWidth
  );
  return clipped;
}

function buildHeadlineSvg(title) {
  const normalized = String(title || "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!normalized) return null;

  let selected = null;
  for (let fontSize = HEADLINE_BOX.maxFontSize; fontSize >= HEADLINE_BOX.minFontSize; fontSize -= 2) {
    const lines = wrapHeadline(normalized, fontSize, HEADLINE_BOX.width, HEADLINE_BOX.maxLines);
    const fits = lines.length <= HEADLINE_BOX.maxLines && lines.every(line => estimateTextWidth(line, fontSize) <= HEADLINE_BOX.width);
    if (fits) {
      selected = { fontSize, lines };
      break;
    }
  }

  if (!selected) {
    selected = {
      fontSize: HEADLINE_BOX.minFontSize,
      lines: wrapHeadline(normalized, HEADLINE_BOX.minFontSize, HEADLINE_BOX.width, HEADLINE_BOX.maxLines)
    };
  }

  const lineHeight = Math.round(selected.fontSize * HEADLINE_BOX.lineHeight);
  const firstY = HEADLINE_BOX.y + selected.fontSize;
  const tspans = selected.lines
    .map((line, index) => `<tspan x="${W / 2}" y="${firstY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="headlineShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <text x="${W / 2}" text-anchor="middle"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="${selected.fontSize}" font-weight="800"
        letter-spacing="0" fill="#ffffff"
        stroke="#050505" stroke-opacity="0.42" stroke-width="3"
        paint-order="stroke fill" filter="url(#headlineShadow)">${tspans}</text>
</svg>`);
}

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

export async function buildInstagramImageBuffer(sourceUrl, { title } = {}) {
  const source = await downloadImage(sourceUrl);
  const base = await sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  const overlay = await sharp(readFileSync(OVERLAY_PATH))
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();

  const layers = [{ input: overlay, top: 0, left: 0 }];
  const headline = buildHeadlineSvg(title);
  if (headline) layers.push({ input: headline, top: 0, left: 0 });

  return sharp(base)
    .composite(layers)
    .jpeg({ quality: 98, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

export async function prepareInstagramImage({ sourceUrl, postId, supabase, title }) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) throw new Error("instagram_source_image_invalid");
  if (!postId) throw new Error("instagram_post_id_missing");

  const buffer = await buildInstagramImageBuffer(sourceUrl, { title });
  const hash = crypto.createHash("sha1")
    .update([HEADLINE_VERSION, sourceUrl, title || ""].join("\n"))
    .digest("hex")
    .slice(0, 10);
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
