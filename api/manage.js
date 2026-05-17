import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { publishPost } from "../core/publish_engine.js";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let _bannersCache = null;

// ── ROTEADOR ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    if (req.query.action === 'banners') return handleBanners(req, res);
    return handleStatus(req, res);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const body = req.body || {};

  if (body.pedidos !== undefined) return handleManual(req, res);

  const portalActions = ["aprovar","rejeitar","editar_aprovar","aprovar_lote","rejeitar_lote"];
  if (portalActions.includes(body.action)) return handleApprovePortal(req, res);

  if (body.action === "newsletter_subscribe") return handleNewsletterSubscribe(req, res);
  if (body.action === "submit_vaga") return handleSubmitVaga(req, res);
  if (body.action === "track_view") return handleTrackView(req, res);
  if (body.action === "setup_storage") return handleSetupStorage(req, res);

  return handleApprove(req, res);
}

async function handleSetupStorage(req, res) {
  try {
    const { error } = await supabase.storage.createBucket("posts-images", { public: true });
    if (error && !error.message.toLowerCase().includes("already exist")) {
      return res.status(200).json({ ok: false, error: error.message });
    }
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}

// ── BANNERS ───────────────────────────────────────────────────────────────────
async function handleBanners(req, res) {
  const cat = (req.query.cat || '').trim().toLowerCase();
  try {
    if (!_bannersCache) {
      _bannersCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'banners.json'), 'utf8'));
    }
    let list = _bannersCache.filter(b => b.active);
    if (cat) {
      const exact = list.filter(b => Array.isArray(b.categories) && b.categories.includes(cat));
      list = exact.length > 0 ? exact : list.filter(b => Array.isArray(b.categories) && b.categories.includes('geral'));
    }
    list = list.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0)).slice(0, 3);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ banners: list, cat });
  } catch(e) {
    return res.status(200).json({ banners: [], cat });
  }
}

// ── STATUS ──────────────────────────────────────────────────────────────────
async function handleStatus(req, res) {
  try {
    const { data } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    const running = data?.value === "on";
    const { data: cfgMax } = await supabase.from("config").select("value").eq("key","MAX_POSTS_DIA").single();
    const maxPosts = parseInt(cfgMax?.value || "300", 10);
    const agora = new Date();
    const inicioDia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()) + (agora.getUTCHours() < 3 ? -1 : 0) * 86400000 + 3 * 3600000);
    const { count: postsHoje } = await supabase.from("posts").select("*",{count:"exact",head:true}).gte("created_at",inicioDia.toISOString()).eq("publish_method","portal");
    const { count: pendentes } = await supabase.from("posts").select("*",{count:"exact",head:true}).eq("status","pendente");
    const { count: erros }    = await supabase.from("posts").select("*",{count:"exact",head:true}).eq("status","error");
    const { data: cfgYt } = await supabase.from("config").select("value").eq("key","YOUTUBE_LIVE_URL").single();
    const youtube_live_url = cfgYt?.value || null;
    return res.status(200).json({ running, posts_hoje: postsHoje||0, max_posts: maxPosts, pendentes:pendentes||0, erros:erros||0, youtube_live_url });
  } catch(e) {
    return res.status(200).json({ running:false, posts_hoje:0, max_posts:300, pendentes:0, erros:0, youtube_live_url:null });
  }
}

// ── CONTAGEM DE VIEWS ────────────────────────────────────────────────────────
async function handleTrackView(req, res) {
  const { post_id } = req.body || {};
  if (!post_id) return res.json({ ok: false });
  try {
    const { data: post } = await supabase.from("posts").select("metrics").eq("id", post_id).single();
    const metrics = (post?.metrics && typeof post.metrics === "object") ? { ...post.metrics } : {};
    metrics.views = (metrics.views || 0) + 1;
    await supabase.from("posts").update({ metrics }).eq("id", post_id);
    return res.json({ ok: true, views: metrics.views });
  } catch(e) {
    return res.json({ ok: false });
  }
}

// ── APROVAÇÃO (approve.js) ──────────────────────────────────────────────────
async function handleApprove(req, res) {
  const { id, ids, action, scheduled_at } = req.body || {};
  try {
    if (action === "retry" && id) {
      await supabase.from("posts").update({ status:"pending", error_msg:null, retry_count:0, updated_at:new Date().toISOString() }).eq("id",id);
      return res.status(200).json({ ok:true });
    }
    if (action === "approve" && id) {
      await supabase.from("posts").update({ status:"approved", approved:true, updated_at:new Date().toISOString() }).eq("id",id);
      return res.status(200).json({ ok:true });
    }
    if (action === "schedule" && id) {
      await supabase.from("posts").update({ status:"scheduled", approved:true, scheduled_at, updated_at:new Date().toISOString() }).eq("id",id);
      return res.status(200).json({ ok:true });
    }
    if (id && !ids) {
      await supabase.from("posts").update({ approved:true, status:"approved", updated_at:new Date().toISOString() }).eq("id",id);
      const result = await publishPost(id);
      return res.status(200).json(result);
    }
    if (ids && Array.isArray(ids)) {
      const results = [];
      for (const pid of ids) {
        await supabase.from("posts").update({ approved:true }).eq("id",pid);
        const r = await publishPost(pid);
        results.push({ id:pid, ...r });
      }
      return res.status(200).json({ status:"batch", results });
    }
    return res.status(400).json({ error:"missing_params" });
  } catch(e) {
    return res.status(200).json({ ok:false, error:e.message });
  }
}

// ── APROVAÇÃO PORTAL (approve_portal.js) ───────────────────────────────────────
async function handleApprovePortal(req, res) {
  const { id, ids, action } = req.body || {};
  const now = new Date().toISOString();
  try {
    if (action === "aprovar" && id) {
      await supabase.from("posts").update({ status:"publicado", approved:true, published_at:now, updated_at:now }).eq("id",id);
      return res.status(200).json({ ok:true, action:"aprovado", id });
    }
    if (action === "rejeitar" && id) {
      await supabase.from("posts").update({ status:"rejeitado", approved:false, updated_at:now }).eq("id",id);
      return res.status(200).json({ ok:true, action:"rejeitado", id });
    }
    if (action === "editar_aprovar" && id) {
      const { titulo, conteudo, imagem, comentario_fixado } = req.body;
      await supabase.from("posts").update({ titulo, conteudo, imagem, comentario_fixado, status:"publicado", approved:true, published_at:now, updated_at:now }).eq("id",id);
      return res.status(200).json({ ok:true, action:"editado_aprovado", id });
    }
    if (action === "aprovar_lote" && ids && Array.isArray(ids)) {
      const results = [];
      for (const pid of ids) {
        const { error } = await supabase.from("posts").update({ status:"publicado", approved:true, published_at:now, updated_at:now }).eq("id",pid);
        results.push({ id:pid, ok:!error });
      }
      return res.status(200).json({ ok:true, action:"lote_aprovado", total:results.length, results });
    }
    if (action === "rejeitar_lote" && ids && Array.isArray(ids)) {
      await supabase.from("posts").update({ status:"rejeitado", approved:false, updated_at:now }).in("id",ids);
      return res.status(200).json({ ok:true, action:"lote_rejeitado", total:ids.length });
    }
    return res.status(400).json({ error:"acao_invalida" });
  } catch(e) {
    return res.status(500).json({ ok:false, error:e.message });
  }
}

// ── GERAÇÃO MANUAL (run_manual.js) ─────────────────────────────────────────────────
function validar(content) {
  if (!content?.titulo || !content?.corpo) return false;
  const t = content.titulo.toLowerCase().trim();
  const c = content.corpo.toLowerCase();
  const proibidos = ["prezado","caro usuário","olá,","atenção:","dear","editor(a)"];
  if (proibidos.some(p => t.startsWith(p) || c.slice(0,100).includes(p))) return false;
  if (content.corpo.length < 500) return false;
  return true;
}

function gerarNotificacoes(resultados) {
  const notifs = [];
  const ok      = resultados.filter(r => r.status==="ok");
  const erros   = resultados.filter(r => r.status==="erro");
  const parciais = resultados.filter(r => r.status==="parcial");
  if (ok.length) notifs.push({tipo:"sucesso", mensagem:`✅ ${ok.length} matéria(s) gerada(s) com sucesso.`});
  parciais.forEach(p => notifs.push({tipo:"aviso",  mensagem:`⚠️ ${p.motivo}`}));
  erros.forEach(e   => notifs.push({tipo:"erro",    mensagem:`❌ ${e.categoria}${e.subcategoria?' → '+e.subcategoria:''}: ${e.motivo}`}));
  return notifs;
}

async function handleManual(req, res) {
  const { pedidos = [], fonteManual = null } = req.body || {};
  if (!pedidos.length) return res.status(400).json({ error:"Informe ao menos um pedido" });

  const inicio = Date.now();
  const resultados = [];
  const now = new Date().toISOString();

  try {
    if (fonteManual) {
      let sourceText = "", sourceTitle = "";
      if (fonteManual.startsWith("http")) {
        const article = await scrape(fonteManual);
        sourceText = article.text || "";
        sourceTitle = article.title || "";
      } else {
        sourceText = fonteManual;
      }
      if (!sourceText || sourceText.length < 50) {
        return res.status(200).json({ status:"error", resultados:[], notificacoes:[{tipo:"erro",mensagem:"Não foi possível extrair conteúdo da fonte informada."}] });
      }
      for (const pedido of pedidos) {
        if (Date.now() - inicio > 50000) break;
        let content;
        try {
          content = await rewritePortal(sourceText, sourceTitle);
          if (pedido.categoria)    content.categoria    = pedido.categoria;
          if (pedido.subcategoria) content.subcategoria = pedido.subcategoria;
        } catch(e) {
          resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"erro", motivo:e.message });
          continue;
        }
        if (!validar(content)) {
          resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"erro", motivo:"Conteúdo inválido gerado pela IA" });
          continue;
        }
        const hash = crypto.createHash("md5").update(sourceText.slice(0,100)+pedido.categoria+Date.now()).digest("hex");
        const imagemFinal = await findImage(content.titulo, content.categoria, "");
        const { data:post, error } = await supabase.from("posts").insert({
          titulo:content.titulo, conteudo:content.corpo, comentario_fixado:content.subtitulo||"",
          imagem:imagemFinal, hash, status:"publicado", approved:true, published_at:now,
          publish_method:"manual",
          user_tags:JSON.stringify([content.categoria]),
          subcategoria:content.subcategoria||"Geral",
          subcategoria_slug:(content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-"),
          collaborators:"[]", metrics:{}, priority:1, retry_count:0, max_retries:3
        }).select().single();
        if (error) resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"erro", motivo:error.message });
        else        resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"ok", titulo:content.titulo, id:post?.id });
      }
      return res.status(200).json({ status:"ok", modo:"manual", resultados, notificacoes:gerarNotificacoes(resultados) });
    }

    const newsCache = {};
    for (const { categoria } of pedidos) {
      if (categoria && !newsCache[categoria]) {
        newsCache[categoria] = await getNewsByCategoria(categoria);
      }
    }

    for (const pedido of pedidos) {
      const { categoria, subcategoria, quantidade=1 } = pedido;
      const qtd = Math.min(Math.max(parseInt(quantidade)||1,1),20);
      let geradosPedido = 0;
      const errosPedido = [];

      const news = newsCache[categoria] || await getNews();
      if (!news.length) {
        resultados.push({ categoria, subcategoria, status:"parcial", solicitado:qtd, gerado:0,
          motivo:`Nenhuma notícia disponível para ${categoria} no momento` });
        continue;
      }

      for (const item of news) {
        if (geradosPedido >= qtd) break;
        if (Date.now() - inicio > 50000) break;
        const hash = crypto.createHash("md5").update(item.link+"_portal").digest("hex");
        const { data:dup } = await supabase.from("posts").select("id").eq("hash",hash).single();
        if (dup) continue;
        const article = await scrape(item.link);
        const sourceText = (article.text?.length>=100) ? article.text : (item.description?.length>=50) ? item.title+". "+item.description : null;
        if (!sourceText) continue;
        let content;
        try { content = await rewritePortal(sourceText, item.title); } catch(e) { errosPedido.push(e.message); continue; }
        if (!validar(content)) continue;
        if (categoria) content.categoria = categoria;
        if (subcategoria) content.subcategoria = subcategoria;
        const imagemFinal = await findImage(content.titulo, content.categoria, article.image||"");
        const { data:post, error } = await supabase.from("posts").insert({
          titulo:content.titulo, conteudo:content.corpo, comentario_fixado:content.subtitulo||"",
          imagem:imagemFinal, hash, status:"publicado", approved:true, published_at:now,
          publish_method:"manual",
          user_tags:JSON.stringify([content.categoria]),
          subcategoria:content.subcategoria||"Geral",
          subcategoria_slug:(content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"-").replace(/[^a-z0-9]+/g,"-"),
          collaborators:"[]", metrics:{}, priority:0, retry_count:0, max_retries:3
        }).select().single();
        if (error) { errosPedido.push(error.message); continue; }
        resultados.push({ categoria, subcategoria:subcategoria||content.subcategoria, status:"ok", titulo:content.titulo, id:post?.id });
        geradosPedido++;
      }
      if (geradosPedido < qtd) {
        resultados.push({ categoria, subcategoria, status:"parcial", solicitado:qtd, gerado:geradosPedido,
          motivo: geradosPedido===0 ? `Nenhuma notícia encontrada para ${categoria}${subcategoria?' → '+subcategoria:''}` : `Gerado ${geradosPedido} de ${qtd} — fontes RSS insuficientes` });
      }
    }
    return res.status(200).json({ status:"ok", modo:"rss", resultados, notificacoes:gerarNotificacoes(resultados) });

  } catch(e) {
    return res.status(500).json({ status:"error", error:e.message, notificacoes:[{tipo:"erro",mensagem:e.message}] });
  }
}

// ── SUBMISSÃO PÚBLICA DE VAGAS ──────────────────────────────────────────────
async function handleSubmitVaga(req, res) {
  const { empresa, cargo, area, localizacao, tipo_contratacao, salario, descricao, email_contato } = req.body || {};
  if (!empresa || !cargo || !descricao || !email_contato) {
    return res.status(400).json({ error: "Campos obrigatórios: empresa, cargo, descricao, email_contato" });
  }
  if (descricao.length < 50) {
    return res.status(400).json({ error: "Descrição muito curta (mínimo 50 caracteres)" });
  }
  try {
    const titulo = `[VAGA] ${cargo} — ${empresa}`;
    const conteudo = `**Empresa:** ${empresa}\n**Cargo:** ${cargo}\n**Área:** ${area||'Não informada'}\n**Localização:** ${localizacao||'Não informada'}\n**Contratação:** ${tipo_contratacao||'Não informado'}\n**Salário:** ${salario||'A combinar'}\n**Contato:** ${email_contato}\n\n## Descrição da Vaga\n\n${descricao}`;
    const { error } = await supabase.from("posts").insert({
      titulo,
      conteudo,
      comentario_fixado: `${cargo} em ${empresa} — ${localizacao||'Local não informado'}`,
      status: "pendente",
      approved: false,
      publish_method: "vaga_publica",
      user_tags: JSON.stringify(["vagas"]),
      subcategoria: area || "Geral",
      subcategoria_slug: (area||"geral").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-"),
      metrics: { email_contato, tipo_contratacao, salario },
      priority: 0, retry_count: 0, max_retries: 0
    });
    if (error) throw error;
    return res.status(200).json({ ok: true, message: "Vaga enviada para aprovação!" });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── NEWSLETTER SUBSCRIBE ──────────────────────────────────────────────────
async function handleNewsletterSubscribe(req, res) {
  const { email, categoria } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  const emailLimpo = email.toLowerCase().trim();
  const agora = new Date().toISOString();

  try {
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email: emailLimpo, categoria: categoria || "geral", confirmed: false, created_at: agora },
      { onConflict: "email" }
    );
    if (!error || error.message?.includes("duplicate")) {
      return res.status(200).json({ ok: true });
    }
  } catch(_) {}

  try {
    const key = "NEWSLETTER_EMAILS";
    const { data: cfg } = await supabase.from("config").select("value").eq("key", key).single();
    let lista = [];
    try { lista = JSON.parse(cfg?.value || "[]"); } catch(_) {}
    if (!lista.some(e => e.email === emailLimpo)) {
      lista.push({ email: emailLimpo, categoria: categoria || "geral", data: agora });
      await supabase.from("config").upsert({ key, value: JSON.stringify(lista) }, { onConflict: "key" });
    }
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
