import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import sharp from "sharp";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const LOGO_URL = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";
const W = 1080;
const H = 1350;

// Cor da tag por tema
function tagColor(tema) {
  const temas = {
    politica: "#c81e1e",
    crime: "#c81e1e",
    justica: "#c81e1e",
    corrupcao: "#c81e1e",
    economia: "#e85d00",
    financas: "#e85d00",
    mercado: "#e85d00",
    sociedade: "#ffc800",
    cultura: "#ffc800",
    saude: "#ffc800",
    educacao: "#ffc800",
  };
  const t = (tema || "").toLowerCase();
  for (const [key, color] of Object.entries(temas)) {
    if (t.includes(key)) return color;
  }
  return "#ffc800";
}

// Baixar imagem como buffer
async function downloadImage(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

// Buscar imagem alternativa via web se necessário
async function fetchImage(url, query) {
  let buf = url ? await downloadImage(url) : null;
  if (!buf && query) {
    // Tenta via Unsplash como fallback genérico
    const fallbackUrl = `https://source.unsplash.com/1080x1350/?${encodeURIComponent(query)}`;
    buf = await downloadImage(fallbackUrl);
  }
  return buf;
}

// Cortar faixa inferior que pode ter marca d'água (últimos 8% da imagem)
async function stripWatermark(buf) {
  const meta = await sharp(buf).metadata();
  const cropH = Math.floor(meta.height * 0.92);
  return sharp(buf).extract({ left: 0, top: 0, width: meta.width, height: cropH }).toBuffer();
}

// Quebrar texto em linhas para o canvas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateCard({ imageUrl, tagText, tagTema, resumo, searchQuery }) {
  // 1. Baixar e preparar imagem de fundo
  let imgBuf = await fetchImage(imageUrl, searchQuery);
  if (imgBuf) {
    imgBuf = await stripWatermark(imgBuf);
    imgBuf = await sharp(imgBuf)
      .resize(W, H, { fit: "cover", position: "center" })
      .toBuffer();
  }

  // 2. Criar canvas
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // 3. Fundo — imagem ou gradiente escuro
  if (imgBuf) {
    const bgImg = await loadImage(imgBuf);
    ctx.drawImage(bgImg, 0, 0, W, H);
    // Overlay escuro gradiente
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(0.45, "rgba(0,0,0,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0d1b2a");
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 4. Logo topo
  try {
    const logoBuf = await downloadImage(LOGO_URL);
    if (logoBuf) {
      const logo = await loadImage(logoBuf);
      const logoW = 180;
      const logoH = (logo.height / logo.width) * logoW;
      ctx.drawImage(logo, (W - logoW) / 2, 60, logoW, logoH);
    }
  } catch {}

  // 5. Tag colorida
  const color = tagColor(tagTema);
  const tagY = 520;
  const tagPadX = 40;
  const tagPadY = 22;
  ctx.font = "bold 52px sans-serif";
  const tagW = ctx.measureText(tagText.toUpperCase()).width + tagPadX * 2;
  const tagX = (W - tagW) / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, 80, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(tagText.toUpperCase(), W / 2, tagY + 55);

  // 6. Resumo bold caixa alta
  ctx.font = "bold 68px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  const resumoUpper = resumo.toUpperCase();
  const lines = wrapText(ctx, resumoUpper, W - 100);
  const lineH = 82;
  let resumoY = tagY + 130;
  for (const line of lines.slice(0, 4)) {
    ctx.fillText(line, 50, resumoY);
    resumoY += lineH;
  }

  // 7. Rodapé
  const footerY = H - 180;
  try {
    const logoBuf = await downloadImage(LOGO_URL);
    if (logoBuf) {
      const logo = await loadImage(logoBuf);
      const lW = 90;
      const lH = (logo.height / logo.width) * lW;
      ctx.drawImage(logo, (W - lW) / 2, footerY, lW, lH);
    }
  } catch {}

  ctx.font = "bold 30px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("O VALOR CAPITAL", W / 2, footerY + 105);

  ctx.font = "26px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Siga @ovalorcapital", W / 2, footerY + 140);
  ctx.fillText("Liberdade econômica, família & patrimônio", W / 2, footerY + 170);
  ctx.fillText("www.ovalorcapital.com.br", W / 2, footerY + 198);

  // 8. Exportar como JPEG buffer
  return canvas.toBuffer("image/jpeg", { quality: 92 });
}
