// core/image_finder.js
// Busca imagem limpa e gratuita por palavras-chave
// Fontes em cascata: Wikimedia Commons → Openverse → fallback por categoria

// Pool de 5 imagens por categoria — rotação aleatória, nunca a mesma
const CAT_POOL = {
  politica:      ["https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80","https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80","https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80","https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80","https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800&q=80"],
  economia:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80","https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80","https://images.unsplash.com/photo-1624953587687-daf255b6b80a?w=800&q=80","https://images.unsplash.com/photo-1638913662529-1d2f1eb5b526?w=800&q=80"],
  negocios:      ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80","https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80","https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80","https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80","https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80"],
  investimentos: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80","https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80","https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80","https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80"],
  seguros:       ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80","https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80","https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&q=80","https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80","https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"],
  mercados:      ["https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80","https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80","https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80"],
  educacao:      ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80","https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80","https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80","https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80","https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80"],
  industria:     ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80","https://images.unsplash.com/photo-1565515267686-89a6c10a5cb8?w=800&q=80","https://images.unsplash.com/photo-1513828583688-c4eb04cd2ab9?w=800&q=80","https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80","https://images.unsplash.com/photo-1469289759076-d7a775b3f8b8?w=800&q=80"],
  tecnologia:    ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80","https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80","https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80","https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800&q=80","https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80"],
  esportes:      ["https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80","https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80","https://images.unsplash.com/photo-1540747913346-19212a729a45?w=800&q=80","https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"],
  saude:         ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80","https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80","https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=800&q=80","https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80","https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80"],
  familia:       ["https://images.unsplash.com/photo-1511895426328-dc8714191011?w=800&q=80","https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80","https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&q=80","https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80","https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=800&q=80"],
  tributacao:    ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80","https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80","https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800&q=80","https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80"],
  regulacao:     ["https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80","https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80"],
  internacional: ["https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80","https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=800&q=80","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80","https://images.unsplash.com/photo-1529400971008-f566de0db3ba?w=800&q=80","https://images.unsplash.com/photo-1551730459-92db2a308d6a?w=800&q=80"],
  parcerias:     ["https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80","https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80","https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80","https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80"],
  geral:         ["https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80","https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80","https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&q=80","https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80","https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"]
};

function randomFallback(categoria) {
  const pool = CAT_POOL[categoria] || CAT_POOL.geral;
  return pool[Math.floor(Math.random() * pool.length)];
}

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
    return randomFallback(categoria);
  }

  // 1. Wikimedia
  const wikiImg = await searchWikimedia(kw);
  if (wikiImg) return wikiImg;

  // 2. Openverse
  const openImg = await searchOpenverse(kw);
  if (openImg) return openImg;

  // 3. Fallback por categoria
  return randomFallback(categoria);
}
