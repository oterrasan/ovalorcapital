import { createClient } from "@supabase/supabase-js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function stripTitle(t) {
  return (t || "").replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();
}

async function cleanupTitles(res, body) {
  if (!body.force) return res.status(403).json({ error: "requires force:true" });
  try {
    const { data: dirty } = await supabase
      .from("posts")
      .select("id, titulo")
      .like("titulo", "%**%")
      .limit(500);
    let fixedTitles = 0;
    for (const p of dirty || []) {
      const clean = stripTitle(p.titulo);
      if (clean !== p.titulo) {
        await supabase.from("posts").update({ titulo: clean }).eq("id", p.id);
        fixedTitles++;
      }
    }
    return res.status(200).json({ status: "ok", fixedTitles, fixedContent: 0 });
  } catch (e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}

export default async function handler(req, res) {
  const body = req.body || {};
  const meta = req.query || {};

  if (meta.action === "buscar_imagem") {
    const q = (meta.q || "").trim();
    if (!q) return res.status(400).json({ error: "q obrigatorio" });
    try {
      const url = await findImage(q, "", "", "");
      return res.status(200).json({ url: url || null });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (body.action === "cleanup_titles") return cleanupTitles(res, body);

  return res.status(200).json({
    status: "pipeline_pausado",
    message: "Geracao de conteudo bloqueada. OVC em reorganizacao para funil editorial unico.",
    generated: 0
  });
}
