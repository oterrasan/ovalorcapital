import { readFileSync } from "fs";
import { join } from "path";

const SITE = "O Valor Capital";
const ORIGIN = "https://www.ovalorcapital.com.br";
const OG_DEFAULT = `${ORIGIN}/images/og-default.jpg`;
const LOGO = `${ORIGIN}/images/logo-ovc.png`;

const CATEGORIES = {
  politica: ["Politica", "Cobertura de poder, governo, Congresso, Judiciario, eleicoes e agenda institucional.", "politica"],
  economia: ["Economia", "Analise economica, Selic, inflacao, PIB, emprego, contas publicas e conjuntura.", "economia"],
  negocios: ["Negocios", "Empresas, empreendedorismo, credito, gestao, contratos, startups e ambiente de negocios.", "negocios"],
  investimentos: ["Investimentos", "Renda fixa, renda variavel, fundos, previdencia, dividendos e educacao do investidor.", "investimentos"],
  seguros: ["Seguros", "Seguro de vida, saude, auto, residencial, empresarial e protecao patrimonial.", "seguros"],
  mercados: ["Mercados", "Bolsa, juros, cambio, commodities, cripto, indices e sinais relevantes para o capital.", "mercados"],
  educacao: ["Educacao", "Educacao financeira, carreira, cursos, certificacoes, universidades e formacao profissional.", "educacao"],
  industria: ["Industria", "Agro, energia, construcao, mineracao, logistica, portos, ferrovias e industria 4.0.", "industria"],
  tecnologia: ["Tecnologia", "Inteligencia artificial, dados, fintechs, pagamentos, telecom, govtech e transformacao digital.", "tecnologia"],
  esportes: ["Esportes", "Futebol, automobilismo, tenis, MMA, eSports e negocio do esporte.", "esportes"],
  saude: ["Saude", "Saude publica, planos, medicina, saude mental, custos e indicadores do setor.", "saude"],
  familia: ["Familia", "Educacao dos filhos, orcamento familiar, habitacao, sucessao, patrimonio e protecao.", "familia"],
  tributos: ["Tributos", "IRPF, reforma tributaria, planejamento, obrigacoes fiscais e impactos no contribuinte.", "tributos"],
  tributacao: ["Tributos", "IRPF, reforma tributaria, planejamento, obrigacoes fiscais e impactos no contribuinte.", "tributos"],
  regulacao: ["Regulacao", "Banco Central, CVM, agencias reguladoras, normas, fiscalizacao e ambiente institucional.", "regulacao"],
  parcerias: ["Parcerias", "Parcerias academicas, empresariais, institucionais, programas e oportunidades comerciais.", "parcerias"],
  internacional: ["Internacional", "Geopolitica, economia global, EUA, Europa, China e fatos externos que afetam o Brasil.", "internacional"],
  variedades: ["Variedades", "Comportamento, cultura popular, cotidiano, entretenimento e temas leves do dia.", "variedades"],
  investigativo: ["Investigativo", "Apuracao, contas publicas, denuncias, fiscalizacao e reportagens especiais.", "investigativo"],
  seguranca: ["Seguranca", "Seguranca publica, criminalidade, policia, defesa social e ordem institucional.", "seguranca"],
  cultura: ["Cultura", "Arte, cinema, musica, literatura, entretenimento e producao cultural brasileira.", "cultura"],
  profissoes: ["Profissoes", "Medicina, Direito, Engenharia, TI, Comunicacao e mercado profissional brasileiro.", "profissoes"],
  vagas: ["Vagas", "Vagas de emprego, oportunidades CLT, carreira, recrutamento e mercado de trabalho.", "vagas"],
  concursos: ["Concursos", "Concursos publicos, editais, inscricoes, provas, cargos e oportunidades no setor publico.", "concursos"],
  imoveis: ["Imoveis", "Mercado imobiliario, financiamento, casa propria, aluguel, FGTS e habitacao.", "imoveis"],
  esg: ["ESG", "Sustentabilidade, governanca, impacto social, agenda ambiental e negocios responsaveis.", "esg"],
  defesa: ["Defesa", "Forcas Armadas, defesa nacional, tecnologia militar e seguranca do Estado brasileiro.", "defesa"],
  religiao: ["Religiao", "Fe, espiritualidade, valores familiares, comunidades religiosas e sociedade.", "religiao"],
  colunistas: ["Colunistas", "Artigos, opiniao, analises autorais e vozes do O Valor Capital.", "colunistas"]
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

const cache = {};

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTemplate(path) {
  const chosen = path || "politica";
  if (cache[chosen]) return cache[chosen];
  try {
    cache[chosen] = readFileSync(join(process.cwd(), "public", chosen, "index.html"), "utf8");
    return cache[chosen];
  } catch (_) {
    cache.politica = cache.politica || readFileSync(join(process.cwd(), "public", "politica", "index.html"), "utf8");
    return cache.politica;
  }
}

function setBodyAttr(html, name, value) {
  const attr = `${name}="${esc(value)}"`;
  const re = new RegExp(`\\s${name}="[^"]*"`, "i");
  if (re.test(html)) return html.replace(re, ` ${attr}`);
  return html.replace(/<body\b([^>]*)>/i, `<body$1 ${attr}>`);
}

function ensureScripts(html) {
  const guard = '<script src="/js/category-section-guard.js" defer></script>';
  if (!html.includes("/js/category-section-guard.js")) {
    if (html.includes("/js/internal-page-v2.js")) {
      html = html.replace(/<script\s+src="\/js\/internal-page-v2\.js"[^>]*><\/script>/i, `${guard}\n$&`);
    } else {
      html = html.replace("</head>", `  ${guard}\n</head>`);
    }
  }
  if (!html.includes("/js/internal-page-v2.js")) {
    html = html.replace("</head>", '  <script src="/js/internal-page-v2.js" defer></script>\n</head>');
  }
  return html;
}

function standardMain(label, description) {
  return `<main class="ovc-main"><section class="ovc-section-hero"><div class="ovc-panel ovc-hero"><span class="ovc-badge">${esc(label)}</span><h1>${esc(label)}</h1><p>${esc(description)}</p></div><aside class="ovc-panel ovc-weather"><h3>Leitura rapida</h3><div class="temp">${esc(label)}</div><p>Conteudo organizado no mesmo padrao editorial do portal, com coluna principal, lateral, imagens e modulos de apoio.</p><div class="ovc-banner-slot"><div><strong>Espaco premium</strong><span>Area preparada para publicidade e chamadas institucionais.</span></div><a class="ovc-btn secondary" href="/anuncie/">Anuncie</a></div></aside></section><section class="ovc-grid"><div class="ovc-story-stack"><div class="ovc-panel" data-hero-card></div><div class="ovc-panel ovc-story-list"><h3>Principais noticias</h3><div class="ovc-mini-list" data-main-list></div></div><div class="ovc-panel ovc-story-list"><h3>Mais da secao</h3><div class="ovc-mini-list" data-local-list></div></div></div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>`;
}

function normalizeLayout(html, cat, label, desc, section) {
  html = setBodyAttr(html, "data-category", cat);
  html = setBodyAttr(html, "data-section", section || "geral");
  html = ensureScripts(html);

  if (cat === "colunistas") return html;

  const hasShell = html.includes("data-hero-card") && html.includes("data-main-list") && html.includes("ovc-right-rail");
  if (!hasShell) return html.replace(/<main\b[\s\S]*?<\/main>/i, standardMain(label, desc));
  return html.replace(/<h1>[^<]*<\/h1>/i, `<h1>${esc(label)}</h1>`);
}

function seoBlock(title, desc, canonical) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: desc,
    url: canonical,
    publisher: { "@type": "Organization", name: SITE, logo: { "@type": "ImageObject", url: LOGO } },
    inLanguage: "pt-BR",
    isAccessibleForFree: true
  });
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${OG_DEFAULT}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`
  ].join("\n");
}

export default async function handler(req, res) {
  const id = String(req.query.id || "").trim();
  if (id) return res.redirect(302, "/og?id=" + encodeURIComponent(id));

  const cat = String(req.query.cat || "").toLowerCase();
  const cfg = CATEGORIES[cat];
  if (!cfg) return res.status(404).send("Not found");

  const [baseLabel, baseDesc, templatePath] = cfg;
  const rawSection = String(req.query.section || "").toLowerCase().replace(/\/+$/g, "").trim();
  const sectionLabel = (SECTION_LABELS[cat] && SECTION_LABELS[cat][rawSection]) || "";
  const label = sectionLabel || baseLabel;
  const desc = sectionLabel
    ? `Cobertura de ${sectionLabel} no O Valor Capital, com noticias, analises e contexto no padrao editorial do portal.`
    : baseDesc;
  const canonicalBase = `${ORIGIN}/${templatePath}/`;
  const canonical = sectionLabel ? `${canonicalBase}${rawSection}/` : canonicalBase;
  const title = `${label} | ${SITE}`;

  let html = getTemplate(templatePath);
  html = normalizeLayout(html, cat, label, desc, sectionLabel ? rawSection : "geral");
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace("</head>", seoBlock(title, desc, canonical) + "\n</head>");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
