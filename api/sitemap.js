import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias",
  vc:"vc", colunistas:"vc", internacional:"internacional", variedades:"variedades",
  investigativo:"investigativo", seguranca:"seguranca",
  cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao",
  geral:"politica"
};

function slugify(str) {
  return (str||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,55);
}

const STATIC_PAGES = [
  { loc:"https://ovalorcapital.com.br/", priority:"1.0", changefreq:"hourly" },
  { loc:"https://ovalorcapital.com.br/politica/", priority:"0.9", changefreq:"hourly" },
  { loc:"https://ovalorcapital.com.br/economia/", priority:"0.9", changefreq:"hourly" },
  { loc:"https://ovalorcapital.com.br/negocios/", priority:"0.9", changefreq:"hourly" },
  { loc:"https://ovalorcapital.com.br/investimentos/", priority:"0.8", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/mercados/", priority:"0.8", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/tecnologia/", priority:"0.8", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/saude/", priority:"0.8", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/internacional/", priority:"0.8", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/seguros/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/tributos/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/regulacao/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/industria/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/educacao/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/esportes/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/familia/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/variedades/", priority:"0.7", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/cultura/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/investigativo/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/seguranca/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/profissoes/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/vagas/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/concursos/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/imoveis/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/esg/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/defesa/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/religiao/", priority:"0.6", changefreq:"daily" },
  { loc:"https://ovalorcapital.com.br/parcerias/", priority:"0.5", changefreq:"weekly" },
  { loc:"https://ovalorcapital.com.br/vc/", priority:"0.5", changefreq:"weekly" },
  { loc:"https://ovalorcapital.com.br/contato/", priority:"0.4", changefreq:"monthly" }
];

export default async function handler(req, res) {
  const BASE = "https://ovalorcapital.com.br";

  let articleUrls = [];
  try {
    const { data } = await supabase.from("posts")
      .select("id,titulo,user_tags,published_at,updated_at")
      .eq("status","publicado")
      .order("published_at",{ascending:false})
      .limit(5000);

    articleUrls = (data||[])
      .filter(p => p.id && p.titulo)
      .map(p => {
        let tags = [];
        try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags||[]); } catch(_) {}
        const cat = tags[0] || "politica";
        const catPath = CAT_PATH[cat] || "politica";
        const id8 = (p.id||"").slice(0,8);
        const slug = slugify(p.titulo);
        const loc = `${BASE}/${catPath}/${slug}-${id8}/`;
        const lastmod = (p.updated_at||p.published_at||"").slice(0,10);
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      });
  } catch(e) {}

  const staticUrls = STATIC_PAGES.map(p =>
    `  <url>\n    <loc>${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...articleUrls].join("\n")}\n</urlset>`;

  res.setHeader("Content-Type","application/xml; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=3600, stale-while-revalidate=300");
  return res.status(200).send(xml);
}
