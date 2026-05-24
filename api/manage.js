import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { publishPost } from "../core/publish_engine.js";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal, normalizarParagrafos } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let _bannersCache = null;

const ADMIN_PASSWORD = "ovc-admin-2026-secreto";

function hashSenha(s) { return crypto.createHash("sha256").update(s + "ovc_salt_2026").digest("hex"); }
function gerarToken() { return crypto.randomBytes(32).toString("hex"); }

function checkAdminAuth(req) {
  return req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-admin-password");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    if (req.query.action === 'banners') return handleBanners(req, res);
    if (req.query.action === 'refresh_token') return handleRefreshToken(req, res);
    if (req.query.action === 'unpublish_recent') return handleUnpublishRecent(req, res);
    if (req.query.action === 'unpublish_no_image') return handleUnpublishNoImage(req, res);
    if (req.query.action === 'audit_images') return handleAuditImages(req, res);
    if (req.query.action === 'list_colunistas') return handleListColunistas(req, res);
    if (req.query.action === 'list_posts_colunista') return handleListPostsColunista(req, res);
    if (req.query.action === 'limpar_pendentes_antigos') return handleLimparPendentesAntigos(req, res);
    if (req.query.action === 'seed_rss_lote2') return handleSeedRssLote2(req, res);
    if (req.query.action === 'seo_batch') return handleSeoBatch(req, res);
    if (req.query.action === 'usuarios') return handleListUsuarios(req, res);
    if (req.query.action === 'usuarios_csv') return handleListUsuariosCsv(req, res);
    if (req.query.action === 'comentarios_admin') return handleListComentariosAdmin(req, res);
    return handleStatus(req, res);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // Editor IA — roteado pelo vercel.json via /api/editor_ia
  if (req.query.action === "editor_ia") return handleEditorIA(req, res);

  const body = req.body || {};

  if (body.pedidos !== undefined) return handleManual(req, res);

  const portalActions = ["aprovar","rejeitar","editar_aprovar","aprovar_lote","rejeitar_lote"];
  if (portalActions.includes(body.action)) return handleApprovePortal(req, res);

  if (body.action === "newsletter_subscribe") return handleNewsletterSubscribe(req, res);
  if (body.action === "submit_vaga") return handleSubmitVaga(req, res);
  if (body.action === "track_view") return handleTrackView(req, res);
  if (body.action === "setup_storage") return handleSetupStorage(req, res);
  if (body.action === "admin_login") return handleAdminLogin(req, res);
  if (body.action === "fix_conclusao_ovc") return handleFixConclusaoOvc(req, res);
  if (body.action === "fix_paragrafos") return handleFixParagrafos(req, res);
  if (body.action === "login_colunista") return handleLoginColunista(req, res);
  if (body.action === "submit_colunista_post") return handleSubmitColunista(req, res);
  if (body.action === "create_colunista") return handleCreateColunista(req, res);
  if (body.action === "toggle_colunista") return handleToggleColunista(req, res);
  if (body.action === "delete_colunista") return handleDeleteColunista(req, res);
  if (body.action === "deletar_comentario") return handleDeletarComentario(req, res);

  return handleApprove(req, res);
}
export default handler;

async function handleEditorIA(req, res) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY não configurado' });
  const { acao, url, texto, imagem, buscarImagem, promptLivre } = req.body || {};
  let sourceText = '', sourceTitle = '';
  try {
    if (url) {
      const article = await scrape(url);
      sourceText = article.text || '';
      sourceTitle = article.title || '';
      if (!sourceText || sourceText.length < 30)
        return res.status(400).json({ error: 'Não foi possível extrair conteúdo da URL' });
    } else if (texto) {
      sourceText = texto;
    } else {
      return res.status(400).json({ error: 'Forneça URL ou texto' });
    }
    let content;
    if (acao === 'tema') {
      // texto é apenas o tema/tópico — criar matéria do zero sem conteúdo fonte
      const tema = sourceText.trim();
      if (!tema) return res.status(400).json({ error: 'Informe o tema da matéria' });
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 4000, temperature: 0.7,
          messages: [
            { role: 'system', content: 'Você é um editor jornalístico sênior do portal O Valor Capital (OVC), especializado em economia, finanças, política e negócios brasileiros. Escreva matérias no estilo Reuters/Bloomberg: factuais, analíticas, sem sensacionalismo. HTML puro (sem markdown). Parágrafos curtos (máx 3 frases). Responda SOMENTE em JSON válido: {"titulo":"...","subtitulo":"...","corpo":"HTML completo com <p>, <h2>, <ul><li> quando pertinente","categoria":"politica|economia|negocios|investimentos|mercados|tecnologia|saude|esportes|variedades","subcategoria":"texto"}' },
            { role: 'user', content: `Escreva uma matéria jornalística completa e detalhada sobre o seguinte tema:\n\n"${tema}"\n\nA matéria deve ter:\n- Título impactante e objetivo (máx 70 chars)\n- Subtítulo explicativo com contexto\n- Corpo com no mínimo 6 parágrafos substanciais em HTML (<p>), incluindo contexto histórico, dados relevantes, análise e implicações\n- Usar subtítulos <h2> para organizar seções quando pertinente` }
          ]
        })
      });
      clearTimeout(timer);
      const rd = await r.json();
      const txt = (rd.choices?.[0]?.message?.content || '').trim();
      const m = txt.match(/\{[\s\S]*\}/);
      content = m ? JSON.parse(m[0]) : null;
      if (!content) return res.status(500).json({ error: 'IA não retornou conteúdo válido' });
    } else if (acao === 'livre' && promptLivre) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 2500, temperature: 0.7,
          messages: [
            { role: 'system', content: 'Editor jornalístico brasileiro. Responda SOMENTE em JSON válido: {"titulo":"...","subtitulo":"...","corpo":"HTML da matéria","categoria":"politica","subcategoria":"Geral"}' },
            { role: 'user', content: promptLivre + '\n\nTexto base:\n' + sourceText.slice(0, 3000) }
          ]
        })
      });
      clearTimeout(timer);
      const rd = await r.json();
      const txt = (rd.choices?.[0]?.message?.content || '').trim();
      const m = txt.match(/\{[\s\S]*\}/);
      content = m ? JSON.parse(m[0]) : null;
      if (!content) return res.status(500).json({ error: 'IA não retornou conteúdo válido' });
    } else {
      content = await rewritePortal(sourceText, sourceTitle || sourceText.slice(0, 100));
    }
    let imagemFinal = (imagem || '').trim();
    if (!imagemFinal && buscarImagem) {
      try { imagemFinal = await findImage(content.titulo || '', content.categoria || 'politica', ''); } catch(_) {}
    }
    return res.status(200).json({
      ok: true,
      titulo: content.titulo || '',
      subtitulo: content.subtitulo || '',
      corpo: content.corpo || '',
      categoria: content.categoria || 'politica',
      subcategoria: content.subcategoria || 'Geral',
      imagem: imagemFinal || ''
    });
  } catch(e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
}

async function handleListUsuarios(req, res) {
  if (!checkAdminAuth(req)) return res.status(401).json({ error: "Não autorizado" });
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id,nome,sobrenome,celular,cidade,idade,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return res.status(200).json({ ok: true, usuarios: profiles || [], total: (profiles||[]).length });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleListUsuariosCsv(req, res) {
  if (!checkAdminAuth(req)) return res.status(401).json({ error: "Não autorizado" });
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id,nome,sobrenome,celular,cidade,idade,created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    const rows = profiles || [];
    const header = "id,nome,sobrenome,celular,cidade,idade,created_at";
    const csv = [header, ...rows.map(r =>
      [r.id, r.nome||'', r.sobrenome||'', r.celular||'', r.cidade||'', r.idade||'', r.created_at||'']
        .map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')
    )].join('\n');
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="usuarios_ovc.csv"');
    return res.status(200).send(csv);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleListComentariosAdmin(req, res) {
  if (!checkAdminAuth(req)) return res.status(401).json({ error: "Não autorizado" });
  try {
    const { data: comentarios, error } = await supabase
      .from("comentarios")
      .select("id,post_id,user_id,user_nome,texto,oculto_moderacao,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return res.status(200).json({ ok: true, comentarios: comentarios || [], total: (comentarios||[]).length });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleDeletarComentario(req, res) {
  if (!checkAdminAuth(req)) return res.status(401).json({ error: "Não autorizado" });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "id obrigatório" });
  try {
    const { error } = await supabase.from("comentarios").delete().eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
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

async function handleAuditImages(req, res) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(200).json({ ok: false, error: 'OPENAI_API_KEY não configurado' });
  const batch  = Math.min(parseInt(req.query.batch  || '4', 10), 6);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  try {
    const { data: posts, error: fetchErr } = await supabase
      .from('posts').select('id, titulo, imagem').eq('status', 'publicado')
      .not('imagem', 'is', null).neq('imagem', '')
      .order('created_at', { ascending: true }).range(offset, offset + batch - 1);
    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!posts || posts.length === 0)
      return res.status(200).json({ ok: true, processed: 0, unpublished: 0, done: true, message: 'Varredura concluída.' });
    const results = [];
    for (const post of posts) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const vRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini', max_tokens: 60, temperature: 0,
            messages: [{ role: 'user', content: [
              { type: 'text', text: 'Analyze this image. Respond ONLY with valid JSON, nothing else: {"is_illustration": true/false, "is_chart_or_table": true/false}\nis_illustration: true if drawing, cartoon, vector art, clip art, icon, logo, or digitally created non-photographic image.\nis_chart_or_table: true if chart, graph, infographic, table.' },
              { type: 'image_url', image_url: { url: post.imagem, detail: 'low' } }
            ]}]
          })
        });
        clearTimeout(timer);
        if (!vRes.ok) { results.push({ id: post.id, status: 'skip', reason: 'vision_api_error' }); continue; }
        const vd = await vRes.json();
        const txt = (vd.choices?.[0]?.message?.content || '').trim();
        const m = txt.match(/\{[^}]+\}/);
        const metrics = m ? JSON.parse(m[0]) : null;
        if (metrics?.is_illustration === true || metrics?.is_chart_or_table === true) {
          await supabase.from('posts').update({ status: 'pendente', approved: false }).eq('id', post.id);
          results.push({ id: post.id, titulo: (post.titulo || '').slice(0, 60), status: 'despublicado', motivo: metrics.is_illustration ? 'ilustração/ícone' : 'gráfico/tabela' });
        } else {
          results.push({ id: post.id, status: 'ok' });
        }
      } catch(e) {
        results.push({ id: post.id, status: 'skip', reason: e.message?.slice(0, 60) });
      }
    }
    const unpublished = results.filter(r => r.status === 'despublicado').length;
    const nextOffset = offset + posts.length;
    const done = posts.length < batch;
    return res.status(200).json({ ok: true, lote: `${offset}–${nextOffset - 1}`, processed: posts.length, unpublished, done, next_url: done ? null : `/api/manage?action=audit_images&offset=${nextOffset}`, results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleUnpublishNoImage(req, res) {
  try {
    const { error, count } = await supabase.from('posts')
      .update({ status: 'pendente', approved: false }).eq('status', 'publicado')
      .or('imagem.is.null,imagem.eq.').select('id', { count: 'exact', head: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, message: 'Posts sem imagem movidos para pendente', total: count || 0 });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleUnpublishRecent(req, res) {
  const dias = Math.min(parseInt(req.query.dias || '5', 10), 30);
  const desde = new Date(Date.now() - dias * 24 * 3600000).toISOString();
  try {
    const { error } = await supabase.from('posts')
      .update({ status: 'pendente', approved: false })
      .eq('status', 'publicado')
      .gte('created_at', desde);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, message: `Artigos dos últimos ${dias} dias movidos para pendente`, desde });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleRefreshToken(req, res) {
  try {
    const { data: accounts } = await supabase.from("ig_accounts").select("*").eq("active", true).not("token", "is", null);
    const results = [];
    for (const account of (accounts || [])) {
      try {
        const refreshRes = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.token}`);
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          await supabase.from("ig_accounts").update({ token: refreshData.access_token }).eq("id", account.id);
          results.push({ account: account.username, status: "renovado" });
        } else {
          results.push({ account: account.username, status: "erro", detail: refreshData });
        }
      } catch(e) {
        results.push({ account: account.username, status: "erro", detail: e.message });
      }
    }
    return res.status(200).json({ ok: true, results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleBanners(req, res) {
  const cat = (req.query.cat || '').trim().toLowerCase();
  try {
    if (!_bannersCache)
      _bannersCache = JSON.parse(readFileSync(join(process.cwd(), 'data', 'banners.json'), 'utf8'));
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
    const { count: erros } = await supabase.from("posts").select("*",{count:"exact",head:true}).eq("status","error");
    const { data: cfgYt } = await supabase.from("config").select("value").eq("key","YOUTUBE_LIVE_URL").single();
    const youtube_live_url = cfgYt?.value || null;
    return res.status(200).json({ running, posts_hoje: postsHoje||0, max_posts: maxPosts, pendentes:pendentes||0, erros:erros||0, youtube_live_url });
  } catch(e) {
    return res.status(200).json({ running:false, posts_hoje:0, max_posts:300, pendentes:0, erros:0, youtube_live_url:null });
  }
}

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
  parciais.forEach(p => notifs.push({tipo:"aviso", mensagem:`⚠️ ${p.motivo}`}));
  erros.forEach(e => notifs.push({tipo:"erro", mensagem:`❌ ${e.categoria}${e.subcategoria?' → '+e.subcategoria:''}: ${e.motivo}`}));
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
      if (!sourceText || sourceText.length < 50)
        return res.status(200).json({ status:"error", resultados:[], notificacoes:[{tipo:"erro",mensagem:"Não foi possível extrair conteúdo da fonte informada."}] });
      for (const pedido of pedidos) {
        if (Date.now() - inicio > 50000) break;
        let content;
        try {
          content = await rewritePortal(sourceText, sourceTitle);
          if (pedido.categoria) content.categoria = pedido.categoria;
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
          publish_method:"manual", user_tags:JSON.stringify([content.categoria]),
          subcategoria:content.subcategoria||"Geral",
          subcategoria_slug:(content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-"),
          collaborators:"[]", metrics:{}, priority:1, retry_count:0, max_retries:3
        }).select().single();
        if (error) resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"erro", motivo:error.message });
        else resultados.push({ categoria:pedido.categoria, subcategoria:pedido.subcategoria, status:"ok", titulo:content.titulo, id:post?.id });
      }
      return res.status(200).json({ status:"ok", modo:"manual", resultados, notificacoes:gerarNotificacoes(resultados) });
    }
    const newsCache = {};
    for (const { categoria } of pedidos) {
      if (categoria && !newsCache[categoria])
        newsCache[categoria] = await getNewsByCategoria(categoria);
    }
    for (const pedido of pedidos) {
      const { categoria, subcategoria, quantidade=1 } = pedido;
      const qtd = Math.min(Math.max(parseInt(quantidade)||1,1),20);
      let geradosPedido = 0;
      const errosPedido = [];
      const news = newsCache[categoria] || await getNews();
      if (!news.length) {
        resultados.push({ categoria, subcategoria, status:"parcial", solicitado:qtd, gerado:0, motivo:`Nenhuma notícia disponível para ${categoria} no momento` });
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
          publish_method:"manual", user_tags:JSON.stringify([content.categoria]),
          subcategoria:content.subcategoria||"Geral",
          subcategoria_slug:(content.subcategoria||"geral").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"-").replace(/[^a-z0-9]+/g,"-"),
          collaborators:"[]", metrics:{}, priority:0, retry_count:0, max_retries:3
        }).select().single();
        if (error) { errosPedido.push(error.message); continue; }
        resultados.push({ categoria, subcategoria:subcategoria||content.subcategoria, status:"ok", titulo:content.titulo, id:post?.id });
        geradosPedido++;
      }
      if (geradosPedido < qtd)
        resultados.push({ categoria, subcategoria, status:"parcial", solicitado:qtd, gerado:geradosPedido,
          motivo: geradosPedido===0 ? `Nenhuma notícia encontrada para ${categoria}${subcategoria?' → '+subcategoria:''}` : `Gerado ${geradosPedido} de ${qtd} — fontes RSS insuficientes` });
    }
    return res.status(200).json({ status:"ok", modo:"rss", resultados, notificacoes:gerarNotificacoes(resultados) });
  } catch(e) {
    return res.status(500).json({ status:"error", error:e.message, notificacoes:[{tipo:"erro",mensagem:e.message}] });
  }
}

async function handleSubmitVaga(req, res) {
  const { empresa, cargo, area, localizacao, tipo_contratacao, salario, descricao, email_contato } = req.body || {};
  if (!empresa || !cargo || !descricao || !email_contato)
    return res.status(400).json({ error: "Campos obrigatórios: empresa, cargo, descricao, email_contato" });
  if (descricao.length < 50)
    return res.status(400).json({ error: "Descrição muito curta (mínimo 50 caracteres)" });
  try {
    const titulo = `[VAGA] ${cargo} — ${empresa}`;
    const conteudo = `**Empresa:** ${empresa}\n**Cargo:** ${cargo}\n**Área:** ${area||'Não informada'}\n**Localização:** ${localizacao||'Não informada'}\n**Contratação:** ${tipo_contratacao||'Não informado'}\n**Salário:** ${salario||'A combinar'}\n**Contato:** ${email_contato}\n\n## Descrição da Vaga\n\n${descricao}`;
    const { error } = await supabase.from("posts").insert({
      titulo, conteudo,
      comentario_fixado: `${cargo} em ${empresa} — ${localizacao||'Local não informado'}`,
      status: "pendente", approved: false, publish_method: "vaga_publica",
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

async function handleNewsletterSubscribe(req, res) {
  const { email, categoria } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "E-mail inválido" });
  const emailLimpo = email.toLowerCase().trim();
  const agora = new Date().toISOString();
  try {
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email: emailLimpo, categoria: categoria || "geral", confirmed: false, created_at: agora },
      { onConflict: "email" }
    );
    if (!error || error.message?.includes("duplicate"))
      return res.status(200).json({ ok: true });
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

async function validarTokenColunista(colunista_id, token) {
  if (!colunista_id || !token) return null;
  try {
    const { data } = await supabase.from("colunistas")
      .select("id,nome,email,ativo").eq("id", colunista_id)
      .eq("session_token", token).eq("ativo", true).single();
    return data || null;
  } catch(_) { return null; }
}

async function handleAdminLogin(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: "email e senha obrigatórios" });
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'roterrasan@gmail.com';
  const ADMIN_HASH  = process.env.ADMIN_PASS_HASH || 'a69eb777894137ff36d5e010260eb859c874a62d1ae9ba4e9941745a8dd9e1e0';
  if (email.toLowerCase().trim() !== ADMIN_EMAIL || hashSenha(senha) !== ADMIN_HASH) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }
  return res.status(200).json({ ok: true });
}

async function handleLoginColunista(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: "email e senha obrigatórios" });
  try {
    const { data: colunista } = await supabase.from("colunistas")
      .select("id,nome,email,senha_hash,ativo").eq("email", email.toLowerCase().trim()).single();
    if (!colunista) return res.status(401).json({ error: "Credenciais inválidas" });
    if (!colunista.ativo) return res.status(401).json({ error: "Conta inativa. Contate o administrador." });
    if (colunista.senha_hash !== hashSenha(senha)) return res.status(401).json({ error: "Credenciais inválidas" });
    const token = gerarToken();
    await supabase.from("colunistas").update({ session_token: token, last_login: new Date().toISOString() }).eq("id", colunista.id);
    return res.status(200).json({ ok: true, token, colunista_id: colunista.id, nome: colunista.nome, email: colunista.email });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleListPostsColunista(req, res) {
  const { colunista_id, token } = req.query;
  const colunista = await validarTokenColunista(colunista_id, token);
  if (!colunista) return res.status(401).json({ error: "Sessão inválida" });
  try {
    const { data } = await supabase.from("posts")
      .select("id,titulo,status,imagem,created_at,published_at,comentario_fixado")
      .eq("publish_method", "colunista").eq("subcategoria", colunista.nome)
      .order("created_at", { ascending: false }).limit(50);
    return res.status(200).json({ ok: true, posts: data || [] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleSubmitColunista(req, res) {
  const { colunista_id, token, titulo, conteudo, imagem } = req.body || {};
  const colunista = await validarTokenColunista(colunista_id, token);
  if (!colunista) return res.status(401).json({ error: "Sessão inválida" });
  if (!titulo || !conteudo) return res.status(400).json({ error: "título e conteúdo obrigatórios" });
  if (titulo.length < 10) return res.status(400).json({ error: "Título muito curto" });
  if (conteudo.length < 200) return res.status(400).json({ error: "Conteúdo mínimo de 200 caracteres" });
  try {
    const hash = crypto.createHash("md5").update(titulo + colunista_id + Date.now()).digest("hex");
    const nomeSlug = colunista.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-");
    const { data: post, error } = await supabase.from("posts").insert({
      titulo, conteudo, imagem: imagem || null,
      comentario_fixado: `Artigo de ${colunista.nome}`,
      hash, status: "pendente", approved: false, publish_method: "colunista",
      user_tags: JSON.stringify(["colunistas"]), subcategoria: colunista.nome,
      subcategoria_slug: nomeSlug,
      metrics: {}, priority: 0, retry_count: 0, max_retries: 0
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, post_id: post.id, message: "Artigo enviado para revisão!" });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleListColunistas(req, res) {
  try {
    const { data, error } = await supabase.from("colunistas")
      .select("id,nome,email,ativo,created_at,last_login").order("nome");
    if (error) {
      if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01'))
        return res.status(200).json({ ok: false, tabela_ausente: true, colunistas: [] });
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true, colunistas: data || [] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleCreateColunista(req, res) {
  const { nome, email, senha } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ error: "nome, email e senha obrigatórios" });
  try {
    const { error } = await supabase.from("colunistas").insert({
      nome: nome.trim(), email: email.toLowerCase().trim(),
      senha_hash: hashSenha(senha), ativo: true
    });
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate"))
        return res.status(400).json({ error: "E-mail já cadastrado" });
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleToggleColunista(req, res) {
  const { id, ativo } = req.body || {};
  if (!id) return res.status(400).json({ error: "id obrigatório" });
  await supabase.from("colunistas").update({ ativo: !ativo }).eq("id", id);
  return res.status(200).json({ ok: true });
}

async function handleDeleteColunista(req, res) {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "id obrigatório" });
  await supabase.from("colunistas").delete().eq("id", id);
  return res.status(200).json({ ok: true });
}

async function handleLimparPendentesAntigos(req, res) {
  const corte = req.query.antes || '2026-05-18T00:00:00';
  try {
    const { data, error } = await supabase.from("posts")
      .update({ status: "arquivado" }).eq("status", "pendente").lt("created_at", corte).select("id");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, arquivados: (data || []).length, corte });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleSeedRssLote2(req, res) {
  const ADMIN_PASS = 'ovc-admin-2026-secreto';
  if (req.query.pass !== ADMIN_PASS) return res.status(403).json({ error: 'forbidden' });
  try {
    const csv = readFileSync(join(process.cwd(), 'data', 'rss_lote2.csv'), 'utf-8');
    const records = csv.split('\n').filter(l => l.trim()).map(line => {
      const [name, domain, , br] = line.split('|');
      const lang = br === '1' ? 'pt-BR' : 'en';
      const gl   = br === '1' ? 'BR'    : 'US';
      const ceid = br === '1' ? 'BR:pt-BR' : 'US:en';
      return {
        name,
        url: `https://news.google.com/rss/search?q=site:${domain}&hl=${lang}&gl=${gl}&ceid=${ceid}`,
        active: true
      };
    });
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const { error } = await supabase.from('rss_sources').insert(batch);
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique'))
        return res.status(500).json({ error: error.message, batch_index: i });
      inserted += batch.length;
    }
    return res.status(200).json({ ok: true, inserted, total: records.length });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleSeoBatch(req, res) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(200).json({ status: 'error', error: 'OPENAI_API_KEY não configurado' });

  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  const limit  = Math.min(parseInt(req.query.limit  || '5', 10), 5);

  try {
    const { count: total } = await supabase.from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'publicado');

    const { data: posts, error: fetchErr } = await supabase.from('posts')
      .select('id, titulo, conteudo, comentario_fixado, metrics')
      .eq('status', 'publicado')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchErr) return res.status(200).json({ status: 'error', error: fetchErr.message });
    if (!posts || posts.length === 0) {
      return res.status(200).json({ status: 'done', total: total || 0, processados: 0, nextOffset: null, resultados: [] });
    }

    const resultados = await Promise.all(posts.map(async post => {
      try {
        const excerpt = (post.conteudo || '').slice(0, 900);
        const prompt = `SEO editorial brasileiro. Retorne SOMENTE JSON válido:\n\nTÍTULO: ${post.titulo}\nCONTEÚDO: ${excerpt}\n\n{"titulo":"título SEO (máx 65 chars)","meta_desc":"meta description (130-155 chars)","keyword":"palavra-chave (2-4 palavras)","slug":"slug-seo (máx 55 chars)"}`;

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 7000);
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 220, temperature: 0.3,
            messages: [{ role: 'user', content: prompt }] })
        });
        clearTimeout(timer);

        const rd = await r.json();
        const txt = (rd.choices?.[0]?.message?.content || '').trim();
        const m = txt.match(/\{[\s\S]*?\}/);
        const seo = m ? JSON.parse(m[0]) : null;
        if (!seo) return { ok: false, titulo: post.titulo };

        const metricsAtual = (post.metrics && typeof post.metrics === 'object') ? { ...post.metrics } : {};
        metricsAtual.meta_desc    = (seo.meta_desc || '').slice(0, 200);
        metricsAtual.foco_keyword = (seo.keyword   || '').slice(0, 60);
        metricsAtual.seo_score    = 80;

        const updateData = { metrics: metricsAtual, updated_at: new Date().toISOString() };
        if (seo.titulo && seo.titulo.length >= 10) updateData.titulo = seo.titulo.slice(0, 120);
        if (seo.meta_desc) updateData.comentario_fixado = seo.meta_desc.slice(0, 200);

        await supabase.from('posts').update(updateData).eq('id', post.id);
        return { ok: true, titulo: seo.titulo || post.titulo };
      } catch(_) {
        return { ok: false, titulo: post.titulo };
      }
    }));

    const nextOffset = offset + posts.length;
    const done = posts.length < limit || nextOffset >= (total || 0);

    return res.status(200).json({
      status: done ? 'done' : 'ok',
      total: total || 0,
      processados: posts.length,
      nextOffset: done ? null : nextOffset,
      resultados
    });
  } catch(e) {
    return res.status(200).json({ status: 'error', error: e.message });
  }
}

async function handleFixParagrafos(req, res) {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Não autorizado' });
  try {
    const offset = parseInt(req.body.offset || 0, 10);
    const BATCH = 100;
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('id, conteudo', { count: 'exact' })
      .not('conteudo', 'is', null)
      .range(offset, offset + BATCH - 1);
    if (error) throw new Error(error.message);
    if (!posts || posts.length === 0) {
      return res.status(200).json({ status: 'done', atualizados: 0, total: 0, nextOffset: null });
    }
    let atualizados = 0;
    for (const post of posts) {
      if (!post.conteudo || !post.conteudo.includes('<p>')) continue;
      const novo = normalizarParagrafos(post.conteudo);
      if (novo !== post.conteudo) {
        await supabase.from('posts').update({ conteudo: novo, updated_at: new Date().toISOString() }).eq('id', post.id);
        atualizados++;
      }
    }
    const nextOffset = offset + posts.length;
    const done = posts.length < BATCH;
    return res.status(200).json({
      status: done ? 'done' : 'ok',
      atualizados,
      processados: posts.length,
      nextOffset: done ? null : nextOffset,
      total: count || 0
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleFixConclusaoOvc(req, res) {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Não autorizado' });
  try {
    const BATCH = 200;
    let offset = 0;
    let totalAtualizado = 0;
    let totalVerificado = 0;

    while (true) {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, conteudo')
        .not('conteudo', 'is', null)
        .range(offset, offset + BATCH - 1);

      if (error) throw new Error(error.message);
      if (!posts || posts.length === 0) break;

      totalVerificado += posts.length;

      for (const post of posts) {
        if (!post.conteudo) continue;
        const temInterpretacao = /interpreta[çc][aã]o\s+estrat[eé]gica/i.test(post.conteudo);
        if (!temInterpretacao) continue;

        const novoConteudo = post.conteudo
          .replace(/<h2>\s*interpreta[çc][aã]o\s+estrat[eé]gica\s*<\/h2>/gi, '<h2>Conclusão OVC</h2>');

        if (novoConteudo !== post.conteudo) {
          await supabase.from('posts')
            .update({ conteudo: novoConteudo, updated_at: new Date().toISOString() })
            .eq('id', post.id);
          totalAtualizado++;
        }
      }

      if (posts.length < BATCH) break;
      offset += BATCH;
    }

    return res.status(200).json({ ok: true, atualizados: totalAtualizado, verificados: totalVerificado });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
