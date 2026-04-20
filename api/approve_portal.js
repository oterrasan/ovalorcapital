import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { id, ids, action } = req.body || {};

  try {
    const now = new Date().toISOString();

    // Aprovar individual
    if (action === "aprovar" && id) {
      await supabase.from("posts").update({
        status: "publicado",
        approved: true,
        published_at: now,
        updated_at: now
      }).eq("id", id);
      return res.status(200).json({ ok: true, action: "aprovado", id });
    }

    // Rejeitar individual
    if (action === "rejeitar" && id) {
      await supabase.from("posts").update({
        status: "rejeitado",
        approved: false,
        updated_at: now
      }).eq("id", id);
      return res.status(200).json({ ok: true, action: "rejeitado", id });
    }

    // Editar e aprovar
    if (action === "editar_aprovar" && id) {
      const { titulo, conteudo, imagem, comentario_fixado } = req.body;
      await supabase.from("posts").update({
        titulo, conteudo, imagem, comentario_fixado,
        status: "publicado",
        approved: true,
        published_at: now,
        updated_at: now
      }).eq("id", id);
      return res.status(200).json({ ok: true, action: "editado_aprovado", id });
    }

    // Aprovar lote
    if (action === "aprovar_lote" && ids && Array.isArray(ids)) {
      const results = [];
      for (const pid of ids) {
        const { error } = await supabase.from("posts").update({
          status: "publicado",
          approved: true,
          published_at: now,
          updated_at: now
        }).eq("id", pid);
        results.push({ id: pid, ok: !error });
      }
      return res.status(200).json({ ok: true, action: "lote_aprovado", total: results.length, results });
    }

    // Rejeitar lote
    if (action === "rejeitar_lote" && ids && Array.isArray(ids)) {
      await supabase.from("posts").update({
        status: "rejeitado",
        approved: false,
        updated_at: now
      }).in("id", ids);
      return res.status(200).json({ ok: true, action: "lote_rejeitado", total: ids.length });
    }

    return res.status(400).json({ error: "acao_invalida" });
  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
