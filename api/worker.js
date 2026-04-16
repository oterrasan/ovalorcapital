import { createClient } from "@supabase/supabase-js";
import { db } from "../core/db.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date().toISOString();

    // Buscar posts agendados cujo horário já chegou
    const { data: scheduled, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(5);

    if (error) return res.status(200).json({ status: "error", error: error.message });
    if (!scheduled?.length) return res.status(200).json({ status: "no_scheduled" });

    const results = [];
    for (const post of scheduled) {
      const result = await db.approve(post.id);
      results.push({ id: post.id, titulo: post.titulo, ...result });
    }

    return res.status(200).json({
      status: "ok",
      processed: results.length,
      results
    });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
