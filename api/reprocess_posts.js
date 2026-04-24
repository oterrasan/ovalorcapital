// /api/reprocess_posts — reprocessa todos os posts pendentes com prompt OVC correto
// GET /api/reprocess_posts?token=ovc2026&offset=0
// Processa 10 por vez para evitar timeout (max 60s no Vercel Hobby)

import { createClient } from "@supabase/supabase-js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.query.token !== "ovc2026") return res.status(401).json({ error: "unauthorized" });

  const offset = parseInt(req.query.offset || "0");
  const batchSize = 8;

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id,titulo,conteudo,user_tags")
    .eq("status", "pendente")
    .order("created_at", { ascending: true })
    .range(offset, offset + batchSize - 1);

  if (error) return res.status(500).json({ error: error.message });
  if (!posts?.length) return res.status(200).json({ done: true, msg: "Todos os posts processados" });

  let ok = 0, erros = 0;
  const resultados = [];

  for (const post of posts) {
    try {
      // Extrair categoria
      let tags = [];
      try { tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) {}
      const categoria = tags[0] || "geral";

      // Reescrever conteúdo no padrão OVC
      const sourceText = post.conteudo || post.titulo || "";
      if (sourceText.length < 50) {
        erros++;
        resultados.push({ id: post.id, status: "skip", motivo: "conteudo muito curto" });
        continue;
      }

      const content = await rewritePortal(sourceText, post.titulo);

      // Buscar imagem limpa
      const novaImagem = await findImage(content.titulo || post.titulo, content.categoria || categoria);

      // Atualizar post
      const { error: upErr } = await supabase.from("posts").update({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem: novaImagem,
        user_tags: JSON.stringify([content.categoria || categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
      }).eq("id", post.id);

      if (upErr) throw upErr;
      ok++;
      resultados.push({ id: post.id, titulo: content.titulo, chars: content.corpo.length, imagem: novaImagem.slice(0,60) });

    } catch(e) {
      erros++;
      resultados.push({ id: post.id, status: "erro", msg: e.message?.slice(0,100) });
    }
  }

  // Contar quantos ainda faltam
  const { count } = await supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pendente");

  return res.status(200).json({
    offset,
    processados: posts.length,
    ok,
    erros,
    restam: count || 0,
    proximo: posts.length === batchSize ? `/api/reprocess_posts?token=ovc2026&offset=${offset + batchSize}` : null,
    resultados
  });
}
