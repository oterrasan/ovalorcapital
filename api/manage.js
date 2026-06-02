import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "sb_publishable_3SXiMraMn_oaubinB2Wn5w_Iqj7W2yf";
const OLD_REF = "bfsegqdgscudtdgwdyci";
const ADMIN_PASS = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || "ovc-admin-2026-secreto";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VENDOR_JS = {
  react: "https://unpkg.com/react@18/umd/react.production.min.js",
  "react-dom": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  babel: "https://unpkg.com/@babel/standalone/babel.min.js",
  supabase: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  html2canvas: "https://html2canvas.hertzen.com/dist/html2canvas.min.js"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    if (req.method === "GET") {
      const action = String(req.query.action || "");
      if (action === "vendor_js") return handleVendorJs(req, res);
      if (action === "validate-token") return res.status(200).json({ valid: String(req.query.token || "") === ADMIN_PASS });
      if (action === "list_colunistas") return handleListColunistas(res);
      if (action === "setup_storage") return handleSetupStorage(res);
      if (action === "limpar_pendentes_antigos") return handleLimparPendentesAntigos(req, res);
      return handleStatus(res);
    }

    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const body = req.body || {};
    const action = String(body.action || "");

    if (action === "create_colunista") return handleCreateColunista(req, res, body);
    if (action === "update_colunista_photo") return handleUpdateColunistaPhoto(req, res, body);
    if (action === "toggle_colunista") return handleToggleColunista(req, res, body);
    if (action === "delete_colunista") return handleDeleteColunista(req, res, body);
    if (["aprovar", "rejeitar", "editar_aprovar", "aprovar_lote", "rejeitar_lote"].includes(action)) return handleApprovePortal(res, body);
    if (body.id && !action) return handleApprovePortal(res, { id: body.id, action: "aprovar" });

    return res.status(200).json({ ok: false, degraded: true, error: "acao_indisponivel_no_modo_emergencia" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
}

async function handleVendorJs(req, res) {
  const name = String(req.query.name || "");
  const url = VENDOR_JS[name];
  if (!url) return res.status(404).send("not found");

  const upstream = await fetch(url);
  if (!upstream.ok) return res.status(502).send("vendor unavailable");
  let code = await upstream.text();

  if (name === "supabase") {
    code += `\n;(function(){\n  var NEW_URL=${JSON.stringify(SUPABASE_URL)};\n  var NEW_KEY=${JSON.stringify(SUPABASE_KEY)};\n  var OLD_REF=${JSON.stringify(OLD_REF)};\n  window.SUPABASE_ANON_KEY=NEW_KEY;\n  if(window.supabase&&window.supabase.createClient){\n    var original=window.supabase.createClient.bind(window.supabase);\n    window.supabase.createClient=function(url,key,options){\n      try{ if(String(url||'').indexOf(OLD_REF)>=0){ return original(NEW_URL, NEW_KEY, options); } }catch(e){}\n      return original(url||NEW_URL, key||NEW_KEY, options);\n    };\n  }\n})();`;
  }

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.status(200).send(code);
}

async function handleStatus(res) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 3, 0, 0));

  const [autoCfg, maxCfg, pendentes, erros, hoje, youtube] = await Promise.allSettled([
    supabase.from("config").select("value").eq("key", "AUTOMATION").maybeSingle(),
    supabase.from("config").select("value").eq("key", "MAX_POSTS_DIA").maybeSingle(),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "error"),
    supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()),
    supabase.from("config").select("value").eq("key", "YOUTUBE_LIVE_URL").maybeSingle()
  ]);

  return res.status(200).json({
    running: autoCfg.value?.data?.value === "on",
    posts_hoje: hoje.value?.count || 0,
    max_posts: Number(maxCfg.value?.data?.value || 300),
    pendentes: pendentes.value?.count || 0,
    erros: erros.value?.count || 0,
    youtube_live_url: youtube.value?.data?.value || null,
    supabase_project: "yntwvfcxjardzafdqanj",
    emergency_manage: true
  });
}

async function handleSetupStorage(res) {
  const { error } = await supabase.storage.createBucket("posts-images", { public: true });
  if (error && !String(error.message || "").toLowerCase().includes("already")) return res.status(200).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleApprovePortal(res, body) {
  const now = new Date().toISOString();
  const { id, ids, action, titulo, conteudo, imagem, comentario_fixado } = body;

  if (action === "aprovar" && id) {
    const { error } = await supabase.from("posts").update({ status: "publicado", approved: true, published_at: now, updated_at: now }).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "aprovado", id });
  }

  if (action === "rejeitar" && id) {
    const { error } = await supabase.from("posts").update({ status: "rejeitado", approved: false, updated_at: now }).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "rejeitado", id });
  }

  if (action === "editar_aprovar" && id) {
    const patch = { titulo, conteudo, imagem, comentario_fixado, status: "publicado", approved: true, published_at: now, updated_at: now };
    const { error } = await supabase.from("posts").update(patch).eq("id", id);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "editado_aprovado", id });
  }

  if (action === "aprovar_lote" && Array.isArray(ids)) {
    const { error } = await supabase.from("posts").update({ status: "publicado", approved: true, published_at: now, updated_at: now }).in("id", ids);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "lote_aprovado", total: ids.length });
  }

  if (action === "rejeitar_lote" && Array.isArray(ids)) {
    const { error } = await supabase.from("posts").update({ status: "rejeitado", approved: false, updated_at: now }).in("id", ids);
    if (error) throw error;
    return res.status(200).json({ ok: true, action: "lote_rejeitado", total: ids.length });
  }

  return res.status(400).json({ ok: false, error: "missing_params" });
}

async function handleListColunistas(res) {
  let { data, error } = await supabase
    .from("colunistas")
    .select("id,nome,email,ativo,created_at,last_login,slug,bio")
    .order("nome");

  if (error) {
    const fallback = await getColunistasConfig();
    return res.status(200).json({ ok: true, fallback_config: true, colunistas: fallback });
  }

  const photoMap = await getColunistaPhotoMap();
  const colunistas = (data || []).map(c => attachFotoColunista(c, photoMap));
  return res.status(200).json({ ok: true, colunistas });
}

async function getColunistasConfig() {
  try {
    const { data } = await supabase.from("config").select("value").eq("key", "COLUNISTAS_ACCOUNTS").maybeSingle();
    const parsed = JSON.parse(data?.value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

async function getColunistaPhotoMap() {
  const map = {};

  try {
    const { data } = await supabase.from("config").select("value").eq("key", "COLUNISTAS_PHOTOS").maybeSingle();
    const parsed = JSON.parse(data?.value || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(map, parsed);
  } catch (_) {}

  try {
    const { data, error } = await supabase.storage.from("posts-images").list("colunistas", { limit: 100 });
    if (!error) {
      const base = `${SUPABASE_URL}/storage/v1/object/public/posts-images/colunistas/`;
      (data || []).forEach(file => {
        if (!file?.name || file.name.startsWith(".")) return;
        const slug = file.name.replace(/\.[^.]+$/, "");
        map[slug] = base + file.name;
      });
    }
  } catch (_) {}

  return map;
}

function attachFotoColunista(c, photoMap) {
  const safe = { ...c };
  const slug = safe.slug || slugify(safe.nome);
  if (!safe.slug) safe.slug = slug;
  const foto = safe.foto_url || photoMap[slug] || photoMap[safe.nome] || photoMap[slugify(safe.nome)];
  if (foto && !String(foto).includes(OLD_REF)) safe.foto_url = foto;
  return safe;
}

async function handleCreateColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const payload = {
    nome: body.nome,
    email: String(body.email || "").toLowerCase().trim(),
    telefone: body.telefone || null,
    slug: slugify(body.slug || body.nome),
    bio: body.bio || null,
    ativo: true,
    senha_hash: body.senha_hash || null
  };
  const { error } = await supabase.from("colunistas").insert(payload);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  if (body.foto_url) await savePhoto(payload.slug, body.foto_url);
  return res.status(200).json({ ok: true });
}

async function handleUpdateColunistaPhoto(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const slug = slugify(body.slug || body.nome || "");
  const foto = String(body.foto_url || "").trim();
  if (!slug || !foto) return res.status(400).json({ error: "slug/nome e foto_url obrigatorios" });
  await savePhoto(slug, foto);
  return res.status(200).json({ ok: true, slug, foto_url: foto });
}

async function savePhoto(slug, foto) {
  const current = await getColunistaPhotoMap();
  current[slug] = foto;
  const { error } = await supabase.from("config").upsert({ key: "COLUNISTAS_PHOTOS", value: JSON.stringify(current), updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

async function handleToggleColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const { id, ativo } = body;
  const { error } = await supabase.from("colunistas").update({ ativo: !ativo }).eq("id", id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleDeleteColunista(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ error: "Nao autorizado" });
  const { error } = await supabase.from("colunistas").delete().eq("id", body.id);
  if (error) return res.status(400).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}

async function handleLimparPendentesAntigos(req, res) {
  const corte = req.query.antes || "2026-05-18T00:00:00";
  const { data, error } = await supabase.from("posts").update({ status: "arquivado" }).eq("status", "pendente").lt("created_at", corte).select("id");
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, arquivados: (data || []).length, corte });
}

function checkAdmin(req, body) {
  const auth = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const supplied = auth || req.headers?.["x-admin-token"] || req.headers?.["x-admin-password"] || body?.token || body?.admin_token || req.query?.token || req.query?.pass || "";
  return String(supplied) === String(ADMIN_PASS);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
