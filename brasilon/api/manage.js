// Brasil ON — administração mínima.
// action=sync: copia pra brasilon_posts os posts do OVC (mesmo Supabase)
// que são brasil-on ou futebol e publicado, sempre automático (Roberto,
// 25/08/2026: "MESMA LOGICA, AUTOMATICO"), sem fila de aprovação própria.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PASS = "ovc-admin-2026-secreto";
const SYNC_LOOKBACK_HORAS = 72;
const SYNC_LIMIT = 200;

export default async function handler(req, res) {
  // CORS liberado — o admin único do OVC (ovalorcapital.com.br) chama esta
  // rota de outro domínio pra mostrar status/disparar sync do Brasil ON.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = String(req.query.action || req.body?.action || "");

  if (action === "sync") {
    if (req.query.pass !== PASS && req.body?.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleSync(req, res);
  }

  if (action === "status") {
    if (req.query.pass !== PASS) return res.status(403).json({ error: "acesso negado" });
    return handleStatus(req, res);
  }

  return res.status(400).json({ error: "action inválida — use sync ou status" });
}

// Busca no OVC (posts) os candidatos brasil-on/futebol publicados recentes,
// e insere no brasilon_posts os que ainda não foram copiados (dedup por
// origem_post_id, que TEM constraint unique real criada no schema —
// upsert com onConflict é seguro aqui, diferente do bug já documentado
// na tabela config do OVC, que não tem constraint).
async function handleSync(req, res) {
  try {
    const cutoff = new Date(Date.now() - SYNC_LOOKBACK_HORAS * 3600000).toISOString();

    const { data: candidatos, error } = await supabase.from("posts")
      .select("id,titulo,conteudo,comentario_fixado,imagem,metrics,user_tags,subcategoria_slug,created_at,published_at,updated_at,status")
      .eq("status", "publicado")
      .gte("published_at", cutoff)
      .order("published_at", { ascending: false })
      .limit(SYNC_LIMIT);
    if (error) throw error;

    const alvos = (candidatos || [])
      .map(p => ({ post: p, categoria: classificar(p) }))
      .filter(x => x.categoria);

    if (!alvos.length) return res.status(200).json({ ok: true, candidatos: (candidatos || []).length, sincronizados: 0 });

    const ids = alvos.map(a => a.post.id);
    const { data: existentes } = await supabase.from("brasilon_posts").select("origem_post_id").in("origem_post_id", ids);
    const jaExiste = new Set((existentes || []).map(r => r.origem_post_id));

    const novos = alvos.filter(a => !jaExiste.has(a.post.id));
    if (!novos.length) return res.status(200).json({ ok: true, candidatos: candidatos.length, sincronizados: 0 });

    const rows = novos.map(({ post, categoria }) => ({
      origem_post_id: post.id,
      categoria,
      titulo: post.titulo,
      conteudo: post.conteudo,
      comentario_fixado: post.comentario_fixado || "",
      meta_title: (post.metrics && post.metrics.meta_title) || post.titulo,
      imagem: post.imagem || "",
      status: "publicado",
      created_at: post.created_at,
      published_at: post.published_at || post.created_at,
      updated_at: post.updated_at || post.published_at || post.created_at
    }));

    const { error: insertErr } = await supabase.from("brasilon_posts").insert(rows);
    if (insertErr) throw insertErr;

    return res.status(200).json({ ok: true, candidatos: candidatos.length, sincronizados: rows.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

// Classifica um post do OVC como 'brasil-on', 'futebol' ou null (fora do
// escopo do Brasil ON). user_tags é TEXT (JSON array) — nunca .contains(),
// sempre parse manual (mesma regra do resto do OVC).
function classificar(post) {
  let tags = [];
  try { tags = JSON.parse(post.user_tags || "[]"); } catch (_) {}
  if (tags.includes("brasil-on")) return "brasil-on";
  if (tags.includes("esportes") && post.subcategoria_slug === "futebol") return "futebol";
  return null;
}

async function handleStatus(req, res) {
  const { count: total } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true });
  const { count: brasilOn } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "brasil-on");
  const { count: futebol } = await supabase.from("brasilon_posts").select("*", { count: "exact", head: true }).eq("categoria", "futebol");
  const { data: ultimos } = await supabase.from("brasilon_posts").select("titulo,categoria,published_at").order("published_at", { ascending: false }).limit(5);
  return res.status(200).json({ total: total || 0, "brasil-on": brasilOn || 0, futebol: futebol || 0, ultimos: ultimos || [] });
}
