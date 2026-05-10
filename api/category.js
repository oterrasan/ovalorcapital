import { readFileSync } from "fs";
import { join } from "path";

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
    canonical: "https://www.ovalorcapital.com.br/vc/",
    tplPath: "vc",
  },
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

export default async function handler(req, res) {
  const cat = (req.query.cat || "").toLowerCase();
  const seo = CAT_SEO[cat];
  if (!seo) return res.status(404).send("Not found");

  const tpl = getTemplate(seo.tplPath);
  if (!tpl) return res.status(500).send("Template error");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": seo.title,
    "description": seo.desc,
    "url": seo.canonical,
    "publisher": {
      "@type": "Organization",
      "name": SITE,
      "logo": { "@type": "ImageObject", "url": LOGO }
    },
    "inLanguage": "pt-BR",
    "isAccessibleForFree": true
  });

  const seoTags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.desc)}">`,
    `<link rel="canonical" href="${seo.canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.desc)}">`,
    `<meta property="og:image" content="${OG_DEFAULT}">`,
    `<meta property="og:url" content="${seo.canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(seo.title)}">`,
    `<meta name="twitter:description" content="${esc(seo.desc)}">`,
    `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n");

  let html = tpl;
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
