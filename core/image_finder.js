// image_finder.js - Busca imagem relevante para o artigo.
// Regra editorial: imagem errada e pior do que nenhuma imagem.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const PIXABAY_KEY = process.env.PIXABAY_KEY || "47979250-ae3f5a24b1e3f7e2fce76eab5";
const PEXELS_KEY = process.env.PEXELS_KEY || "";

const STOCK_SAFE_CATEGORIES = new Set([
  "economia", "negocios", "investimentos", "seguros", "mercados", "educacao",
  "industria", "tecnologia", "saude", "familia", "tributacao", "regulacao",
  "parcerias", "variedades", "cultura", "profissoes", "vagas", "concursos",
  "imoveis", "esg", "religiao", "radar"
]);

const SENSITIVE_TITLE_RE = /(agress|acus|crime|pris[aã]o|morte|morre|ferid|viol[eê]ncia|guerra|ataque|terror|homic[ií]dio|assassin|queda|avi[aã]o|acidente|sequest|abuso|den[úu]ncia|corrup|opera[cç][aã]o|pol[ií]cia|policial|manifest|protest|pcc|comando vermelho|fac[cç][aã]o)/i;

const BLOQUEIO_PATTERNS = [
  "/autor/", "/autora/", "/reporter/", "/jornalista/", "/colunista/",
  "/editor/", "/author/", "/byline/", "/perfil/", "/profile/", "/headshot/",
  "/avatar/", "/staff/", "/equipe/", "foto-autor", "foto-reporter",
  "headshot", "profile-pic", "author-photo", "logo", "icon", "favicon",
  "banner", "marca", "vector", "ilustra", "illustration", "diagram",
  "diagrama", "infograph", "infografia", "cartoon", "drawing", "clipart",
  "clip-art", "clip_art", "sketch", "esquema", "graphic-design", "template",
  "stock-illustr", "shutterstock", "gettyimages", "lh3.googleusercontent",
  "lh4.googleusercontent", "lh5.googleusercontent", "lh6.googleusercontent",
  "yt3.ggpht", "googlelogo", "google_logo", "google-logo",
  "gstatic.com/images", "ssl.gstatic", "encrypted-tbn", "placeholder",
  "default-image", "no-image", "sem-imagem"
];

const COMPETITOR_HOSTS = new Set([
  "glbimg.com", "globo.com", "g1.globo.com", "ge.globo.com", "valor.com.br",
  "uol.com.br", "folha.uol.com.br", "estadao.com.br", "r7.com",
  "record.com.br", "sbt.com.br", "jovempan.com.br", "band.com.br",
  "cnnbrasil.com.br", "veja.com.br", "exame.com", "cartacapital.com.br",
  "poder360.com.br", "gazetadopovo.com.br", "metropoles.com",
  "seudinheiro.com", "infomoney.com.br", "terra.com.br", "ig.com.br",
  "reuters.com", "ap.org"
]);

const ALIASES = {
  "flávio bolsonaro": "Flávio Bolsonaro",
  "flavio bolsonaro": "Flávio Bolsonaro",
  "eduardo bolsonaro": "Eduardo Bolsonaro",
  "carlos bolsonaro": "Carlos Bolsonaro",
  "jair bolsonaro": "Jair Bolsonaro",
  "bolsonaro": "Jair Bolsonaro",
  "lula": "Luiz Inácio Lula da Silva",
  "temer": "Michel Temer",
  "dilma": "Dilma Rousseff",
  "fhc": "Fernando Henrique Cardoso",
  "haddad": "Fernando Haddad",
  "guedes": "Paulo Guedes",
  "meirelles": "Henrique Meirelles",
  "campos neto": "Roberto Campos Neto",
  "moraes": "Alexandre de Moraes",
  "barroso": "Luís Roberto Barroso",
  "flavio dino": "Flávio Dino",
  "stf": "Supremo Tribunal Federal",
  "stj": "Superior Tribunal de Justiça",
  "tse": "Tribunal Superior Eleitoral",
  "tcu": "Tribunal de Contas da União",
  "bacen": "Banco Central do Brasil",
  "banco central": "Banco Central do Brasil",
  "congresso": "Congresso Nacional do Brasil",
  "senado": "Senado Federal do Brasil",
  "câmara": "Câmara dos Deputados do Brasil",
  "camara": "Câmara dos Deputados do Brasil",
  "planalto": "Palácio do Planalto",
  "petrobras": "Petrobras",
  "vale": "Vale S.A.",
  "embraer": "Embraer",
  "itaú": "Itaú Unibanco",
  "itau": "Itaú Unibanco",
  "banco do brasil": "Banco do Brasil",
  "caixa": "Caixa Econômica Federal",
  "bndes": "BNDES",
  "ibge": "IBGE",
  "anatel": "Anatel",
  "aneel": "Aneel",
  "anvisa": "Anvisa",
  "receita federal": "Receita Federal do Brasil",
  "trump": "Donald Trump",
  "biden": "Joe Biden",
  "xi jinping": "Xi Jinping",
  "putin": "Vladimir Putin",
  "zelensky": "Volodymyr Zelensky",
  "macron": "Emmanuel Macron",
  "elon musk": "Elon Musk",
  "amazon": "Amazon",
  "microsoft": "Microsoft",
  "google": "Google",
  "apple": "Apple Inc",
  "meta": "Meta Platforms",
  "openai": "OpenAI",
  "nvidia": "Nvidia",
  "pcc": "Primeiro Comando da Capital",
  "cv": "Comando Vermelho"
};

const CATEGORY_QUERY = {
  economia: "economy finance business",
  negocios: "business meeting company",
  investimentos: "investment finance stock market",
  seguros: "insurance contract family protection",
  mercados: "financial market trading screen",
  educacao: "education school students",
  industria: "industry factory production",
  tecnologia: "technology data artificial intelligence",
  saude: "healthcare doctor hospital",
  familia: "family home parents children",
  tributacao: "tax accounting finance",
  regulacao: "law regulation documents",
  parcerias: "business partnership handshake",
  variedades: "lifestyle culture city",
  cultura: "culture art audience",
  profissoes: "professional career portrait workplace",
  vagas: "job interview workplace",
  concursos: "exam study classroom",
  imoveis: "real estate house building",
  esg: "sustainability environment renewable energy",
  religiao: "church faith spirituality",
  radar: "news desk information"
};

const TITLE_QUERY_RULES = [
  [/plano[s]? de sa[úu]de|sa[úu]de suplementar|ans/i, "health insurance medical plan"],
  [/seguro|responsabilidade civil|rc profissional/i, "insurance contract professional protection"],
  [/emprego|vagas|carreira|profiss/i, "job interview professional career"],
  [/concurso|edital|prova/i, "exam study public contest"],
  [/universidade|faculdade|ensino superior/i, "university students campus"],
  [/casa pr[óo]pria|im[óo]vel|financiamento imobili[aá]rio/i, "real estate family home finance"],
  [/tecnologia|intelig[eê]ncia artificial|ia|dados/i, "technology data artificial intelligence"],
  [/juros|selic|infla[cç][aã]o|d[óo]lar|mercado/i, "financial market economy"],
  [/fam[ií]lia|filhos|adolesc/i, "family parents children"],
  [/relig/i, "church faith spirituality"]
];

function normalizeText(text = "") {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isImagemBloqueada(url) {
  if (!url || url.length < 12) return true;
  const u = url.toLowerCase();
  if (BLOQUEIO_PATTERNS.some(p => u.includes(p))) return true;
  if (/\.(svg|gif|ico|bmp)(\?|$)/i.test(u)) return true;
  if (/\b(16|32|48|64)x(16|32|48|64)\b/.test(u)) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if ([...COMPETITOR_HOSTS].some(d => host === d || host.endsWith("." + d))) return true;
  } catch (_) {}
  return false;
}

function extrairEntidades(titulo, somenteAliases = false) {
  const tLower = normalizeText(titulo);
  const encontrados = [];
  for (const [alias, nome] of Object.entries(ALIASES)) {
    if (tLower.includes(normalizeText(alias))) encontrados.push(nome);
    if (encontrados.length >= 2) return encontrados;
  }
  if (somenteAliases) return encontrados;
  const nomes = String(titulo || "").match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3}/g) || [];
  for (const nome of nomes) {
    if (!encontrados.includes(nome)) encontrados.push(nome);
    if (encontrados.length >= 2) break;
  }
  return encontrados.slice(0, 2);
}

function podeUsarBancoStock(titulo, categoria) {
  const cat = normalizeText(categoria);
  if (!STOCK_SAFE_CATEGORIES.has(cat)) return false;
  return !SENSITIVE_TITLE_RE.test(String(titulo || ""));
}

function buildQueries(titulo, categoria) {
  const queries = [];
  for (const [rx, q] of TITLE_QUERY_RULES) {
    if (rx.test(titulo || "")) queries.push(q);
  }
  const catQuery = CATEGORY_QUERY[normalizeText(categoria)] || "";
  if (catQuery) queries.push(catQuery);
  queries.push("brazil news editorial");
  return [...new Set(queries)].slice(0, 3);
}

async function fetchJson(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function buscarWikipedia(entityName, imagensUsadas) {
  for (const lang of ["pt", "en"]) {
    const encoded = encodeURIComponent(entityName);
    const data = await fetchJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
      headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" }
    }, 3500);
    const img = data?.originalimage?.source || data?.thumbnail?.source;
    if (!img || isImagemBloqueada(img)) continue;
    if (!/\.(jpg|jpeg|png|webp)/i.test(img) && !img.includes("upload.wikimedia")) continue;
    const widthMatch = img.match(/\/(\d+)px-/);
    if (widthMatch && parseInt(widthMatch[1], 10) < 400) continue;
    const grande = img.replace(/\/\d+px-/, "/1000px-");
    if (!imagensUsadas.has(grande)) return grande;
    if (!imagensUsadas.has(img)) return img;
  }
  return null;
}

async function buscarWikimedia(query, imagensUsadas) {
  const q = encodeURIComponent(query);
  const url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${q}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
  const data = await fetchJson(url, {
    headers: { "User-Agent": "OVCPortal/1.0 (ovalorcapital.com.br)" }
  }, 6500);
  const pages = Object.values(data?.query?.pages || {});
  for (const page of pages) {
    const title = page.title || "";
    if (/flag|bandeira|icon|logo|coat|arms|seal|emblem|svg|mapa|map|diagram|schema|vector|illustration|ilustr|cartoon|chart|graph|infograph|drawing|sketch|template|clipart|badge|temple|pagoda|palace|mosque|cathedral|shrine|stupa|landmark|monument|tourist|tourism|stock_photo|placeholder/i.test(title)) continue;
    const info = page?.imageinfo?.[0];
    const img = info?.url;
    if (!img || isImagemBloqueada(img)) continue;
    if (!/\.(jpg|jpeg|png|webp)/i.test(img)) continue;
    if (info?.width && info.width < 500) continue;
    if (!imagensUsadas.has(img)) return img;
  }
  return null;
}

async function buscarPexels(query, imagensUsadas) {
  if (!PEXELS_KEY) return null;
  const q = encodeURIComponent(query);
  const data = await fetchJson(`https://api.pexels.com/v1/search?query=${q}&per_page=12&orientation=landscape`, {
    headers: { Authorization: PEXELS_KEY }
  }, 6500);
  for (const foto of (data?.photos || [])) {
    const img = foto?.src?.large || foto?.src?.medium;
    if (img && !imagensUsadas.has(img) && !isImagemBloqueada(img)) return img;
  }
  return null;
}

async function buscarPixabay(query, imagensUsadas) {
  if (!PIXABAY_KEY) return null;
  const q = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&min_width=800&per_page=12&safesearch=true`;
  const data = await fetchJson(url, {}, 6500);
  for (const hit of (data?.hits || [])) {
    const img = hit.largeImageURL || hit.webformatURL;
    if (img && !imagensUsadas.has(img) && !isImagemBloqueada(img)) return img;
  }
  return null;
}

async function getImagensUsadas() {
  try {
    const { data } = await supabase
      .from("posts")
      .select("imagem")
      .not("imagem", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    return new Set((data || []).map(p => p.imagem).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

async function buscarImagemInterna(titulo, categoria) {
  const imagensUsadas = await getImagensUsadas();
  const stockSeguro = podeUsarBancoStock(titulo, categoria);
  const entidades = extrairEntidades(titulo, !stockSeguro);

  for (const entidade of entidades) {
    const img = await buscarWikipedia(entidade, imagensUsadas);
    if (img) return img;
  }

  for (const entidade of entidades) {
    const img = await buscarWikimedia(entidade, imagensUsadas);
    if (img) return img;
  }

  if (stockSeguro) {
    const imgWiki = await buscarWikimedia(titulo, imagensUsadas);
    if (imgWiki) return imgWiki;
  }

  if (!stockSeguro) return null;

  for (const query of buildQueries(titulo, categoria)) {
    const pexels = await buscarPexels(query, imagensUsadas);
    if (pexels) return pexels;
    const pixabay = await buscarPixabay(query, imagensUsadas);
    if (pixabay) return pixabay;
  }

  return null;
}

export async function findImage(titulo, categoria, _urlProibida = "", _urlOriginal = "") {
  try {
    const resultado = await Promise.race([
      buscarImagemInterna(titulo, categoria),
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
    return resultado || null;
  } catch (_) {
    return null;
  }
}

// Clubes de futebol (Brasileirão Série A/B, Libertadores, Sul-Americana) — nome canônico de busca (pt.wikipedia)
const FUTEBOL_CLUBES = {
  "flamengo": "Flamengo", "palmeiras": "Palmeiras", "corinthians": "Corinthians",
  "sao paulo": "São Paulo Futebol Clube", "santos": "Santos Futebol Clube",
  "gremio": "Grêmio", "internacional": "Sport Club Internacional",
  "cruzeiro": "Cruzeiro Esporte Clube", "atletico mineiro": "Clube Atlético Mineiro",
  "atletico-mg": "Clube Atlético Mineiro", "galo": "Clube Atlético Mineiro",
  "fluminense": "Fluminense Football Club", "botafogo": "Botafogo de Futebol e Regatas",
  "vasco": "Club de Regatas Vasco da Gama", "vasco da gama": "Club de Regatas Vasco da Gama",
  "bahia": "Esporte Clube Bahia", "fortaleza": "Fortaleza Esporte Clube",
  "athletico paranaense": "Club Athletico Paranaense", "athletico-pr": "Club Athletico Paranaense",
  "bragantino": "Red Bull Bragantino", "red bull bragantino": "Red Bull Bragantino",
  "ceara": "Ceará Sporting Club", "vitoria": "Esporte Clube Vitória",
  "sport recife": "Sport Club do Recife", "sport": "Sport Club do Recife",
  "juventude": "Esporte Clube Juventude", "mirassol": "Mirassol Futebol Clube",
  "cuiaba": "Cuiabá Esporte Clube", "goias": "Goiás Esporte Clube",
  "coritiba": "Coritiba Foot Ball Club", "criciuma": "Criciúma Esporte Clube",
  "atletico goianiense": "Atlético Clube Goianiense", "novorizontino": "Grêmio Novorizontino",
  "chapecoense": "Associação Chapecoense de Futebol", "ponte preta": "Associação Atlética Ponte Preta",
  "guarani": "Guarani Futebol Clube", "avai": "Avaí Futebol Clube",
  "vila nova": "Vila Nova Futebol Clube", "operario": "Operário Ferroviário Esporte Clube",
  "amazonas": "Amazonas Futebol Clube", "crb": "Clube de Regatas Brasil",
  "botafogo-sp": "Botafogo Futebol Clube (Ribeirão Preto)", "paysandu": "Paysandu Sport Club",
  "remo": "Clube do Remo", "america mineiro": "América Futebol Clube (Belo Horizonte)",
  "ferroviaria": "Associação Ferroviária de Esportes",
  "river plate": "River Plate", "boca juniors": "Boca Juniors", "boca": "Boca Juniors",
  "racing club": "Racing Club", "independiente": "Club Atlético Independiente",
  "san lorenzo": "San Lorenzo de Almagro", "talleres": "Talleres de Córdoba",
  "velez sarsfield": "Vélez Sarsfield", "estudiantes": "Estudiantes de La Plata",
  "penarol": "Peñarol", "nacional": "Club Nacional de Football",
  "colo-colo": "Colo-Colo", "universidad de chile": "Club Universidad de Chile",
  "universidad catolica": "Club Deportivo Universidad Católica",
  "independiente del valle": "Independiente del Valle", "ldu quito": "LDU Quito",
  "barcelona sc": "Barcelona Sporting Club", "emelec": "Club Sport Emelec",
  "cerro porteno": "Cerro Porteño", "olimpia": "Club Olimpia",
  "libertad": "Club Libertad", "bolivar": "Club Bolívar",
  "the strongest": "The Strongest", "sporting cristal": "Sporting Cristal",
  "alianza lima": "Alianza Lima", "universitario": "Club Universitario de Deportes",
  "deportivo tachira": "Deportivo Táchira", "millonarios": "Millonarios Fútbol Club",
  "atletico nacional": "Atlético Nacional", "junior barranquilla": "Junior FC",
  "deportivo cali": "Deportivo Cali", "america de cali": "América de Cali"
};

// Organizações/competições de futebol — nome canônico de busca (ESPN)
const FUTEBOL_ORGS = {
  "cbf": "CBF", "confederacao brasileira de futebol": "CBF",
  "fifa": "FIFA", "uefa": "UEFA",
  "premier league": "Premier League",
  "liga dos campeoes": "UEFA Champions League", "champions league": "UEFA Champions League",
  "conmebol": "CONMEBOL",
  "libertadores": "CONMEBOL Libertadores", "copa libertadores": "CONMEBOL Libertadores",
  "sul-americana": "CONMEBOL Sudamericana", "sulamericana": "CONMEBOL Sudamericana",
  "copa sul-americana": "CONMEBOL Sudamericana",
  "selecao brasileira": "Brazil", "selecao masculina": "Brazil",
  "brasileirao": "Campeonato Brasileiro Serie A", "campeonato brasileiro": "Campeonato Brasileiro Serie A",
  "copa do mundo": "FIFA World Cup", "mundial de clubes": "FIFA Club World Cup",
  "la liga": "LaLiga", "bundesliga": "Bundesliga", "ligue 1": "Ligue 1"
};

function extrairEntidadesFutebol(texto) {
  const tLower = normalizeText(texto);
  const clubes = [];
  for (const [chave, nome] of Object.entries(FUTEBOL_CLUBES)) {
    if (tLower.includes(normalizeText(chave))) clubes.push(nome);
    if (clubes.length >= 2) break;
  }
  const orgs = [];
  for (const [chave, nome] of Object.entries(FUTEBOL_ORGS)) {
    if (tLower.includes(normalizeText(chave))) orgs.push(nome);
    if (orgs.length >= 2) break;
  }
  const pessoas = String(texto || "").match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,3}/g) || [];
  const pessoasUnicas = [...new Set(pessoas)].slice(0, 3);
  return { clubes, orgs, pessoas: pessoasUnicas };
}

// Busca o escudo/logo OFICIAL de um time ou organização via ESPN (mesma fonte já usada
// nas tabelas de Brasileirão/Libertadores em api/live.js). NUNCA inventa: exige que TODOS
// os tokens do nome batam no resultado, senão retorna null — sem imagem é melhor que errada.
async function buscarEscudoEspn(nome) {
  const data = await fetchJson(
    `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(nome)}&limit=10`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; OVC/1.0)" } },
    5000
  );
  const grupos = Array.isArray(data?.results) ? data.results : [];
  const candidatos = [];
  grupos.forEach(g => (g.contents || []).forEach(c => {
    const href = c?.link?.web?.href || "";
    if (/\/soccer\//i.test(href) && !/\/soccer\/player\//i.test(href)) candidatos.push(c);
  }));
  const alvoTokens = normalizeText(nome).replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const match = candidatos.find(c => {
    const cand = normalizeText(c.displayName || "").replace(/[^a-z0-9\s]/g, "");
    return alvoTokens.length > 0 && alvoTokens.every(t => cand.includes(t));
  });
  const escudo = match?.logos?.[0]?.href || match?.logo || match?.image?.default || match?.image?.href || "";
  return /^https?:\/\//i.test(escudo) ? escudo : null;
}

// Busca dedicada para conteúdo de futebol (Radar da Bola) — imagens de clubes, jogadores, técnicos e dirigentes
// REGRA (Roberto, 31/07/2026): se a matéria envolve um time/organização, usar SEMPRE o
// escudo/logo oficial — nunca foto de banco de imagens ou lead-photo aleatória da Wikipedia
// (causava casos como foto de 1960 do Vasco em matéria atual). Sem fallback: se o escudo não
// for encontrado com confiança, a matéria fica sem imagem — nunca uma foto genérica errada.
export async function findImageFutebol(titulo, corpo) {
  try {
    return await Promise.race([
      (async () => {
        const texto = `${titulo || ""} ${String(corpo || "").replace(/<[^>]+>/g, " ")}`.slice(0, 600);
        const { clubes, orgs, pessoas } = extrairEntidadesFutebol(texto);

        for (const entidade of [...clubes, ...orgs]) {
          const escudo = await buscarEscudoEspn(entidade);
          if (escudo) return escudo;
        }
        if (clubes.length || orgs.length) return null;

        const imagensUsadas = await getImagensUsadas();
        for (const pessoa of pessoas) {
          const img = await buscarWikipedia(pessoa, imagensUsadas);
          if (img) return img;
        }
        for (const pessoa of pessoas) {
          const img = await buscarWikimedia(pessoa, imagensUsadas);
          if (img) return img;
        }
        return null;
      })(),
      new Promise(resolve => setTimeout(() => resolve(null), 9000))
    ]) || null;
  } catch (_) {
    return null;
  }
}
