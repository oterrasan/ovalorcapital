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
const HEADLINE_VERSION = "canva-headline-v9-category-badge-1440";
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

// 18/11/2026 — Roberto: "capture a categoria... mediante as categorias do
// nosso portal... e coloque uma flagzinha na arte... da cor que é
// política no portal... bem discreto, bem profissional". Cores e labels
// copiados verbatim de CORES_CAT/CATS em public/js/ovc-cards.js (as
// cores REAIS já usadas nos cards/menu do portal — nunca inventadas),
// duplicados aqui de propósito (mesmo padrão já usado no projeto: zero
// import cruzado entre o client-side e o pipeline server-side).
const BADGE_LABELS = {
  "brasil-on": "Brasil On", politica: "Política", economia: "Economia",
  financas: "Finanças", negocios: "Negócios", tecnologia: "Tecnologia",
  internacional: "Internacional", industria: "Indústria", familia: "Família",
  esportes: "Esportes", colunistas: "Colunistas"
};
const BADGE_COLORS = {
  "brasil-on": "#0f172a", politica: "#dc2626", economia: "#2563eb",
  financas: "#059669", negocios: "#7c3aed", tecnologia: "#6366f1",
  internacional: "#dc2626", industria: "#ea580c", familia: "#db2777",
  esportes: "#16a34a", colunistas: "#b8860b"
};
// Aliases de categorias legadas/absorvidas → categoria real atual (mesmo
// mapeamento de normalizeCat()/CAT_PATH em api/portal-posts.js).
const BADGE_ALIASES = {
  tributos: "economia", tributacao: "economia", regulacao: "economia",
  investimentos: "financas", seguros: "financas", mercados: "financas",
  parcerias: "negocios", vc: "colunistas",
  saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
  cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
  profissoes: "brasil-on", vagas: "brasil-on", concursos: "brasil-on",
  investigativo: "brasil-on", seguranca: "brasil-on", variedades: "brasil-on",
  defesa: "brasil-on", esg: "brasil-on"
};
function resolveBadgeCategory(tags) {
  let list = [];
  if (Array.isArray(tags)) list = tags;
  else { try { list = JSON.parse(tags || "[]"); } catch (_) { list = []; } }
  list = list.map(t => String(t || "").trim().toLowerCase()).filter(Boolean);
  if (list.includes("colunistas") || list.includes("vc")) return "colunistas";
  const first = list[0] || "";
  const canon = BADGE_LABELS[first] ? first : (BADGE_ALIASES[first] || first);
  return BADGE_LABELS[canon] ? canon : null; // null = assunto sem categoria reconhecida, não desenha nada
}
const BADGE_MARGIN_LEFT = px(46);
// Logo do topo termina em ~px(160) (ver TOP_BRAND_* abaixo) — y=px(200)
// deixa uma folga clara visível, "distante do logo" (Roberto pediu
// explicitamente pra não ficar colado nele).
const BADGE_TOP = px(200);
const BADGE_FONT_SIZE = px(24);
const BADGE_PAD_X = px(24);
const BADGE_PAD_Y = px(12);
// Sombra discreta atrás da pílula — garante contraste mesmo sobre foto
// de tom parecido com a cor da categoria (ex.: "Família"/rosa claro ou
// uma categoria clara sobre céu/concreto claro). Mesmo rect com blur
// (feGaussianBlur), nunca feDropShadow — mais universalmente suportado
// pelo librsvg usado por sharp.
const BADGE_SHADOW_BLUR = px(4);
const BADGE_SHADOW_OFFSET = px(2);
async function buildCategoryBadgeLayers(tags) {
  const cat = resolveBadgeCategory(tags);
  if (!cat) return [];
  const label = BADGE_LABELS[cat].toUpperCase();
  const color = BADGE_COLORS[cat];
  const textBuf = await sharp({
    text: {
      text: `<span foreground="#ffffff" weight="700">${escapeXml(label)}</span>`,
      font: `Inter ${BADGE_FONT_SIZE}`,
      fontfile: HEADLINE_FONT_PATH,
      align: "center", rgba: true, dpi: 72, wrap: "none"
    }
  }).png().toBuffer();
  const meta = await sharp(textBuf).metadata();
  const textW = meta.width || 0;
  const textH = meta.height || 0;
  const pillW = textW + BADGE_PAD_X * 2;
  const pillH = textH + BADGE_PAD_Y * 2;
  const radius = Math.round(pillH / 2);
  const pad = BADGE_SHADOW_BLUR * 3;
  const canvasW = pillW + pad * 2;
  const canvasH = pillH + pad * 2;
  const pillWithShadow = await sharp(Buffer.from(
    `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${BADGE_SHADOW_BLUR}"/></filter></defs>` +
    `<rect x="${pad + BADGE_SHADOW_OFFSET}" y="${pad + BADGE_SHADOW_OFFSET}" width="${pillW}" height="${pillH}" rx="${radius}" ry="${radius}" fill="#000000" opacity="0.38" filter="url(#b)"/>` +
    `<rect x="${pad}" y="${pad}" width="${pillW}" height="${pillH}" rx="${radius}" ry="${radius}" fill="${color}"/></svg>`
  )).png().toBuffer();
  return [
    { input: pillWithShadow, top: BADGE_TOP - pad, left: BADGE_MARGIN_LEFT - pad },
    { input: textBuf, top: BADGE_TOP + Math.round((pillH - textH) / 2), left: BADGE_MARGIN_LEFT + BADGE_PAD_X }
  ];
}

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

// 17/11/2026 — Roberto: "vamos remover aquela mascara escura dos posts do
// feed do OVC e deixar a imagem ocupando todo o espaco, como já fazemos
// no BRASILON ... nos posts do feed, tambem nao precisa manter os dados
// de site, etc, apenas o logo e o nome do ovc - e a manchete, dentro do
// quadro amarelo marca texto como nos reels". Suavizado no mesmo pedido:
// "voce pode ate deixar um degrade escuro ou azul petroleo marinho nos
// posts de feed do ovc, mas bem menor e mais pra baixo do que temos hoje".
//
// MOLDURA_YELLOW é a mesma cor medida pixel a pixel no vídeo de
// referência dele e já usada no template novo dos Reels (ver
// scripts/render-instagram-reel.mjs, sanitizeHeadline()) — feed e Reels
// ficam com a mesma identidade de manchete. Base do texto preta + palavra
// de impacto em HIGHLIGHT_COLOR (mesmo padrão já usado nos Reels pra
// moldura), função própria (renderMolduraLineMarkup) em vez de reusar
// renderLineMarkup() porque essa função só suporta "branco + destaque" ou
// "preto sem destaque" — nunca "preto + destaque colorido" — e não quero
// arriscar mudar o comportamento do caminho bold/capa de Reel (ainda sem
// nenhum chamador real, mas intocado de propósito, fora do escopo pedido).
const MOLDURA_YELLOW = "#F7FA14";
const MOLDURA_BOX = {
  width: Math.round(W * 0.88),
  paddingX: px(40),
  paddingY: px(34),
  radius: px(22),
  maxLines: 4,
  maxFontSize: px(54),
  minFontSize: px(34),
  lineGap: 1.16,
  bottomAnchor: Math.round(H * 0.92)
};
const TOP_BRAND_PATH = new URL("../public/assets/ig-top-brand-ovc.png", import.meta.url);
// 17/11/2026 — Roberto: "a posição do ícone do cabeçalho... deve ser
// exatamente na mesma proporção para Reels e para Feed... estão bem
// diferentes". Medido com PIL (não suposição): o ícone do topo do feed
// renderizava a só ~5,7% da altura do quadro, contra ~8,85% nos Reels —
// quase 1,6x menor. Causa: o asset antigo (1080x210) tinha margem
// transparente solta em volta do ícone+wordmark, e era esticado pra uma
// altura de banda fixa (280px) sem relação nenhuma com o tamanho real do
// ícone nos Reels.
// Fix: asset recortado justo (ver ig-top-brand-ovc.png, só 2px de
// margem em volta de ícone+wordmark) + as 2 frações abaixo, copiadas
// direto das constantes canônicas do Reel (DUAL_LOGO_TOP_Y=70,
// DUAL_LOGO_BOX=170, HEIGHT=1920 — scripts/render-instagram-reel.mjs) —
// o ícone do feed agora nasce do mesmo tamanho/posição relativa que o
// ícone do OVC nos Reels, só que com o nome "O VALOR CAPITAL" embutido
// no mesmo asset, logo abaixo (Reels não têm wordmark nenhum — pedido
// explícito e diferente desse, mantido).
// 17/11/2026 — Reel reduzido de DUAL_LOGO_BOX=170 pra 90 (Roberto: "os dois
// ícones estão maiores do que qualquer outra coisa. Está ridículo.") —
// essas frações são re-derivadas dos valores NOVOS do Reel, pra manter a
// paridade de proporção pedida ("mesma proporção para Reels e para Feed").
const TOP_BRAND_ICON_TOP_MARGIN_FRAC = 70 / 1920; // = DUAL_LOGO_TOP_Y / HEIGHT do Reel
const TOP_BRAND_ICON_HEIGHT_FRAC = 90 / 1920; // = DUAL_LOGO_BOX / HEIGHT do Reel
// Posição do ícone DENTRO do asset ig-top-brand-ovc.png (301x140, medido
// uma vez com PIL — ink começa a 2px de toda borda, ícone só vai até y=79):
const TOP_BRAND_NATIVE_W = 301;
const TOP_BRAND_NATIVE_H = 140;
const TOP_BRAND_ICON_TOP_IN_ASSET = 2;
const TOP_BRAND_ICON_HEIGHT_IN_ASSET = 78;

function renderMolduraLineMarkup(line, highlightWord, state) {
  const parts = String(line || "").split(/(\s+)/);
  return parts.map(part => {
    if (!part) return "";
    const token = normalizeWord(part);
    const highlight = !state.used && highlightWord && token === highlightWord;
    if (highlight) state.used = true;
    return `<span foreground="${highlight ? HIGHLIGHT_COLOR : "#050505"}">${escapeXml(part)}</span>`;
  }).join("");
}

async function buildMolduraHeadlineLayers(title) {
  const normalized = String(title || "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!normalized) return [];
  const box = MOLDURA_BOX;
  const inner = box.width - box.paddingX * 2;
  let fontSize = box.minFontSize;
  let lines = wrapHeadline(normalized, fontSize, inner, box.maxLines);
  for (let size = box.maxFontSize; size >= box.minFontSize; size -= 2) {
    const tentativa = wrapHeadline(normalized, size, inner, box.maxLines);
    if (tentativa.every(line => estimateTextWidth(line, size) <= inner)) {
      fontSize = size;
      lines = tentativa;
      break;
    }
  }
  const lineHeightPx = Math.round(fontSize * box.lineGap);
  const boxHeight = box.paddingY * 2 + lineHeightPx * lines.length;
  const boxTop = Math.max(0, box.bottomAnchor - boxHeight);
  const boxLeft = Math.round((W - box.width) / 2);
  const rect = await sharp(Buffer.from(
    `<svg width="${box.width}" height="${boxHeight}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${box.width}" height="${boxHeight}" rx="${box.radius}" ry="${box.radius}" fill="${MOLDURA_YELLOW}"/></svg>`
  )).png().toBuffer();
  const highlightWord = chooseHighlightWord(normalized);
  const highlightState = { used: false };
  const markup = lines.map(line => renderMolduraLineMarkup(line, highlightWord, highlightState)).join("\n");
  const text = await sharp({
    text: {
      text: `<span weight="800">${markup}</span>`,
      font: `Inter ${fontSize}`,
      fontfile: HEADLINE_FONT_PATH,
      align: "center", rgba: true, dpi: 72, wrap: "none"
    }
  }).png().toBuffer();
  const meta = await sharp(text).metadata();
  return [
    { input: rect, left: boxLeft, top: boxTop },
    { input: text, left: Math.round((W - (meta.width || 0)) / 2), top: boxTop + Math.round((boxHeight - (meta.height || 0)) / 2) }
  ];
}

// Degrade bem pequeno e baixo (opcional — Roberto: "pode ate deixar"), só
// pra dar uma leve profundidade atrás da caixa amarela — NÃO é mais
// necessário pra legibilidade (o texto agora sempre fica sobre uma caixa
// opaca, nunca direto sobre a foto). Começa em ~74% da altura, termina
// numa opacidade baixa — bem menor e mais pra baixo que a banda preta
// sólida de ~47% que existia antes.
async function buildFeedGradient() {
  const topPct = 74;
  return Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="${topPct}%" stop-color="#0a1830" stop-opacity="0"/>
          <stop offset="100%" stop-color="#0a1830" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#fade)"/>
    </svg>`);
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

export async function buildInstagramImageBuffer(sourceUrl, { title, bold, tags } = {}) {
  const source = await downloadImage(sourceUrl);

  if (bold) {
    // Caminho da capa de Reel (HEADLINE_BOX_BOLD) — sem chamador real
    // hoje (confirmado via busca em todo o repo), mantido exatamente como
    // era antes de 17/11/2026. Fora do escopo do pedido do Roberto, que
    // falou especificamente de "posts do feed" — nunca mencionou a capa
    // do Reel.
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
    const layers = [{ input: overlay, top: 0, left: 0 }];
    const headlineLayers = await buildHeadlineLayers(title, { bold: true });
    if (headlineLayers) layers.push(...headlineLayers);
    return sharp(base)
      .composite(layers)
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  // 17/11/2026 — template novo do feed (ver comentário de MOLDURA_YELLOW
  // acima). Foto preenche o quadro INTEIRO — mesmo algoritmo de recorte
  // inteligente de sempre (fit:"cover" + attention), só numa caixa mais
  // alta; nenhum recorte novo/diferente foi introduzido. Degrade pequeno
  // e baixo opcional, logo+nome do OVC só no topo (sem handle/site/
  // tagline), manchete real da matéria sempre dentro da caixa amarela.
  const photo = await sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: sharp.strategy.attention })
    .png()
    .toBuffer();
  // Escala o asset pelo tamanho real do ÍCONE (não pela banda inteira) —
  // garante que o ícone saia com a mesma altura proporcional do ícone do
  // Reel, e posiciona pra o topo do ícone cair na mesma margem
  // proporcional também (ver constantes TOP_BRAND_* acima).
  const topBrandScale = (TOP_BRAND_ICON_HEIGHT_FRAC * H) / TOP_BRAND_ICON_HEIGHT_IN_ASSET;
  const topBrandW = Math.round(TOP_BRAND_NATIVE_W * topBrandScale);
  const topBrandH = Math.round(TOP_BRAND_NATIVE_H * topBrandScale);
  const topBrand = await sharp(readFileSync(TOP_BRAND_PATH))
    .resize(topBrandW, topBrandH, { fit: "fill" })
    .png()
    .toBuffer();
  const topBrandLeft = Math.round((W - topBrandW) / 2);
  const topBrandTop = Math.round(TOP_BRAND_ICON_TOP_MARGIN_FRAC * H - TOP_BRAND_ICON_TOP_IN_ASSET * topBrandScale);
  const gradient = await buildFeedGradient();
  const headlineLayers = await buildMolduraHeadlineLayers(title);
  const badgeLayers = await buildCategoryBadgeLayers(tags);

  return sharp(photo)
    .composite([
      { input: gradient, top: 0, left: 0 },
      { input: topBrand, top: topBrandTop, left: topBrandLeft },
      ...badgeLayers,
      ...headlineLayers
    ])
    .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

export async function prepareInstagramImage({ sourceUrl, postId, supabase, title, bold, tags }) {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) throw new Error("instagram_source_image_invalid");
  if (!postId) throw new Error("instagram_post_id_missing");

  const buffer = await buildInstagramImageBuffer(sourceUrl, { title, bold, tags });
  // inclui a categoria resolvida da flag no hash — se o post trocar de
  // categoria depois de já ter gerado uma imagem, o cache não fica preso
  // na flag antiga.
  const hash = crypto.createHash("sha1")
    .update([HEADLINE_VERSION, bold ? "bold" : "normal", sourceUrl, title || "", resolveBadgeCategory(tags) || ""].join("\n"))
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
