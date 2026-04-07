import { createCanvas, loadImage } from "canvas";
import fs from "fs";

export async function generateCard(imageUrl, title) {
  const img = await loadImage(imageUrl);
  const canvas = createCanvas(1080, 1350);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0, 1080, 1350);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 900, 1080, 450);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 60px Arial";
  ctx.fillText(title.slice(0, 50), 50, 1100);

  const path = `/tmp/card-${Date.now()}.jpg`;
  fs.writeFileSync(path, canvas.toBuffer());

  return path;
}
