import crypto from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const W = 1440;
const H = 1800;
const SCALE = W / 1080;
const px = value => Math.round(value * SCALE);
const PHOTO_HEIGHT = px(960);
const BUCKET = "post-images";
const PREFIX = "instagram";
const OVERLAY_PATH = new URL("../public/assets/ig-overlay-ovc-canva.png", import.meta.url);
const HEADLINE_FONT_PATH = fileURLToPath(new URL("../public/assets/fonts/Inter-Variable.ttf", import.meta.url));
const HEADLINE_VERSION = "canva-headline-v8-editorial-fit-1440";
const HEADLINE_BOX = {
  y: px(705),
  width: px(780),
  maxLines: 4,
  maxFontSize: px(42),
  minFontSize: px(30)
};
const HIGHLIGHT_COLOR = "#f28c22";
const STOPWORDS = new Set([
  "A", "O", "AS", "OS", "UM", "UMA", "UNS", "UMAS",
  "DE", "DA", "DO", "DAS", "DOS", "E", "EM", "NO", "NA", "NOS", "NAS",
  "POR", "PARA", "COM", "SEM", "SOB", "SOBRE", "ENTRE", "APOS", "ATE",
  "AO", "AOS", "QUE", "SE", "SUA", "SEU", "SUAS", "SEUS", "PROPRIA",
  "PROPRIO", "EX", "EUA"
]);
const IMPACT_WORDS = new Map([
  ["MORTE", 80], ["MORTA", 80], ["MORTO", 80], ["MORRE", 80], ["ASSASSINATO", 78],
  ["CULPADA", 76], ["CULPADO", 76], ["CONDENADO", 74], ["CONDENADA", 74],
  ["CRIME", 72], ["FACADAS", 70], ["MATAR", 68], ["PRESO", 68], ["PRESA", 68],
  ["BILIONARIO", 66], ["MILIONARIO", 64], ["ALTA", 62], ["QUEDA", 62],
  ["RECUA", 62], ["AVANCA", 62], ["DOLAR", 62], ["JUROS", 62], ["LULA", 70],
  ["BOLSONARO", 70], ["TRUMP", 70], ["STF", 70], ["GOVERNO", 58]
]);

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
    else if ("IÍÌÎÏ!.,:;|".includes(ch)) units += 0.34;
    else if ("MWÁÀÂÃÄÓÒÔÕÖÚÙÛÜÇQ".includes(ch)) units += 0.88;
    else units += 0.64;
  }
  return units * fontSize;
}

function normalizeWord(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}

function chooseHighlightWord(title) {
  const words = String(title || "").match(/[\p{L}\p{N}]+/gu) || [];
  let best = null;
  words.forEach((word, index) => {
    const normalized = normalizeWord(word);
    if (!normalized || STOPWORDS.has(normalized) || normalized.length < 4) return;
    const score = (IMPACT_WORDS.get(normalized) || 0)
      + Math.min(normalized.length, 14)
      - index * 0.35;
    if (!best || score > best.score) best = { normalized, score };
  });
  return best?.normalized || null;
}

function renderLineMarkup(line, highlightWord, state, color = true) {
  const parts = String(line || "").split(/(\s+)/);
  return parts.map(part => {
    if (!part) return "";
    const token = normalizeWord(part);
    const highlight = !state.used && highlightWord && token === highlightWord;
    if (highlight) state.used = true;
    const foreground = color && highlight ? HIGHLIGHT_COLOR : color ? "#ffffff" : "#050505";
    return `<span foreground="${foreground}">${escapeXml(part)}</span>`;
  }).join("");
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

async function buildHeadlineLayers(title) {
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

  const highlightWord = chooseHighlightWord(normalized);
  const highlightState = { used: false };
  const markup = selected.lines
    .map(line => renderLineMarkup(line, highlightWord, highlightState, true))
    .join("\n");
  const textOptions = text => ({
    text: `<span weight="800">${text}</span>`,
    font: `Inter ${selected.fontSize}`,
    fontfile: HEADLINE_FONT_PATH,
    align: "center",
    rgba: true,
    dpi: 72,
    wrap: "none"
  });
  const foreground = await sharp({ text: textOptions(markup) }).png().toBuffer();
  const { width = HEADLINE_BOX.width } = await sharp(foreground).metadata();
  const left = Math.max(0, Math.round((W - width) / 2));
  return [
    { input: foreground, top: HEADLINE_BOX.y, left, blend: "over" }
  ];
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
  const photo = await sharp(source)
    .rotate()
    .resize(W, PHOTO_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
    .png()
    .toBuffer();
  const base = await sharp({
    create: { width: W, height: H, channels: 3, background: "#000000" }
  })
    .composite([{ input: photo, top: 0, left: 0 }])
    .png()
    .toBuffer();
  const overlay = await sharp(readFileSync(OVERLAY_PATH))
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();

  const layers = [
    { input: overlay, top: 0, left: 0 }
  ];
  const headlineLayers = await buildHeadlineLayers(title);
  if (headlineLayers) layers.push(...headlineLayers);

  return sharp(base)
    .composite(layers)
    .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
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
  return { url, path, version: HEADLINE_VERSION };
}
