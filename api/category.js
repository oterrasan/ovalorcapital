import { readFileSync } from "fs";
import { join } from "path";
import articleHandler from "./article.js";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const CAT_SEO = {
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
    desc: "Empreendedorismo, gestão financeira, startups, MEI, crédito e tributação para PJ. Tudo o que sua empresa precisa saber.",
    canonical: "https://www.ovalorcapital.com.br/negocios/",
    tplPath: "negocios",
  },
  investimentos: {
    title: "Investimentos | O Valor Capital",
    desc: "Renda fixa, renda variável, fundos, previdência e educação do investidor. Análises e estratégias para seu patrimônio crescer.",
    canonical: "https://www.ovalorcapital.com.br/investimentos/",
    tplPath: "investimentos",
  },
  seguros: {
    title: "Seguros | O Valor Capital",
    desc: "Seguros de vida, saúde, auto, residencial e empresarial. Tudo sobre proteção patrimonial e familiar no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguros/",
    tplPath: "seguros",
  },
  mercados: {
    title: "Mercados Financeiros | O Valor Capital",
    desc: "Bolsa de valores, câmbio, juros, commodities, criptomoedas e cotações em tempo real. O melhor dos mercados financeiros do Brasil e do mundo.",
    canonical: "https://www.ovalorcapital.com.br/mercados/",
    tplPath: "mercados",
  },
  educacao: {
    title: "Educação | O Valor Capital",
    desc: "Educação financeira, ENEM, carreira, cursos e certificações. Conteúdo para quem quer crescer profissional e financeiramente.",
    canonical: "https://www.ovalorcapital.com.br/educacao/",
    tplPath: "educacao",
  },
  industria: {
    title: "Indústria | O Valor Capital",
    desc: "Notícias da indústria brasileira: agronegócio, energia, construção, mineração, automotivo, logística e indústria 4.0.",
    canonical: "https://www.ovalorcapital.com.br/industria/",
    tplPath: "industria",
  },
  tecnologia: {
    title: "Tecnologia | O Valor Capital",
    desc: "Inteligência artificial, fintechs, e-commerce, cibersegurança, 5G e transformação digital no Brasil e no mundo.",
    canonical: "https://www.ovalorcapital.com.br/tecnologia/",
    tplPath: "tecnologia",
  },
  esportes: {
    title: "Esportes | O Valor Capital",
    desc: "Futebol, basquete, tênis, automobilismo, NFL, MMA e eSports. Notícias esportivas com análise de negócios e impacto econômico.",
    canonical: "https://www.ovalorcapital.com.br/esportes/",
    tplPath: "esportes",
  },
  saude: {
    title: "Saúde | O Valor Capital",
    desc: "Saúde pública, SUS, saúde mental, planos de saúde e políticas de saúde no Brasil. Informação para decisões mais saudáveis.",
    canonical: "https://www.ovalorcapital.com.br/saude/",
    tplPath: "saude",
  },
  familia: {
    title: "Família | O Valor Capital",
    desc: "Orçamento familiar, educação dos filhos, habitação, seguros da família, planejamento patrimonial e sucessão.",
    canonical: "https://www.ovalorcapital.com.br/familia/",
    tplPath: "familia",
  },
  tributos: {
    title: "Tributação | O Valor Capital",
    desc: "IRPF, reforma tributária, planejamento tributário, obrigações fiscais e simuladores. Tudo sobre impostos e tributos no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/tributos/",
    tplPath: "tributos",
  },
  tributacao: {
    title: "Tributação | O Valor Capital",
    desc: "IRPF, reforma tributária, planejamento tributário, obrigações fiscais e simuladores. Tudo sobre impostos e tributos no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/tributos/",
    tplPath: "tributos",
  },
  regulacao: {
    title: "Regulação | O Valor Capital",
    desc: "Regulação financeira, fiscal, de infraestrutura, telecom, saúde e concorrência no Brasil. Notícias sobre BACEN, CVM e agências reguladoras.",
    canonical: "https://www.ovalorcapital.com.br/regulacao/",
    tplPath: "regulacao",
  },
  parcerias: {
    title: "Parcerias | O Valor Capital",
    desc: "Parcerias empresariais, acadêmicas, institucionais e oportunidades de crescimento com O Valor Capital.",
    canonical: "https://www.ovalorcapital.com.br/parcerias/",
    tplPath: "parcerias",
  },
  internacional: {
    title: "Internacional | O Valor Capital",
    desc: "Notícias internacionais: geopolítica, economia global, EUA, Europa, China e mercados que impactam o Brasil.",
    canonical: "https://www.ovalorcapital.com.br/internacional/",
    tplPath: "internacional",
  },
  variedades: {
    title: "Variedades | O Valor Capital",
    desc: "Notícias de variedades, comportamento, lifestyle e curiosidades do Brasil e do mundo.",
    canonical: "https://www.ovalorcapital.com.br/variedades/",
    tplPath: "variedades",
  },
  investigativo: {
    title: "Investigativo | O Valor Capital",
    desc: "Jornalismo investigativo, reportagens especiais e apurações exclusivas sobre política, economia e poder no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/investigativo/",
    tplPath: "investigativo",
  },
  seguranca: {
    title: "Segurança Pública | O Valor Capital",
    desc: "Segurança pública, polícia, criminalidade, defesa nacional e forças armadas. Notícias e análises sobre segurança no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguranca/",
    tplPath: "seguranca",
  },
  cultura: {
    title: "Cultura | O Valor Capital",
    desc: "Arte, entretenimento, cinema, literatura, música e cultura brasileira. O melhor da produção cultural nacional.",
    canonical: "https://www.ovalorcapital.com.br/cultura/",
    tplPath: "cultura",
  },
  profissoes: {
    title: "Profissões | O Valor Capital",
    desc: "Tendências de mercado, perspectivas e análises das principais profissões e carreiras em alta no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/profissoes/",
    tplPath: "profissoes",
  },
  vagas: {
    title: "Vagas de Emprego | O Valor Capital",
    desc: "Vagas de emprego abertas no Brasil, oportunidades no mercado de trabalho, CLT, home office e as melhores empresas para trabalhar.",
    canonical: "https://www.ovalorcapital.com.br/vagas/",
    tplPath: "vagas",
  },
  concursos: {
    title: "Concursos Públicos | O Valor Capital",
    desc: "Concursos públicos abertos, novos editais, inscrições, gabaritos e resultados. Oportunidades no setor público brasileiro.",
    canonical: "https://www.ovalorcapital.com.br/concursos/",
    tplPath: "concursos",
  },
  imoveis: {
    title: "Imóveis | O Valor Capital",
    desc: "Mercado imobiliário, lançamentos, financiamento habitacional, Minha Casa Minha Vida, FGTS, aluguel e compra de imóveis.",
    canonical: "https://www.ovalorcapital.com.br/imoveis/",
    tplPath: "imoveis",
  },
  esg: {
    title: "ESG | O Valor Capital",
    desc: "ESG, sustentabilidade empresarial, impacto social e ambiental, finanças verdes e agenda ESG no Brasil e no mundo.",
    canonical: "https://www.ovalorcapital.com.br/esg/",
    tplPath: "esg",
  },
  defesa: {
    title: "Defesa Nacional | O Valor Capital",
    desc: "Forças armadas, defesa nacional, Exército, Marinha, Aeronáutica, política de defesa e segurança do Estado brasileiro.",
    canonical: "https://www.ovalorcapital.com.br/defesa/",
    tplPath: "defesa",
  },
  religiao: {
    title: "Fé & Espiritualidade | O Valor Capital",
    desc: "Notícias religiosas, espiritualidade, tradições de fé, valores familiares e o papel da religião na sociedade brasileira.",
    canonical: "https://www.ovalorcapital.com.br/religiao/",
    tplPath: "religiao",
  },
  colunistas: {
    title: "Colunistas & Opinião | O Valor Capital",
    desc: "Análise, opinião e contexto dos principais pensadores sobre política, economia e sociedade brasileira.",
    canonical: "https://www.ovalorcapital.com.br/colunistas/",
    tplPath: "colunistas",
  },
  "brasil-on": {
    title: "Brasil On | O Valor Capital",
    desc: "Segurança pública, investigação jornalística, denúncias, defesa civil e variedades do Brasil real. O país sem filtro.",
    canonical: "https://www.ovalorcapital.com.br/brasil-on/",
    tplPath: "brasil-on",
  },
  carreira: {
    title: "Carreira | O Valor Capital",
    desc: "Vagas de emprego, concursos públicos, profissões em alta, educação e parcerias. Tudo para crescer na carreira e no mercado de trabalho.",
    canonical: "https://www.ovalorcapital.com.br/carreira/",
    tplPath: "carreira",
  },
};

const SECTION_LABELS = {
  investigativo: {
    denuncias: "Denuncias e Exposicao",
    "contas-publicas": "Contas Publicas"
  },
  profissoes: {
    medicina: "Medicina",
    enfermagem: "Enfermagem",
    odontologia: "Odontologia",
    farmacia: "Farmacia",
    psicologia: "Psicologia",
    fisioterapia: "Fisioterapia",
    nutricao: "Nutricao",
    veterinaria: "Medicina Veterinaria",
    biomedicina: "Biomedicina",
    fonoaudiologia: "Fonoaudiologia",
    direito: "Direito e Advocacia",
    contabilidade: "Contabilidade",
    administracao: "Administracao",
    economia: "Economia",
    auditoria: "Auditoria e Compliance",
    "engenharia-civil": "Engenharia Civil e Construcao",
    arquitetura: "Arquitetura e Urbanismo",
    "engenharia-eletrica": "Engenharia Eletrica e Eletronica",
    "engenharia-quimica": "Engenharia Quimica e Materiais",
    ti: "TI e Programacao",
    agronomia: "Agronomia e Agro",
    jornalismo: "Jornalismo",
    publicidade: "Publicidade e Propaganda",
    "relacoes-publicas": "Relacoes Publicas",
    pedagogia: "Pedagogia e Docencia",
    rh: "Recursos Humanos",
    "servico-social": "Servico Social"
  },
  colunistas: {
    "roberto-terrasan": "Roberto Terrasan",
    "beta-ferreira": "Beta Ferreira",
    "adriana-ferreira": "Adriana Ferreira",
    "michele-froiz": "Michele Froiz",
    "coluna-ovc": "Coluna OVC",
    "prof-marcos-pizzolatto": "Prof. Marcos Pizzolatto",
    "larissa-corvetto": "Larissa Corvetto",
    "taisa-da-fonseca": "Taisa da Fonseca",
    "andre-oliveira": "Andre Oliveira",
    "gabriel-thiede": "Gabriel Thiede",
    "fabiana-campos": "Fabiana Campos"
  }
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

  const rawSection = (req.query.section || "").toLowerCase().replace(/\/+$/g, "").trim();
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
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(html);
}
