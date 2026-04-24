import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const { url, texto, publicar } = req.body || {};

    if (!url && !texto) return res.status(400).json({ error: "Informe url ou texto" });

    let sourceText = "";
    let sourceTitle = "";
    let imagem = "";

    if (url) {
      // Scrape da URL
      const article = await scrape(url);
      if (!article.text || article.text.length < 100) {
        return res.status(400).json({ error: "Não foi possível extrair conteúdo desta URL" });
      }
      sourceText = article.text;
      sourceTitle = article.title || "";
      imagem = article.image || "";
    } else {
      // Texto direto
      sourceText = texto;
    }

    // Gerar no padrão OVC
    const content = await rewritePortal(sourceText, sourceTitle);

    if (!content.corpo || content.corpo.length < 300) {
      return res.status(500).json({ error: "Conteúdo gerado insuficiente" });
    }

    const hash = crypto.createHash("md5").update((url || texto).slice(0,200) + "_manual").digest("hex");

    // Salvar — pendente por padrão, publicado se publicar=true
    const status = publicar ? "publicado" : "pendente";
    const now = new Date().toISOString();

    const { data: post, error } = await supabase.from("posts").insert({
      titulo: content.titulo,
      conteudo: content.corpo,
      comentario_fixado: content.subtitulo || "",
      imagem,
      hash,
      status,
      approved: publicar ? true : false,
      publish_method: "portal",
      published_at: publicar ? now : null,
      user_tags: JSON.stringify([content.categoria || "geral"]),
      collaborators: "[]",
      metrics: {},
      priority: 1, // manual tem prioridade
      retry_count: 0,
      max_retries: 3
    }).select().single();

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      status,
      id: post.id,
      titulo: content.titulo,
      categoria: content.categoria,
      subtitulo: content.subtitulo,
      corpo: content.corpo.slice(0, 300) + "...",
      imagem
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
