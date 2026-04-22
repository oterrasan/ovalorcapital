import { createClient } from "@supabase/supabase-js";
import { rewriteTitle } from "../core/ai_portal.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, titulo, conteudo")
      .eq("status", "publicado")
      .limit(200);

    if (error) throw error;

    let atualizados = 0;
    const resultados = [];

    for (const post of posts) {
      try {
        const novoTitulo = await rewriteTitle(post.titulo, post.conteudo);
        if (novoTitulo && novoTitulo !== post.titulo) {
          await supabase.from("posts")
            .update({ titulo: novoTitulo })
            .eq("id", post.id);
          atualizados++;
          resultados.push({ de: post.titulo, para: novoTitulo });
        }
        // Pausa para não estourar rate limit
        await new Promise(r => setTimeout(r, 800));
      } catch(e) {
        resultados.push({ de: post.titulo, erro: e.message });
      }
    }

    return res.status(200).json({ ok: true, total: posts.length, atualizados, resultados });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
