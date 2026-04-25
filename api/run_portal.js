import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const MAX_DIA = 1440;

// Filtro de qualidade — rejeita conteúdo inválido
function validarConteudo(content) {
  if (!content || !content.titulo || !content.corpo) return false;
  const titulo = content.titulo.toLowerCase().trim();
  const corpo = content.corpo.toLowerCase();
  const corpoInicio = content.corpo.slice(0, 200).toLowerCase();

  // Rejeitar títulos que começam com palavras de carta/email
  const tituloInvalido = /^(prezado|caro|olá|atenção|aviso|notícia:|sem título|titulo:|headline:|assunto:|dear|hello|hi |erro:|teste:|exemplo:)/.test(titulo);
  if (tituloInvalido) return false;

  // Rejeitar se título contém "prezado" em qualquer posição
  if (titulo.includes("prezado") || titulo.includes("caro usuário") || titulo.includes("editor")) return false;

  // Rejeitar corpo muito curto
  if (content.corpo.length < 800) return false;

  // Rejeitar corpo que começa com lixo de email/carta
  const inicioInvalido = /^(prezado|caro |olá,|atenção:|aviso:|dear |hello|seguem|segue |conforme |informamos|comunicamos)/.test(corpoInicio.trim());
  if (inicioInvalido) return false;

  // Rejeitar se não tem "redação ovc" no corpo
  if (!corpo.includes("redação ovc")) return false;

  // Rejeitar título genérico demais (menos de 3 palavras)
  if (titulo.split(" ").filter(w => w.length > 1).length < 3) return false;

  return true;
}

export default async function handler(req, res) {
  const inicio = Date.now();

  try {
    // Checar automação
    const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });

    // Checar limite diário
    const hoje = new Date().toISOString().slice(0,10);
    const { count } = await supabase.from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hoje + "T00:00:00")
      .eq("publish_method", "portal");
    if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: "limit_reached", count });

    // Buscar notícias
    const news = await getNews();
    if (!news.length) return res.status(200).json({ status: "no_news" });

    // Tentar cada notícia até 1 funcionar — rápido e dentro do timeout da Vercel
    for (const item of news.slice(0, 15)) {
      // Verificar tempo restante — Vercel mata em 60s
      if (Date.now() - inicio > 45000) {
        return res.status(200).json({ status: "timeout_preventivo" });
      }

      const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");

      // Checar duplicata
      const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).single();
      if (dup) continue;

      // Scrape
      const article = await scrape(item.link);
      const sourceText = (article.text && article.text.length >= 100)
        ? article.text
        : (item.description && item.description.length >= 50)
          ? item.title + ". " + item.description
          : null;
      if (!sourceText) continue;

      // Reescrever no padrão OVC
      let content;
      try {
        content = await rewritePortal(sourceText, item.title);
      } catch(e) {
        continue; // tenta próxima
      }

      // Validar qualidade — rejeita lixo
      if (!validarConteudo(content)) continue;
      if (!content.categoria || content.categoria === "geral") continue;
      if (!content.subcategoria) {
        content.subcategoria = "Geral";
        content.subcategoria_slug = "geral";
      }

      // Imagem sempre diferente da fonte
      const urlProibida = article.image || "";
      const imagemFinal = await findImage(content.titulo, content.categoria, urlProibida);

      // Publicação automática — gerado e validado pelo sistema
      const { data: post, error } = await supabase.from("posts").insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.subtitulo || "",
        imagem: imagemFinal,
        hash,
        status: "publicado",
        approved: true,
        publish_method: "portal",
        published_at: new Date().toISOString(),
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: "[]",
        metrics: {},
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) return res.status(200).json({ status: "db_error", error: error.message });

      return res.status(200).json({
        status: "ok",
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        id: post?.id
      });
    }

    return res.status(200).json({ status: "no_valid_news" });

  } catch(e) {
    return res.status(500).json({ status: "error", error: e.message });
  }
}
