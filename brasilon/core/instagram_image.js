// Brasil ON — composição da imagem do Instagram.
//
// Spec fechada por Roberto em 03/09/2026 (ele mesmo, literal, depois de
// rejeitar a ideia de "layout"/arte elaborada tipo OVC):
//   "ESQUECE LAYOUT. Vamos usar a imagem CRUA que está publicada no site.
//    e só colocar o ícone do Brasil ON no centro da imagem como marca
//    d'água e no rodapé [...] nao tem nada de arte. é a imagem inteira
//    ocupando todo o card. o icone do brasil ON abaixo do titulo da
//    manchete. manchete dentro de uma moldura amarela e fonte preta.
//    acabeou. é isso"
//
// Ou seja, ao contrário do OVC (core/instagram_image.js na raiz — banda de
// foto + overlay de marca elaborado + destaque de palavra de impacto):
//   1. Foto ORIGINAL do post (a mesma já publicada em obrasilon.com.br),
//      cover fit, preenchendo o card INTEIRO — sem banda preta, sem base.
//   2. Manchete dentro de uma caixa AMARELA sólida (moldura), texto preto
//      em negrito.
//   3. Ícone do Brasil ON (círculo) centralizado, logo ABAIXO da caixa.
//
// Zero import cruzado com core/ da raiz do OVC (Regra do monorepo —
// brasilon é um deploy Vercel 100% independente, ver brasilon/CLAUDE.md).
// Texto renderizado via sharp+Pango com fonte embutida no próprio repo
// (mesmo padrão comprovado em core/instagram_image.js da raiz — nunca usar
// <text> de SVG puro pra texto, depende de fonte instalada no SO e já
// causou fragilidade documentada nesse projeto).
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const W = 1080;
const H = 1350; // 4:5 — máximo portrait aceito pelo feed do Instagram
const ICON_PATH = fileURLToPath(new URL("../public/assets/icone-brasil-on.svg", import.meta.url));
const HEADLINE_FONT_PATH = fileURLToPath(new URL("../public/assets/fonts/Inter-Variable.ttf", import.meta.url));
const COMPOSITION_VERSION = "bon-raw-yellow-box-v1";

const YELLOW = "#e6c23c"; // mesmo amarelo do anel do ícone — identidade única
const BOX = {
  width: Math.round(W * 0.88),
  paddingX: 40,
  paddingY: 34,
  radius: 22,
  maxLines: 4,
  maxFontSize: 54,
  minFontSize: 34,
  lineGap: 1.16, // multiplicador do fontSize pra altura de linha
  bottomAnchor: Math.round(H * 0.86) // base da caixa fica perto de 86% da altura
};
const ICON_SIZE = 118;
const ICON_GAP = 22; // espaço entre a base da caixa amarela e o topo do ícone

function estimateTextWidth(text, fontSize) {
  // Heurística já calibrada pro projeto (mesma usada em core/instagram_image.js
  // da raiz) pra texto em maiúsculas/PT-BR sem depender de medição real de fonte.
  let units = 0;
  for (const ch of String(text || "")) {
    if (ch === " ") units += 0.28;
    else if ("IÍÌÎÏ!.,:;|".includes(ch)) units += 0.34;
    else if ("MWÁÀÂÃÄÓÒÔÕÖÚÙÛÜÇQ".includes(ch)) units += 0.88;
    else units += 0.64;
  }
  return units * fontSize;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function fitHeadline(title) {
  const normalized = String(title || "").replace(/\s+/g, " ").trim().toUpperCase();
  const innerWidth = BOX.width - BOX.paddingX * 2;
  for (let fontSize = BOX.maxFontSize; fontSize >= BOX.minFontSize; fontSize -= 2) {
    const lines = wrapHeadline(normalized, fontSize, innerWidth, BOX.maxLines);
    const fits = lines.every(line => estimateTextWidth(line, fontSize) <= innerWidth);
    if (fits) return { fontSize, lines };
  }
  return { fontSize: BOX.minFontSize, lines: wrapHeadline(normalized, BOX.minFontSize, innerWidth, BOX.maxLines) };
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

// Constrói a caixa amarela (retângulo puro, sem texto — nenhuma
// dependência de fonte aqui, só cor/forma via SVG) já dimensionada pra
// caber as N linhas da manchete.
async function buildYellowBox(lineCount, fontSize) {
  const lineHeight = Math.round(fontSize * BOX.lineGap);
  const height = BOX.paddingY * 2 + lineHeight * lineCount;
  const svg = `<svg width="${BOX.width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${BOX.width}" height="${height}" rx="${BOX.radius}" ry="${BOX.radius}" fill="${YELLOW}"/>` +
    `</svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return { buffer, width: BOX.width, height, lineHeight };
}

// Texto preto em negrito, centralizado, renderizado como PNG transparente
// via Pango (sharp) com a fonte embutida no próprio repo — mesma técnica
// já comprovada em core/instagram_image.js da raiz.
async function buildHeadlineText(lines, fontSize) {
  const markup = lines.map(line => `<span foreground="#000000">${escapeXml(line)}</span>`).join("\n");
  const buffer = await sharp({
    text: {
      text: `<span weight="800">${markup}</span>`,
      font: `Inter ${fontSize}`,
      fontfile: HEADLINE_FONT_PATH,
      align: "center",
      rgba: true,
      dpi: 72,
      wrap: "none"
    }
  }).png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width || 0, height: meta.height || 0 };
}

async function buildIcon() {
  const svg = readFileSync(ICON_PATH);
  return sharp(svg).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();
}

export async function buildInstagramImageBuffer(sourceUrl, { title } = {}) {
  const source = await downloadImage(sourceUrl);

  // 1. Foto crua, cover fit, preenchendo o card INTEIRO (sem banda/base).
  const photo = sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: sharp.strategy.attention });

  // 2. Manchete: escolhe o maior fontSize que cabe em até 4 linhas.
  const { fontSize, lines } = fitHeadline(title);
  const box = await buildYellowBox(lines.length, fontSize);
  const text = await buildHeadlineText(lines, fontSize);
  const icon = await buildIcon();

  const boxTop = Math.max(0, BOX.bottomAnchor - box.height);
  const boxLeft = Math.round((W - box.width) / 2);
  const textTop = boxTop + Math.round((box.height - text.height) / 2);
  const textLeft = Math.round((W - text.width) / 2);
  const iconTop = boxTop + box.height + ICON_GAP;
  const iconLeft = Math.round((W - ICON_SIZE) / 2);

  return photo
    .composite([
      { input: box.buffer, top: boxTop, left: boxLeft },
      { input: text.buffer, top: textTop, left: textLeft },
      { input: icon, top: iconTop, left: iconLeft }
    ])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

const BUCKET = "post-images";
const PREFIX = "instagram-brasilon";

export async function prepareInstagramImage({ sourceUrl, postId, supabase, title }) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) throw new Error("instagram_source_image_invalid");
  if (!postId) throw new Error("instagram_post_id_missing");

  const buffer = await buildInstagramImageBuffer(sourceUrl, { title });
  const path = `${PREFIX}/${postId}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true
  });
  if (error) throw new Error("instagram_image_upload_failed: " + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error("instagram_image_public_url_missing");
  return { url, path, version: COMPOSITION_VERSION };
}
