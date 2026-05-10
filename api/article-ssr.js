import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
  politica:"Politica", economia:"Economia", negocios:"Negocios",
  investimentos:"Investimentos", seguros:"Seguros", mercados:"Mercados",
  educacao:"Educacao", industria:"Industria", tecnologia:"Tecnologia",
  esportes:"Esportes", saude:"Saude", familia:"Familia",
  tributacao:"Tributacao", regulacao:"Regulacao", parcerias:"Parcerias",
  internacional:"Internacional", vc:"OVC", vagas:"Vagas",
  concursos:"Concursos", imoveis:"Imoveis", esg:"ESG",
  defesa:"Defesa", religiao:"Religiao", cultura:"Cultura",
  profissoes:"Profissoes", seguranca:"Seguranca Publica",
  investigativo:"Investigativo", variedades:"Variedades"
};

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
    if (id.length >= 36) {
      const { data } = await supabase.from("posts")
        .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,published_at")
        .eq("status", "publicado").eq("id", id).single();
      post = data;
    } else {
      const { data } = await supabase.from("posts")
        .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,published_at")
        .eq("status", "publicado")
        .order("published_at", { ascending: false })
        .limit(500);
      post = (data || []).find(r => r.id && r.id.startsWith(id)) || null;
    }
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
  const imagemRaw = post.imagem || "https://www.ovalorcapital.com.br/assets/og-default.jpg";
  const imagem = esc(imagemRaw);
  const canonicalUrl = `https://www.ovalorcapital.com.br/${catPath}/?id=${id8}`;

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
