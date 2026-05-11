import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=30");

  const { categoria, limit = 40, page = 0, id, resources, sort, format } = req.query;

  if (format === "og" && id) {
    let post = null;
    try {
      if (id.length >= 36) {
        const { data } = await supabase.from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,published_at")
          .eq("status","publicado").eq("id",id).single();
        post = data;
      } else {
        const { data: rows } = await supabase.from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,published_at")
          .eq("status","publicado").ilike("id", `${id}%`).limit(1);
        post = rows?.[0] || null;
      }
    } catch(_) {}
    const p = post ? formatPost(post, false) : null;
    const title = p ? p.titulo : "O Valor Capital";
    const desc  = p ? (p.subtitulo || p.resumo || "").slice(0,200) : "Portal premium de notícias do Brasil.";
    const img   = (p && p.imagem) ? p.imagem : OG_DEFAULT;
    const url   = p ? ("https://ovalorcapital.com.br" + p.url) : "https://ovalorcapital.com.br";
    res.setHeader("Content-Type","text/html; charset=utf-8");
    res.setHeader("Cache-Control","public, max-age=300");
    return res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${title} — O Valor Capital</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="O Valor Capital">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ovalorcapital">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<script>window.location.replace("${url}");</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px;">
<p>Redirecionando para <a href="${url}">O Valor Capital</a>…</p>
</body>
</html>`);
  }

  if (sort === "popular") {
    const { data } = await supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at,metrics")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(200);
    const sorted = (data||[])
      .filter(p => p.titulo && p.id)
      .sort((a,b) => {
        const va = (a.metrics && typeof a.metrics === "object" ? a.metrics.views : 0) || 0;
        const vb = (b.metrics && typeof b.metrics === "object" ? b.metrics.views : 0) || 0;
        return vb - va;
      })
      .slice(0, Number(limit) || 10);
    const posts = sorted.map(p => formatPost(p, false)).filter(p => imgOk(p.imagem));
    return res.status(200).json({ posts, total: posts.length });
  }

  try {
    if (id) {
      let data = null;

      if (id.length >= 36) {
        const { data: row } = await supabase
          .from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
          .eq("status", "publicado")
          .eq("id", id)
          .single();
        data = row;
      } else {
        const { data: rows } = await supabase
          .from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
          .eq("status", "publicado")
          .ilike("id", `${id}%`)
          .limit(1);
        data = rows?.[0] || null;
      }

      if (!data) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(formatPost(data, true));
    }

    const { q: searchTerm } = req.query;
    if (searchTerm && searchTerm.trim().length > 0) {
      const termo = searchTerm.trim();
      const COLS = "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at";

      const [{ data: byTitulo }, { data: byConteudo }] = await Promise.all([
        supabase.from("posts").select(COLS).eq("status", "publicado")
          .ilike("titulo", `%${termo}%`)
          .order("published_at", { ascending: false })
          .limit(40),
        supabase.from("posts").select(COLS).eq("status", "publicado")
          .ilike("conteudo", `%${termo}%`)
          .order("published_at", { ascending: false })
          .limit(40)
      ]);

      const seenId = new Set();
      const combined = [];
      for (const p of [...(byTitulo || []), ...(byConteudo || [])]) {
        if (!p.id || seenId.has(p.id)) continue;
        seenId.add(p.id);
        combined.push(p);
        if (combined.length >= 40) break;
      }

      const CATS_VALIDAS = new Set(['politica','economia','negocios','investimentos','seguros','mercados',
        'educacao','industria','tecnologia','esportes','saude','familia','tributacao','regulacao',
        'parcerias','internacional','vc','colunistas','variedades',
        'investigativo','seguranca','cultura','profissoes','vagas',
        'concursos','imoveis','esg','defesa','religiao']);

      const posts = combined.map(p => formatPost(p, false)).filter(p => CATS_VALIDAS.has(p.categoria));
      return res.status(200).json({ posts, total: posts.length, query: termo });
    }

    let q = supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at", { count: "exact" })
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(Number(page) * Number(limit), (Number(page) + 1) * Number(limit) - 1);

    if (categoria && categoria !== "all") {
      q = q.like("user_tags", `%"${categoria}"%`);
    }

    const { data, count, error } = await q;
    if (error) throw error;

    const seenId = new Set();
    const seenTitulo = new Set();
    const postsRaw = (data || []).filter(p => {
      if (!p.id || !p.titulo) return false;
      if (seenId.has(p.id)) return false;
      const tNorm = (p.titulo||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,30);
      if (seenTitulo.has(tNorm)) return false;
      seenId.add(p.id);
      seenTitulo.add(tNorm);
      return true;
    });

    const CATS_VALIDAS = new Set(['politica','economia','negocios','investimentos','seguros','mercados',
      'educacao','industria','tecnologia','esportes','saude','familia','tributacao','regulacao',
      'parcerias','internacional','vc','colunistas','variedades',
      'investigativo','seguranca','cultura','profissoes','vagas',
      'concursos','imoveis','esg','defesa','religiao']);

    const posts = postsRaw.map(p => formatPost(p, false)).filter(p => imgOk(p.imagem) && CATS_VALIDAS.has(p.categoria));

    if (resources) {
      return res.status(200).json({
        articles: posts.map(p => ({
          title: p.titulo, excerpt: p.resumo, image: p.imagem,
          url: p.url, category: p.categoria, source: "Redação OVC",
          relativeDate: dataBr(p.data), readingTime: "3 min", slug: p.slug
        })),
        banners: []
      });
    }

    return res.status(200).json({ posts, total: count || 0 });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function formatPost(p, full) {
  let tags = [];
  try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch(_) {}
  const categoria = tags[0] || "geral";
  const conteudo = p.conteudo || "";
  const resumo = conteudo.slice(0, 220).replace(/^Redação OVC.*?\n/, "").trim() + "...";
  const CAT_PATH = {
    politica:"politica", economia:"economia", negocios:"negocios",
    investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
    educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
    esportes:"esportes", saude:"saude", familia:"familia",
    tributacao:"tributos", regulacao:"regulacao", internacional:"internacional",
    parcerias:"parcerias", vc:"vc", colunistas:"vc", variedades:"variedades",
    investigativo:"investigativo", seguranca:"seguranca",
    cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
    concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao",
    geral:"politica"
  };
  const sl = slugify(p.titulo || "").slice(0, 55);
  const id8 = (p.id || "").slice(0, 8);
  const cp = CAT_PATH[categoria] || "politica";
  return {
    id: p.id,
    titulo: p.titulo || "",
    subtitulo: p.comentario_fixado || "",
    resumo,
    corpo: full ? conteudo : undefined,
    imagem: p.imagem || OG_DEFAULT,
    categoria,
    subcategoria: p.subcategoria || "",
    subcategoria_slug: p.subcategoria_slug || "",
    tags,
    slug: sl,
    url: `/${cp}/${sl}-${id8}/`,
    data: p.published_at || p.created_at
  };
}

function imgOk(url) {
  if (!url || url.length < 10) return false;
  const BLOCKED = [/logo/i,/icon/i,/avatar/i,/author/i,/reporter/i,/profile/i,/headshot/i,/perfil/i,/brand/i,/\.svg$/i,/\.gif$/i];
  return !BLOCKED.some(r => r.test(url));
}

function dataBr(dt) {
  if (!dt) return "";
  try { return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }
  catch(_){ return ""; }
}

function slugify(str) {
  return (str||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
}
