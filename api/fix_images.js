// /api/fix_images — processa todos os posts pendentes e substitui imagens
// Chame uma vez: GET /api/fix_images?token=ovc2026
import { createClient } from "@supabase/supabase-js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.query.token !== "ovc2026") return res.status(401).json({ error: "unauthorized" });

  // Buscar todos os posts pendentes
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id,titulo,user_tags,imagem")
    .eq("status", "pendente")
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });
  if (!posts?.length) return res.status(200).json({ msg: "nenhum post encontrado" });

  let atualizados = 0;
  let erros = 0;

  for (const post of posts) {
    try {
      let tags = [];
      try { tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) {}
      const categoria = tags[0] || "geral";

      const novaImagem = await findImage(post.titulo, categoria);

      if (novaImagem && novaImagem !== post.imagem) {
        await supabase.from("posts").update({ imagem: novaImagem }).eq("id", post.id);
        atualizados++;
      }
    } catch(e) {
      erros++;
    }
  }

  return res.status(200).json({
    total: posts.length,
    atualizados,
    erros,
    msg: "Imagens substituídas com sucesso"
  });
}
