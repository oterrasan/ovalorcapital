import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const BASE = "https://www.ovalorcapital.com.br";
const PAGE_SIZE = 500;

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias",
  internacional:"internacional", vc:"colunistas", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg",
  defesa:"defesa", religiao:"religiao", cultura:"cultura",
  profissoes:"profissoes", seguranca:"seguranca",
  investigativo:"investigativo", variedades:"variedades",
  colunistas:"colunistas", geral:"politica"
};

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 55);
}

const STATIC_PATHS = [
  "/","/busca/","/newsletter/","/radar/","/tv-ovc/","/radio-ovc/",
  "/dados/","/dados/cotacoes/","/dados/agenda-economica/",
  "/trabalho/","/financas/","/moradia/","/seguranca/","/bem-estar/","/inteligencia/",
  "/politica/","/economia/","/negocios/","/investimentos/",
  "/seguros/","/mercados/","/educacao/","/industria/",
  "/tecnologia/","/esportes/","/saude/","/familia/",
  "/tributos/","/regulacao/","/parcerias/","/colunistas/",
  "/vagas/","/concursos/","/imoveis/","/esg/",
  "/defesa/","/religiao/","/cultura/","/profissoes/",
  "/investigativo/","/variedades/",
  "/politica/executivo/","/politica/legislativo-congresso-ao-vivo/","/politica/judiciario/","/politica/projetos-de-lei/",
  "/politica/eleicoes/","/politica/agenda-regulatoria/","/politica/geral/",
  "/economia/monetaria-copom-selic/","/economia/fiscal-orcamento-divida-pib-primario/",
  "/economia/conjuntura-pib-emprego-consumo-focus/",
  "/economia/internacional-eua-europa-china-commodities/",
  "/economia/minuto-fiscal/","/economia/geral/",
  "/negocios/empreender-mei-me-ltda/","/negocios/tributacao-pj/",
  "/negocios/gestao-financeira/","/negocios/credito/",
  "/negocios/vendas-e-preco/","/negocios/contratos-e-societario/",
  "/negocios/lgpd-e-compliance/","/negocios/startups/","/negocios/geral/",
  "/investimentos/renda-fixa/","/investimentos/renda-variavel/",
  "/investimentos/fundos/","/investimentos/previdencia/",
  "/investimentos/alternativos/","/investimentos/estrategias/",
  "/investimentos/calendario-e-dividendos/",
  "/investimentos/educacao-do-investidor/","/investimentos/geral/",
  "/seguros/saude-e-odonto/","/seguros/vida/","/seguros/auto/",
  "/seguros/residencial/","/seguros/empresarial-e-rc/",
  "/seguros/viagem/","/seguros/kpis/","/seguros/geral/",
  "/mercados/bolsa-earnings-dividendos/","/mercados/juros-di/",
  "/mercados/cambio/","/mercados/commodities/","/mercados/cripto/",
  "/mercados/ipos-fos/","/mercados/indices/",
  "/mercados/cotacoes-em-tempo-real/","/mercados/geral/",
  "/educacao/trilha-zero/","/educacao/financas-pessoais/",
  "/educacao/carreira-e-empregos/","/educacao/cursos-e-certificacoes/",
  "/educacao/parcerias-academicas/","/educacao/glossario/",
  "/educacao/workshops-e-aulas/","/educacao/geral/",
  "/industria/construcao-e-imobiliario/","/industria/energia-e-infra/",
  "/industria/agro/","/industria/mineracao-e-siderurgia/",
  "/industria/quimica-e-materiais/","/industria/automotivo/",
  "/industria/logistica-e-portos-e-ferrovias/",
  "/industria/industria-4-0/","/industria/geral/",
  "/tecnologia/ia-e-dados/","/tecnologia/fintechs-e-pagamentos/",
  "/tecnologia/e-commerce/","/tecnologia/ciberseguranca/",
  "/tecnologia/telecom-e-5g/","/tecnologia/transformacao-digital/",
  "/tecnologia/govtech/","/tecnologia/saude-digital/","/tecnologia/geral/",
  "/esportes/futebol/","/esportes/basquete/","/esportes/tenis/",
  "/esportes/automobilismo/","/esportes/nfl/","/esportes/mlb/",
  "/esportes/mma/","/esportes/esports/","/esportes/geral/",
  "/saude/preventiva/","/saude/mental/","/saude/custos-e-indicadores/",
  "/saude/politicas/","/saude/saude-digital/","/saude/geral/",
  "/familia/orcamento/","/familia/educacao-dos-filhos/",
  "/familia/habitacao/","/familia/lazer-e-esportes/",
  "/familia/seguranca/","/familia/seguros-da-familia/",
  "/familia/sucessao-e-patrimonio/","/familia/geral/",
  "/tributos/irpf/","/tributos/investimentos/","/tributos/obrigacoes/",
  "/tributos/planejamento/","/tributos/simuladores/","/tributos/geral/",
  "/regulacao/financeiro/","/regulacao/fiscal-e-receita/",
  "/regulacao/infra-e-energia/","/regulacao/telecom-e-midia/",
  "/regulacao/transporte-e-logistica/","/regulacao/saude/",
  "/regulacao/consumidor-e-normas/","/regulacao/concorrencia-e-controle/",
  "/regulacao/mineracao-e-industria/","/regulacao/geral/",
  "/parcerias/empresas-e-startups/","/parcerias/universidades-e-faculdades/",
  "/parcerias/orgaos-e-associacoes/",
  "/parcerias/comunidades-e-influenciadores/",
  "/parcerias/programas-e-editais/","/parcerias/beneficios-e-descontos/",
  "/parcerias/geral/",
  "/vc/quem-somos/","/vc/principios-editoriais/",
  "/vc/liberdade-economica/","/vc/familia-e-patrimonio/"
];

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");

  const type = req.query.type || "index";
  const page = Math.max(0, parseInt(req.query.page || "0", 10));
  const today = new Date().toISOString().slice(0, 10);

  // ── SITEMAP ESTÁTICO ──────────────────────────────────────────────────────
  if (type === "static") {
    const xml = STATIC_PATHS.map(path =>
      `  <url><loc>${BASE}${path}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ).join("\n");
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`
    );
  }

  // ── SITEMAP DE ARTIGOS (por página) ──────────────────────────────────────
  if (type === "posts") {
    try {
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      const { data: posts, error } = await supabase
        .from("posts")
        .select("id,titulo,user_tags,published_at,updated_at")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const xml = (posts || []).map(p => {
        let tags = [];
        try { tags = JSON.parse(p.user_tags || "[]"); } catch(_) {}
        const cat     = (tags[0] || "politica").toLowerCase();
        const catPath = CAT_PATH[cat] || "politica";
        const id8     = (p.id || "").slice(0, 8);
        const sl      = slugify(p.titulo || "");
        const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
        return `  <url><loc>${BASE}/${catPath}/${sl}-${id8}/</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.9</priority></url>`;
      }).join("\n");

      return res.status(200).send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`
      );
    } catch(e) {
      return res.status(500).send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
      );
    }
  }

  // ── SITEMAP INDEX (padrão, sem parâmetros) ────────────────────────────────
  try {
    const { count, error } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "publicado");

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

    const sitemaps = [
      `  <sitemap><loc>${BASE}/sitemap.xml?type=static</loc><lastmod>${today}</lastmod></sitemap>`
    ];
    for (let i = 0; i < totalPages; i++) {
      sitemaps.push(
        `  <sitemap><loc>${BASE}/sitemap.xml?type=posts&page=${i}</loc><lastmod>${today}</lastmod></sitemap>`
      );
    }

    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`
    );
  } catch(e) {
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${BASE}/sitemap.xml?type=static</loc></sitemap></sitemapindex>`
    );
  }
}
