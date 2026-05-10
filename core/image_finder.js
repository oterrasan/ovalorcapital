// image_finder.js — Busca imagem relevante para o artigo
// Prioridade: Wikipedia (entidade do artigo) → Wikimedia Commons → Pixabay → Pool
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const PIXABAY_KEY = process.env.PIXABAY_KEY || "47979250-ae3f5a24b1e3f7e2fce76eab5";
const PEXELS_KEY  = process.env.PEXELS_KEY  || "";

// ─── POOL DE FALLBACK (usado SOMENTE se todas as APIs falharem ou timeout) ───
const POOLS = {
  politica:      ["https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800","https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800"],
  economia:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800"],
  negocios:      ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"],
  investimentos: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800"],
  seguros:       ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
  mercados:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800"],
  tecnologia:    ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800","https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800"],
  esportes:      ["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"],
  saude:         ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800","https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800"],
  educacao:      ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800","https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800"],
  tributacao:    ["https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800","https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800"],
  regulacao:     ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"],
  industria:     ["https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800","https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800"],
  internacional: ["https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800","https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800"],
  familia:       ["https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800"],
  variedades:    ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800","https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"],
  parcerias:     ["https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"],
};

// ─── FILTROS ─────────────────────────────────────────────────────────────────
const BLOQUEIO_PATTERNS = [
  '/autor/', '/autora/', '/reporter/', '/jornalista/',
  '/colunista/', '/editor/', '/author/', '/byline/', '/perfil/',
  '/profile/', '/headshot/', '/avatar/', '/staff/', '/equipe/',
  'foto-autor', 'foto-reporter', 'headshot', 'profile-pic', 'author-photo',
  'logo', 'icon', 'favicon', 'banner', 'marca',
];

const COMPETITOR_HOSTS = new Set([
  'glbimg.com','globo.com','g1.globo.com','ge.globo.com','valor.com.br',
  'uol.com.br','folha.uol.com.br','estadao.com.br','r7.com','record.com.br',
  'sbt.com.br','jovempan.com.br','band.com.br','cnnbrasil.com.br',
  'veja.com.br','exame.com','cartacapital.com.br','poder360.com.br',
  'gazetadopovo.com.br','metropoles.com','seudinheiro.com','infomoney.com.br',
  'terra.com.br','ig.com.br','reuters.com','ap.org','ebc.com.br',
]);

function isImagemBloqueada(url) {
  if (!url || url.length < 12) return true;
  const u = url.toLowerCase();
  if (BLOQUEIO_PATTERNS.some(p => u.includes(p))) return true;
  if (/\.(svg|gif|ico|bmp)(\?|$)/i.test(u)) return true;
  if (/\b(16|32|48|64)x(16|32|48|64)\b/.test(u)) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if ([...COMPETITOR_HOSTS].some(d => host === d || host.endsWith('.' + d))) return true;
  } catch(_) {}
  return false;
}

// ─── EXTRAÇÃO DE ENTIDADES DO TÍTULO ─────────────────────────────────────────
function extrairEntidades(titulo) {
  if (!titulo) return [];

  const ALIASES = {
    'lula': 'Luiz Inácio Lula da Silva',
    'bolsonaro': 'Jair Bolsonaro',
    'temer': 'Michel Temer',
    'dilma': 'Dilma Rousseff',
    'fhc': 'Fernando Henrique Cardoso',
    'haddad': 'Fernando Haddad',
    'guedes': 'Paulo Guedes',
    'meirelles': 'Henrique Meirelles',
    'campos neto': 'Roberto Campos Neto',
    'moraes': 'Alexandre de Moraes',
    'barroso': 'Luís Roberto Barroso',
    'flavio dino': 'Flávio Dino',
    'stf': 'Supremo Tribunal Federal',
    'stj': 'Superior Tribunal de Justiça',
    'tse': 'Tribunal Superior Eleitoral',
    'tcu': 'Tribunal de Contas da União',
    'bacen': 'Banco Central do Brasil',
    'banco central': 'Banco Central do Brasil',
    'petrobras': 'Petrobras',
    'vale': 'Vale S.A.',
    'embraer': 'Embraer',
    'bradesco': 'Banco Bradesco',
    'itaú': 'Itaú Unibanco',
    'itau': 'Itaú Unibanco',
    'bb': 'Banco do Brasil',
    'banco do brasil': 'Banco do Brasil',
    'caixa': 'Caixa Econômica Federal',
    'bndes': 'BNDES',
    'ibge': 'IBGE',
    'anatel': 'Anatel',
    'aneel': 'Aneel',
    'anvisa': 'Anvisa',
    'receita federal': 'Receita Federal do Brasil',
    'trump': 'Donald Trump',
    'biden': 'Joe Biden',
    'xi jinping': 'Xi Jinping',
    'putin': 'Vladimir Putin',
    'zelensky': 'Volodymyr Zelensky',
    'macron': 'Emmanuel Macron',
    'elon musk': 'Elon Musk',
    'amazon': 'Amazon',
    'microsoft': 'Microsoft',
    'google': 'Google',
    'apple': 'Apple Inc',
    'meta': 'Meta Platforms',
    'openai': 'OpenAI',
    'nvidia': 'Nvidia',
    'congresso': 'Congresso Nacional do Brasil',
    'senado': 'Senado Federal do Brasil',
    'câmara': 'Câmara dos Deputados do Brasil',
    'planalto': 'Palácio do Planalto',
    'ibovespa': 'Ibovespa',
    'b3': 'B3 bolsa de valores',
    'selic': 'taxa Selic Brasil',
    'pcc': 'Primeiro Comando da Capital',
    'cv': 'Comando Vermelho',
  };

  const tLower = titulo.toLowerCase();
  const encontrados = [];

  for (const [alias, nome] of Object.entries(ALIASES)) {
    if (tLower.includes(alias)) {
      encontrados.push(nome);
      if (encontrados.length >= 2) break;
    }
  }

  if (encontrados.length >= 2) return encontrados.slice(0, 2);

  const seqMaiusculas = titulo.match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3}/g) || [];
  for (const seq of seqMaiusculas) {
    if (seq.split(' ').length >= 2) encontrados.push(seq);
    if (encontrados.length >= 2) break;
  }

  const siglas = titulo.match(/\b[A-Z]{3,6}\b/g) || [];
  for (const sigla of siglas) {
    const mapped = ALIASES[sigla.toLowerCase()];
    if (mapped && !encontrados.includes(mapped)) {
      encontrados.push(mapped);
      if (encontrados.length >= 2) break;
    }
  }

  return [...new Set(encontrados)].slice(0, 2);
}

// ─── FONTE 1: WIKIPEDIA ──────────────────────────────────────────────────────
async function buscarWikipedia(entityName, imagensUsadas) {
  for (const lang of ['pt', 'en']) {
    try {
      const encoded = encodeURIComponent(entityName);
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'OVCPortal/1.0 (ovalorcapital.com.br)' },
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const img = data?.originalimage?.source || data?.thumbnail?.source;
      if (!img) continue;
      if (isImagemBloqueada(img)) continue;
      if (!/\.(jpg|jpeg|png|webp)/i.test(img) && !img.includes('upload.wikimedia')) continue;
      const imgGrande = img.replace(/\/\d+px-/, '/1000px-');
      if (!imagensUsadas.has(imgGrande)) return imgGrande;
      if (!imagensUsadas.has(img)) return img;
    } catch(_) {}
  }
  return null;
}

// ─── FONTE 2: WIKIMEDIA COMMONS — UMA ÚNICA CHAMADA com generator ────────────
// Antes: 1 chamada de busca + até 15 chamadas individuais de info = até 90s
// Agora: 1 chamada só com generator+prop=imageinfo = max ~6s
async function buscarWikimedia(query, imagensUsadas) {
  try {
    const q = encodeURIComponent(query);
    const url = [
      'https://commons.wikimedia.org/w/api.php',
      '?action=query',
      '&generator=search',
      `&gsrsearch=${q}`,
      '&gsrnamespace=6',
      '&gsrlimit=8',
      '&prop=imageinfo',
      '&iiprop=url|size',
      '&format=json',
      '&origin=*'
    ].join('');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OVCPortal/1.0 (ovalorcapital.com.br)' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});

    for (const page of pages) {
      const title = page.title || '';
      if (/flag|bandeira|icon|logo|coat|arms|seal|emblem|svg|mapa|map|diagram|schema/i.test(title)) continue;
      const imgInfo = page?.imageinfo?.[0];
      const img = imgInfo?.url;
      if (!img) continue;
      if (isImagemBloqueada(img)) continue;
      if (!/\.(jpg|jpeg|png)/i.test(img)) continue;
      if (imgInfo?.width && imgInfo.width < 400) continue;
      if (!imagensUsadas.has(img)) return img;
    }
  } catch(_) {}
  return null;
}

// ─── FONTE 3: PIXABAY ────────────────────────────────────────────────────────
async function buscarPixabay(query, imagensUsadas) {
  if (!PIXABAY_KEY) return null;
  try {
    const q = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&min_width=800&per_page=10&safesearch=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    for (const hit of (data?.hits || [])) {
      const img = hit.largeImageURL || hit.webformatURL;
      if (img && !imagensUsadas.has(img) && !isImagemBloqueada(img)) return img;
    }
  } catch(_) {}
  return null;
}

// ─── FONTE 4: PEXELS ─────────────────────────────────────────────────────────
async function buscarPexels(query, imagensUsadas) {
  if (!PEXELS_KEY) return null;
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${q}&per_page=10&orientation=landscape`;
    const res = await fetch(url, {
      headers: { 'Authorization': PEXELS_KEY },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const foto of (data?.photos || [])) {
      const img = foto?.src?.large || foto?.src?.medium;
      if (img && !imagensUsadas.has(img) && !isImagemBloqueada(img)) return img;
    }
  } catch(_) {}
  return null;
}

// ─── TERMOS DE BUSCA EM INGLÊS ────────────────────────────────────────────────
function topicosEmIngles(titulo, categoria) {
  const mapa = {
    'economia': 'economy finance brazil',
    'política': 'politics government brazil',
    'politica': 'politics government brazil',
    'inflação': 'inflation money economy',
    'inflacao': 'inflation money economy',
    'selic': 'interest rate central bank',
    'pib': 'gdp economic growth',
    'investimentos': 'investments stock market finance',
    'seguros': 'insurance healthcare',
    'mercados': 'financial markets trading',
    'tributos': 'taxes fiscal policy',
    'tributação': 'taxes fiscal policy',
    'tributacao': 'taxes fiscal policy',
    'tecnologia': 'technology innovation digital',
    'saúde': 'healthcare medicine hospital',
    'saude': 'healthcare medicine hospital',
    'educação': 'education school university',
    'educacao': 'education school university',
    'esportes': 'sports athletes competition',
    'indústria': 'industry manufacturing factory',
    'industria': 'industry manufacturing factory',
    'agronegócio': 'agriculture farm harvest',
    'agronegocio': 'agriculture farm harvest',
    'imóveis': 'real estate building construction',
    'imoveis': 'real estate building construction',
    'segurança': 'security police law enforcement',
    'seguranca': 'security police law enforcement',
    'internacional': 'international diplomacy world politics',
    'esg': 'sustainability environment green energy',
    'defesa': 'military defense armed forces',
    'família': 'family children home',
    'familia': 'family children home',
    'cultura': 'culture art music',
    'variedades': 'lifestyle entertainment',
  };
  const t = titulo.toLowerCase();
  for (const [termo, en] of Object.entries(mapa)) {
    if (t.includes(termo)) return en;
  }
  const catMap = {
    politica:'politics brazil',economia:'economy finance',negocios:'business meeting',
    investimentos:'investment finance chart',seguros:'insurance contract',
    mercados:'stock market trading',tecnologia:'technology digital',
    saude:'healthcare medicine',educacao:'education learning',
    esportes:'sports athlete',industria:'industry factory',
    familia:'family home',tributacao:'tax finance',regulacao:'regulation law',
    internacional:'international world',variedades:'lifestyle',
    investigativo:'investigation law',seguranca:'security police',
    cultura:'culture art',profissoes:'professional career',
    vagas:'job work employment',concursos:'exam study',
    imoveis:'real estate building',parcerias:'partnership business',
    esg:'sustainability green',defesa:'military defense',
    religiao:'church faith spirituality',
  };
  return catMap[categoria] || 'brazil news';
}

// ─── IMAGENS JÁ USADAS ────────────────────────────────────────────────────────
async function getImagensUsadas() {
  try {
    const { data } = await supabase
      .from('posts')
      .select('imagem')
      .not('imagem', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);
    return new Set((data || []).map(p => p.imagem).filter(Boolean));
  } catch(_) {
    return new Set();
  }
}

// ─── BUSCA INTERNA (sem timeout) ─────────────────────────────────────────────
async function _buscarImagem(titulo, categoria) {
  const imagensUsadas = await getImagensUsadas();

  const entidades = extrairEntidades(titulo);

  // Wikipedia por entidade
  for (const entidade of entidades) {
    try {
      const img = await buscarWikipedia(entidade, imagensUsadas);
      if (img) return img;
    } catch(_) {}
  }

  // Wikimedia Commons por entidade
  for (const entidade of entidades) {
    try {
      const img = await buscarWikimedia(entidade, imagensUsadas);
      if (img) return img;
    } catch(_) {}
  }

  // Wikimedia Commons por tema
  try {
    const img = await buscarWikimedia(titulo, imagensUsadas);
    if (img) return img;
  } catch(_) {}

  // Pixabay
  const termoEn = topicosEmIngles(titulo, categoria);
  try {
    const img = await buscarPixabay(termoEn, imagensUsadas);
    if (img) return img;
  } catch(_) {}

  // Pexels
  try {
    const img = await buscarPexels(termoEn, imagensUsadas);
    if (img) return img;
  } catch(_) {}

  return null;
}

// ─── EXPORTAÇÃO PRINCIPAL — com timeout de 10s ────────────────────────────────
export async function findImage(titulo, categoria, _urlProibida = '', _urlOriginal = '') {
  const pool = POOLS[categoria] || POOLS['economia'];
  const fallback = pool[Math.floor(Math.random() * pool.length)];

  try {
    const resultado = await Promise.race([
      _buscarImagem(titulo, categoria),
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
    return resultado || fallback;
  } catch(_) {
    return fallback;
  }
}
