import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1920;
const END_SCAN_SECONDS = 8;
const END_SCAN_FPS = 4;
const END_SCAN_WIDTH = 96;
const END_SCAN_HEIGHT = 170;
// 20/09/2026 — causa raiz real confirmada via teste de produção: o Graph
// API do Instagram só aceita Reels de até 90s (o app nativo aceita mais,
// a API não — https://developers.facebook.com/docs/instagram-platform/
// content-publishing/resumable-uploads/). Sem esse teto, um vídeo-fonte
// mais longo (ex: 9min, caso real testado) renderizava inteiro — 11min
// de ffmpeg — e só falhava no upload final pra Meta com HTTP 400,
// desperdiçando o ciclo inteiro do job (20min de timeout). 2s de margem
// de segurança sobre o teto documentado de 90s.
const REELS_MAX_DURATION_SECONDS = 88;
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

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 25/09/2026 — Roberto: "tem duas frases indo em todos eles no template e
// elas param com '...' isso nao faz o menor sentido... a chamada deve
// seguir o padrao das materias, o sistema deve criar uma chamada real,
// chamativa, que chame atencao, mas que seja real a manchete original que
// raspamos em fontes branca e uma ou duas palavras de outra cor. igual aos
// posts do feed". Causa raiz real: título E corpo eram truncados de forma
// INDEPENDENTE (excerpt() por caractere + wrapText() por contagem de
// linha) — mesmo sendo texto real (job.title/job.body vêm do título/corpo
// real da matéria, api/manage.js ~linha 1625), praticamente todo reel
// acabava com os DOIS blocos terminando em "...", o que lia como template
// fixo. Fix: um ÚNICO bloco — a manchete real, sem resumo separado —
// quebra de linha por LARGURA estimada (só trunca de verdade como último
// recurso, nunca por contagem fixa de caracteres) + 1 palavra de destaque
// em cor diferente sobre fundo branco, mesma lógica de
// core/instagram_image.js (chooseHighlightWord/IMPACT_WORDS/STOPWORDS) —
// duplicada aqui de propósito: script standalone do GitHub Actions, sem
// import de core/ pra não acoplar os dois pipelines de render (mesmo
// padrão de duplicação deliberada já usado em core/brasilonMirror.js).
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

function normalizeWord(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
}

function chooseHighlightWord(title) {
  const words = String(title || "").match(/[\p{L}\p{N}]+/gu) || [];
  let best = null;
  words.forEach((word, index) => {
    const normalized = normalizeWord(word);
    if (!normalized || STOPWORDS.has(normalized) || normalized.length < 4) return;
    const score = (IMPACT_WORDS.get(normalized) || 0) + Math.min(normalized.length, 14) - index * 0.35;
    if (!best || score > best.score) best = { normalized, score };
  });
  return best?.normalized || null;
}

// 25/09/2026 — Roberto: "TODA A FORMATACAO DE FONTES, CORES, PADRAO DE
// ESCRITA TEM QUE SER FIEL E IDENTICO... OS REELS DEVEM RESPEITAR O QUE
// EXISTE DE PADRAO NAS CHAMADAS DOS POSTS DE FEED". Bug real confirmado
// antes desta troca: a versão anterior montava a manchete em SVG com cada
// palavra e cada ESPAÇO num <tspan> separado — o librsvg (sharp) descarta
// o <tspan> que só tem espaço, então TODA manchete saía com as palavras
// coladas ("POLÍCIAPRENDESUSPEITO..."). Agora a manchete é renderizada
// EXATAMENTE como core/instagram_image.js (buildHeadlineLayers) faz no
// feed: Pango markup do sharp, fonte Inter empacotada no repo (peso 800),
// centralizada, mesma largura/tamanhos/nº de linhas (na escala de 1080px
// de largura, que é a largura do Reel), mesma cor de destaque. Funções
// duplicadas de propósito (script standalone do GitHub Actions, sem import
// de core/). Se o feed mudar, atualizar aqui junto.
const HEADLINE_FONT_PATH = resolve(root, "public", "assets", "fonts", "Inter-Variable.ttf");
const HEADLINE_BOX = {
  width: 780,
  maxLines: 4,
  maxFontSize: 42,
  minFontSize: 30
};
// Faixa vertical onde a manchete fica no Reel (entre o vídeo e o rodapé
// da marca, que começa em y=1490). O bloco é ancorado pelo fim.
const HEADLINE_BOTTOM_Y = 1300;
const HEADLINE_MIN_TOP_Y = 1000;

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

function renderLineMarkup(line, highlightWord, state) {
  const parts = String(line || "").split(/(\s+)/);
  return parts.map(part => {
    if (!part) return "";
    // Espaço fica FORA de qualquer <span> — garante que nunca some.
    if (/^\s+$/.test(part)) return " ";
    const token = normalizeWord(part);
    const highlight = !state.used && highlightWord && token === highlightWord;
    if (highlight) state.used = true;
    return `<span foreground="${highlight ? HIGHLIGHT_COLOR : "#ffffff"}">${escapeXml(part)}</span>`;
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

async function buildHeadlineLayer(title) {
  const normalized = cleanText(title).replace(/\s+/g, " ").trim().toUpperCase();
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
    .map(line => renderLineMarkup(line, highlightWord, highlightState))
    .join("\n");
  const buffer = await sharp({
    text: {
      text: `<span weight="800">${markup}</span>`,
      font: `Inter ${selected.fontSize}`,
      fontfile: HEADLINE_FONT_PATH,
      align: "center",
      rgba: true,
      dpi: 72,
      wrap: "none"
    }
  }).png().toBuffer();
  const { width = HEADLINE_BOX.width, height = 0 } = await sharp(buffer).metadata();
  const left = Math.max(0, Math.round((WIDTH - width) / 2));
  const top = Math.max(HEADLINE_MIN_TOP_Y, HEADLINE_BOTTOM_Y - height);
  return { input: buffer, left, top };
}

// Cor da sombra em função da opacidade — mantém a mesma progressão visual
// (navy escuro -> preto puro) usada desde a versão original do template,
// tanto pra vídeo vertical (cover, faixas fixas) quanto horizontal
// (contain, faixas calculadas dinamicamente a partir de onde o vídeo termina).
function colorForOpacity(opacity) {
  if (opacity <= 0) return "#071929";
  if (opacity < 0.3) return "#061725";
  if (opacity < 0.8) return "#041522";
  if (opacity < 0.99) return "#020b13";
  return "#000000";
}

// Vídeo VERTICAL (fitMode "cover", o caso original e mais comum): sombra
// em faixas fixas, idênticas à versão anterior do template — o vídeo
// sempre preenche o quadro 1080x1920 inteiro, então a posição da sombra
// nunca varia.
const COVER_FADE_STOPS = [[0, 0], [34, 0], [45, 0.18], [54, 0.7], [62, 0.97], [67, 1], [80, 1], [100, 1]];

// Curva "smootherstep" (Ken Perlin) — ainda mais suave nas duas pontas que
// um ease-in-out comum. Importante aqui: perto do vídeo (o ponto mais
// sensível, onde um começo abrupto lê como "corte") a subida é quase
// imperceptível no início, só ganhando força no meio do trecho.
function smootherstep(t) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

// Vídeo HORIZONTAL/QUADRADO (fitMode "contain", encaixado no topo sem
// recorte — Roberto, 18/09/2026): a sombra precisa subir até onde o
// vídeo de fato termina, não ficar presa nos 34% fixos pensados pra
// vídeo vertical. boundaryPct = % da altura total onde o vídeo acaba.
//
// CORRIGIDO 18/09/2026 (Roberto: "a passagem do sombreado para o vídeo
// não existe e fica horrível") — 2 rodadas:
// 1ª: a versão original começava a escurecer em boundaryPct-6 (ANTES do
//     fim real do vídeo) numa rampa de só 11% de altura — corrigido pra
//     começar exatamente na borda real, span de 14%. Verificado pixel a
//     pixel (sem JPEG) que a rampa de alpha É matematicamente suave.
// 2ª: mesmo assim, no vídeo real (comprimido em H.264, footage já escura
//     em vários pontos) a transição de 14% ainda lia como corte a olho nu
//     — perto do preto, o olho humano precisa de uma faixa bem mais larga
//     e de uma curva ainda mais gradual nas pontas pra perceber degradê
//     em vez de corte. Span subiu pra 20% (mais amostras, 12 em vez de 8)
//     e a curva trocou de smoothstep pra smootherstep.
function buildContainFadeStops(videoOutHeightPx) {
  const boundaryPct = Math.min(66, Math.max(8, (videoOutHeightPx / HEIGHT) * 100));
  const spanPct = 20;
  const samples = 12;
  const stops = [[0, 0], [boundaryPct, 0]];
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples;
    stops.push([boundaryPct + spanPct * t, smootherstep(t)]);
  }
  stops.push([Math.min(97, boundaryPct + spanPct + 12), 1]);
  stops.push([100, 1]);
  for (let i = 1; i < stops.length; i += 1) {
    if (stops[i][0] <= stops[i - 1][0]) stops[i][0] = stops[i - 1][0] + 0.2;
  }
  return stops;
}

function buildGradientSvg(stops) {
  const stopEls = stops
    .map(([offset, opacity]) => `<stop offset="${offset}%" stop-color="${colorForOpacity(opacity)}" stop-opacity="${opacity}"/>`)
    .join("\n          ");
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          ${stopEls}
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)"/>
    </svg>`);
}

async function buildOverlay(job, outputPath, fitMode = "cover", videoOutHeightPx = HEIGHT) {
  const feedOverlay = resolve(root, "public", "assets", "ig-overlay-ovc-canva.png");
  const reelFooter = resolve(root, "public", "assets", "ig-footer-ovc-reels-canva.png");
  // As marcas são extraídas como blocos estáticos, sem redimensionamento.
  // Isso preserva proporção, tipografia e pixels do overlay oficial do feed.
  const topBrand = await sharp(feedOverlay).extract({ left: 350, top: 25, width: 380, height: 205 }).png().toBuffer();
  const gradient = buildGradientSvg(fitMode === "contain" ? buildContainFadeStops(videoOutHeightPx) : COVER_FADE_STOPS);

  const headline = await buildHeadlineLayer(job.title);

  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: gradient, left: 0, top: 0 },
      ...(headline ? [headline] : []),
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

// Recorte de segurança pra marca d'água/logo de outras emissoras — usado
// tanto no vídeo vertical (cover) quanto no horizontal/quadrado (contain).
// 20/09/2026 — Roberto: "o Recorte de outras marcas e propagandas precisa
// estar perfeito", e o vídeo horizontal (fitMode "contain", adicionado em
// 18/09/2026) NUNCA tinha recorte nenhum — só o vertical tinha. Bugs de
// canal em vídeo horizontal costumam ficar num canto (topo/base) ou numa
// tarja inferior (legenda/rodapé da fonte) — defaults mais moderados que
// os do vertical (lá o corte grande no topo existe pra remover overlay de
// usuário do Instagram, que não existe em fonte horizontal comum).
function containCropRatios(job) {
  return {
    cropTop: clampCrop(job.watermark_crop_top, 0.05, 0.2),
    cropBottom: clampCrop(job.watermark_crop_bottom, 0.08, 0.2),
    cropSide: clampCrop(job.watermark_crop_side, 0.04, 0.15)
  };
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

// Detecta a proporção real do vídeo fonte pra decidir como encaixar no
// template (Roberto, 18/09/2026): vídeo horizontal/quadrado (largura >=
// altura) entra no template SEM RECORTE, encaixado no topo, com a sombra
// subindo dinamicamente até onde ele termina (ver buildContainFadeStops).
// Vídeo vertical continua no comportamento original (cover, recorte
// central pra preencher o quadro 1080x1920 por completo). Falha na
// leitura (arquivo ausente/corrompido) sempre cai no comportamento
// original — nunca quebra o render por causa desta detecção.
async function probeDimensions(inputPath) {
  try {
    const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
    const probe = await runCapture(ffprobe, [
      "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", inputPath
    ]);
    const [width, height] = probe.stdout.toString("utf8").trim().split(",").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) return { width, height };
  } catch (_) {
    // ignorado de propósito — fallback pro comportamento original (cover)
  }
  return null;
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

async function runFfmpeg(job, inputPath, overlayPath, outputPath, fitMode = "cover") {
  const endTrim = await detectEndTrim(job, inputPath);
  const trimmedDuration = endTrim.duration && endTrim.trimSeconds > 0
    ? Math.max(2, endTrim.duration - endTrim.trimSeconds)
    : (endTrim.duration || null);
  // SEMPRE aplica o teto de 88s (REELS_MAX_DURATION_SECONDS), mesmo sem
  // nenhum end-trim detectado — antes disso, um vídeo-fonte sem end-card
  // promocional (a maioria) nunca tinha nenhum "-t" no ffmpeg e renderizava
  // inteiro, não importa o tamanho.
  const cappedByReelsLimit = trimmedDuration != null && trimmedDuration > REELS_MAX_DURATION_SECONDS;
  const outputDuration = trimmedDuration != null
    ? Math.min(trimmedDuration, REELS_MAX_DURATION_SECONDS)
    : REELS_MAX_DURATION_SECONDS;

  let videoFilter;
  if (fitMode === "contain") {
    // Vídeo horizontal/quadrado — encaixa no topo do quadro (Roberto,
    // 18/09/2026), mas AGORA com o mesmo recorte de segurança contra
    // marca d'água/logo de outra emissora que o modo vertical já tinha
    // (Roberto, 20/09/2026 — "o recorte precisa estar perfeito", nunca
    // existia aqui). Recorta as bordas primeiro, escala pra largura 1080
    // preservando a proporção resultante, preenche o resto do quadro
    // 1080x1920 com preto — a sombra (buildContainFadeStops) usa a MESMA
    // proporção de recorte pra saber exatamente onde o vídeo termina.
    const { cropTop, cropBottom, cropSide } = containCropRatios(job);
    const cropWidth = 1 - cropSide * 2;
    const cropHeight = 1 - cropTop - cropBottom;
    const cropFilter = `crop=trunc(iw*${cropWidth}/2)*2:trunc(ih*${cropHeight}/2)*2:trunc(iw*${cropSide}/2)*2:trunc(ih*${cropTop}/2)*2`;
    videoFilter = `${cropFilter},scale=${WIDTH}:-2,pad=${WIDTH}:${HEIGHT}:0:0:black,setsar=1,fps=30`;
  } else {
    // Vídeo vertical (comportamento original) — recorte de segurança pra
    // vídeos de terceiros (elimina marcas persistentes nas bordas), depois
    // preenche o quadro 1080x1920 por completo via crop central.
    const cropTop = clampCrop(job.watermark_crop_top, 0.16, 0.25);
    const cropBottom = clampCrop(job.watermark_crop_bottom, 0.02, 0.15);
    const cropSide = clampCrop(job.watermark_crop_side, 0.04, 0.15);
    const cropWidth = 1 - cropSide * 2;
    const cropHeight = 1 - cropTop - cropBottom;
    const cropFilter = `crop=trunc(iw*${cropWidth}/2)*2:trunc(ih*${cropHeight}/2)*2:trunc(iw*${cropSide}/2)*2:trunc(ih*${cropTop}/2)*2`;
    videoFilter = `${cropFilter},scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1,fps=30`;
  }

  const args = [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-i", inputPath,
    "-loop", "1", "-i", overlayPath,
    "-filter_complex",
    `[0:v]${videoFilter}[video];[video][1:v]overlay=0:0:shortest=1:format=auto[out]`,
    "-map", "[out]", "-map", "0:a?",
    ...(outputDuration ? ["-t", outputDuration.toFixed(3)] : []),
    "-c:v", "libx264", "-preset", "medium", "-crf", "16",
    "-maxrate", "8M", "-bufsize", "16M",
    // 20/09/2026 — tentativa anterior (GOP fechado): não resolveu — 2
    // ProcessingFailedError reais foram REPRODUZIDOS de novo em 21/09/2026,
    // ao vivo, com este exato código (já com o GOP fechado abaixo), via
    // teste real (download+render+upload resumível pra Meta, sem publicar).
    // O GOP fechado permanece (é boa prática e não é a causa, mas também
    // não faz mal manter).
    "-x264-params", "scenecut=0:open_gop=0:keyint=60:min-keyint=60",
    // 21/09/2026 — causa real encontrada, com matemática concreta, não
    // suposição: em -level 4.1, 1080x1920@30fps usa 8160 de 8192 MBs/frame
    // (99,6% do teto) e 244.800 de 245.760 MBs/s (99,6% do teto) — margem
    // de só 0,4%. Level 4.1 é tecnicamente compatível (8160<=8192), mas
    // essa margem quase zero é um candidato real e concreto pra rejeição
    // marginal do validador da Meta. Level 5.1 dá folga enorme (28.704
    // MBs/frame e 738.240 MBs/s de margem) sem nenhuma desvantagem —
    // suportado universalmente, inclusive pela própria Meta.
    "-profile:v", "high", "-level", "5.1", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
    "-movflags", "+faststart", "-shortest", outputPath
  ];
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || "ffmpeg", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0
      ? resolvePromise({ ...endTrim, output_duration_seconds: outputDuration, capped_by_reels_limit: cappedByReelsLimit })
      : reject(new Error(`ffmpeg_exit_${code}`)));
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

// Detecta a proporção real da fonte (Roberto, 18/09/2026): vídeo
// horizontal/quadrado (largura >= altura) usa fitMode "contain" — encaixa
// no topo (com recorte de marca d'água nas bordas, 20/09/2026), sombra
// sobe até onde ele termina. Vídeo vertical (o caso mais comum) mantém o
// comportamento original ("cover"). job.fit permite forçar um modo
// específico (usado em testes); sem isso, é 100% automático a partir do
// ffprobe real do arquivo.
const sourceDims = await probeDimensions(inputPath);
const autoFit = sourceDims && sourceDims.width >= sourceDims.height ? "contain" : "cover";
const fitMode = job.fit === "contain" || job.fit === "cover" ? job.fit : autoFit;
// 20/09/2026 — a altura de saída agora precisa considerar o recorte de
// marca d'água aplicado em runFfmpeg (containCropRatios) — sem isso a
// sombra ficaria calculada pra proporção ORIGINAL do vídeo, não pra
// proporção real depois do crop, e a transição sombra→vídeo desalinharia.
const videoOutHeightPx = fitMode === "contain" && sourceDims
  ? (() => {
      const { cropTop, cropBottom, cropSide } = containCropRatios(job);
      const effectiveWidth = sourceDims.width * (1 - cropSide * 2);
      const effectiveHeight = sourceDims.height * (1 - cropTop - cropBottom);
      return Math.max(2, Math.round((WIDTH * effectiveHeight) / effectiveWidth / 2) * 2);
    })()
  : HEIGHT;

await buildOverlay(job, overlayPath, fitMode, videoOutHeightPx);
let endTrim = null;
if (process.env.REEL_OVERLAY_ONLY !== "1") {
  endTrim = await runFfmpeg(job, inputPath, overlayPath, outputPath, fitMode);
}
console.log(JSON.stringify({
  ok: true,
  output: process.env.REEL_OVERLAY_ONLY === "1" ? null : outputPath,
  overlay: overlayPath,
  template_version: job.template_version,
  end_trim: endTrim,
  fit_mode: fitMode,
  source_dimensions: sourceDims,
  video_out_height: fitMode === "contain" ? videoOutHeightPx : null
}));
