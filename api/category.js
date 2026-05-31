import { readFileSync } from "fs";
import { join } from "path";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const CAT_SEO = {
  politica: {
    title: "PolÃ­tica | O Valor Capital",
    desc: "Cobertura completa da polÃ­tica brasileira: PresidÃªncia, Congresso Nacional, STF, eleiÃ§Ãµes e projetos de lei. NotÃ­cias e anÃ¡lises em tempo real.",
    canonical: "https://www.ovalorcapital.com.br/politica/",
    tplPath: "politica",
  },
  economia: {
    title: "Economia | O Valor Capital",
    desc: "AnÃ¡lise econÃ´mica: COPOM, Selic, PIB, inflaÃ§Ã£o, cÃ¢mbio e conjuntura macroeconÃ´mica do Brasil e do mundo. Dados e notÃ­cias em tempo real.",
    canonical: "https://www.ovalorcapital.com.br/economia/",
    tplPath: "economia",
  },
  negocios: {
    title: "NegÃ³cios | O Valor Capital",
    desc: "Empreendedorismo, gestÃ£o financeira, startups, MEI, crÃ©dito e tributaÃ§Ã£o para PJ. Tudo o que sua empresa precisa saber.",
    canonical: "https://www.ovalorcapital.com.br/negocios/",
    tplPath: "negocios",
  },
  investimentos: {
    title: "Investimentos | O Valor Capital",
    desc: "Renda fixa, renda variÃ¡vel, fundos, previdÃªncia e educaÃ§Ã£o do investidor. AnÃ¡lises e estratÃ©gias para seu patrimÃ´nio crescer.",
    canonical: "https://www.ovalorcapital.com.br/investimentos/",
    tplPath: "investimentos",
  },
  seguros: {
    title: "Seguros | O Valor Capital",
    desc: "Seguros de vida, saÃºde, auto, residencial e empresarial. Tudo sobre proteÃ§Ã£o patrimonial e familiar no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguros/",
    tplPath: "seguros",
  },
  mercados: {
    title: "Mercados Financeiros | O Valor Capital",
    desc: "Bolsa de valores, cÃ¢mbio, juros, commodities, criptomoedas e cotaÃ§Ãµes em tempo real. O melhor dos mercados financeiros do Brasil e do mundo.",
    canonical: "https://www.ovalorcapital.com.br/mercados/",
    tplPath: "mercados",
  },
  educacao: {
    title: "EducaÃ§Ã£o | O Valor Capital",
    desc: "EducaÃ§Ã£o financeira, ENEM, carreira, cursos e certificaÃ§Ãµes. ConteÃºdo para quem quer crescer profissional e financeiramente.",
    canonical: "https://www.ovalorcapital.com.br/educacao/",
    tplPath: "educacao",
  },
  industria: {
    title: "IndÃºstria | O Valor Capital",
    desc: "NotÃ­cias da indÃºstria brasileira: agronegÃ³cio, energia, construÃ§Ã£o, mineraÃ§Ã£o, automotivo, logÃ­stica e indÃºstria 4.0.",
    canonical: "https://www.ovalorcapital.com.br/industria/",
    tplPath: "industria",
  },
  tecnologia: {
    title: "Tecnologia | O Valor Capital",
    desc: "InteligÃªncia artificial, fintechs, e-commerce, ciberseguranÃ§a, 5G e transformaÃ§Ã£o digital no Brasil e no mundo.",
    canonical: "https://www.ovalorcapital.com.br/tecnologia/",
    tplPath: "tecnologia",
  },
  esportes: {
    title: "Esportes | O Valor Capital",
    desc: "Futebol, basquete, tÃªnis, automobilismo, NFL, MMA e eSports. NotÃ­cias esportivas com anÃ¡lise de negÃ³cios e impacto econÃ´mico.",
    canonical: "https://www.ovalorcapital.com.br/esportes/",
    tplPath: "esportes",
  },
  saude: {
    title: "SaÃºde | O Valor Capital",
    desc: "SaÃºde pÃºblica, SUS, saÃºde mental, planos de saÃºde e polÃ­ticas de saÃºde no Brasil. InformaÃ§Ã£o para decisÃµes mais saudÃ¡veis.",
    canonical: "https://www.ovalorcapital.com.br/saude/",
    tplPath: "saude",
  },
  familia: {
    title: "FamÃ­lia | O Valor Capital",
    desc: "OrÃ§amento familiar, educaÃ§Ã£o dos filhos, habitaÃ§Ã£o, seguros da famÃ­lia, planejamento patrimonial e sucessÃ£o.",
    canonical: "https://www.ovalorcapital.com.br/familia/",
    tplPath: "familia",
  },
  tributos: {
    title: "TributaÃ§Ã£o | O Valor Capital",
    desc: "IRPF, reforma tributÃ¡ria, planejamento tributÃ¡rio, obrigaÃ§Ãµes fiscais e simuladores. Tudo sobre impostos e tributos no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/tributos/",
    tplPath: "tributos",
  },
  tributacao: {
    title: "TributaÃ§Ã£o | O Valor Capital",
    desc: "IRPF, reforma tributÃ¡ria, planejamento tributÃ¡rio, obrigaÃ§Ãµes fiscais e simuladores. Tudo sobre impostos e tributos no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/tributos/",
    tplPath: "tributos",
  },
  regulacao: {
    title: "RegulaÃ§Ã£o | O Valor Capital",
    desc: "RegulaÃ§Ã£o financeira, fiscal, de infraestrutura, telecom, saÃºde e concorrÃªncia no Brasil. NotÃ­cias sobre BACEN, CVM e agÃªncias reguladoras.",
    canonical: "https://www.ovalorcapital.com.br/regulacao/",
    tplPath: "regulacao",
  },
  parcerias: {
    title: "Parcerias | O Valor Capital",
    desc: "Parcerias empresariais, acadÃªmicas, institucionais e oportunidades de crescimento com O Valor Capital.",
    canonical: "https://www.ovalorcapital.com.br/parcerias/",
    tplPath: "parcerias",
  },
  internacional: {
    title: "Internacional | O Valor Capital",
    desc: "NotÃ­cias internacionais: geopolÃ­tica, economia global, EUA, Europa, China e mercados que impactam o Brasil.",
    canonical: "https://www.ovalorcapital.com.br/internacional/",
    tplPath: "internacional",
  },
  variedades: {
    title: "Variedades | O Valor Capital",
    desc: "NotÃ­cias de variedades, comportamento, lifestyle e curiosidades do Brasil e do mundo.",
    canonical: "https://www.ovalorcapital.com.br/variedades/",
    tplPath: "variedades",
  },
  investigativo: {
    title: "Investigativo | O Valor Capital",
    desc: "Jornalismo investigativo, reportagens especiais e apuraÃ§Ãµes exclusivas sobre polÃ­tica, economia e poder no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/investigativo/",
    tplPath: "investigativo",
  },
  seguranca: {
    title: "SeguranÃ§a PÃºblica | O Valor Capital",
    desc: "SeguranÃ§a pÃºblica, polÃ­cia, criminalidade, defesa nacional e forÃ§as armadas. NotÃ­cias e anÃ¡lises sobre seguranÃ§a no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguranca/",
    tplPath: "seguranca",
  },
  cultura: {
    title: "Cultura | O Valor Capital",
    desc: "Arte, entretenimento, cinema, literatura, mÃºsica e cultura brasileira. O melhor da produÃ§Ã£o cultural nacional.",
    canonical: "https://www.ovalorcapital.com.br/cultura/",
    tplPath: "cultura",
  },
  profissoes: {
    title: "ProfissÃµes | O Valor Capital",
    desc: "TendÃªncias de mercado, perspectivas e anÃ¡lises das principais profissÃµes e carreiras em alta no Brasil.",
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
    title: "Concursos PÃºblicos | O Valor Capital",
    desc: "Concursos pÃºblicos abertos, novos editais, inscriÃ§Ãµes, gabaritos e resultados. Oportunidades no setor pÃºblico brasileiro.",
    canonical: "https://www.ovalorcapital.com.br/concursos/",
    tplPath: "concursos",
  },
  imoveis: {
    title: "ImÃ³veis | O Valor Capital",
    desc: "Mercado imobiliÃ¡rio, lanÃ§amentos, financiamento habitacional, Minha Casa Minha Vida, FGTS, aluguel e compra de imÃ³veis.",
    canonical: "https://www.ovalorcapital.com.br/imoveis/",
    tplPath: "imoveis",
  },
  esg: {
    title: "ESG | O Valor Capital",
    desc: "ESG, sustentabilidade empresarial, impacto social e ambiental, finanÃ§as verdes e agenda ESG no Brasil e no mundo.",
    canonical: "https://www.ovalorcapital.com.br/esg/",
    tplPath: "esg",
  },
  defesa: {
    title: "Defesa Nacional | O Valor Capital",
    desc: "ForÃ§as armadas, defesa nacional, ExÃ©rcito, Marinha, AeronÃ¡utica, polÃ­tica de defesa e seguranÃ§a do Estado brasileiro.",
    canonical: "https://www.ovalorcapital.com.br/defesa/",
    tplPath: "defesa",
  },
  religiao: {
    title: "FÃ© & Espiritualidade | O Valor Capital",
    desc: "NotÃ­cias religiosas, espiritualidade, tradiÃ§Ãµes de fÃ©, valores familiares e o papel da religiÃ£o na sociedade brasileira.",
    canonical: "https://www.ovalorcapital.com.br/religiao/",
    tplPath: "religiao",
  },
  colunistas: {
    title: "Colunistas & OpiniÃ£o | O Valor Capital",
    desc: "AnÃ¡lise, opiniÃ£o e contexto dos principais pensadores sobre polÃ­tica, economia e sociedade brasileira.",
    canonical: "https://www.ovalorcapital.com.br/colunistas/",
    tplPath: "colunistas",
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
  if (html.includes("/js/internal-page-v2.js")) return html;
  return html.replace("</head>", '  <script src="/js/internal-page-v2.js" defer></script>\n</head>');
}

function standardMain(categoryLabel, description) {
  return `<main class="ovc-main"><section class="ovc-section-hero"><div class="ovc-panel ovc-hero"><span class="ovc-badge">${esc(categoryLabel)}</span><h1>${esc(categoryLabel)}</h1><p>${esc(description)}</p></div><aside class="ovc-panel ovc-weather"><h3>Leitura rÃ¡pida</h3><div class="temp">${esc(categoryLabel)}</div><p>ConteÃºdo organizado no mesmo padrÃ£o editorial do portal, com coluna principal, lateral, imagens e mÃ³dulos de apoio.</p><div class="ovc-banner-slot"><div><strong>EspaÃ§o premium</strong><span>Ãrea preparada para publicidade e chamadas institucionais.</span></div><a class="ovc-btn secondary" href="/anuncie/">Anuncie</a></div></aside></section><section class="ovc-grid"><div class="ovc-story-stack"><div class="ovc-panel" data-hero-card></div><div class="ovc-panel ovc-story-list"><h3>Principais notÃ­cias</h3><div class="ovc-mini-list" data-main-list></div></div><div class="ovc-panel ovc-story-list"><h3>Mais da seÃ§Ã£o</h3><div class="ovc-mini-list" data-local-list></div></div></div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>`;
}

function normalizeCategoryLayout(html, cat, label, desc, section) {
  html = setBodyAttr(html, "data-category", cat);
  html = setBodyAttr(html, "data-section", section || "geral");
  html = ensureInternalScript(html);

  const hasStandardMain = html.includes("data-hero-card") && html.includes("data-main-list") && html.includes("ovc-right-rail");
  if (!hasStandardMain) {
    html = html.replace(/<main\b[\s\S]*?<\/main>/i, standardMain(label, desc));
  } else {
    html = html.replace(/<h1>[^<]*<\/h1>/i, `<h1>${esc(label)}</h1>`);
  }
  return html;
}

export default async function handler(req, res) {
  const artId = (req.query.id || "").trim();
  if (artId) {
    return res.redirect(302, "/og?id=" + encodeURIComponent(artId));
  }

  const cat = (req.query.cat || "").toLowerCase();
  const seo = CAT_SEO[cat];
  if (!seo) return res.status(404).send("Not found");

  const rawSection = (req.query.section || "").toLowerCase().replace(/\/+$/g, "").trim();
  const sectionLabel = (SECTION_LABELS[cat] && SECTION_LABELS[cat][rawSection]) || "";
  const pageLabel = sectionLabel || titleFromSeo(seo.title);
  const pageDesc = sectionLabel
    ? `Cobertura de ${sectionLabel} no O Valor Capital, com noticias, analises, oportunidades e contexto profissional em layout editorial padronizado.`
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
  html = html.replace("</head>", seoTags + "\n</head>");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
