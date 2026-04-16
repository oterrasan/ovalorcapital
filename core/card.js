import sharp from "sharp";
import axios from "axios";

const W = 1080;
const H = 1350;
const LOGO_URL = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";

function tagColor(tema) {
  const t = (tema || "").toLowerCase();
  if (["politica","crime","justica","corrupcao"].some(k => t.includes(k))) return { fill: "rgb(200,30,30)", hex: "#c81e1e" };
  if (["economia","financas","mercado"].some(k => t.includes(k))) return { fill: "rgb(232,93,0)", hex: "#e85d00" };
  return { fill: "rgb(255,200,0)", hex: "#ffc800" };
}

function escapeXml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function wrapSvgText(text, maxChars, x, y, lineHeight, fontSize, fill, fontWeight) {
  const words = text.toUpperCase().split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (test.length > maxChars && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4).map((l, i) =>
    `<text x="${x}" y="${y + i * lineHeight}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" font-family="Arial, sans-serif" text-anchor="start">${escapeXml(l)}</text>`
  ).join("\n");
}

async function downloadBuffer(url) {
  try {
    const r = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    return Buffer.from(r.data);
  } catch { return null; }
}

async function searchImage(query) {
  // Unsplash source como fallback gratuito
  try {
    const url = `https://source.unsplash.com/1080x1350/?${encodeURIComponent(query)}`;
    const r = await axios.get(url, { responseType: "arraybuffer", timeout: 10000, maxRedirects: 5 });
    return Buffer.from(r.data);
  } catch { return null; }
}

export async function generateCard({ imageUrl, tagText, tagTema, resumo, searchQuery }) {
  const color = tagColor(tagTema);

  // 1. Obter imagem de fundo
  let imgBuf = imageUrl ? await downloadBuffer(imageUrl) : null;
  if (!imgBuf && searchQuery) imgBuf = await searchImage(searchQuery);

  // 2. Preparar fundo
  let bgBuf;
  if (imgBuf) {
    // Cortar faixa inferior (remove marca d'água)
    const meta = await sharp(imgBuf).metadata();
    const cropH = Math.floor((meta.height || H) * 0.92);
    bgBuf = await sharp(imgBuf)
      .extract({ left: 0, top: 0, width: meta.width || W, height: cropH })
      .resize(W, H, { fit: "cover", position: "center" })
      .toBuffer();
  } else {
    // Fundo gradiente escuro via SVG
    const svgBg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0d1b2a"/>
          <stop offset="100%" stop-color="#000000"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
    </svg>`;
    bgBuf = await sharp(Buffer.from(svgBg)).png().toBuffer();
  }

  // 3. Overlay escuro via SVG
  const overlaySvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
        <stop offset="45%" stop-color="rgba(0,0,0,0.35)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#ov)"/>
  </svg>`;
  const overlayBuf = await sharp(Buffer.from(overlaySvg)).png().toBuffer();

  // 4. Tag colorida + texto + rodapé via SVG
  const tagW = Math.min(900, Math.max(300, (tagText || "").length * 38 + 80));
  const tagX = (W - tagW) / 2;
  const tagY = 500;
  const tagTextColor = color.hex === "#ffc800" ? "#000000" : "#ffffff";

  const textSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${tagX}" y="${tagY}" width="${tagW}" height="88" rx="6" fill="${color.fill}"/>
    <text x="${W/2}" y="${tagY + 58}" font-size="52" font-weight="bold" fill="${tagTextColor}" font-family="Arial, sans-serif" text-anchor="middle">${escapeXml((tagText || "").toUpperCase())}</text>
    ${wrapSvgText(resumo || "", 22, 50, tagY + 140, 84, 68, "#ffffff", "bold")}
    <line x1="50" y1="${H - 240}" x2="${W - 50}" y2="${H - 240}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="${W/2}" y="${H - 190}" font-size="28" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="middle">O VALOR CAPITAL</text>
    <text x="${W/2}" y="${H - 150}" font-size="24" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" text-anchor="middle">Siga @ovalorcapital</text>
    <text x="${W/2}" y="${H - 115}" font-size="22" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" text-anchor="middle">Liberdade econômica, família &amp; patrimônio</text>
    <text x="${W/2}" y="${H - 82}" font-size="22" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" text-anchor="middle">www.ovalorcapital.com.br</text>
  </svg>`;
  const textBuf = await sharp(Buffer.from(textSvg)).png().toBuffer();

  // 5. Compor tudo
  let composite = await sharp(bgBuf)
    .composite([
      { input: overlayBuf, top: 0, left: 0 },
      { input: textBuf, top: 0, left: 0 }
    ]);

  // 6. Logo OVC no topo
  try {
    const logoBuf = await downloadBuffer(LOGO_URL);
    if (logoBuf) {
      const logoResized = await sharp(logoBuf).resize(160, null).toBuffer();
      const logoMeta = await sharp(logoResized).metadata();
      composite = sharp(await composite.toBuffer()).composite([
        { input: logoResized, top: 60, left: Math.floor((W - logoMeta.width) / 2) }
      ]);
    }
  } catch {}

  return composite.jpeg({ quality: 92 }).toBuffer();
}
