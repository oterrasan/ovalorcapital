// Brasil ON — feed JSON de posts publicados (brasilon_posts).
// Homepage e páginas de categoria são HTML estático (public/) — o conteúdo
// é carregado client-side via fetch nesta rota, mesmo padrão do OVC
// (que também serve a home como arquivo estático + JS busca os posts).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATS = new Set(["brasil-on", "politica", "policia", "futebol"]);

// 04/09/2026 — Roberto foi explícito: "NO PORTAL (NO SITE DO BRASIL ON) SÓ
// PODE SER PUBLICADO O QUE O OVC PUBLICOU NO DIA... É SEMPRE O ESPELHO DO
// DIA." A tabela brasilon_posts é um arquivo permanente que acumula desde
// 25/08 (nunca expira sozinho), mas a LISTAGEM visível (home + páginas de
// categoria, que é isso que este endpoint alimenta) deve mostrar só o
// que tem published_at dentro do dia calendário BRT de hoje.
// Deliberadamente NÃO aplicado em article.js (páginas individuais
// permanecem acessíveis pelo link direto) nem em sitemap.js (continua
// listando tudo) — mexer nisso derrubaria as 861 páginas já indexadas no
// Search Console (confirmado por Roberto hoje mesmo). Só a listagem que
// um visitante navega precisa ser o "espelho do dia".
function inicioHojeBRT() {
  const anoMesDia = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(`${anoMesDia}T00:00:00-03:00`).toISOString();
}

export default async function handler(req, res) {
  try {
    if (String(req.query.maisLidas || "") === "true") return handleMaisLidas(req, res);

    const categoria = String(req.query.categoria || "").toLowerCase();
    const limit = clampInt(req.query.limit, 20, 1, 60);
    const offset = clampInt(req.query.offset, 0, 0, 5000);

    let q = supabase.from("brasilon_posts")
      .select("id,titulo,comentario_fixado,imagem,categoria,created_at,published_at", { count: "exact" })
      .eq("status", "publicado")
      .gte("published_at", inicioHojeBRT())
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

// Mais Lidas — Brasil ON não tem contador de views próprio ainda (exigiria
// coluna nova em brasilon_posts, uma migração que precisa ser rodada à mão
// no Supabase). Enquanto isso não existe, usa como proxy honesto o
// metrics.views já acumulado no artigo ORIGINAL do OVC (origem_post_id) —
// é o post idêntico, então "quanto essa matéria já foi lida" é um número
// real, só que contado do lado do OVC, não visitas específicas do Brasil ON.
async function handleMaisLidas(req, res) {
  try {
    const categoria = String(req.query.categoria || "").toLowerCase();
    const limit = clampInt(req.query.limit, 8, 1, 20);

    let q = supabase.from("brasilon_posts")
      .select("id,origem_post_id,titulo,comentario_fixado,imagem,categoria,created_at,published_at")
      .eq("status", "publicado")
      .not("origem_post_id", "is", null)
      .gte("published_at", inicioHojeBRT())
      .order("published_at", { ascending: false })
      .limit(300);
    if (categoria) {
      if (!CATS.has(categoria)) return res.status(400).json({ error: "categoria inválida" });
      q = q.eq("categoria", categoria);
    }

    const { data: candidatos, error } = await q;
    if (error) throw error;
    if (!candidatos?.length) return res.status(200).json({ posts: [] });

    const ids = candidatos.map(c => c.origem_post_id);
    const { data: viewsRows } = await supabase.from("posts").select("id,metrics").in("id", ids);
    const viewsMap = {};
    (viewsRows || []).forEach(r => { viewsMap[r.id] = parseInt(r.metrics?.views, 10) || 0; });

    const ranked = candidatos
      .map(c => ({ ...c, __views: viewsMap[c.origem_post_id] || 0 }))
      .sort((a, b) => b.__views - a.__views || new Date(b.published_at) - new Date(a.published_at))
      .slice(0, limit)
      .map(formatPost);

    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
    return res.status(200).json({ posts: ranked });
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
