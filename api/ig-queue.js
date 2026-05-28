import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { status = "pending" } = req.query;
    try {
      const { data, error } = await sb
        .from("ig_queue")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: true })
        .limit(5);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ jobs: data || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    const { action } = req.query;
    const body = req.body || {};

    if (action === "done") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "id required" });
      await sb.from("ig_queue").update({ status: "done", published_at: new Date().toISOString() }).eq("id", id);
      return res.status(200).json({ ok: true });
    }
    if (action === "error") {
      const { id, message } = body;
      if (!id) return res.status(400).json({ error: "id required" });
      await sb.from("ig_queue").update({ status: "error", error_msg: message || "unknown" }).eq("id", id);
      return res.status(200).json({ ok: true });
    }
    if (action === "retry") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "id required" });
      await sb.from("ig_queue").update({ status: "pending", error_msg: null }).eq("id", id);
      return res.status(200).json({ ok: true });
    }

    const { post_id, titulo, imagem, resumo, categoria } = body;
    if (!post_id || !titulo || !imagem)
      return res.status(400).json({ error: "post_id, titulo e imagem obrigatórios" });

    const { data: existing } = await sb
      .from("ig_queue").select("id").eq("post_id", post_id)
      .in("status", ["pending", "processing"]).maybeSingle();
    if (existing) return res.status(200).json({ ok: true, duplicate: true, id: existing.id });

    const { data, error } = await sb.from("ig_queue")
      .insert({ post_id, titulo, imagem, resumo: resumo || "", categoria: categoria || "geral", status: "pending" })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, job: data });
  }

  return res.status(405).json({ error: "method not allowed" });
}
