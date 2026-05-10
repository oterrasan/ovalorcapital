import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const COMPETITOR_IMG_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','i.s3.glbimg.com',
  'globo.com','g1.globo.com','ge.globo.com','oglobo.globo.com',
  'extra.globo.com','valor.com.br',
  'uol.com.br','folha.uol.com.br','f.i.uol.com.br','imguol.i.uol.com.br',
  'estadao.com.br','broadcast.com.br',
  'r7.com','record.com.br','sbt.com.br','jovempan.com.br',
  'band.com.br','cnnbrasil.com.br','assets.cnnbrasil.com.br',
  'veja.com.br','abril.com.br','exame.com','cartacapital.com.br',
  'poder360.com.br','gazetadopovo.com.br','metropoles.com',
  'seudinheiro.com','infomoney.com.br','terra.com.br','ig.com.br',
  'agenciabrasil.ebc.com.br','imagens.ebc.com.br',
  'reuters.com','ap.org','canaltech.com.br','apublica.org',
  'correiobraziliense.com.br','nsctotal.com.br',
]);

function isCompetitorDomain(url) {
  if (!url || url.length < 10) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_IMG_HOSTS].some(d => hostname === d || hostname.endsWith('.' + d));
  } catch(_) { return false; }
}

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
    let imgScrapeada = "";

    if (url) {
      const article = await scrape(url);
      if (!article.text || article.text.length < 100) {
        return res.status(400).json({ error: "Não foi possível extrair conteúdo desta URL" });
      }
      sourceText = article.text;
      sourceTitle = article.title || "";
      imgScrapeada = article.image || "";
    } else {
      sourceText = texto;
    }

    const content = await rewritePortal(sourceText, sourceTitle);

    if (!content.corpo || content.corpo.length < 300) {
      return res.status(500).json({ error: "Conteúdo gerado insuficiente" });
    }

    const hash = crypto.createHash("md5").update((url || texto).slice(0,200) + "_manual").digest("hex");

    // Imagem: bloquear concorrentes, usar findImage como fallback
    let imagemFinal = null;
    const imgAprovada = imgScrapeada && !isCompetitorDomain(imgScrapeada) ? imgScrapeada : null;
    if (imgAprovada) {
      try {
        imagemFinal = await processAndSaveImage(imgAprovada, hash.slice(0, 12));
      } catch(_) {}
    }
    if (!imagemFinal) {
      imagemFinal = await findImage(content.titulo, content.categoria, '', '');
    }

    const status = publicar ? "publicado" : "pendente";
    const now = new Date().toISOString();

    const { data: post, error } = await supabase.from("posts").insert({
      titulo: content.titulo,
      conteudo: content.corpo,
      comentario_fixado: content.subtitulo || "",
      imagem: imagemFinal,
      hash,
      status,
      approved: publicar ? true : false,
      publish_method: "portal",
      published_at: publicar ? now : null,
      user_tags: JSON.stringify([content.categoria || "geral"]),
      subcategoria: content.subcategoria || "",
      subcategoria_slug: content.subcategoria_slug || "",
      collaborators: "[]",
      metrics: {
        foco_keyword: content.foco_keyword || "",
        seo_slug: content.slug || "",
        meta_descricao: content.meta_descricao || ""
      },
      priority: 1,
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
      subcategoria: content.subcategoria,
      subtitulo: content.subtitulo,
      corpo: content.corpo.slice(0, 300) + "...",
      imagem: imagemFinal
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
