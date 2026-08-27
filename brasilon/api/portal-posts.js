// Brasil ON — feed JSON de posts publicados (brasilon_posts).
// Homepage e páginas de categoria são HTML estático (public/) — o conteúdo
// é carregado client-side via fetch nesta rota, mesmo padrão do OVC
// (que também serve a home como arquivo estático + JS busca os posts).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATS = new Set(["brasil-on", "politica", "policia", "futebol"]);

export default async function handler(req, res) {
  try {
    const categoria = String(req.query.categoria || "").toLowerCase();
    const limit = clampInt(req.query.limit, 20, 1, 60);
    const offset = clampInt(req.query.offset, 0, 0, 5000);

    let q = supabase.from("brasilon_posts")
      .select("id,titulo,comentario_fixado,imagem,categoria,created_at,published_at", { count: "exact" })
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoria) {
      if (!CATS.has(categoria)) return res.status(400).json({ error: "categoria inválida" });
      q = q.eq("categoria", categoria);
    }

    const { data, error, count } = await q;
    if (error) throw error;

    const posts = (data || []).map(formatPost);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ posts, total: count || 0 });
  } catch (error) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
}

function formatPost(row) {
  const id8 = String(row.id).slice(0, 8);
  const titulo = row.titulo || "";
  const slug = slugify(titulo);
  return {
    id: row.id,
    titulo,
    resumo: row.comentario_fixado || "",
    imagem: row.imagem || "",
    categoria: row.categoria,
    published_at: row.published_at || row.created_at,
    url: `/${row.categoria}/${slug}-${id8}/`
  };
}

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "materia";
}
