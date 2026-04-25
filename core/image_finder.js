// image_finder.js — Regra absoluta:
// Pessoa mencionada = foto dessa pessoa
// Instituição mencionada = foto dessa instituição
// Assunto específico = imagem do assunto
// Fallback = pool da categoria

const POOLS = {
  politica:      ["https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800","https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800","https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=800"],
  economia:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800","https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800"],
  negocios:      ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800","https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800"],
  investimentos: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800","https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800"],
  seguros:       ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800","https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800"],
  mercados:      ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800","https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800"],
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

// Busca foto no Wikipedia REST API — mais confiável que action=query
async function buscarFotoWikipedia(termo) {
  try {
    // Tentar pt.wikipedia primeiro, depois en.wikipedia
    for (const lang of ["pt","en"]) {
      const slug = encodeURIComponent(termo.trim().replace(/\s+/g, "_"));
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br; roberto@oterrasan.com.br)" },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      // Priorizar originalimage (maior qualidade) sobre thumbnail
      const img = data?.originalimage?.source || data?.thumbnail?.source;
      if (img && img.length > 10 && /\.(jpg|jpeg|png)/i.test(img)) return img;
    }
  } catch(_) {}
  return null;
}

// Extrai todas as entidades mencionadas no título
// Retorna lista ordenada por prioridade: pessoas primeiro, depois instituições, depois assuntos
function extrairEntidades(titulo) {
  const t = titulo;
  const tl = titulo.toLowerCase();
  const entidades = [];

  // Pessoas — nomes próprios (2+ palavras começando com maiúscula)
  const pessoaRegex = /\b([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+(?:de|da|do|dos|das|e)\s+)?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)?)\b/g;
  const stopPalavras = new Set(["Para","Com","Sem","Após","Ante","Nova","Novo","Mais","Menos","Grande","Pequeno","Alto","Baixo"]);
  let m;
  while ((m = pessoaRegex.exec(t)) !== null) {
    const nome = m[1];
    if (!stopPalavras.has(nome.split(" ")[0]) && nome.split(" ").length >= 2) {
      entidades.push({ termo: nome, prioridade: 1 });
    }
  }

  // Instituições e entidades conhecidas por palavras-chave
  const instituicoes = [
    ["kremlin", "Kremlin"],
    ["planalto", "Palácio do Planalto"],
    ["congresso nacional", "Congresso Nacional do Brasil"],
    ["senado federal", "Senado Federal do Brasil"],
    ["câmara dos deputados", "Câmara dos Deputados do Brasil"],
    ["stf", "Supremo Tribunal Federal"],
    ["supremo tribunal", "Supremo Tribunal Federal"],
    ["banco central", "Banco Central do Brasil"],
    ["federal reserve", "Federal Reserve"],
    ["petrobras", "Petrobras"],
    ["vale ", "Vale SA empresa"],
    ["embraer", "Embraer"],
    ["ibovespa", "Ibovespa"],
    ["b3 bolsa", "B3 bolsa valores"],
    ["receita federal", "Receita Federal do Brasil"],
    ["white house", "White House Washington"],
    ["casa branca", "White House Washington"],
    ["palmeiras", "Palmeiras futebol clube"],
    ["flamengo", "Flamengo futebol clube"],
    ["corinthians", "Corinthians futebol clube"],
    ["são paulo fc", "São Paulo futebol clube"],
    ["atletico mineiro", "Atlético Mineiro futebol"],
    ["grêmio", "Grêmio futebol clube"],
    ["fluminense", "Fluminense futebol clube"],
    ["vasco", "Vasco da Gama futebol"],
    ["botafogo", "Botafogo futebol clube"],
    ["santos fc", "Santos futebol clube"],
    ["bitcoin", "Bitcoin cryptocurrency"],
    ["posto de gasolina", "posto gasolina Brasil"],
    ["combustível", "combustível gasolina posto"],
    ["selic", "taxa selic gráfico"],
    ["dólar", "dólar moeda"],
    ["inflação", "inflação gráfico economia"],
    ["imposto de renda", "imposto de renda declaração"],
    ["sus", "Sistema Único de Saúde Brasil"],
    ["anvisa", "ANVISA Brasil"],
    ["copa do mundo", "Copa do Mundo futebol"],
    ["olimpíadas", "Olimpíadas"],
  ];

  for (const [chave, busca] of instituicoes) {
    if (tl.includes(chave)) {
      entidades.push({ termo: busca, prioridade: 2 });
    }
  }

  // Países mencionados
  const paises = [
    ["ucrânia", "Ucrânia"],["rússia", "Rússia"],["china", "China"],
    ["estados unidos", "Estados Unidos"],["eua", "Estados Unidos"],
    ["israel", "Israel"],["argentina", "Argentina"],["venezuela", "Venezuela"],
    ["alemanha", "Alemanha"],["frança", "França"],["reino unido", "Reino Unido"],
    ["japão", "Japão"],["índia", "Índia"],["turquia", "Turquia"],
    ["iran", "Irã"],["irã", "Irã"],["cuba", "Cuba"],
  ];

  for (const [chave, busca] of paises) {
    if (tl.includes(chave)) {
      entidades.push({ termo: busca, prioridade: 3 });
    }
  }

  return entidades.sort((a,b) => a.prioridade - b.prioridade);
}

export async function findImage(titulo, categoria, urlProibida = "") {
  const entidades = extrairEntidades(titulo);

  // Tentar cada entidade em ordem de prioridade
  for (const entidade of entidades) {
    const img = await buscarFotoWikipedia(entidade.termo);
    if (img && img !== urlProibida) return img;
  }

  // Fallback: pool da categoria
  const pool = POOLS[categoria] || POOLS["economia"];
  const candidatas = pool.filter(u => u !== urlProibida);
  return candidatas[Math.floor(Math.random() * candidatas.length)] || pool[0];
}
