import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=30");

  const { categoria, limit = 40, page = 0, id, resources } = req.query;

  try {
    if (id) {
      let data = null;

      if (id.length >= 36) {
        // ID completo — busca direta
        const { data: row } = await supabase
          .from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,created_at,published_at")
          .eq("status", "publicado")
          .eq("id", id)
          .single();
        data = row;
      } else {
        // ID parcial — buscar recentes e filtrar em JS
        const { data: rows } = await supabase
          .from("posts")
          .select("id,titulo,comentario_fixado,conteudo,imagem,user_tags,created_at,published_at")
          .eq("status", "publicado")
          .order("published_at", { ascending: false })
          .limit(200);
        if (rows) {
          data = rows.find(r => r.id && r.id.startsWith(id)) || null;
        }
      }

      if (!data) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(formatPost(data, true));
    }

    // Lista paginada
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
    tributacao:"tributos", regulacao:"regulacao", internacional:"economia",
    geral:"politica"
  };
  return {
    id: p.id,
    titulo: p.titulo || "",
    subtitulo: p.comentario_fixado || "",
    resumo,
    corpo: full ? conteudo : undefined,
    imagem: p.imagem || "",
    categoria,
    tags,
    slug: slugify(p.titulo || ""),
    url: `/${CAT_PATH[categoria] || "politica"}/?id=${(p.id||"").slice(0,8)}`,
    data: p.published_at || p.created_at
  };
}

function dataBr(dt) {
  if (!dt) return "";
  try { return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }
  catch(_){ return ""; }
}

function slugify(str) {
  return (str||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
}
