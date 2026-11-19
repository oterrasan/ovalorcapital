import { readFileSync } from "fs";
import { readFile } from "node:fs/promises";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { load } from "cheerio";
import articleHandler from "./article.js";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const BASE = "https://www.ovalorcapital.com.br";
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mesmo mapa de api/article.js — categoria ativa no banco → path real da URL.
const CAT_PATH_REDIRECT = {
  "brasil-on": "brasil-on", politica: "politica", economia: "economia",
  financas: "financas", negocios: "negocios", tecnologia: "tecnologia",
  internacional: "internacional", industria: "industria", familia: "familia",
  esportes: "esportes", giro: "giro", vc: "colunistas", colunistas: "colunistas",
  investimentos: "financas", seguros: "financas", mercados: "financas",
  saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
  cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
  variedades: "brasil-on", investigativo: "brasil-on", seguranca: "brasil-on",
  esg: "brasil-on", defesa: "brasil-on", profissoes: "brasil-on",
  vagas: "brasil-on", concursos: "brasil-on", parcerias: "negocios",
  tributos: "economia", tributacao: "economia", regulacao: "economia",
  geral: "politica"
};

function slugifyRedirect(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 55);
}

// Resolve um link antigo "?id=" pra a URL real do artigo (mesmo esquema de
// busca por id completo ou só os 8 primeiros chars de handleOne() em
// api/portal-posts.js) e devolve a URL canônica pronta, ou null se não achar.
async function resolveLegacyIdUrl(rawId) {
  const id = String(rawId || "").trim();
  let row = null;
  try {
    if (id.length >= 36) {
      const result = await supabase.from("posts").select("id,titulo,user_tags").eq("id", id).maybeSingle();
      row = result.data || null;
    } else if (/^[a-f0-9]{8}$/i.test(id.slice(0, 8))) {
      const id8 = id.slice(0, 8).toLowerCase();
      const lo = `${id8}-0000-0000-0000-000000000000`;
      const hi = `${id8}-ffff-ffff-ffff-ffffffffffff`;
      const result = await supabase.from("posts").select("id,titulo,user_tags").gte("id", lo).lte("id", hi).limit(1);
      row = result.data?.[0] || null;
    }
  } catch (_) { return null; }
  if (!row) return null;
  let tags = [];
  try { tags = typeof row.user_tags === "string" ? JSON.parse(row.user_tags) : (row.user_tags || []); } catch (_) {}
  const catPath = CAT_PATH_REDIRECT[tags[0]] || "politica";
  const slug = slugifyRedirect(row.titulo);
  const id8 = String(row.id).slice(0, 8);
  return `${BASE}/${catPath}/${slug}-${id8}/`;
}

const CAT_SEO = {
  "brasil-on": {
    title: "Brasil On | O Valor Capital",
    desc: "Segurança pública, jornalismo investigativo, denúncias, defesa civil e as histórias do Brasil real sem filtro editorial. O país como ele é.",
    canonical: "https://www.ovalorcapital.com.br/brasil-on/",
    tplPath: "brasil-on",
  },
  politica: {
    title: "Política | O Valor Capital",
    desc: "Cobertura completa da política brasileira: Presidência, Congresso Nacional, STF, eleições e projetos de lei. Notícias e análises em tempo real.",
    canonical: "https://www.ovalorcapital.com.br/politica/",
    tplPath: "politica",
  },
  economia: {
    title: "Economia | O Valor Capital",
    desc: "Análise econômica: COPOM, Selic, PIB, inflação, câmbio e conjuntura macroeconômica do Brasil e do mundo. Dados e notícias em tempo real.",
    canonical: "https://www.ovalorcapital.com.br/economia/",
    tplPath: "economia",
  },
  negocios: {
    title: "Negócios | O Valor Capital",
    desc: "Empreendedorismo, gestão financeira, startups, MEI, crédito empresarial e tributação para PJ. O que as empresas brasileiras precisam saber.",
    canonical: "https://www.ovalorcapital.com.br/negocios/",
    tplPath: "negocios",
  },
  tecnologia: {
    title: "Tecnologia | O Valor Capital",
    desc: "Inteligência artificial, fintechs, cibersegurança, 5G, e-commerce e transformação digital. O impacto das tendências tecnológicas no Brasil e no mundo.",
    canonical: "https://www.ovalorcapital.com.br/tecnologia/",
    tplPath: "tecnologia",
  },
  internacional: {
    title: "Internacional | O Valor Capital",
    desc: "Geopolítica, economia global, EUA, Europa, China e Oriente Médio. Notícias e análises sobre o cenário internacional e seu impacto direto no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/internacional/",
    tplPath: "internacional",
  },
  industria: {
    title: "Indústria | O Valor Capital",
    desc: "Agronegócio, energia, construção civil, mineração, setor automotivo, logística e indústria 4.0. A produção brasileira em análise e contexto econômico.",
    canonical: "https://www.ovalorcapital.com.br/industria/",
    tplPath: "industria",
  },
  familia: {
    title: "Família | O Valor Capital",
    desc: "Orçamento familiar, educação dos filhos, habitação, planejamento patrimonial, sucessão e bem-estar. Decisões práticas para a família brasileira.",
    canonical: "https://www.ovalorcapital.com.br/familia/",
    tplPath: "familia",
  },
  esportes: {
    title: "Esportes | O Valor Capital",
    desc: "Futebol, basquete, tênis, automobilismo, NFL, MMA e eSports. Notícias esportivas com análise de negócios, patrocínios e impacto econômico no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/esportes/",
    tplPath: "esportes",
  },
  giro: {
    title: "Giro | O Valor Capital",
    desc: "Famosos, celebridades, bastidores, entretenimento e cultura pop no Brasil e no mundo. O giro do que está sendo comentado, com o padrão editorial do OVC.",
    canonical: "https://www.ovalorcapital.com.br/giro/",
    tplPath: "giro",
  },
  colunistas: {
    title: "Colunistas & Opinião | O Valor Capital",
    desc: "Artigos de opinião e análises dos colunistas de O Valor Capital sobre política, economia, sociedade, família e fé na perspectiva brasileira.",
    canonical: "https://www.ovalorcapital.com.br/colunistas/",
    tplPath: "colunistas",
  },
  vc: {
    title: "VC — Sobre o Portal | O Valor Capital",
    desc: "Conheça O Valor Capital: missão editorial, princípios jornalísticos, liberdade econômica e os fundamentos do portal premium de notícias do Brasil.",
    canonical: "https://www.ovalorcapital.com.br/vc/",
    tplPath: "vc",
  },
  financas: {
    title: "Finanças | O Valor Capital",
    desc: "Renda fixa, bolsa de valores, seguros, previdência, fundos imobiliários, planejamento patrimonial e criptomoedas. Decisões financeiras com análise editorial de alto nível.",
    canonical: "https://www.ovalorcapital.com.br/financas/",
    tplPath: "financas",
  },
};

const SECTION_LABELS = {
  politica: {
    "bastidores-de-brasilia": "Bastidores de Brasília",
    "eleicoes-2026": "Eleições 2026",
    "noticias-24hrs": "Notícias 24hrs",
    "corrupcao-e-investigacao": "Corrupção & Investigação",
    "politica-internacional": "Política Internacional",
    geral: "Geral",
    // legado
    executivo: "Executivo", legislativo: "Legislativo", judiciario: "Judiciário",
    eleicoes: "Eleições", partidos: "Partidos", defesa: "Defesa Nacional"
  },
  economia: {
    "politica-economica": "Política Econômica",
    "cambio-e-mercados": "Câmbio & Mercados",
    "pib-e-indicadores": "PIB & Indicadores",
    tributos: "Tributos",
    geral: "Geral",
    // legado
    pib: "PIB & Crescimento", inflacao: "Inflação & IPCA", cambio: "Câmbio",
    selic: "Selic & COPOM", fiscal: "Política Fiscal", previdencia: "Previdência"
  },
  financas: {
    "renda-fixa": "Renda Fixa",
    "bolsa-e-acoes": "Bolsa & Ações",
    "seguros-e-protecao": "Seguros & Proteção",
    previdencia: "Previdência",
    "fundos-e-fiis": "Fundos & FIIs",
    "planejamento-patrimonial": "Planejamento Patrimonial",
    criptomoedas: "Criptomoedas",
    geral: "Geral"
  },
  negocios: {
    empreendedorismo: "Empreendedorismo", startups: "Startups",
    gestao: "Gestão", "credito-empresarial": "Crédito Empresarial", geral: "Geral",
    // legado
    mei: "MEI & Pequenas", credito: "Crédito & Captação", franquias: "Franquias"
  },
  tecnologia: {
    "inteligencia-artificial": "Inteligência Artificial", fintechs: "Fintechs",
    ciberseguranca: "Cibersegurança", inovacao: "Inovação", geral: "Geral",
    // legado
    ia: "Inteligência Artificial", "5g": "5G & Telecom", "e-commerce": "E-commerce"
  },
  internacional: {
    eua: "Estados Unidos", europa: "Europa", china: "China",
    geopolitica: "Geopolítica", geral: "Geral",
    // legado
    "america-latina": "América Latina", asia: "Ásia", "oriente-medio": "Oriente Médio"
  },
  industria: {
    agronegocio: "Agronegócio", energia: "Energia", construcao: "Construção Civil",
    logistica: "Logística", geral: "Geral",
    // legado
    mineracao: "Mineração", automotivo: "Setor Automotivo"
  },
  esportes: {
    futebol: "Futebol", basquete: "Basquete", motor: "Motor",
    tenis: "Tênis", mma: "MMA", volei: "Vôlei", nfl: "NFL", geral: "Geral",
    // legado
    automobilismo: "Automobilismo", "e-sports": "E-sports"
  },
  giro: {
    famosos: "Famosos", bastidores: "Bastidores", geral: "Geral"
  },
  familia: {
    "orcamento-familiar": "Orçamento Familiar",
    "educacao-dos-filhos": "Educação dos Filhos",
    habitacao: "Habitação", sucessao: "Sucessão", geral: "Geral",
    // legado
    orcamento: "Orçamento Familiar", filhos: "Filhos & Educação",
    seguros: "Seguros da Família", "bem-estar": "Bem-estar"
  },
  "brasil-on": {
    cotidiano: "Cotidiano", consumidor: "Consumidor",
    "bem-estar": "Bem-estar", "meio-ambiente": "Meio Ambiente",
    "ciencia-e-inovacao": "Ciência & Inovação", geral: "Geral",
    // legado
    seguranca: "Segurança Pública", investigativo: "Investigativo", denuncias: "Denúncias",
    defesa: "Defesa Civil", "brasil-real": "Brasil Real", variedades: "Variedades"
  },
  colunistas: {
    "roberto-terrasan": "Roberto Terrasan",
    "beta-ferreira": "Beta Ferreira",
    "adriana-ferreira": "Adriana Ferreira",
    "michele-froiz": "Michele Froiz",
    "prof-marcos-pizzolatto": "Prof. Marcos Pizzolatto",
    "taisa-da-fonseca": "Taisa da Fonseca"
  },
  // legado — mantidos para URLs antigas de artigos
  saude: { "saude-publica": "Saúde Pública", planos: "Planos de Saúde", sus: "SUS" },
  carreira: { vagas: "Vagas & Empregos", concursos: "Concursos", profissoes: "Profissões" },
  investimentos: { "renda-fixa": "Renda Fixa", "renda-variavel": "Renda Variável" },
  seguros: { vida: "Seguro de Vida", auto: "Auto", residencial: "Residencial" },
  tributos: { irpf: "IRPF", reforma: "Reforma Tributária" },
  imoveis: { "compra-venda": "Compra & Venda", aluguel: "Aluguel" },
  cultura: { cinema: "Cinema & Streaming", musica: "Música" },
  religiao: { evangelicos: "Evangélicos", catolicos: "Católicos" }
};

const _tpl = {};
function getTemplate(tplPath) {
  if (_tpl[tplPath]) return _tpl[tplPath];
  try {
    _tpl[tplPath] = readFileSync(join(process.cwd(), "public", tplPath, "index.html"), "utf8");
    return _tpl[tplPath];
  } catch (_) {
    try {
      _tpl["politica"] = _tpl["politica"] || readFileSync(join(process.cwd(), "public", "politica", "index.html"), "utf8");
      return _tpl["politica"];
    } catch (__) { return null; }
  }
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function titleFromSeo(title) {
  return (title || "").split("|")[0].trim() || SITE;
}

function setBodyAttr(html, name, value) {
  const attr = `${name}="${esc(value)}"`;
  if (new RegExp(`\\s${name}="[^"]*"`, "i").test(html)) {
    return html.replace(new RegExp(`\\s${name}="[^"]*"`, "i"), ` ${attr}`);
  }
  return html.replace(/<body\b([^>]*)>/i, `<body$1 ${attr}>`);
}

function ensureInternalScript(html) {
  const guard = '<script src="/js/category-section-guard.js" defer></script>';
  if (!html.includes("/js/category-section-guard.js")) {
    if (html.includes("/js/internal-page-v2.js")) {
      html = html.replace(/<script\s+src="\/js\/internal-page-v2\.js"[^>]*><\/script>/i, `${guard}\n$&`);
    } else {
      html = html.replace("</head>", `  ${guard}\n</head>`);
    }
  }
  if (html.includes("/js/internal-page-v2.js")) return html;
  return html.replace("</head>", '  <script src="/js/internal-page-v2.js" defer></script>\n</head>');
}

function standardMain(categoryLabel, description) {
  return `<main class="ovc-main"><section class="ovc-section-hero"><div class="ovc-panel ovc-hero"><span class="ovc-badge">${esc(categoryLabel)}</span><h1>${esc(categoryLabel)}</h1><p>${esc(description)}</p></div><aside class="ovc-panel ovc-weather"><h3>Leitura rápida</h3><div class="temp">${esc(categoryLabel)}</div><p>Conteúdo organizado no mesmo padrão editorial do portal, com coluna principal, lateral, imagens e módulos de apoio.</p><div class="ovc-banner-slot"><div><strong>Espaço premium</strong><span>Área preparada para publicidade e chamadas institucionais.</span></div><a class="ovc-btn secondary" href="/anuncie/">Anuncie</a></div></aside></section><section class="ovc-grid"><div class="ovc-story-stack"><div class="ovc-panel" data-hero-card></div><div class="ovc-panel ovc-story-list"><h3>Principais notícias</h3><div class="ovc-mini-list" data-main-list></div></div><div class="ovc-panel ovc-story-list"><h3>Mais da seção</h3><div class="ovc-mini-list" data-local-list></div></div></div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>`;
}

function normalizeCategoryLayout(html, cat, label, desc, section) {
  html = setBodyAttr(html, "data-category", cat);
  html = setBodyAttr(html, "data-section", section || "geral");
  html = ensureInternalScript(html);

  if (cat === "colunistas") return html;

  const hasStandardMain = html.includes("data-hero-card") && html.includes("data-main-list") && html.includes("ovc-right-rail");
  if (!hasStandardMain) {
    html = html.replace(/<main\b[\s\S]*?<\/main>/i, standardMain(label, desc));
  } else {
    html = html.replace(/<h1>[^<]*<\/h1>/i, `<h1>${esc(label)}</h1>`);
  }
  return html;
}

// ══════════════════════════════════════════════════════════════════════
// 19/11/2026 — "editorial": SSR real da home + das 11 editorias + de suas
// subseções, com título/canonical/JSON-LD/links de matéria de verdade
// injetados no HTML (não só via fetch client-side). Antes desta data isso
// vivia num arquivo separado (api/editorial.js, criado no PR #903) — foi
// fundido aqui porque um 11º arquivo em api/ viola a Regra Zero-A deste
// projeto (máximo 10 arquivos — regra inviolável, documentada em CLAUDE.md,
// já causou 1 dia inteiro de build quebrado silenciosamente em 16/05/2026).
// Usa o parâmetro `section` (não `cat`) pra não colidir com o caminho
// antigo acima (colunistas e qualquer outro chamador de ?cat=), que
// continua 100% intacto.
// ══════════════════════════════════════════════════════════════════════

const EDITORIAL_SECTIONS = new Set(["politica", "economia", "negocios", "financas", "industria", "tecnologia",
  "esportes", "familia", "giro", "internacional", "brasil-on"]);
const FINANCE_TOPICS = new Set(["Renda Fixa", "Bolsa e Ações", "Seguros e Proteção", "Previdência",
  "Fundos e FIIs", "Planejamento Patrimonial", "Criptomoedas"]);

// 19/11/2026 (correção real, ver histórico) — rótulos das 122 subseções
// REAIS do menu, extraídas diretamente do HTML da home em produção
// (não de SECTION_LABELS acima, que estava desatualizada e cobria só
// 61 das 122 — testar contra a própria tabela parcial mascarava o erro).
// Confirmado por extração programática do <header> real: exatamente
// 122 combinações (cat, sub), batendo com os 104 HTTP 400 + 18 HTTP 200
// observados em produção antes deste fix.
const SUBSECTIONS = {
  politica: {
    "bastidores-de-brasilia": "Bastidores de Brasília",
    "corrupcao-e-investigacao": "Corrupção e Investigação",
    "eleicoes-2026": "Eleições 2026",
    geral: "Geral",
    judiciario: "Judiciário",
    legislativo: "Legislativo",
    "noticias-24hrs": "Notícias 24hrs",
    "poder-executivo": "Poder Executivo",
    "politica-internacional": "Política Internacional"
  },
  economia: {
    "cambio-e-mercados": "Câmbio e Mercados",
    commodities: "Commodities",
    "consumo-e-varejo": "Consumo e Varejo",
    geral: "Geral",
    inflacao: "Inflação",
    infraestrutura: "Infraestrutura",
    "mercado-de-trabalho": "Mercado de Trabalho",
    "pib-e-indicadores": "PIB e Indicadores",
    "politica-economica": "Política Econômica",
    "politica-monetaria": "Política Monetária",
    "reforma-tributaria": "Reforma Tributária",
    tributos: "Tributos"
  },
  negocios: {
    "comercio-exterior": "Comércio Exterior",
    "credito-empresarial": "Crédito Empresarial",
    "economia-criativa": "Economia Criativa",
    empreendedorismo: "Empreendedorismo",
    franquias: "Franquias",
    "fusoes-e-aquisicoes": "Fusões e Aquisições",
    geral: "Geral",
    gestao: "Gestão",
    "lgpd-e-compliance": "LGPD e Compliance",
    "mercado-de-capitais": "Mercado de Capitais",
    startups: "Startups",
    "sustentabilidade-empresarial": "Sustentabilidade Empresarial"
  },
  financas: {
    "bolsa-e-acoes": "Bolsa e Ações",
    criptomoedas: "Criptomoedas",
    dividendos: "Dividendos",
    "educacao-financeira": "Educação Financeira",
    "fundos-e-fiis": "Fundos e FIIs",
    geral: "Geral",
    "imoveis-como-investimento": "Imóveis como Investimento",
    "investimentos-internacionais": "Investimentos Internacionais",
    "planejamento-patrimonial": "Planejamento Patrimonial",
    previdencia: "Previdência",
    "renda-fixa": "Renda Fixa",
    "seguros-e-protecao": "Seguros e Proteção"
  },
  industria: {
    agronegocio: "Agronegócio",
    automotivo: "Setor Automotivo",
    "construcao-civil": "Construção Civil",
    energia: "Energia",
    geral: "Geral",
    "industria-40": "Indústria 4.0",
    logistica: "Logística",
    mineracao: "Mineração",
    "petroleo-e-gas": "Petróleo e Gás"
  },
  tecnologia: {
    ciberseguranca: "Cibersegurança",
    "dados-e-analytics": "Dados e Analytics",
    fintechs: "Fintechs",
    geral: "Geral",
    govtech: "Govtech",
    healthtech: "Healthtech",
    inovacao: "Inovação",
    "inteligencia-artificial": "Inteligência Artificial",
    "startups-tech": "Startups de Tecnologia",
    "transformacao-digital": "Transformação Digital"
  },
  esportes: {
    atletismo: "Atletismo",
    ciclismo: "Ciclismo",
    esports: "eSports",
    geral: "Geral",
    golf: "Golfe",
    hockey: "Hóquei",
    "luta-e-artes-marciais": "Luta e Artes Marciais",
    mlb: "Beisebol (MLB)",
    natacao: "Natação",
    olimpiadas: "Olimpíadas",
    rugby: "Rúgbi",
    "vela-e-nautico": "Vela e Náutico",
    xadrez: "Xadrez"
  },
  familia: {
    "criancas-e-adolescentes": "Crianças e Adolescentes",
    "direito-de-familia": "Direito de Família",
    "educacao-dos-filhos": "Educação dos Filhos",
    geral: "Geral",
    habitacao: "Habitação",
    "lazer-e-bem-estar": "Lazer e Bem-estar",
    "orcamento-familiar": "Orçamento Familiar",
    relacionamentos: "Relacionamentos",
    "saude-familiar": "Saúde Familiar",
    sucessao: "Sucessão",
    "terceira-idade": "Terceira Idade",
    "viagens-em-familia": "Viagens em Família"
  },
  giro: {
    bastidores: "Bastidores",
    famosos: "Famosos",
    geral: "Geral"
  },
  internacional: {
    africa: "África",
    "america-latina": "América Latina",
    "asia-pacifico": "Ásia-Pacífico",
    china: "China",
    "comercio-global": "Comércio Global",
    "estados-unidos": "Estados Unidos",
    europa: "Europa",
    geopolitica: "Geopolítica",
    geral: "Geral",
    "organismos-internacionais": "Organismos Internacionais",
    "oriente-medio": "Oriente Médio",
    "russia-e-conflitos": "Rússia e Conflitos"
  },
  "brasil-on": {
    "bem-estar": "Bem-estar",
    "carreira-e-trabalho": "Carreira e Trabalho",
    "ciencia-e-inovacao": "Ciência e Inovação",
    "concursos-e-educacao": "Concursos e Educação",
    consumidor: "Consumidor",
    cotidiano: "Cotidiano",
    "cultura-e-lazer": "Cultura e Lazer",
    "direitos-e-cidadania": "Direitos e Cidadania",
    "energia-e-sustentabilidade": "Energia e Sustentabilidade",
    "fe-e-espiritualidade": "Fé e Espiritualidade",
    geral: "Geral",
    "habitacao-e-imoveis": "Habitação e Imóveis",
    "meio-ambiente": "Meio Ambiente",
    "previdencia-social": "Previdência Social",
    "saude-e-qualidade-de-vida": "Saúde e Qualidade de Vida",
    "seguranca-publica": "Segurança Pública",
    "tecnologia-e-sociedade": "Tecnologia e Sociedade",
    "transporte-e-mobilidade": "Transporte e Mobilidade"
  }
};

const _editorialFeeds = new Map();

async function fetchLatestEditorial(category, limit) {
  const url = new URL("/api/portal-posts", BASE);
  url.search = new URLSearchParams({ recentes: "true", categoria: category, limit });
  const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
  if (!response.ok) throw new Error("Feed indisponível");
  const { posts } = await response.json();
  return posts.filter(post => post.categoria === category && post.titulo?.trim() &&
    /^\/[a-z0-9-]+\/[a-z0-9-]+-[a-f0-9]{8}\/$/.test(post.url));
}

async function latestEditorial(category, limit) {
  const key = category + "/" + limit;
  const previous = _editorialFeeds.get(key);
  if (previous && Date.now() - previous.time < 120000) return previous.posts;
  try {
    const posts = await fetchLatestEditorial(category, limit);
    if (posts.length) _editorialFeeds.set(key, { posts, time: Date.now() });
    return posts;
  } catch {
    return previous && Date.now() - previous.time < 3600000 ? previous.posts : [];
  }
}

function fillEditorialCard($, id, post) {
  if (!post) return;
  $("#card-" + id + "-titulo").text(post.titulo.replaceAll("**", ""));
  $("#card-" + id + "-resumo").text(post.resumo || post.comentario_fixado || "");
  $("#card-" + id + "-link").attr("href", post.url);
}

function injectEditorialJsonLd($, name, url) {
  $("<script>").attr("type", "application/ld+json").text(JSON.stringify({
    "@context": "https://schema.org", "@type": "CollectionPage", name, url
  }).replaceAll("<", "\\u003c")).appendTo("head");
}

function injectEditorialLinks($, posts) {
  for (const post of posts) {
    const anchor = $("<a>").attr("href", post.url).text(post.titulo);
    $("<div>").append(anchor).appendTo("[data-main-list]");
  }
}

async function handleEditorial(req, res) {
  const section = req.query.section || "";
  if (section && !EDITORIAL_SECTIONS.has(section)) return res.status(404).end();

  const sub = req.query.sub || "";
  if (sub) {
    if (!section || !SUBSECTIONS[section] || !SUBSECTIONS[section][sub]) return res.status(404).end();
    const label = SUBSECTIONS[section][sub];
    const canonical = BASE + "/" + section + "/" + sub + "/";
    const template = await readFile(join(process.cwd(), "public", section, "index.html"), "utf8");
    const $ = load(template);
    // rótulo da editoria-mãe, lido do <title> original do template estático
    // (já confirmado correto pra todas as 11 categorias) — usado no badge/
    // temp pra dar contexto de hierarquia, enquanto o H1 fica específico da
    // subseção (badge = categoria, H1 = página atual).
    const parentLabel = $("title").text().split("|")[0].trim();
    $('link[rel="canonical"]').remove();
    $("<link>").attr({ rel: "canonical", href: canonical }).appendTo("head");
    $("title").text(label + " | " + parentLabel + " | O Valor Capital");
    $('meta[name="description"]').attr("content",
      `Cobertura de ${label} no O Valor Capital, dentro da editoria de ${parentLabel}, com notícias, análises e contexto editorial padronizado.`);
    $(".ovc-hero h1").text(label);
    $(".ovc-hero .ovc-badge, .ovc-weather .temp").text(parentLabel);
    injectEditorialJsonLd($, label, canonical);

    const broad = await latestEditorial(section, 40);
    const filtered = sub === "geral" ? [] : broad.filter(post => post.subcategoria_slug === sub);
    const posts = (filtered.length >= 3 ? filtered : broad).slice(0, 8);
    injectEditorialLinks($, posts);
    const complete = posts.length > 0;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", complete
      ? "public, s-maxage=120, stale-while-revalidate=600, stale-if-error=3600" : "no-store");
    if (!complete) res.setHeader("Retry-After", "60");
    return res.status(complete ? 200 : 503).send($.html());
  }

  const template = await readFile(join(process.cwd(), "public", section, "index.html"), "utf8");
  const $ = load(template);
  const canonical = BASE + (section ? "/" + section + "/" : "/");
  $('link[rel="canonical"]').remove();
  $("<link>").attr({ rel: "canonical", href: canonical }).appendTo("head");
  let complete = false;
  if (section) {
    const label = $("title").text().split("|")[0].trim();
    const desc = $('meta[name="description"]').attr("content") || "";
    $(".ovc-hero h1, .ovc-hero .ovc-badge, .ovc-weather .temp").text(label);
    $(".ovc-hero > p").text(desc);
    injectEditorialJsonLd($, label, canonical);
    const posts = await latestEditorial(section, 8);
    injectEditorialLinks($, posts);
    complete = posts.length > 0;
  } else {
    const [politics, business, finance] = await Promise.all([
      latestEditorial("politica", 8), latestEditorial("negocios", 8), latestEditorial("financas", 50)
    ]);
    fillEditorialCard($, "hero", politics[0]);
    fillEditorialCard($, "feature", business[0]);
    const featuredFinance = finance.find(post => FINANCE_TOPICS.has(post.subcategoria));
    if (featuredFinance) fillEditorialCard($, "lions", featuredFinance);
    else $("#card-lions-titulo").text("Finanças e investimentos");
    complete = Boolean(politics.length && business.length);
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", complete ? "public, s-maxage=120, stale-while-revalidate=600, stale-if-error=3600" : "no-store");
  if (!complete) res.setHeader("Retry-After", "60");
  return res.status(complete ? 200 : 503).send($.html());
}

export default async function handler(req, res) {
  const host = req.headers['host'] || '';
  if (host === 'ovalorcapital.com.br') {
    res.setHeader('Location', `https://www.ovalorcapital.com.br${req.url}`);
    return res.status(301).end();
  }

  const artId = (req.query.id || "").trim();
  if (artId) {
    // Bug real (04/11/2026): isto redirecionava pra /og?id=, uma rota que
    // NUNCA serviu página nenhuma — /og cai no handler padrão de
    // api/portal-posts.js, que vê req.query.id e devolve handleOne() em
    // JSON puro. Qualquer link antigo (?id=) clicado hoje mostrava texto
    // JSON cru pro visitante e pro Googlebot, em vez do artigo de verdade.
    // Fix: resolver o id de uma vez pra URL real do artigo e 301 direto
    // pra lá — nunca mais um link antigo termina em página quebrada.
    const realUrl = await resolveLegacyIdUrl(artId);
    res.setHeader("Location", realUrl || "/");
    return res.status(301).end();
  }

  const cat = (req.query.cat || "").toLowerCase();
  if (!cat) return handleEditorial(req, res);

  const seo = CAT_SEO[cat];
  if (!seo) return res.status(404).send("Not found");

  const rawSection = (req.query.s || req.query.section || "").toLowerCase().replace(/\/+$/g, "").trim();
  if (cat === "colunistas" && rawSection && !SECTION_LABELS.colunistas[rawSection] && /-[a-f0-9]{8}$/i.test(rawSection)) {
    req.query = { ...req.query, cat: "colunistas", slug: rawSection };
    return articleHandler(req, res);
  }
  const sectionLabel = (SECTION_LABELS[cat] && SECTION_LABELS[cat][rawSection]) || "";
  const pageLabel = sectionLabel || titleFromSeo(seo.title);
  const pageDesc = sectionLabel
    ? (cat === "colunistas"
      ? `Artigos, opinioes e analises de ${sectionLabel} no O Valor Capital, dentro da area oficial de colunistas do portal.`
      : `Cobertura de ${sectionLabel} no O Valor Capital, com noticias, analises, oportunidades e contexto profissional em layout editorial padronizado.`)
    : seo.desc;
  const canonical = sectionLabel ? seo.canonical.replace(/\/$/, `/${rawSection}/`) : seo.canonical;
  const pageTitle = sectionLabel ? `${sectionLabel} | ${SITE}` : seo.title;

  const tpl = getTemplate(seo.tplPath);
  if (!tpl) return res.status(500).send("Template error");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": canonical,
    "publisher": {
      "@type": "Organization",
      "name": SITE,
      "logo": { "@type": "ImageObject", "url": LOGO }
    },
    "inLanguage": "pt-BR",
    "isAccessibleForFree": true
  });

  const seoTags = [
    `<title>${esc(pageTitle)}</title>`,
    `<meta name="description" content="${esc(pageDesc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(pageTitle)}">`,
    `<meta property="og:description" content="${esc(pageDesc)}">`,
    `<meta property="og:image" content="${OG_DEFAULT}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(pageTitle)}">`,
    `<meta name="twitter:description" content="${esc(pageDesc)}">`,
    `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`,
  ].join("\n");

  let html = normalizeCategoryLayout(tpl, cat, pageLabel, pageDesc, sectionLabel ? rawSection : "geral");
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const noCache = cat === "colunistas";
  res.setHeader("Cache-Control", noCache
    ? "no-store, must-revalidate"
    : "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).send(html);
}
