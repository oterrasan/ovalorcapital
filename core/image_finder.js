// Busca imagem relevante — extrai entidade principal do título e busca foto específica

const POOLS = {
  politica:      ["https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800","https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800","https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800"],
  economia:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800","https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800"],
  negocios:      ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  investimentos: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800","https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"],
  seguros:       ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
  mercados:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800"],
  tecnologia:    ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800","https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800","https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800"],
  esportes:      ["https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800","https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800"],
  saude:         ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800","https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800","https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800"],
  educacao:      ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800","https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800","https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800"],
  tributacao:    ["https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800","https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  regulacao:     ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  industria:     ["https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800","https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800","https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800"],
  internacional: ["https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800","https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800"],
  familia:       ["https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800","https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800"],
  variedades:    ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800","https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800","https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800"],
  parcerias:     ["https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"],
};

// Mapa de entidades conhecidas → imagem fixa e confiável
const ENTIDADES_FIXAS = {
  // Lugares / Instituições
  "kremlin":       "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Moscow_July_2011-7a.jpg/1280px-Moscow_July_2011-7a.jpg",
  "white house":   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/WhiteHouseSouthFacade.JPG/1280px-WhiteHouseSouthFacade.JPG",
  "casa branca":   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/WhiteHouseSouthFacade.JPG/1280px-WhiteHouseSouthFacade.JPG",
  "congresso":     "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Congresso_Nacional_do_Brasil.jpg/1280px-Congresso_Nacional_do_Brasil.jpg",
  "senado":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Congresso_Nacional_do_Brasil.jpg/1280px-Congresso_Nacional_do_Brasil.jpg",
  "câmara":        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Congresso_Nacional_do_Brasil.jpg/1280px-Congresso_Nacional_do_Brasil.jpg",
  "stf":           "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/STF_Fachada.jpg/1280px-STF_Fachada.jpg",
  "supremo":       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/STF_Fachada.jpg/1280px-STF_Fachada.jpg",
  "planalto":      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Palacio_do_planalto2.jpg/1280px-Palacio_do_planalto2.jpg",
  "ibovespa":      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BM%26FBOVESPA.jpg/1280px-BM%26FBOVESPA.jpg",
  "b3":            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BM%26FBOVESPA.jpg/1280px-BM%26FBOVESPA.jpg",
  "bolsa":         "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BM%26FBOVESPA.jpg/1280px-BM%26FBOVESPA.jpg",
  "banco central": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Banco_Central_do_Brasil_%28sede%29.jpg/1280px-Banco_Central_do_Brasil_%28sede%29.jpg",
  "fed":           "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg/1280px-Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg",
  "federal reserve":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg/1280px-Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg",
  "petrobras":     "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Petrobras_logo.svg/1280px-Petrobras_logo.svg.png",
  "vale":          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/thirty/Vale_logo.svg/1280px-Vale_logo.svg.png",
  "receita federal":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Receita_Federal_do_Brasil.jpg/800px-Receita_Federal_do_Brasil.jpg",
  // Países / Regiões
  "ucrânia":       "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Ukraine.svg/1280px-Flag_of_Ukraine.svg.png",
  "rússia":        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/1280px-Flag_of_Russia.svg.png",
  "china":         "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Flag_of_the_People%27s_Republic_of_China.svg/1280px-Flag_of_the_People%27s_Republic_of_China.svg.png",
  "estados unidos":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_United_States_%28DoS_ECA_Color_Standard%29.svg/1280px-Flag_of_the_United_States_%28DoS_ECA_Color_Standard%29.svg.png",
  "eua":           "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Flag_of_the_United_States_%28DoS_ECA_Color_Standard%29.svg/1280px-Flag_of_the_United_States_%28DoS_ECA_Color_Standard%29.svg.png",
  "israel":        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Israel.svg/1280px-Flag_of_Israel.svg.png",
  "argentina":     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/1280px-Flag_of_Argentina.svg.png",
  "europa":        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/1280px-Flag_of_Europe.svg.png",
  // Times de futebol
  "palmeiras":     "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/800px-Palmeiras_logo.svg.png",
  "flamengo":      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_logo.svg/800px-Flamengo_logo.svg.png",
  "corinthians":   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Sport_Club_Corinthians_Paulista.svg/800px-Sport_Club_Corinthians_Paulista.svg.png",
  "são paulo":     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Escudo_do_S%C3%A3o_Paulo_Futebol_Clube.svg/800px-Escudo_do_S%C3%A3o_Paulo_Futebol_Clube.svg.png",
  "atletico":      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Atletico_mineiro_galo.svg/800px-Atletico_mineiro_galo.svg.png",
  "grêmio":        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_logo.svg/800px-Gr%C3%AAmio_Foot-Ball_Porto_Alegrense_logo.svg.png",
  "internacional": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Esporte_Clube_Internacional.svg/800px-Esporte_Clube_Internacional.svg.png",
  // Temas econômicos
  "selic":         "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
  "bitcoin":       "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/800px-Bitcoin.svg.png",
  "dólar":         "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800",
  "inflação":      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800",
  "irpf":          "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800",
  "imposto":       "https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800",
};

// Extrai palavras-chave relevantes do título
function extrairChave(titulo) {
  const t = titulo.toLowerCase();

  // Verificar entidades fixas primeiro
  for (const [chave, url] of Object.entries(ENTIDADES_FIXAS)) {
    if (t.includes(chave)) return { tipo: "fixa", url };
  }

  // Extrair palavras mais longas e relevantes para busca no Wikimedia
  const stopwords = new Set(["para","com","sem","por","que","uma","uns","das","dos","nos","nas","seu","sua","seus","suas","como","mais","mas","foi","são","esta","esse","essa","após","ante","entre","sobre","pelo","pela","pelos","pelas","tem","ter","vai","vão","num","numa","pode","deve","será"]);
  const palavras = t.replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 4);

  return { tipo: "busca", query: palavras.join(" ") };
}

async function buscarWikimedia(query) {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=8&format=json&origin=*`,
      { headers: { "User-Agent": "OVCPortal/1.0" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.query?.search || [];

    for (const result of results) {
      // Ignorar ícones, logos SVG genéricos, flags
      if (/flag|bandeira|icon|logo|coat|arms|seal|emblem/i.test(result.title) && !/brasil|brazil/i.test(result.title)) continue;

      const infoRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
        { headers: { "User-Agent": "OVCPortal/1.0" }, signal: AbortSignal.timeout(4000) }
      );
      if (!infoRes.ok) continue;
      const info = await infoRes.json();
      const pages = Object.values(info?.query?.pages || {});
      const imgUrl = pages[0]?.imageinfo?.[0]?.url;

      if (imgUrl && /\.(jpg|jpeg|png)/i.test(imgUrl)) {
        return imgUrl;
      }
    }
  } catch(_) {}
  return null;
}

export async function findImage(titulo, categoria, urlProibida = "") {
  // 1) Verificar mapa de entidades fixas
  const chave = extrairChave(titulo);

  if (chave.tipo === "fixa") {
    const url = chave.url;
    if (url && url !== urlProibida) return url;
  }

  // 2) Buscar no Wikimedia com palavras-chave do título
  if (chave.tipo === "busca" && chave.query.length > 3) {
    const img = await buscarWikimedia(chave.query);
    if (img && img !== urlProibida) return img;
  }

  // 3) Fallback: pool da categoria
  const pool = POOLS[categoria] || POOLS["economia"];
  const candidatas = pool.filter(u => u !== urlProibida);
  return candidatas[Math.floor(Math.random() * candidatas.length)] || pool[0];
}
