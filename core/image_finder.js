// Busca imagem relevante para a matéria
// Prioridade: 1) Pessoa citada  2) Empresa/clube/entidade  3) Assunto específico  4) Pool por categoria

const POOLS = {
  politica:      ["https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800","https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800","https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800"],
  economia:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800","https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800"],
  negocios:      ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  investimentos: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800","https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"],
  seguros:       ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
  mercados:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800"],
  tecnologia:    ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800","https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800","https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800"],
  esportes:      ["https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800","https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"],
  saude:         ["https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800","https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800","https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800"],
  educacao:      ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800","https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800","https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800"],
  tributacao:    ["https://images.unsplash.com/photo-1607863680198-23d4b2565df0?w=800","https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  regulacao:     ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  industria:     ["https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800","https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800","https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800"],
  internacional: ["https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800","https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800"],
  familia:       ["https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800","https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800"],
  parcerias:     ["https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
};

// Extrai entidades do título+corpo para busca específica
function extrairEntidade(titulo, corpo) {
  const texto = (titulo + " " + (corpo || "")).slice(0, 500);

  // Nomes de pessoas — palavras maiúsculas consecutivas (padrão Nome Sobrenome)
  const pessoaMatch = texto.match(/\b([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3})\b/g);
  
  // Empresas e entidades conhecidas
  const empresaMatch = texto.match(/\b(Petrobras|Braskem|Ibovespa|B3|STF|Banco Central|BNDES|Senado|Câmara|OAB|ANS|SUSEP|CVM|Receita Federal|INSS|Fiesp|Febraban|Embraer|Vale|Itaú|Bradesco|Nubank|BTG|XP|Netflix|Apple|Microsoft|Google|Meta|Amazon|Tesla|BYD|Volkswagen|Fiat|Ford|Toyota|NBA|NFL|FIFA|CBF|Palmeiras|Flamengo|Corinthians|São Paulo|Santos|Cruzeiro|Atlético|Botafogo|Vasco|Grêmio|Internacional)\b/i);

  if (empresaMatch) return empresaMatch[0];

  // Filtrar nomes comuns e pegar o mais relevante
  const nomesFiltrados = (pessoaMatch || []).filter(n =>
    !["Para", "Esta", "Esse", "Essa", "Como", "Mais", "Mas", "Com", "Sem", "Dos", "Das", "Uma", "Uns", "Umas", "Novo", "Nova", "Toda", "Todo"].includes(n.split(" ")[0])
    && n.split(" ").length >= 2
  );

  if (nomesFiltrados.length > 0) return nomesFiltrados[0];
  return null;
}

async function buscarWikimedia(query) {
  try {
    const q = encodeURIComponent(query);
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.query?.search || [];

    for (const result of results) {
      const title = result.title;
      if (!title) continue;

      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const infoRes = await fetch(infoUrl, {
        headers: { "User-Agent": "OVCPortal/1.0" },
        signal: AbortSignal.timeout(5000)
      });
      if (!infoRes.ok) continue;
      const info = await infoRes.json();
      const pages = Object.values(info?.query?.pages || {});
      const imgUrl = pages[0]?.imageinfo?.[0]?.url;
      if (imgUrl && /\.(jpg|jpeg|png)/i.test(imgUrl) && !imgUrl.includes("Flag_of") && !imgUrl.includes("Coat_of")) {
        return imgUrl;
      }
    }
  } catch(_) {}
  return null;
}

export async function findImage(titulo, categoria, urlProibida = "") {
  // 1) Tentar imagem específica da entidade/pessoa citada
  const entidade = extrairEntidade(titulo, "");
  if (entidade && entidade.length > 3) {
    const img = await buscarWikimedia(entidade);
    if (img && img !== urlProibida) return img;
  }

  // 2) Tentar imagem do assunto do título
  const palavrasChave = titulo
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(w => w.length > 4)
    .slice(0, 3)
    .join(" ");

  if (palavrasChave.length > 5) {
    const img = await buscarWikimedia(palavrasChave);
    if (img && img !== urlProibida) return img;
  }

  // 3) Fallback: pool da categoria (rotativo)
  const pool = POOLS[categoria] || POOLS["economia"];
  const candidatas = pool.filter(u => u !== urlProibida);
  if (candidatas.length === 0) return pool[0];
  return candidatas[Math.floor(Math.random() * candidatas.length)];
}
