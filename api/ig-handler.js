import { createClient } from "@supabase/supabase-js";

const PASS = 'ovc-admin-2026-secreto';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const op = req.query.op;

  // ── SETUP ────────────────────────────────────────────────────────────────
  if (op === "setup") {
    if (req.query.pass !== PASS) return res.status(403).json({ error: "Acesso negado" });

    const { error: checkErr } = await sb.from("ig_queue").select("id").limit(1);
    if (!checkErr) return res.status(200).json({ ok: true, message: "Tabela ig_queue já existe. Tudo pronto!" });

    const sql = `CREATE TABLE IF NOT EXISTS ig_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  titulo text NOT NULL,
  imagem text NOT NULL,
  resumo text DEFAULT '',
  categoria text DEFAULT 'geral',
  status text DEFAULT 'pending',
  error_msg text,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);`;

    const { error } = await sb.rpc('exec_sql', { sql });
    if (error) {
      return res.status(200).json({
        ok: false,
        manual: true,
        message: "Execute este SQL no Supabase Dashboard → SQL Editor:",
        sql
      });
    }
    return res.status(200).json({ ok: true, message: "Tabela ig_queue criada com sucesso!" });
  }

  // ── QUEUE ────────────────────────────────────────────────────────────────
  if (op === "queue") {
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
      const action = req.query.action;
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

  return res.status(400).json({ error: "op param required: setup or queue" });
}
