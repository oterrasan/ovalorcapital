import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=60");

  const { categoria, limit = 40, page = 0, id, resources } = req.query;

  try {
    // Busca por ID parcial (8 chars) — página de matéria
    if (id) {
      const isPartial = id.length === 8;
      let q = supabase.from("posts")
        .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,created_at,published_at")
        .eq("status", "publicado");
      if (isPartial) {
        q = q.ilike("id", `${id}%`);
      } else {
        q = q.eq("id", id);
      }
      const { data, error } = await (isPartial ? q.limit(1).single() : q.single());
      if (error || !data) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(formatPost(data, true));
    }

    // Buscar matérias publicadas
    let q = supabase.from("posts")
      .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,created_at,published_at", { count: "exact" })
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(Number(page) * Number(limit), (Number(page) + 1) * Number(limit) - 1);

    if (categoria && categoria !== "all") {
      q = q.contains("user_tags", JSON.stringify([categoria]));
    }

    const { data, count, error } = await q;
    if (error) throw error;

    const posts = (data || []).map(p => formatPost(p, false));

    // Se veio do internal-page.js (?resources=articles,...) retornar no formato legado
    if (resources) {
      return res.status(200).json({
        articles: posts.map(p => ({
          title: p.titulo,
          excerpt: p.resumo,
          image: p.imagem,
          url: p.url,
          category: p.categoria,
          source: "Redação OVC",
          relativeDate: dataBr(p.data),
          readingTime: "3 min",
          slug: p.slug
        })),
        banners: []
      });
    }

    return res.status(200).json({
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
      posts
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function formatPost(p, full = false) {
  let tags = [];
  try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch(_) {}
  const categoria = tags[0] || "geral";
  const slug = slugify(p.titulo || "materia");
  const conteudo = p.conteudo || "";
  const linhas = conteudo.split("\n").filter(l => l.trim() && !l.startsWith("Redação OVC"));
  const resumo = linhas.join(" ").slice(0, 200) + (linhas.join(" ").length > 200 ? "..." : "");

  return {
    id: p.id,
    titulo: p.titulo || "",
    subtitulo: p.comentario_fixado || "",
    resumo,
    corpo: full ? conteudo : undefined,
    imagem: p.imagem || "",
    categoria,
    tags,
    slug,
    url: `/materia.html?id=${p.id.slice(0,8)}`,
    data: p.published_at || p.created_at
  };
}

function dataBr(dt) {
  if (!dt) return "";
  try { return new Date(dt).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }); }
  catch(_) { return ""; }
}

function slugify(str) {
  return (str || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-")
    .slice(0, 60);
}
