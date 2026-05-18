import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const config = { maxDuration: 10 };

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    if (req.query.action === 'refresh_token') return handleRefreshToken(req, res);
    if (req.query.action === 'unpublish_recent') return handleUnpublishRecent(req, res);
    if (req.query.action === 'unpublish_no_image') return handleUnpublishNoImage(req, res);
    if (req.query.action === 'audit_images') return handleAuditImages(req, res);
    return handleStatus(req, res);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { action } = req.body || {};
  if (action === "track_view")   return handleTrackView(req, res);
  if (action === "setup_storage") return handleSetupStorage(req, res);
  return res.status(400).json({ error: "unknown_action" });
}

async function handleStatus(req, res) {
  try {
    const { data: cfg } = await supabase.from("config").select("key,value");
    const out = {};
    (cfg || []).forEach(r => { out[r.key] = r.value; });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleTrackView(req, res) {
  const { post_id } = req.body || {};
  if (!post_id) return res.status(400).json({ error: 'post_id required' });
  try {
    await supabase.rpc('increment_views', { post_id });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
}

async function handleSetupStorage(req, res) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === 'post-images');
    if (!exists) {
      await supabase.storage.createBucket('post-images', { public: true });
    }
    return res.status(200).json({ ok: true, created: !exists });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── VARREDURA DE IMAGENS — despublica matérias com ícones/ilustrações/desenhos ──────────────
async function handleAuditImages(req, res) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(200).json({ ok: false, error: 'OPENAI_API_KEY não configurado' });

  const batch  = Math.min(parseInt(req.query.batch  || '4', 10), 6);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

  try {
    const { data: posts, error: fetchErr } = await supabase
      .from('posts')
      .select('id, titulo, imagem')
      .eq('status', 'publicado')
      .not('imagem', 'is', null)
      .neq('imagem', '')
      .order('created_at', { ascending: true })
      .range(offset, offset + batch - 1);

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });
    if (!posts || posts.length === 0) {
      return res.status(200).json({ ok: true, processed: 0, unpublished: 0, done: true, message: 'Varredura concluída.' });
    }

    const results = [];

    for (const post of posts) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);

        const vRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 60,
            temperature: 0,
            messages: [{ role: 'user', content: [
              {
                type: 'text',
                text: 'Analyze this image. Respond ONLY with valid JSON, nothing else: {"is_illustration": true/false, "is_chart_or_table": true/false}\nis_illustration: true if this is a drawing, cartoon, vector art, clip art, icon, app icon, logo, or any digitally created non-photographic image. false if it is a real photograph of a real scene, person, or place.\nis_chart_or_table: true if chart, graph, infographic, table.'
              },
              {
                type: 'image_url',
                image_url: { url: post.imagem, detail: 'low' }
              }
            ]}]
          })
        });
        clearTimeout(timer);

        if (!vRes.ok) {
          results.push({ id: post.id, status: 'skip', reason: 'vision_api_error' });
          continue;
        }

        const vd = await vRes.json();
        const txt = (vd.choices?.[0]?.message?.content || '').trim();
        const m = txt.match(/\{[^}]+\}/);
        const metrics = m ? JSON.parse(m[0]) : null;

        if (metrics?.is_illustration === true || metrics?.is_chart_or_table === true) {
          await supabase.from('posts')
            .update({ status: 'pendente', approved: false })
            .eq('id', post.id);
          results.push({
            id: post.id,
            titulo: (post.titulo || '').slice(0, 60),
            status: 'despublicado',
            motivo: metrics.is_illustration ? 'ilustração/ícone' : 'gráfico/tabela'
          });
        } else {
          results.push({ id: post.id, status: 'ok' });
        }
      } catch(e) {
        results.push({ id: post.id, status: 'skip', reason: e.message?.slice(0, 60) });
      }
    }

    const unpublished = results.filter(r => r.status === 'despublicado').length;
    const nextOffset  = offset + posts.length;
    const done        = posts.length < batch;

    return res.status(200).json({
      ok: true,
      lote: `${offset}–${nextOffset - 1}`,
      processed: posts.length,
      unpublished,
      done,
      next_url: done ? null : `/api/manage?action=audit_images&offset=${nextOffset}`,
      results
    });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── DESPUBLICAR POSTS SEM IMAGEM (move publicado → pendente) ────────────────────────────────
async function handleUnpublishNoImage(req, res) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'pendente', approved: false })
      .eq('status', 'publicado')
      .or('imagem.is.null,imagem.eq.');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, updated: data?.length || 0 });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleUnpublishRecent(req, res) {
  try {
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'pendente', approved: false })
      .eq('status', 'publicado')
      .gte('published_at', since);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, updated: data?.length || 0 });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleRefreshToken(req, res) {
  return res.status(200).json({ ok: true, message: 'Token refresh not implemented' });
}
