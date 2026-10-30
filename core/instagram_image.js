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
// 28/09/2026 — Roberto: "o alcance é ridículo... talvez a capa decente, bem
// enquadrada, com título forte e atraente com letras maiores e destacadas
// possam melhorar". Variante mais agressiva usada SÓ na capa do Reel (grade
// do perfil, vista pequena) — fonte bem maior (peso 900, o mais pesado do
// Inter Variable), menos linhas (força frases mais curtas e grossas em vez
// de 4 linhas pequenas) e caixa mais larga pra caber a letra maior. O post
// de feed (foto grande, vista em tela cheia) continua com HEADLINE_BOX,
// sem mudança nenhuma.
const HEADLINE_BOX_BOLD = {
  y: px(660),
  width: px(920),
  maxLines: 3,
  maxFontSize: px(62),
  minFontSize: px(44)
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

async function buildHeadlineLayers(title, { bold = false } = {}) {
  const box = bold ? HEADLINE_BOX_BOLD : HEADLINE_BOX;
  const normalized = String(title || "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!normalized) return null;

  let selected = null;
  for (let fontSize = box.maxFontSize; fontSize >= box.minFontSize; fontSize -= 2) {
    const lines = wrapHeadline(normalized, fontSize, box.width, box.maxLines);
    const fits = lines.length <= box.maxLines && lines.every(line => estimateTextWidth(line, fontSize) <= box.width);
    if (fits) {
      selected = { fontSize, lines };
      break;
    }
  }

  if (!selected) {
    selected = {
      fontSize: box.minFontSize,
      lines: wrapHeadline(normalized, box.minFontSize, box.width, box.maxLines)
    };
  }

  const highlightWord = chooseHighlightWord(normalized);
  const highlightState = { used: false };
  const markup = selected.lines
    .map(line => renderLineMarkup(line, highlightWord, highlightState, true))
    .join("\n");
  const textOptions = text => ({
    text: `<span weight="${bold ? 900 : 800}">${text}</span>`,
    font: `Inter ${selected.fontSize}`,
    fontfile: HEADLINE_FONT_PATH,
    align: "center",
    rgba: true,
    dpi: 72,
    wrap: "none"
  });
  const foreground = await sharp({ text: textOptions(markup) }).png().toBuffer();
  const { width = box.width } = await sharp(foreground).metadata();
  const left = Math.max(0, Math.round((W - width) / 2));
  return [
    { input: foreground, top: box.y, left, blend: "over" }
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

export async function buildInstagramImageBuffer(sourceUrl, { title, bold } = {}) {
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
  const headlineLayers = await buildHeadlineLayers(title, { bold });
  if (headlineLayers) layers.push(...headlineLayers);

  return sharp(base)
    .composite(layers)
    .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

export async function prepareInstagramImage({ sourceUrl, postId, supabase, title, bold }) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) throw new Error("instagram_source_image_invalid");
  if (!postId) throw new Error("instagram_post_id_missing");

  const buffer = await buildInstagramImageBuffer(sourceUrl, { title, bold });
  const hash = crypto.createHash("sha1")
    .update([HEADLINE_VERSION, bold ? "bold" : "normal", sourceUrl, title || ""].join("\n"))
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

// ══════════════════════════════════════════════════════════════════════
// CARTÃO IRÔNICO DO INSTAGRAM — 30/10/2026, pedido explícito de Roberto:
// "quero que voce construa esse mecanismo e coloque no admin pra eu
// testar. vou escrever conteudos la e publicar no instagram sem
// automacao de gerar conteudo, eu mesmo vou adicionar, textos, legendas,
// e o texto dos cards" — fundo escuro + texto, SEM foto. Automação de
// feed gerava ~200 views/post; 3 posts manuais dele (fundo sólido + logo
// + chamada irônica multi-parágrafo, sem foto) passaram de 2 mil views
// cada. Reusa o MESMO overlay (logo+rodapé já embutidos) por cima de um
// fundo sólido escuro em vez de foto real — zero asset novo.
// ══════════════════════════════════════════════════════════════════════
const CARD_BG = { r: 11, g: 18, b: 32 }; // navy bem escuro, mesma família do logo
// top: margem real abaixo do wordmark "O VALOR CAPITAL" do overlay.
// bottom: medido o overlay de verdade (perfil de alpha por linha) — o
// bloco de assinatura do rodapé ("O VALOR CAPITAL / @ovalorcapital/...")
// começa em y≈1188 de 1350 (88%) na resolução nativa do overlay
// (1080x1350). bottom=1100 deixa ~88px de folga real acima dele. NUNCA
// usar um valor de referência acima de 1350 aqui — o overlay nativo só
// tem essa altura, e px() escala por W/1080, então qualquer valor de
// referência > 1350 já ultrapassa a própria altura do canvas (H=1800) e
// invade o rodapé (bug real encontrado e corrigido em 28/10/2026).
const CARD_BOX = {
  top: px(360),
  bottom: px(1100),
  width: px(900),
  maxFontSize: px(36),
  minFontSize: px(22),
  lineHeight: 1.4,
  paragraphGap: 0.9 // em múltiplos da altura de linha
};

// mesma lógica de wrapHeadline() acima, mas preserva o índice global da
// palavra (pra casar com o mapa de cores de destaque DEPOIS da quebra de
// linha — sem isso, uma frase destacada podia ficar cortada ao meio numa
// quebra de linha).
function wrapParagraphIndexed(words, startIndex, fontSize, maxWidth) {
  const lines = [];
  let current = [];
  let currentText = "";
  words.forEach((word, i) => {
    const candidate = currentText ? `${currentText} ${word}` : word;
    if (!currentText || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      currentText = candidate;
      current.push({ word, idx: startIndex + i });
      return;
    }
    lines.push(current);
    currentText = word;
    current = [{ word, idx: startIndex + i }];
  });
  if (current.length) lines.push(current);
  return lines;
}

// Roberto: "eu quero poder escolher quais palavras exatamente ficam em
// outras cores e quais cores". highlights aceita {phrase, color} (cor
// própria por frase) além do formato antigo (string solta = usa
// HIGHLIGHT_COLOR, retrocompat). Retorna Map<índice da palavra, cor hex>.
function markHighlightColors(words, highlights) {
  const normWords = words.map(normalizeWord);
  const colorByIndex = new Map();
  for (const item of highlights || []) {
    const phrase = typeof item === "string" ? item : item?.phrase;
    const color = (typeof item === "object" && item?.color) ? item.color : HIGHLIGHT_COLOR;
    const phraseWords = String(phrase || "").trim().split(/\s+/).map(normalizeWord).filter(Boolean);
    if (!phraseWords.length) continue;
    for (let i = 0; i <= normWords.length - phraseWords.length; i++) {
      let match = true;
      for (let j = 0; j < phraseWords.length; j++) {
        if (normWords[i + j] !== phraseWords[j]) { match = false; break; }
      }
      if (match) {
        for (let j = 0; j < phraseWords.length; j++) colorByIndex.set(i + j, color);
        break;
      }
    }
  }
  return colorByIndex;
}

// 30/10/2026 — editor manual no admin (posição, largura, tamanho de
// fonte, cor). layout (opcional) sobrescreve qualquer campo de CARD_BOX
// — null/ausente = comportamento automático de sempre. fontSize fixo
// desliga o auto-fit (Roberto escolheu o tamanho, não tenta mais
// encolher sozinho). Mesmo com tamanho fixo ou no mínimo automático,
// nunca deixa o texto avançar na borda de baixo (rede de segurança:
// corta linha por linha de trás pra frente até caber).
async function buildCardBodyLayers(paragraphs, highlights, layout) {
  const box = { ...CARD_BOX, ...(layout || {}) };
  const list = (paragraphs || []).map(p => String(p || "").replace(/\s+/g, " ").trim().toUpperCase()).filter(Boolean);
  if (!list.length) return null;

  const textColor = layout?.textColor || "#ffffff";
  const maxHeight = box.bottom - box.top;

  const medir = (fontSize) => {
    const lineHeightPx = Math.round(fontSize * box.lineHeight);
    const gapPx = Math.round(lineHeightPx * box.paragraphGap);
    let totalHeight = 0;
    const paraLines = [];
    let globalWordIdx = 0;
    for (const para of list) {
      const words = para.split(/\s+/).filter(Boolean);
      const lines = wrapParagraphIndexed(words, globalWordIdx, fontSize, box.width);
      globalWordIdx += words.length;
      paraLines.push(lines);
      totalHeight += lines.length * lineHeightPx;
    }
    totalHeight += gapPx * Math.max(0, list.length - 1);
    return { fontSize, lineHeightPx, gapPx, paraLines, totalHeight };
  };

  let chosen;
  if (layout?.fontSize) {
    // tamanho fixo escolhido manualmente — nunca encolhe sozinho.
    chosen = medir(layout.fontSize);
  } else {
    chosen = medir(box.maxFontSize);
    for (let fontSize = box.maxFontSize - 2; fontSize >= box.minFontSize; fontSize -= 2) {
      const tentativa = medir(fontSize);
      chosen = tentativa;
      if (tentativa.totalHeight <= maxHeight) break;
    }
  }

  // Rede de segurança: mesmo no tamanho mínimo (ou no tamanho fixo que
  // Roberto escolheu), se ainda estourar a borda de baixo, corta linhas
  // de trás pra frente até caber — "nao avancar nas bordas" nunca falha.
  while (chosen.totalHeight > maxHeight && chosen.paraLines.some(p => p.length)) {
    let removido = false;
    for (let p = chosen.paraLines.length - 1; p >= 0 && !removido; p--) {
      if (chosen.paraLines[p].length > 1) {
        chosen.paraLines[p] = chosen.paraLines[p].slice(0, -1);
        chosen.totalHeight -= chosen.lineHeightPx;
        removido = true;
      } else if (chosen.paraLines[p].length === 1 && chosen.paraLines.filter(x => x.length).length > 1) {
        chosen.paraLines[p] = [];
        chosen.totalHeight -= chosen.lineHeightPx;
        if (p < chosen.paraLines.length - 1) chosen.totalHeight -= chosen.gapPx;
        removido = true;
      }
    }
    if (!removido) break; // sobrou só 1 linha de 1 parágrafo — não dá mais pra cortar
  }

  // palavras de TODOS os parágrafos numa lista só, pra casar índice global
  const allWords = list.flatMap(p => p.split(/\s+/).filter(Boolean));
  const colorByIndex = markHighlightColors(allWords, highlights);

  const markupLines = [];
  chosen.paraLines.forEach((lines, pIdx) => {
    if (!lines.length) return;
    lines.forEach(lineWords => {
      const markup = lineWords.map(({ word, idx }) => {
        const color = colorByIndex.get(idx) || textColor;
        return `<span foreground="${color}">${escapeXml(word)}</span>`;
      }).join(" ");
      markupLines.push(markup);
    });
    if (pIdx < chosen.paraLines.length - 1 && chosen.paraLines.slice(pIdx + 1).some(p => p.length)) markupLines.push("");
  });
  if (!markupLines.length) return null;

  const textOptions = {
    text: `<span weight="700">${markupLines.join("\n")}</span>`,
    font: `Inter ${chosen.fontSize}`,
    fontfile: HEADLINE_FONT_PATH,
    align: "left",
    rgba: true,
    dpi: 72,
    wrap: "none",
    spacing: Math.round(chosen.lineHeightPx - chosen.fontSize)
  };
  const foreground = await sharp({ text: textOptions }).png().toBuffer();
  const left = Math.max(0, Math.round((W - box.width) / 2));
  return [{ input: foreground, top: box.top, left, blend: "over" }];
}

// cartão irônico (sem foto, por padrão). Mesmo overlay (logo+rodapé já
// embutidos, transparente em cima); fundo sólido escuro OU, se Roberto
// escolher ("colocar imagens, se eu quiser"), uma foto real (mesmo
// tratamento de download/recorte do template com foto normal).
export async function buildInstagramIronicCardBuffer({ paragraphs, highlights, layout, backgroundImageUrl } = {}) {
  let backgroundLayer;
  if (backgroundImageUrl) {
    const source = await downloadImage(backgroundImageUrl);
    backgroundLayer = await sharp(source)
      .rotate()
      .resize(W, PHOTO_HEIGHT, { fit: "cover", position: sharp.strategy.attention })
      .png()
      .toBuffer();
  } else {
    backgroundLayer = await sharp({
      create: { width: W, height: PHOTO_HEIGHT, channels: 3, background: CARD_BG }
    }).png().toBuffer();
  }
  const base = await sharp({
    create: { width: W, height: H, channels: 3, background: "#000000" }
  })
    .composite([{ input: backgroundLayer, top: 0, left: 0 }])
    .png()
    .toBuffer();
  const overlay = await sharp(readFileSync(OVERLAY_PATH))
    .resize(W, H, { fit: "fill" })
    .png()
    .toBuffer();

  const layers = [{ input: overlay, top: 0, left: 0 }];
  const bodyLayers = await buildCardBodyLayers(paragraphs, highlights, layout);
  if (bodyLayers) layers.push(...bodyLayers);

  return sharp(base)
    .composite(layers)
    .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

export async function prepareInstagramIronicCard({ postId, supabase, paragraphs, highlights, layout, backgroundImageUrl }) {
  if (!postId) throw new Error("instagram_post_id_missing");
  if (!Array.isArray(paragraphs) || !paragraphs.length) throw new Error("instagram_card_paragraphs_missing");

  const buffer = await buildInstagramIronicCardBuffer({ paragraphs, highlights, layout, backgroundImageUrl });
  const hlKey = (highlights || []).map(h => typeof h === "string" ? h : `${h?.phrase || ""}:${h?.color || ""}`).join("|");
  const hash = crypto.createHash("sha1")
    .update(["ironic-card-v2", paragraphs.join("\n"), hlKey, JSON.stringify(layout || {}), backgroundImageUrl || ""].join("\n"))
    .digest("hex")
    .slice(0, 10);
  const path = `${PREFIX}/${postId}-ironic-${hash}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true
  });
  if (error) throw new Error("instagram_ironic_card_upload_failed: " + error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data?.publicUrl;
  if (!url) throw new Error("instagram_ironic_card_public_url_missing");
  return { url, path, version: "ironic-card-v2" };
}
