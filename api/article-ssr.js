import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BASE = "https://www.ovalorcapital.com.br";

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias",
  internacional:"internacional", vc:"vc", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg",
  defesa:"defesa", religiao:"religiao", cultura:"cultura",
  profissoes:"profissoes", seguranca:"seguranca",
  investigativo:"investigativo", variedades:"variedades",
  colunistas:"vc", geral:"politica"
};

const CAT_LABEL = {
  politica:"Política", economia:"Economia", negocios:"Negócios",
  investimentos:"Investimentos", seguros:"Seguros", mercados:"Mercados",
  educacao:"Educação", industria:"Indústria", tecnologia:"Tecnologia",
  esportes:"Esportes", saude:"Saúde", familia:"Família",
  tributacao:"Tributação", regulacao:"Regulação", parcerias:"Parcerias",
  internacional:"Internacional", vc:"OVC", vagas:"Vagas",
  concursos:"Concursos Públicos", imoveis:"Imóveis", esg:"ESG",
  defesa:"Defesa", religiao:"Fé & Espiritualidade", cultura:"Cultura",
  profissoes:"Profissões", seguranca:"Segurança Pública",
  investigativo:"Investigativo", variedades:"Variedades"
};

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slugify(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 55);
}

let _template = null;
function getTemplate() {
  if (!_template) {
    _template = readFileSync(join(process.cwd(), "public/materia/index.html"), "utf-8");
  }
  return _template;
}

export default async function handler(req, res) {
  const id = req.query.id || "";

  let html;
  try { html = getTemplate(); }
  catch(_) { return res.status(500).send("Template not found"); }

  if (!id) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60");
    return res.status(200).send(html);
  }

  let post = null;
  try {
    const { data } = await supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,published_at")
      .eq("status", "publicado")
      .ilike("id", `${id.slice(0,8)}%`)
      .limit(1);
    post = data?.[0] || null;
  } catch(_) {}

  if (!post) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(html);
  }

  let tags = [];
  try { tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) {}
  const cat = tags[0] || "politica";
  const catPath = CAT_PATH[cat] || "politica";
  const catLabel = CAT_LABEL[cat] || cat;
  const id8 = (post.id || "").slice(0, 8);

  const titulo = esc(post.titulo || "");
  const subtitulo = esc(post.comentario_fixado || "");
  const resumoRaw = (post.conteudo || "").slice(0, 220).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  const resumo = esc(resumoRaw);
  const imagemRaw = post.imagem || `${BASE}/images/og-default.jpg`;
  const imagem = esc(imagemRaw);
  const slugClean = slugify(post.titulo || "");
  const canonicalUrl = `${BASE}/${catPath}/${slugClean}-${id8}/`;

  const corpoHtml = (post.conteudo || "").split(/\n\n+/).filter(l => l.trim())
    .map(l => `<p>${esc(l.trim())}</p>`).join("");

  const noscriptContent = [
    `<noscript>`,
    `<article style="max-width:800px;margin:40px auto;padding:20px 24px;font-family:Georgia,serif;line-height:1.8;">`,
    `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#dc2626;margin-bottom:12px;">${catLabel}</div>`,
    `<h1 style="font-size:28px;font-weight:900;line-height:1.2;margin:0 0 16px;color:#0f172a;">${titulo}</h1>`,
    subtitulo ? `<p style="font-size:18px;color:#475569;font-style:italic;margin:0 0 24px;">${subtitulo}</p>` : "",
    `<div style="font-size:16px;color:#1e293b;">${corpoHtml}</div>`,
    `</article>`,
    `</noscript>`
  ].join("");

  const ogTags = [
    `  <link rel="canonical" href="${canonicalUrl}">`,
    `  <meta property="og:type" content="article">`,
    `  <meta property="og:site_name" content="O Valor Capital">`,
    `  <meta property="og:title" content="${titulo}">`,
    `  <meta property="og:description" content="${resumo}">`,
    `  <meta property="og:image" content="${imagem}">`,
    `  <meta property="og:url" content="${canonicalUrl}">`,
    `  <meta property="og:locale" content="pt_BR">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:site" content="@ovalorcapital">`,
    `  <meta name="twitter:title" content="${titulo}">`,
    `  <meta name="twitter:description" content="${resumo}">`,
    `  <meta name="twitter:image" content="${imagem}">`
  ].join("\n");

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo} | O Valor Capital</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${resumo}">`)
    .replace("</head>", `${ogTags}\n</head>`)
    .replace("</body>", `${noscriptContent}\n</body>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).send(html);
}
