import { readFileSync } from "fs";
import { join } from "path";
import articleHandler from "./article.js";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

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
  investimentos: {
    title: "Investimentos | O Valor Capital",
    desc: "Renda fixa, renda variável, fundos, previdência privada e estratégias do investidor brasileiro. Análises para seu patrimônio crescer com segurança.",
    canonical: "https://www.ovalorcapital.com.br/investimentos/",
    tplPath: "investimentos",
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
  saude: {
    title: "Saúde | O Valor Capital",
    desc: "Saúde pública, SUS, saúde mental, planos de saúde, medicamentos e políticas de saúde no Brasil. Informação confiável para decisões mais saudáveis.",
    canonical: "https://www.ovalorcapital.com.br/saude/",
    tplPath: "saude",
  },
  tributos: {
    title: "Tributos | O Valor Capital",
    desc: "IRPF, reforma tributária, planejamento tributário, obrigações fiscais e Simples Nacional. Tudo sobre impostos e tributos no Brasil com análise editorial.",
    canonical: "https://www.ovalorcapital.com.br/tributos/",
    tplPath: "tributos",
  },
  carreira: {
    title: "Carreira | O Valor Capital",
    desc: "Vagas de emprego, concursos públicos, profissões em alta, educação profissional e mercado de trabalho. Tudo para crescer na carreira no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/carreira/",
    tplPath: "carreira",
  },
  imoveis: {
    title: "Imóveis | O Valor Capital",
    desc: "Mercado imobiliário brasileiro: lançamentos, financiamento habitacional, Minha Casa Minha Vida, FGTS, aluguel, compra de imóveis e fundos imobiliários.",
    canonical: "https://www.ovalorcapital.com.br/imoveis/",
    tplPath: "imoveis",
  },
  seguros: {
    title: "Seguros | O Valor Capital",
    desc: "Seguros de vida, saúde, automóvel, residencial e empresarial. Mercado segurador, proteção patrimonial e planejamento financeiro familiar no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguros/",
    tplPath: "seguros",
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
  cultura: {
    title: "Cultura | O Valor Capital",
    desc: "Cinema, música, literatura, teatro, gastronomia e a produção cultural brasileira. Entretenimento com análise editorial e impacto na sociedade e na economia.",
    canonical: "https://www.ovalorcapital.com.br/cultura/",
    tplPath: "cultura",
  },
  religiao: {
    title: "Fé & Espiritualidade | O Valor Capital",
    desc: "Evangelismo, catolicismo, espiritualidade, missões e valores de fé no contexto da sociedade brasileira. A religião como força política, cultural e familiar.",
    canonical: "https://www.ovalorcapital.com.br/religiao/",
    tplPath: "religiao",
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

export default async function handler(req, res) {
  const host = req.headers['host'] || '';
  if (host === 'ovalorcapital.com.br') {
    res.setHeader('Location', `https://www.ovalorcapital.com.br${req.url}`);
    return res.status(301).end();
  }

  const artId = (req.query.id || "").trim();
  if (artId) {
    return res.redirect(302, "/og?id=" + encodeURIComponent(artId));
  }

  const cat = (req.query.cat || "").toLowerCase();
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
