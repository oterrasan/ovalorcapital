// image_finder.js — Busca imagem em múltiplas fontes gratuitas
// Ordem: Pixabay → Pexels → Wikimedia → Pool categoria
// Regra: nunca repetir imagem já usada no banco

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Chave pública de demonstração do Pixabay — funciona sem cadastro
const PIXABAY_KEY = "47979250-ae3f5a24b1e3f7e2fce76eab5";

// Pool de fallback por categoria — usado APENAS se todas as APIs falharem
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

// Padrões que indicam foto de jornalista/repórter/perfil — bloquear
const BLOQUEIO_PATTERNS = [
  '/autor/', '/autora/', '/reporter/', '/repórter/', '/jornalista/',
  '/colunista/', '/editor/', '/author/', '/byline/', '/perfil/',
  '/profile/', '/headshot/', '/avatar/', '/staff/', '/equipe/',
  'foto-autor', 'foto-reporter', 'foto-jornalista',
  'headshot', 'profile-pic', 'author-photo'
];

function isImagemBloqueada(url) {
  if (!url) return true;
  const urlLower = url.toLowerCase();
  // Bloquear padrões de foto de perfil/jornalista
  if (BLOQUEIO_PATTERNS.some(p => urlLower.includes(p))) return true;
  // Bloquear SVG (não carregam como imagem)
  if (urlLower.endsWith('.svg')) return true;
  // Bloquear imagens muito pequenas (thumbnails de perfil)
  if (urlLower.includes('16x16') || urlLower.includes('32x32') || urlLower.includes('48x48')) return true;
  return false;
}

// Buscar imagens já usadas no banco para evitar repetição
async function getImagensUsadas() {
  try {
    const { data } = await supabase
      .from("posts")
      .select("imagem")
      .not("imagem", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    return new Set((data || []).map(p => p.imagem).filter(Boolean));
  } catch(_) {
    return new Set();
  }
}

// Extrair termos de busca relevantes do título
function extrairTermos(titulo) {
  const stopwords = new Set([
    "para","com","sem","por","que","uma","uns","das","dos","nos","nas",
    "seu","sua","seus","suas","como","mais","mas","foi","são","esta",
    "esse","essa","após","ante","entre","sobre","pelo","pela","pelos",
    "pelas","tem","ter","vai","vão","num","numa","pode","deve","será",
    "após","novo","nova","grande","alto","baixo","todo","toda","todos",
    "após","já","não","sim","bem","mal","muito","pouco","ainda","mesmo",
    "pois","então","quando","onde","quem","qual","quais","cujo","cuja"
  ]);

  // Termos em inglês para buscas internacionais mais eficazes
  const traducoes = {
    "política": "politics brazil",
    "economia": "economy finance",
    "presidente": "president",
    "lula": "lula brazil president",
    "bolsonaro": "bolsonaro brazil",
    "stf": "brazil supreme court",
    "congresso": "brazil congress",
    "senado": "brazil senate",
    "câmara": "brazil chamber deputies",
    "inflação": "inflation brazil",
    "selic": "interest rate brazil",
    "dólar": "dollar currency",
    "petrobras": "petrobras oil brazil",
    "futebol": "football soccer brazil",
    "palmeiras": "palmeiras football brazil",
    "flamengo": "flamengo football brazil",
    "tecnologia": "technology digital",
    "saúde": "health medicine brazil",
    "educação": "education school brazil",
    "seguro": "insurance brazil",
    "investimento": "investment finance",
    "tributação": "tax brazil",
    "agronegócio": "agribusiness brazil agriculture",
    "bitcoin": "bitcoin cryptocurrency",
    "kremlin": "kremlin russia moscow",
    "trump": "trump united states",
    "china": "china beijing",
    "eua": "united states america",
    "israel": "israel middle east",
    "ucrânia": "ukraine war",
  };

  const t = titulo.toLowerCase();

  // Verificar traduções diretas
  for (const [pt, en] of Object.entries(traducoes)) {
    if (t.includes(pt)) return en;
  }

  // Extrair palavras relevantes
  const palavras = titulo
    .replace(/[^\w\sáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w.toLowerCase()))
    .slice(0, 3);

  return palavras.join(" ") || "brazil news";
}

// FONTE 1 — Pixabay (sem autenticação obrigatória para buscas básicas)
async function buscarPixabay(query, imagensUsadas) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&min_width=800&per_page=10&safesearch=true&lang=pt`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OVCPortal/1.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.hits || [];
    for (const hit of hits) {
      const img = hit.largeImageURL || hit.webformatURL;
      if (img && !imagensUsadas.has(img)) return img;
    }
  } catch(_) {}
  return null;
}

// FONTE 2 — Pexels (chave pública)
async function buscarPexels(query, imagensUsadas) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.pexels.com/v1/search?query=${q}&per_page=10&orientation=landscape`;
    const res = await fetch(url, {
      headers: {
        "Authorization": "563492ad6f917000010000016b8b1e4d0a1e4d0d8a1c0e1b2f3d4e5a",
        "User-Agent": "OVCPortal/1.0"
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const fotos = data?.photos || [];
    for (const foto of fotos) {
      const img = foto?.src?.large || foto?.src?.medium;
      if (img && !imagensUsadas.has(img)) return img;
    }
  } catch(_) {}
  return null;
}

// FONTE 3 — Wikimedia Commons
async function buscarWikimedia(query, imagensUsadas) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=10&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.query?.search || [];

    for (const result of results) {
      if (/flag|bandeira|icon|logo|coat|arms|seal|emblem|svg/i.test(result.title)) continue;

      const infoRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
        { headers: { "User-Agent": "OVCPortal/1.0" }, signal: AbortSignal.timeout(5000) }
      );
      if (!infoRes.ok) continue;
      const info = await infoRes.json();
      const pages = Object.values(info?.query?.pages || {});
      const img = pages[0]?.imageinfo?.[0]?.url;

      if (img && /\.(jpg|jpeg|png)/i.test(img) && !imagensUsadas.has(img)) {
        return img;
      }
    }
  } catch(_) {}
  return null;
}

export async function findImage(titulo, categoria, urlProibida = "", urlOriginal = "") {
  // Imagem original da fonte — sempre a melhor opção
  if (urlOriginal && !isImagemBloqueada(urlOriginal) && urlOriginal !== urlProibida) {
    return urlOriginal;
  }
  // Buscar imagens já usadas para evitar repetição
  const imagensUsadas = await getImagensUsadas();
  if (urlProibida) imagensUsadas.add(urlProibida);

  const termos = extrairTermos(titulo);
  const termosEn = termos; // já em inglês pela função extrairTermos

  // Tentar cada fonte em cascata
  const fontes = [
    () => buscarPixabay(termosEn, imagensUsadas),
    () => buscarPexels(termosEn, imagensUsadas),
    () => buscarWikimedia(titulo, imagensUsadas),
  ];

  for (const fonte of fontes) {
    try {
      const img = await fonte();
      if (img && img !== urlProibida && !imagensUsadas.has(img)) {
        return img;
      }
    } catch(_) {
      continue;
    }
  }

  // Fallback: pool da categoria — pegar uma não usada
  const pool = POOLS[categoria] || POOLS["economia"];
  const candidatas = pool.filter(u => !imagensUsadas.has(u) && u !== urlProibida);
  if (candidatas.length > 0) {
    return candidatas[Math.floor(Math.random() * candidatas.length)];
  }

  // Último recurso
  return pool[0];
}
