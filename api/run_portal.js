import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function getMaxDiaByHora() {
  // Usar horário de Brasília (UTC-3) — servidor Vercel roda em UTC
  const now = new Date();
  const horaBrasilia = (now.getUTCHours() - 3 + 24) % 24;

  // 01:00 às 06:00 Brasília = 12 total
  if (horaBrasilia >= 1 && horaBrasilia < 6) return 12;

  // 06:00 às 12:00 Brasília = 30 total
  if (horaBrasilia >= 6 && horaBrasilia < 12) return 30;

  // 12:00 às 17:00 Brasília = 40 total
  if (horaBrasilia >= 12 && horaBrasilia < 17) return 40;

  // 17:00 às 00:00 Brasília = 68 total
  if (horaBrasilia >= 17 && horaBrasilia < 24) return 68;

  // 00:00 às 01:00 Brasília = 12
  return 12;
}

// Filtro de qualidade — rejeita conteudo fora do escopo editorial OVC
function validarConteudo(content) {
  if (!content || !content.titulo) return false;
  const titulo = content.titulo.toLowerCase().trim();
  const corpo = (content.corpo || '').toLowerCase().slice(0, 400);

  if (titulo.length < 10) return false;

  // Titulos claramente invalidos
  if (/^(prezado|caro|ola|sem titulo|titulo:|headline:|assunto:|erro:|teste:)/.test(titulo)) return false;

  // Fora do escopo editorial OVC
  const foraEscopo = [
    /jornal da oeste/, /revista oeste/, /programa.{0,20}ao ar/,
    /transmit.{0,20}ao vivo/, /segunda edi.{1,3}o.*programa/,
    /apresenta.{1,3}o.*realizada por/, /exib.{0,10}segunda.{0,10}sexta/,
    /programa.{1,10}o audiovisual/, /horario.{0,10}das \d+h.{0,5}as \d+h/,
    /colunista.{0,10}folha/, /colunista.{0,10}globo/,
    /novela|reality show|soap opera/
  ];
  for (const r of foraEscopo) {
    if (r.test(titulo) || r.test(corpo)) return false;
  }

  return true;
}


export default async function handler(req, res) {
  const inicio = Date.now();

  try {
    // Checar automação
    const { data: cfg } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!cfg || cfg.value !== "on") return res.status(200).json({ status: "automation_paused" });

    // Checar limite diário (variável por horário)
    const MAX_DIA = getMaxDiaByHora();
    // Meia-noite Brasília = 03:00 UTC
    const agora = new Date();
    const inicioDiaBrasilia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()) + (agora.getUTCHours() < 3 ? -1 : 0) * 86400000 + 3 * 3600000);
    const { count } = await supabase.from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicioDiaBrasilia.toISOString())
      .eq("publish_method", "portal");
    const horaBrasiliaAtual = (new Date().getUTCHours() - 3 + 24) % 24;
    if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: "limit_reached", count, max: MAX_DIA, currentHour: horaBrasiliaAtual });

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

      // Imagem: tentar usar a original da fonte (processada/recortada), senão buscar banco
      let imagemFinal = null;
      if (article.image && article.image.length > 10) {
        // Usar imagem original — baixa, recorta marca d'água, salva no Supabase Storage
        const hashImg = hash.slice(0,12);
        imagemFinal = await processAndSaveImage(article.image, hashImg);
      }
      if (!imagemFinal) {
        // Fallback: buscar imagem relevante nos bancos
        imagemFinal = await findImage(content.titulo, content.categoria, "", article.image || "");
      }

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
