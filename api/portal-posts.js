import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=60");

  const { categoria, limit = 20, page = 0, id } = req.query;

  try {
    // Buscar matéria específica
    if (id) {
      const { data, error } = await supabase.from("posts")
        .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,created_at,published_at")
        .eq("id", id)
        .eq("status", "publicado")
        .single();
      if (error || !data) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(formatPost(data));
    }

    // Listar matérias publicadas
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

    return res.status(200).json({
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
      posts: (data || []).map(formatPost)
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function formatPost(p) {
  let tags = [];
  try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch(_) {}
  const categoria = tags[0] || "geral";
  const slug = slugify(p.titulo || "materia");
  return {
    id: p.id,
    titulo: p.titulo,
    subtitulo: p.comentario_fixado || "",
    resumo: (p.conteudo || "").slice(0, 200).replace(/^Redação OVC.*?\n/, "").trim() + "...",
    corpo: p.conteudo,
    imagem: p.imagem || "",
    categoria,
    tags,
    slug,
    url: `/materia/${slug}-${p.id.slice(0,8)}`,
    data: p.published_at || p.created_at
  };
}

function slugify(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s-]/g,"")
    .trim().replace(/\s+/g,"-")
    .slice(0, 60);
}
