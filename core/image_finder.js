// core/image_finder.js
// Busca imagem limpa e gratuita por palavras-chave
// Fontes em cascata: Wikimedia Commons → Openverse → fallback por categoria

const CAT_FALLBACK = {
  politica:      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
  economia:      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  negocios:      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
  investimentos: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  seguros:       "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  mercados:      "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80",
  educacao:      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  industria:     "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  tecnologia:    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  esportes:      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
  saude:         "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  familia:       "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=800&q=80",
  tributacao:    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  regulacao:     "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  internacional: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80",
  parcerias:     "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80",
  geral:         "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"
};

// Extrair palavras-chave do título (remove palavras curtas e comuns)
function keywords(titulo) {
  const stopwords = new Set(['de','da','do','das','dos','em','no','na','nos','nas','para','por','com','que','se','uma','um','ao','aos','as','os','é','e','o','a']);
  return titulo
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 4)
    .join(" ");
}

// Wikimedia Commons — sem chave, imagens livres
async function searchWikimedia(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const r = await fetch(url, {
      headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" },
      signal: AbortSignal.timeout(8000)
    });
    const d = await r.json();
    const results = d?.query?.search || [];
    for (const result of results) {
      const title = encodeURIComponent(result.title);
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${title}&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`;
      const r2 = await fetch(infoUrl, {
        headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" },
        signal: AbortSignal.timeout(8000)
      });
      const d2 = await r2.json();
      const pages = d2?.query?.pages || {};
      for (const page of Object.values(pages)) {
        const ii = page?.imageinfo?.[0];
        if (!ii) continue;
        const mime = ii.mime || "";
        const imgUrl = ii.url || "";
        // Aceitar apenas JPEG e PNG, mínimo 200px
        if (!mime.includes("jpeg") && !mime.includes("png")) continue;
        if ((ii.width || 0) < 200) continue;
        // Rejeitar logos, ícones, bandeiras pequenas, portraits
        if (/logo|icon|flag|coat|seal|badge|portrait|autor|reporter/i.test(imgUrl)) continue;
        return imgUrl;
      }
    }
    return null;
  } catch { return null; }
}

// Openverse (WordPress) — sem chave, CC licensed
async function searchOpenverse(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://api.openverse.org/v1/images/?q=${q}&license_type=commercial&mature=false&page_size=5`;
    const r = await fetch(url, {
      headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" },
      signal: AbortSignal.timeout(8000)
    });
    const d = await r.json();
    const results = d?.results || [];
    for (const img of results) {
      const url = img.url || "";
      if (!url) continue;
      if (/logo|icon|badge|portrait/i.test(url)) continue;
      if ((img.width || 0) < 300) continue;
      return url;
    }
    return null;
  } catch { return null; }
}

// Função principal — tenta fontes em cascata, cai no fallback por categoria
export async function findImage(titulo, categoria) {
  const kw = keywords(titulo);
  if (kw.length < 3) {
    return CAT_FALLBACK[categoria] || CAT_FALLBACK.geral;
  }

  // 1. Wikimedia
  const wikiImg = await searchWikimedia(kw);
  if (wikiImg) return wikiImg;

  // 2. Openverse
  const openImg = await searchOpenverse(kw);
  if (openImg) return openImg;

  // 3. Fallback por categoria
  return CAT_FALLBACK[categoria] || CAT_FALLBACK.geral;
}
