import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1920;
const TEXT_RENDER_SCALE = 2;
const END_SCAN_SECONDS = 8;
const END_SCAN_FPS = 4;
const END_SCAN_WIDTH = 96;
const END_SCAN_HEIGHT = 170;
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return cleanText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function removeRepeatedTitle(body, title) {
  const cleanBody = cleanText(body);
  const cleanTitle = cleanText(title);
  if (!cleanBody || !cleanTitle) return cleanBody;
  const prefix = cleanBody.slice(0, cleanTitle.length + 12);
  if (normalize(prefix).startsWith(normalize(cleanTitle))) {
    return cleanBody.slice(cleanTitle.length).replace(/^[\s:;,.!\-–—]+/, "").trim();
  }
  return cleanBody;
}

function excerpt(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, Math.max(lastSpace, maxLength - 20)).trim()}...`;
}

function wrapText(value, maxChars, maxLines) {
  const words = cleanText(value).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ").length;
  if (consumed < cleanText(value).length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]?$/, "...");
  }
  return lines;
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function textSvg(title, body) {
  const titleLines = wrapText(excerpt(title, 110).toUpperCase(), 30, 3);
  const bodyText = excerpt(removeRepeatedTitle(body, title), 210).toUpperCase();
  const bodyLines = wrapText(bodyText, 34, 4);
  const titleSize = titleLines.length > 2 ? 43 : 47;
  const bodySize = bodyLines.length > 3 ? 35 : 39;
  const titleLeading = Math.round(titleSize * 1.18);
  const bodyLeading = Math.round(bodySize * 1.25);
  const totalHeight = titleLines.length * titleLeading + (bodyLines.length ? 30 + bodyLines.length * bodyLeading : 0);
  const startY = Math.max(1010, 1280 - totalHeight);
  const titleSpans = titleLines.map((line, index) => `<tspan x="110" dy="${index ? titleLeading : 0}">${escapeXml(line)}</tspan>`).join("");
  const bodyY = startY + Math.max(0, titleLines.length - 1) * titleLeading + 78;
  const bodySpans = bodyLines.map((line, index) => `<tspan x="110" dy="${index ? bodyLeading : 0}">${escapeXml(line)}</tspan>`).join("");

  return Buffer.from(`
    <svg width="${WIDTH * TEXT_RENDER_SCALE}" height="${HEIGHT * TEXT_RENDER_SCALE}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .headline { font-family: Inter, Arial, sans-serif; font-size: ${titleSize}px; font-weight: 750; letter-spacing: 0; }
        .summary { font-family: Inter, Arial, sans-serif; font-size: ${bodySize}px; font-weight: 650; letter-spacing: 0; }
      </style>
      <text class="headline" x="110" y="${startY}" fill="#f4c20d">${titleSpans}</text>
      ${bodyLines.length ? `<text class="summary" x="110" y="${bodyY}" fill="#ffffff">${bodySpans}</text>` : ""}
    </svg>`);
}

async function buildOverlay(job, outputPath) {
  const feedOverlay = resolve(root, "public", "assets", "ig-overlay-ovc-canva.png");
  const reelFooter = resolve(root, "public", "assets", "ig-footer-ovc-reels-canva.png");
  // As marcas são extraídas como blocos estáticos, sem redimensionamento.
  // Isso preserva proporção, tipografia e pixels do overlay oficial do feed.
  const topBrand = await sharp(feedOverlay).extract({ left: 350, top: 25, width: 380, height: 205 }).png().toBuffer();
  const gradient = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#071929" stop-opacity="0"/>
          <stop offset="34%" stop-color="#071929" stop-opacity="0"/>
          <stop offset="45%" stop-color="#061725" stop-opacity="0.18"/>
          <stop offset="54%" stop-color="#041522" stop-opacity="0.7"/>
          <stop offset="62%" stop-color="#020b13" stop-opacity="0.97"/>
          <stop offset="67%" stop-color="#000000" stop-opacity="1"/>
          <stop offset="80%" stop-color="#000000" stop-opacity="1"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/>
    </svg>`);

  const crispText = await sharp(textSvg(job.title, job.body))
    .resize(WIDTH, HEIGHT, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: gradient, left: 0, top: 0 },
      { input: crispText, left: 0, top: 0 },
      { input: topBrand, left: 350, top: 25 },
      { input: reelFooter, left: 350, top: 1490 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

function clampCrop(value, fallback, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, parsed)) : fallback;
}

function runCapture(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolvePromise({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr).toString("utf8") });
      reject(new Error(`${command}_exit_${code}: ${Buffer.concat(stderr).toString("utf8").slice(-500)}`));
    });
  });
}

function meanAbsoluteDifference(current, previous) {
  let sum = 0;
  for (let i = 0; i < current.length; i += 1) sum += Math.abs(current[i] - previous[i]);
  return sum / current.length;
}

function frameStats(frame) {
  let black = 0;
  let sum = 0;
  let sumSquares = 0;
  for (const value of frame) {
    if (value < 30) black += 1;
    sum += value;
    sumSquares += value * value;
  }
  const mean = sum / frame.length;
  return {
    blackRatio: black / frame.length,
    mean,
    deviation: Math.sqrt(Math.max(0, (sumSquares / frame.length) - (mean * mean)))
  };
}

async function detectEndTrim(job, inputPath) {
  const explicitTrim = Number(job.trim_end_seconds);
  if (Number.isFinite(explicitTrim) && explicitTrim >= 0) {
    return { trimSeconds: Math.min(explicitTrim, 10), reason: explicitTrim ? "manual" : "manual_disabled" };
  }
  if (job.auto_trim_end === false) return { trimSeconds: 0, reason: "automatic_disabled" };

  const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
  const probe = await runCapture(ffprobe, [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", inputPath
  ]);
  const duration = Number(probe.stdout.toString("utf8").trim());
  if (!Number.isFinite(duration) || duration < 5) return { trimSeconds: 0, duration, reason: "video_too_short" };

  const scanDuration = Math.min(END_SCAN_SECONDS, duration);
  const scanStart = Math.max(0, duration - scanDuration);
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  const sampled = await runCapture(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-ss", scanStart.toFixed(3), "-i", inputPath,
    "-an", "-vf", `fps=${END_SCAN_FPS},scale=${END_SCAN_WIDTH}:${END_SCAN_HEIGHT}:force_original_aspect_ratio=decrease,pad=${END_SCAN_WIDTH}:${END_SCAN_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,format=gray`,
    "-f", "rawvideo", "pipe:1"
  ]);
  const frameSize = END_SCAN_WIDTH * END_SCAN_HEIGHT;
  const frameCount = Math.floor(sampled.stdout.length / frameSize);
  if (frameCount < END_SCAN_FPS) return { trimSeconds: 0, duration, reason: "insufficient_samples" };

  const frames = [];
  for (let index = 0; index < frameCount; index += 1) {
    const frame = sampled.stdout.subarray(index * frameSize, (index + 1) * frameSize);
    frames.push({ ...frameStats(frame), motion: index ? meanAbsoluteDifference(frame, sampled.stdout.subarray((index - 1) * frameSize, index * frameSize)) : 0 });
  }

  const minimumStableFrames = Math.max(3, Math.round(END_SCAN_FPS * 0.75));
  let detectedIndex = -1;
  for (let index = 1; index <= frames.length - minimumStableFrames; index += 1) {
    const suffix = frames.slice(index, index + minimumStableFrames);
    const averageMotion = suffix.slice(1).reduce((sum, frame) => sum + frame.motion, 0) / Math.max(1, suffix.length - 1);
    const averageBlack = suffix.reduce((sum, frame) => sum + frame.blackRatio, 0) / suffix.length;
    const abruptTransition = frames[index].motion >= 10;
    const looksLikeEndCard = averageBlack >= 0.58 || averageMotion <= 1.8;
    if (abruptTransition && looksLikeEndCard) {
      detectedIndex = index;
      break;
    }
  }

  if (detectedIndex < 0) return { trimSeconds: 0, duration, reason: "no_promotional_end_card" };
  const detectedAt = scanStart + (detectedIndex / END_SCAN_FPS);
  // End cards costumam ser precedidos por 3-4 s de chamada/contagem da
  // própria fonte. O avanço cobre também essa abertura promocional.
  const leadSeconds = clampCrop(job.auto_trim_lead_seconds, 4.25, 5);
  const cutAt = Math.max(2, detectedAt - leadSeconds);
  const trimSeconds = Math.min(10, Math.max(0, duration - cutAt));
  return { trimSeconds, duration, detectedAt, cutAt, reason: "promotional_end_card" };
}

async function runFfmpeg(job, inputPath, overlayPath, outputPath) {
  // Recorte de segurança para vídeos vindos de terceiros: elimina marcas
  // persistentes nas bordas antes de aplicar o layout. A área inferior ainda
  // recebe o gradiente opaco do OVC, que cobre legendas externas remanescentes.
  const cropTop = clampCrop(job.watermark_crop_top, 0.16, 0.25);
  const cropBottom = clampCrop(job.watermark_crop_bottom, 0.02, 0.15);
  const cropSide = clampCrop(job.watermark_crop_side, 0.04, 0.15);
  const cropWidth = 1 - cropSide * 2;
  const cropHeight = 1 - cropTop - cropBottom;
  const cropFilter = `crop=trunc(iw*${cropWidth}/2)*2:trunc(ih*${cropHeight}/2)*2:trunc(iw*${cropSide}/2)*2:trunc(ih*${cropTop}/2)*2`;
  const endTrim = await detectEndTrim(job, inputPath);
  const outputDuration = endTrim.duration && endTrim.trimSeconds > 0
    ? Math.max(2, endTrim.duration - endTrim.trimSeconds)
    : null;
  const args = [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-i", inputPath,
    "-loop", "1", "-i", overlayPath,
    "-filter_complex",
    `[0:v]${cropFilter},scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1,fps=30[video];[video][1:v]overlay=0:0:shortest=1:format=auto[out]`,
    "-map", "[out]", "-map", "0:a?",
    ...(outputDuration ? ["-t", outputDuration.toFixed(3)] : []),
    "-c:v", "libx264", "-preset", "medium", "-crf", "16",
    "-maxrate", "8M", "-bufsize", "16M",
    "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
    "-movflags", "+faststart", "-shortest", outputPath
  ];
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || "ffmpeg", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolvePromise(endTrim) : reject(new Error(`ffmpeg_exit_${code}`)));
  });
}

const [jobPath, inputPath, outputPath, overlayPathArg] = process.argv.slice(2);
if (!jobPath || !inputPath || !outputPath) {
  throw new Error("uso: node scripts/render-instagram-reel.mjs job.json input-video output.mp4 [overlay.png]");
}
const payload = JSON.parse(await readFile(jobPath, "utf8"));
const job = payload.job || payload;
if (!job?.title || !job?.source_url) throw new Error("job_invalido");
const overlayPath = overlayPathArg || `${outputPath}.overlay.png`;
await buildOverlay(job, overlayPath);
let endTrim = null;
if (process.env.REEL_OVERLAY_ONLY !== "1") {
  endTrim = await runFfmpeg(job, inputPath, overlayPath, outputPath);
}
console.log(JSON.stringify({ ok: true, output: process.env.REEL_OVERLAY_ONLY === "1" ? null : outputPath, overlay: overlayPath, template_version: job.template_version, end_trim: endTrim }));
