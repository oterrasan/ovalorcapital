import axios from "axios";
import * as cheerioModule from "cheerio";
const cheerio = cheerioModule.default || cheerioModule;

// Padrões BLOQUEADOS — repórter, âncora, logo, marca d'água, identidade de outro veículo
const BLOCKED_IMG = [
  // Pessoas / autores
  /perfil/i, /author/i, /avatar/i, /reporter/i, /jornalista/i,
  /apresentador/i, /anchor/i, /staff/i, /\/autores?\//i, /\/pessoas?\//i,
  /foto-de-perfil/i, /profile/i, /headshot/i, /foto_autor/i, /\/time\//i,
  /columnist/i, /byline/i, /contributor/i, /editor/i, /redator/i,
  // Logos / marcas / ícones
  /icon/i, /logo/i, /favicon/i, /sprite/i, /brand/i, /marca/i,
  /watermark/i, /marca.dagua/i, /\/marca\//i,
  // Formatos inválidos
  /\.svg$/i, /\.gif$/i, /\.ico$/i,
  // Domínios de identidade de veículos (thumbnails de TV com rostos)
  /imagens\.ebc\.com\.br\/profile/i,
  /conteudo\.globo\.com.*foto.*autor/i,
  /s2\.glbimg\.com.*authors/i,
  /agencia\.gov\.br.*foto.*autor/i
];

const COMPETITOR_IMG_HOSTS = new Set([
  'glbimg.com', 's2.glbimg.com', 's3.glbimg.com', 'i.s3.glbimg.com',
  'globo.com', 'g1.globo.com', 'ge.globo.com', 'oglobo.globo.com',
  'extra.globo.com', 'valor.com.br',
  'uol.com.br', 'folha.uol.com.br', 'f.i.uol.com.br',
  'imguol.i.uol.com.br', 'conteudo.imguol.i.uol.com.br',
  'estadao.com.br', 'broadcast.com.br',
  'r7.com', 'noticias.r7.com', 'record.com.br',
  'sbt.com.br', 'jovempan.com.br',
  'band.com.br', 'bandnewsfm.band.com.br',
  'cnnbrasil.com.br', 'assets.cnnbrasil.com.br',
  'veja.com.br', 'abril.com.br', 'exame.com',
  'cartacapital.com.br', 'poder360.com.br',
  'gazetadopovo.com.br', 'metropoles.com',
  'seudinheiro.com', 'infomoney.com.br',
  'terra.com.br', 'ig.com.br', 'msn.com',
  'agenciabrasil.ebc.com.br', 'imagens.ebc.com.br',
  'reuters.com', 'ap.org',
  'canaltech.com.br', 'apublica.org',
  'correiobraziliense.com.br', 'nsctotal.com.br',
  'diariodocomercio.com.br', 'correiodopovo.com.br',
  'oantagonista.com', 'novonoticias.com.br',
]);

function isCompetitorImage(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_IMG_HOSTS].some(d => hostname === d || hostname.endsWith('.' + d));
  } catch(_) { return false; }
}

const PRESS_AUTHOR_PATHS = [
  /\/autor\//i, /\/autores\//i, /\/jornalista\//i, /\/repórter\//i,
  /\/colunista\//i, /\/equipe\//i, /\/redacao\//i, /\/people\//i,
  /\/team\//i, /\/staff\//i, /\/about\/people/i
];

function isValidImage(url, allowCompetitorImage = false) {
  if (!url || url.length < 12) return false;
  if (BLOCKED_IMG.some(p => p.test(url))) return false;
  if (PRESS_AUTHOR_PATHS.some(p => p.test(url))) return false;
  if (!allowCompetitorImage && isCompetitorImage(url)) return false;
  if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) {
    if (/\.(svg|gif|ico|bmp|tiff)(\?|$)/i.test(url)) return false;
  }
  return true;
}

// allowCompetitorImage — 13/08/2026: por padrão false em TODA a pipeline
// geral (RSS/materias/etc), porque ali imagem de domínio concorrente
// (glbimg.com, jovempan.com.br, etc — ver COMPETITOR_IMG_HOSTS) não deve
// ser reaproveitada como se fosse do OVC. Mas o fluxo Jovem Pan Política
// (api/run_portal.js, autoJovempanPolitica) é estruturalmente igual ao
// Brasil ON/Bacci: a IMAGEM DEVE SER SEMPRE a da própria fonte (Roberto,
// 12/08/2026: "assim como no bacci"). Sem este parâmetro, isValidImage()
// rejeitava 100% das imagens da Jovem Pan só por causa do domínio estar
// na lista de concorrentes — causa raiz real de generated:0 com
// candidates:15 (falhas.semImagem:7 confirmado ao vivo). Passar true
// SOMENTE nos fluxos onde a fonte é single-purpose e aprovada por Roberto
// para reaproveitar sua própria imagem (Jovem Pan Política, e qualquer
// futuro canal no mesmo padrão) — nunca no caminho geral de matérias.
export async function scrape(url, opts = {}) {
  const { allowCompetitorImage = false } = opts;
  try {
    const res = await axios.get(url, {
      timeout: 7000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      maxRedirects: 5,
    });
    const $ = cheerio.load(res.data);

    const candidates = [
      $('meta[property="og:image"]').attr("content"),
      $('meta[name="twitter:image"]').attr("content"),
      $('meta[property="og:image:url"]').attr("content"),
      $('meta[itemprop="image"]').attr("content"),
      $('article img').first().attr("src"),
      $(".post-thumbnail img, .featured-image img, .entry-thumbnail img").first().attr("src"),
    ].map(s => normalizeUrl(s, url)).filter(Boolean);

    const imageUrl = candidates.find(c => isValidImage(c, allowCompetitorImage)) || "";

    $('script, style, nav, footer, header, aside, .sidebar, .menu, .ad, .advertisement, .related, .comments, .share, .social, [class*="banner"], [class*="popup"]').remove();

    // Tentativa 1: seletores semânticos de artigo — 13/08/2026 (Roberto: "a reescrita
    // deve ser da materia completa, COMPLETA e sempre COMPLETA"): inclui blockquote
    // (declarações/citações de fonte em matérias de última hora costumam vir em
    // <blockquote>, não <p>) e reduz o piso de tamanho por trecho (40→20 chars) —
    // frases curtas de atualização ao vivo ("O TSE rejeitou a hipótese.") estavam
    // sendo descartadas e cortando substância real de matérias em desenvolvimento.
    let textParts = $('article p, article blockquote, [class*="content"] p, [class*="content"] blockquote, [class*="article"] p, [class*="corpo"] p, [class*="materia"] p, [itemprop="articleBody"] p, .entry-content p, main p, #content p, p, blockquote')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 20);

    // Tentativa 2: divs de conteúdo se parágrafos insuficientes
    if (textParts.join('').length < 200) {
      const divParts = $('[class*="content"], [class*="article"], [class*="corpo"], [class*="materia"], [class*="texto"], [itemprop="articleBody"], .entry-content, main, #content, #main')
        .find('p, div, blockquote')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 30 && !/<[a-z]/i.test(t));
      if (divParts.join('').length > textParts.join('').length) textParts = divParts;
    }

    // Cap 4000→7000 chars — 13/08/2026: matérias em desenvolvimento (ex: apuração +
    // declaração de fonte + resposta oficial) legitimamente passam de 4000 chars de
    // texto-fonte; cortar aí perdia o final da matéria antes mesmo de chegar na IA.
    let text = textParts.join("\n").slice(0, 7000);

    // Tentativa 3: og:description + og:title como fallback mínimo
    if (text.length < 100) {
      const ogTitle = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || '';
      const ogDesc  = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      if (ogTitle || ogDesc) {
        text = [ogTitle, ogDesc].filter(Boolean).join('. ');
      }
    }

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim() || "";

    return { text: text || "", image: imageUrl, title };
  } catch(e) {
    return { text: "", image: "", title: "" };
  }
}

function normalizeUrl(src, base) {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  try {
    const u = new URL(base);
    if (src.startsWith("//")) return u.protocol + src;
    if (src.startsWith("/")) return u.origin + src;
    return u.origin + "/" + src;
  } catch(_) { return src; }
}
