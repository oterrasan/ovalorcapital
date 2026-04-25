import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function validar(content) {
  if (!content?.titulo || !content?.corpo) return false;
  const t = content.titulo.toLowerCase().trim();
  const c = content.corpo.toLowerCase();
  const proibidos = ["prezado","caro usuário","olá,","atenção:","dear","editor(a)"];
  if (proibidos.some(p => t.startsWith(p) || c.slice(0,100).includes(p))) return false;
  if (content.corpo.length < 500) return false;
  if (!c.includes("redação ovc")) return false;
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  if (req.method==="OPTIONS") return res.status(200).end();
  if (req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});

  try {
    const { pedidos = [], fonteManual = null } = req.body || {};
    // pedidos = [{categoria, subcategoria, quantidade}]

    if (!pedidos.length) return res.status(400).json({error:"Informe ao menos um pedido"});

    const inicio = Date.now();
    const resultados = [];

    // MODO B — fonte manual (URL ou texto)
    if (fonteManual) {
      let sourceText = "";
      let sourceTitle = "";

      if (fonteManual.startsWith("http")) {
        const article = await scrape(fonteManual);
        sourceText = article.text || "";
        sourceTitle = article.title || "";
      } else {
        sourceText = fonteManual;
      }

      if (!sourceText || sourceText.length < 50) {
        return res.status(200).json({
          status: "error",
          resultados: [],
          notificacoes: [{tipo:"erro", mensagem:"Não foi possível extrair conteúdo da fonte informada."}]
        });
      }

      // Gerar 1 post por pedido com a fonte manual
      for (const pedido of pedidos) {
        if (Date.now() - inicio > 50000) break;

        let content;
        try {
          content = await rewritePortal(sourceText, sourceTitle);
          // Forçar categoria/subcategoria do pedido
          if (pedido.categoria) content.categoria = pedido.categoria;
          if (pedido.subcategoria) content.subcategoria = pedido.subcategoria;
        } catch(e) {
          resultados.push({categoria: pedido.categoria, subcategoria: pedido.subcategoria, status:"erro", motivo: e.message});
          continue;
        }

        if (!validar(content)) {
          resultados.push({categoria: pedido.categoria, subcategoria: pedido.subcategoria, status:"erro", motivo:"Conteúdo inválido gerado pela IA"});
          continue;
        }

        const hash = crypto.createHash("md5").update(sourceText.slice(0,100) + pedido.categoria + Date.now()).digest("hex");
        const imagemFinal = await findImage(content.titulo, content.categoria, "");

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
          subcategoria: content.subcategoria || "Geral",
          subcategoria_slug: (content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-"),
          collaborators: "[]", metrics: {}, priority: 1, retry_count: 0, max_retries: 3
        }).select().single();

        if (error) {
          resultados.push({categoria: pedido.categoria, subcategoria: pedido.subcategoria, status:"erro", motivo: error.message});
        } else {
          resultados.push({categoria: pedido.categoria, subcategoria: pedido.subcategoria, status:"ok", titulo: content.titulo, id: post?.id});
        }
      }

      return res.status(200).json({
        status: "ok",
        modo: "manual",
        resultados,
        notificacoes: gerarNotificacoes(resultados)
      });
    }

    // MODO A — RSS automático por categoria/subcategoria
    const news = await getNews();
    if (!news.length) {
      return res.status(200).json({
        status: "no_news",
        resultados: [],
        notificacoes: [{tipo:"erro", mensagem:"Nenhuma notícia disponível nas fontes RSS no momento."}]
      });
    }

    for (const pedido of pedidos) {
      const { categoria, subcategoria, quantidade = 1 } = pedido;
      const qtd = Math.min(Math.max(parseInt(quantidade)||1, 1), 20);
      let geradosPedido = 0;
      const errosPedido = [];

      for (const item of news) {
        if (geradosPedido >= qtd) break;
        if (Date.now() - inicio > 50000) break;

        const hash = crypto.createHash("md5").update(item.link + "_portal").digest("hex");
        const { data: dup } = await supabase.from("posts").select("id").eq("hash",hash).single();
        if (dup) continue;

        const article = await scrape(item.link);
        const sourceText = (article.text?.length >= 100) ? article.text
          : (item.description?.length >= 50) ? item.title + ". " + item.description
          : null;
        if (!sourceText) continue;

        let content;
        try {
          content = await rewritePortal(sourceText, item.title);
        } catch(e) { errosPedido.push(e.message); continue; }

        if (!validar(content)) continue;

        // Filtrar por categoria solicitada
        if (categoria && content.categoria !== categoria) continue;
        // Filtrar por subcategoria se informada
        if (subcategoria && content.subcategoria !== subcategoria) continue;

        const urlProibida = article.image || "";
        const imagemFinal = await findImage(content.titulo, content.categoria, urlProibida);

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
          subcategoria: content.subcategoria || "Geral",
          subcategoria_slug: (content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-"),
          collaborators: "[]", metrics: {}, priority: 0, retry_count: 0, max_retries: 3
        }).select().single();

        if (error) { errosPedido.push(error.message); continue; }

        resultados.push({
          categoria, subcategoria: subcategoria||content.subcategoria,
          status:"ok", titulo: content.titulo, id: post?.id
        });
        geradosPedido++;
      }

      // Se não atingiu a quantidade — notificar
      if (geradosPedido < qtd) {
        resultados.push({
          categoria, subcategoria,
          status:"parcial",
          solicitado: qtd,
          gerado: geradosPedido,
          motivo: geradosPedido === 0
            ? `Nenhuma notícia encontrada para ${categoria}${subcategoria?' → '+subcategoria:''}`
            : `Gerado ${geradosPedido} de ${qtd} — fontes RSS insuficientes para esta combinação`
        });
      }
    }

    return res.status(200).json({
      status: "ok",
      modo: "rss",
      resultados,
      notificacoes: gerarNotificacoes(resultados)
    });

  } catch(e) {
    return res.status(500).json({status:"error", error: e.message, notificacoes:[{tipo:"erro",mensagem:e.message}]});
  }
}

function gerarNotificacoes(resultados) {
  const notifs = [];
  const ok = resultados.filter(r => r.status==="ok");
  const erros = resultados.filter(r => r.status==="erro");
  const parciais = resultados.filter(r => r.status==="parcial");

  if (ok.length) notifs.push({tipo:"sucesso", mensagem:`✅ ${ok.length} matéria(s) gerada(s) com sucesso.`});
  parciais.forEach(p => notifs.push({tipo:"aviso", mensagem:`⚠️ ${p.motivo}`}));
  erros.forEach(e => notifs.push({tipo:"erro", mensagem:`❌ ${e.categoria}${e.subcategoria?' → '+e.subcategoria:''}: ${e.motivo}`}));

  return notifs;
}
