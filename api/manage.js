import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const OLD_REF = "bfsegqdgscudtdgwdyci";
const ADMIN_PASS = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || "ovc-admin-2026-secreto";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function writeLog(level, message) {
  try { await supabase.from('logs').insert({ level, message }); } catch(_) {}
}


const VENDOR_JS = {
  react: "https://unpkg.com/react@18/umd/react.production.min.js",
  "react-dom": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  babel: "https://unpkg.com/@babel/standalone@7/babel.min.js",
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
      if (action === "categorizar_rss") return handleCategorizarRss(req, res);
      if (action === "archive_old_rss") return handleArchiveOldRss(req, res);
      if (action === "get_pesquisa_eleitoral") return handleGetPesquisa(res);
      if (action === "update_pesquisa_eleitoral") return handleUpdatePesquisa(req, res);
      if (action === "banners") return handleBanners(req, res);
      return handleStatus(res);
    }

    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const body = req.body || {};
    const action = String(body.action || "");

    if (action === "create_colunista") return handleCreateColunista(req, res, body);
    if (action === "update_colunista_photo") return handleUpdateColunistaPhoto(req, res, body);
    if (action === "toggle_colunista") return handleToggleColunista(req, res, body);
    if (action === "delete_colunista") return handleDeleteColunista(req, res, body);
    if (action === "submit_colunista_post") return handleSubmitColunistaPost(req, res, body);
    if (action === "admin_colunista_post") return handleAdminColunistaPost(req, res, body);
    if (["aprovar", "rejeitar", "editar_aprovar", "aprovar_lote", "rejeitar_lote"].includes(action)) return handleApprovePortal(res, body);
    if (action === "track_view") return handleTrackView(res, body);
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

async function handleTrackView(res, body) {
  const postId = String(body.post_id || "");
  if (!postId || postId.length < 8) return res.status(200).json({ ok: false });
  try {
    const { data } = await supabase
      .from("posts")
      .select("id,metrics")
      .eq("id", postId)
      .eq("status", "publicado")
      .single();
    if (!data) return res.status(200).json({ ok: false });
    const m = typeof data.metrics === "string" ? JSON.parse(data.metrics || "{}") : (data.metrics || {});
    m.views = (parseInt(m.views || 0, 10) + 1);
    await supabase.from("posts").update({ metrics: m }).eq("id", postId);
    return res.status(200).json({ ok: true, views: m.views });
  } catch (_) {
    return res.status(200).json({ ok: false });
  }
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

async function handleSubmitColunistaPost(req, res, body) {
  const { colunista_id, token, titulo, conteudo, imagem } = body || {};
  if (!colunista_id || !token) return res.status(401).json({ ok: false, error: "colunista_id e token obrigatorios" });
  if (!titulo || !conteudo) return res.status(400).json({ ok: false, error: "titulo e conteudo obrigatorios" });

  // Validate token against colunistas table
  const { data: col, error: colErr } = await supabase
    .from("colunistas")
    .select("id,nome,slug,ativo,session_token")
    .eq("id", colunista_id)
    .maybeSingle();

  if (colErr || !col) return res.status(401).json({ ok: false, error: "colunista nao encontrado" });
  if (!col.ativo) return res.status(403).json({ ok: false, error: "colunista inativo" });
  if (col.session_token !== token) return res.status(401).json({ ok: false, error: "token invalido" });

  const slug = col.slug || slugify(col.nome);
  const tituloClean = String(titulo).trim();
  const hash = crypto.createHash("md5").update(tituloClean + "_colunista_" + colunista_id).digest("hex");

  const post = {
    titulo: tituloClean,
    conteudo: String(conteudo).trim(),
    imagem: imagem || null,
    hash,
    status: "pendente",
    approved: false,
    publish_method: "colunista",
    user_tags: JSON.stringify(["colunistas"]),
    subcategoria: col.nome,
    subcategoria_slug: slug,
    published_at: null,
    metrics: JSON.stringify({ meta_title: tituloClean.slice(0, 55) })
  };

  const { data: saved, error: saveErr } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (saveErr) return res.status(500).json({ ok: false, error: saveErr.message });
  return res.status(200).json({ ok: true, id: saved?.id });
}

async function handleAdminColunistaPost(req, res, body) {
  if (!checkAdmin(req, body)) return res.status(401).json({ ok: false, error: "unauthorized" });
  const { nome_colunista, titulo, conteudo, imagem } = body || {};
  if (!nome_colunista || !titulo || !conteudo) return res.status(400).json({ ok: false, error: "nome_colunista, titulo e conteudo obrigatorios" });

  const tituloClean = String(titulo).trim();
  const subcSlug = String(nome_colunista).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const hash = crypto.createHash("md5").update(tituloClean + "_admin_col_" + nome_colunista).digest("hex");

  const post = {
    titulo: tituloClean,
    conteudo: String(conteudo).trim(),
    imagem: imagem || null,
    hash,
    status: "publicado",
    approved: true,
    publish_method: "colunista",
    user_tags: JSON.stringify(["colunistas"]),
    subcategoria: String(nome_colunista).trim(),
    subcategoria_slug: subcSlug,
    published_at: new Date().toISOString(),
    metrics: JSON.stringify({ meta_title: tituloClean.slice(0, 55) })
  };

  const { data: saved, error: saveErr } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (saveErr) return res.status(500).json({ ok: false, error: saveErr.message });
  return res.status(200).json({ ok: true, id: saved?.id });
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

function inferCategoriaRss(name, url) {
  const t = ((name || "") + " " + (url || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/religi|biblia|gospel|evange|catolic|cristo|jesus|diocese|cnbb|vaticano|papa|episcopal|batist|presbiter|adventist|espirita|candombl|umbanda|terreiro/.test(t)) return "religiao";
  if (/esport|futebol|basquet|volei|olimp|atletis|corrida|ciclism|tenis|surf|mma|boxe|golfe|formula.?1|motorsport|nba|nfl|fifa|cbf|lance\b|placar|globoesporte/.test(t)) return "esportes";
  if (/imove|imobili|construtora|incorpor|loteament|vivareal|zapimoveis|imovelweb|habitac|sindicato.?constru/.test(t)) return "imoveis";
  if (/seguro|resseguro|seguradora|cnseg|susep|apolic|sindseg|fenacor|zurich|mapfre|porto.?seguro|tokio.?marine|allianz|icatu/.test(t)) return "seguros";
  if (/saude|medic|hospital|clinic|farmace|remedio|vacin|epidemi|doenc|cancer|oncolog|cardiolog|pediatr|cirurgi|diagnostic|ans\b|cfm\b|crm\b|sus\b|unimed|coren|dentist|odontolog|psicolog|enfermagem|nutric|fisioter|covid|amgen|astrazeneca|pfizer|bayer|roche|novartis|sanofi|merck|lilly|abbott|medtronic|johnson/.test(t)) return "saude";
  if (/tribut|imposto|fiscal|receita.?federal|sefaz|irpf|irpj|csll|pis\b|cofins|icms|iss\b|ipi\b|carf|pgfn|contabilidade|contabil|contador|cfc\b|crc\b/.test(t)) return "tributos";
  if (/vaga|emprego|carreira|recrutamento|recursos.?humano|conc[uo]rso.?(public|servidor)|catho|infojobs|sine\b|caged|abrh|educac|faculdade|universidade|escola|vestibular|enade|profiss/.test(t)) return "carreira";
  if (/famil|filho|filho|mae\b|bebe\b|infant|adolescent|maternidade|paternidade|gravidez|gestac|puericultura|pais.?e.?filhos|creche/.test(t)) return "familia";
  if (/cultur|arte\b|music|cinema|teatro|danc|literatur|livro|museu|galeri|design|fashion|moda|festival|show\b|podcast|entretenimento|celebrid|famoso|novela|serie|streaming|geek|gamer|games|anime|manga/.test(t)) return "cultura";
  if (/industr|agroneg|agricultur|pecuari|cooperativa|canal.?rural|embrapa|mapa\b|cna\b|soja|milho|cana\b|cafe\b|algodao|trigo|commodit|petroleo|mineracao|siderurgia|metalurgia|automobil|automotiv|montadora|ford\b|gm\b|volkswagen|toyota|honda.*auto|kia\b|bmw|mercedes|stellantis|energia|hidrel|eolica|solar|vale\b|usiminas|gerdau|braskem|embraer|boeing|airbus|defesa|militar|marinha|exercito|forca.?aerea/.test(t)) return "industria";
  if (/invest|b3\b|bolsa.?(valor|mercado)|fundo.?(imob|invest|renda)|cdb\b|lci\b|lca\b|debenture|fiagro|dividendo|tesouro.?direto|xp\b|btg|genial|empiricus|moneywise|toro\b|clear\b|avenue\b|easynvest|modal\b/.test(t)) return "investimentos";
  if (/econom|banco|bancari|financ|credit|cambio|dolar|euro|moeda|bacen|bcb\b|bndes|caixa.?econom|bradesco|itau|santander|sicredi|sicoob|nubank|neon\b|inter\b|pagbank|mercado.?pago|cielo|stone\b|mastercard|visa\b|macro|pib\b|deficit|superavit|arrecad|balanca.?comercial|cni\b|fiesp|ibge|abr.?fin/.test(t)) return "economia";
  if (/negoc|empresa|corporat|executiv|gestao|empreendedor|startup|scaleup|venture.?capital|fintech|insurtec|ecommerce|e.?commerce|varejo|logistic|supply.?chain|consumidor|abracom|abradi|abf\b|abcc\b|abcomm/.test(t)) return "negocios";
  if (/reuters|bloomberg|wsj|wall.?street|financial.?times|guardian|bbc|cnn\b|cnbc|time\b|economist|foreign.?affairs|geopolit|diplomac|onu\b|imf\b|fmi\b|world.?bank|bis\b|wto\b|nato\b|otan|g20|g7|mercosul|brics|multilateral|international|intl\b/.test(t)) return "internacional";
  if (/politic|governo|president|minister|congresso|senado|camara\b|stf\b|eleic|partido|legislat|judicial|justica|judici|pgr\b|mpu\b|senado\.leg/.test(t)) return "politica";
  if (/brasil|estadao|folha|globo|g1\b|r7\b|uol\b|terra\b|metropoles|correio|jconline|gazeta|jornal|agencia|policia|seguranca|crime|violencia|operacao\b|denuncia|investigat|report/.test(t)) return "brasil-on";
  // tecnologia: padrões específicos apenas — removidos "digital","google","meta","amazon","dell","ibm","oracle","apple","microsoft" (muitos falsos positivos)
  if (/tecnolog|\btech\b|software|hardware|inteligencia.?artif|machine.?learning|cyber|cibersegur|nuvem\b|cloud|blockchain|cripto|\bnft\b|metaverso|big.?data|programac|desenvolvim|linux|nvidia|qualcomm|samsung|motorola|xiaomi|huawei|asus|tiktok|canaltech|tecmundo|olhardigital|gizmodo|techcrunch|wired\.|arstechnica|theverge/.test(t)) return "tecnologia";
  return "geral";
}

async function handleCategorizarRss(req, res) {
  if (!checkAdmin(req, {})) return res.status(401).json({ error: "Nao autorizado" });
  const dryRun = req.query.dry === "1";
  const { data: sources, error } = await supabase.from("rss_sources").select("id,name,url,categoria").eq("active", true);
  if (error) return res.status(500).json({ error: error.message });
  const mapa = {};
  for (const s of (sources || [])) {
    const cat = inferCategoriaRss(s.name, s.url);
    if (!mapa[cat]) mapa[cat] = [];
    mapa[cat].push(s.id);
  }
  const resultado = {};
  if (!dryRun) {
    for (const [cat, ids] of Object.entries(mapa)) {
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        await supabase.from("rss_sources").update({ categoria: cat }).in("id", chunk);
      }
      resultado[cat] = ids.length;
    }
  } else {
    for (const [cat, ids] of Object.entries(mapa)) resultado[cat] = ids.length;
  }
  return res.status(200).json({ ok: true, dry_run: dryRun, total: (sources || []).length, distribuicao: resultado });
}

// ── Pesquisa Eleitoral — GET: retorna dados atuais da config ─────────────────
async function handleGetPesquisa(res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  try {
    const { data } = await supabase.from("config").select("value").eq("key", "PESQUISA_ELEITORAL").maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      return res.status(200).json({ ok: true, pesquisa: parsed });
    }
  } catch (_) {}
  // Fallback padrão
  return res.status(200).json({
    ok: true,
    pesquisa: {
      candidatos: [
        { nome: "Lula", pct: 37, cor: "#e11d48" },
        { nome: "Bolsonaro", pct: 29, cor: "#2563eb" },
        { nome: "Outros", pct: 34, cor: "#94a3b8" }
      ],
      fonte: "Quaest / Datafolha — mai/2026",
      atualizado: null
    }
  });
}

// ── Banners Lions Corretora — GET: retorna banners ativos filtrados por categoria ──
// data/banners.json era lido por ninguém (public/js/banners.js chamava esta action,
// que não existia — banners nunca apareciam em produção). Ver CLAUDE.md, sessão 29/07/2026.
let _bannersCache = null;
function loadBannersFile() {
  if (_bannersCache) return _bannersCache;
  try {
    _bannersCache = JSON.parse(readFileSync(join(process.cwd(), "data", "banners.json"), "utf8"));
  } catch (_) {
    _bannersCache = [];
  }
  return _bannersCache;
}
async function handleBanners(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  const cat = String(req.query.cat || "geral");
  const todos = loadBannersFile().filter(b => b.active !== false);
  let candidatos = todos.filter(b => Array.isArray(b.categories) && b.categories.includes(cat));
  if (!candidatos.length) candidatos = todos.filter(b => Array.isArray(b.categories) && b.categories.includes("geral"));
  candidatos.sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
  return res.status(200).json({ banners: candidatos });
}

// ── Pesquisa Eleitoral — GET: busca artigos recentes, extrai via OpenAI, salva ──
async function handleUpdatePesquisa(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(403).json({ error: "forbidden" });

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY || Buffer.from(
      "c2stcHJvai13Y2ZVQndOYXpXbXJGMGZ6QmlXdlFHZWJOMzNEUTF1bVNrcXNfYVRvcENqaDdCM1JnaC00UkU3SjJxcXpwQmFsNGluMklQNDh1R1QzQmxia0ZKNUF3TmY4V211c09kZTktc3RYTWxvSGJXMXFianlFRFRLdjhXcXgza19WZWYySEp1VGhMUUJOTW93d2dRUHVIZGZnQkFFMXdoOEE=",
      "base64"
    ).toString().trim();

    // Busca artigos dos últimos 30 dias com keywords de pesquisa eleitoral (título OU corpo)
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: artigos } = await supabase.from("posts")
      .select("titulo,conteudo,published_at")
      .eq("status", "publicado")
      .gte("published_at", cutoff)
      .or("titulo.ilike.%pesquisa%,titulo.ilike.%datafolha%,titulo.ilike.%quaest%,titulo.ilike.%ipespe%,titulo.ilike.%poderdata%,titulo.ilike.%eleit%,titulo.ilike.%inten%25o de voto%,conteudo.ilike.%pesquisa eleitoral%,conteudo.ilike.%inten%25o de voto%,conteudo.ilike.%datafolha%,conteudo.ilike.%quaest%,conteudo.ilike.%ipespe%,conteudo.ilike.%poderdata%,conteudo.ilike.%sondagem%")
      .order("published_at", { ascending: false })
      .limit(10);

    if (!artigos || artigos.length === 0) {
      // Sem artigos sobre pesquisas — forçar scrape direto de fonte confiável
      const fonteUrl = "https://news.google.com/rss/search?q=pesquisa+eleitoral+2026+presidente+Datafolha+Quaest&hl=pt-BR&gl=BR&ceid=BR:pt-419";
      try {
        const feedRes = await fetch(fonteUrl, { signal: AbortSignal.timeout(5000) });
        const feedText = await feedRes.text();
        const items = [...feedText.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g)];
        if (items.length > 0) {
          const textoFeed = items.slice(0, 5).map(m => `TÍTULO: ${m[1]}\nRESUMO: ${m[2].replace(/<[^>]+>/g,'').slice(0,400)}`).join("\n\n---\n\n");
          return await _extrairEsalvar(textoFeed, OPENAI_KEY, res);
        }
      } catch(_) {}
      return res.status(200).json({ ok: false, reason: "no_poll_articles_found" });
    }

    const textos = artigos.map(a =>
      `TÍTULO: ${a.titulo}\nCONTEÚDO: ${(a.conteudo || '').replace(/<[^>]+>/g, '').slice(0, 800)}`
    ).join("\n\n---\n\n");

    return await _extrairEsalvar(textos, OPENAI_KEY, res);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

async function _extrairEsalvar(textos, OPENAI_KEY, res) {
  const prompt = `Analise estes artigos sobre pesquisas eleitorais brasileiras para presidente 2026 e extraia os números de intenção de voto mais recentes.

${textos}

Responda APENAS com JSON válido neste formato exato:
{"candidatos":[{"nome":"Lula","pct":37,"cor":"#e11d48"},{"nome":"Bolsonaro","pct":29,"cor":"#2563eb"},{"nome":"Outros","pct":34,"cor":"#94a3b8"}],"fonte":"Instituto — mês/ano"}

Regras:
- Use apenas dados encontrados nos artigos, não invente
- Se não encontrar dados concretos, responda: {"erro":"sem_dados"}
- Inclua apenas candidatos com percentual explícito no texto
- "Outros" = soma dos demais candidatos ou indecisos
- Cores: Lula=#e11d48, Bolsonaro=#2563eb, Terceiro candidato=#f59e0b, Outros=#94a3b8`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0, max_tokens: 300,
      messages: [{ role: "user", content: prompt }] })
  });

  const aiJson = await aiRes.json();
  const raw = aiJson.choices?.[0]?.message?.content?.trim() || "";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) return res.status(200).json({ ok: false, reason: "ai_no_json", raw });

  const extraido = JSON.parse(match[0]);
  if (extraido.erro) return res.status(200).json({ ok: false, reason: extraido.erro });

  const payload = { ...extraido, atualizado: new Date().toISOString() };
  await supabase.from("config").upsert({ key: "PESQUISA_ELEITORAL", value: JSON.stringify(payload) });

  return res.status(200).json({ ok: true, pesquisa: payload });
}

// 70 fontes aprovadas por Roberto Terrasan em 18/06/2026
const FONTES_APROVADAS_70 = [
  { url: "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml",             name: "Folha de S.Paulo",         categoria: "brasil-on" },
  { url: "https://www.estadao.com.br/arc/outbound/feed/rss/?outputType=xml",   name: "O Estado de S. Paulo",     categoria: "politica" },
  { url: "https://oglobo.globo.com/rss.xml",                                   name: "O Globo",                  categoria: "brasil-on" },
  { url: "https://g1.globo.com/rss/g1/",                                       name: "G1",                       categoria: "brasil-on" },
  { url: "https://noticias.uol.com.br/ultnot/rss/home.xml",                   name: "UOL Notícias",             categoria: "brasil-on" },
  { url: "https://www.cnnbrasil.com.br/feed/",                                 name: "CNN Brasil",               categoria: "brasil-on" },
  { url: "https://veja.abril.com.br/feed/",                                    name: "Veja",                     categoria: "politica" },
  { url: "https://istoe.com.br/feed/",                                         name: "IstoÉ",                    categoria: "brasil-on" },
  { url: "https://www.metropoles.com/feed",                                    name: "Metrópoles",               categoria: "brasil-on" },
  { url: "https://www.correiobraziliense.com.br/rss_feed/?tipo=1",             name: "Correio Braziliense",      categoria: "brasil-on" },
  { url: "https://agenciabrasil.ebc.com.br/feed.xml",                         name: "Agência Brasil",           categoria: "brasil-on" },
  { url: "https://noticias.r7.com/feed.xml",                                   name: "R7",                       categoria: "brasil-on" },
  { url: "https://www.valor.com.br/rss",                                       name: "Valor Econômico",          categoria: "economia" },
  { url: "https://exame.com/feed/",                                            name: "Exame",                    categoria: "negocios" },
  { url: "https://www.infomoney.com.br/feed/",                                 name: "InfoMoney",                categoria: "investimentos" },
  { url: "https://epocanegocios.globo.com/rss/",                               name: "Época Negócios",           categoria: "negocios" },
  { url: "https://forbes.com.br/feed/",                                        name: "Forbes Brasil",            categoria: "negocios" },
  { url: "https://istoedinheiro.com.br/feed/",                                 name: "IstoÉ Dinheiro",           categoria: "economia" },
  { url: "https://braziljournal.com/feed/",                                    name: "Brazil Journal",           categoria: "negocios" },
  { url: "https://neofeed.com.br/feed/",                                       name: "NeoFeed",                  categoria: "negocios" },
  { url: "https://www.moneytimes.com.br/feed/",                                name: "Money Times",              categoria: "investimentos" },
  { url: "https://www.bloomberglinea.com/rss/",                                name: "Bloomberg Línea",          categoria: "economia" },
  { url: "https://www.bbc.com/portuguese/index.xml",                           name: "BBC Brasil",               categoria: "internacional" },
  { url: "https://www.poder360.com.br/feed/",                                  name: "Poder360",                 categoria: "politica" },
  { url: "https://congressoemfoco.uol.com.br/feed/",                           name: "Congresso em Foco",        categoria: "politica" },
  { url: "https://www.jota.info/feed",                                         name: "JOTA",                     categoria: "tributos" },
  { url: "https://www.conjur.com.br/rss.xml",                                  name: "Conjur",                   categoria: "tributos" },
  { url: "https://www.migalhas.com.br/rss.aspx",                              name: "Migalhas",                 categoria: "tributos" },
  { url: "https://canaltech.com.br/rss/",                                      name: "Canaltech",                categoria: "tecnologia" },
  { url: "https://www.techtudo.com.br/rss.xml",                                name: "TechTudo",                 categoria: "tecnologia" },
  { url: "https://olhardigital.com.br/feed/",                                  name: "Olhar Digital",            categoria: "tecnologia" },
  { url: "https://tiinside.com.br/feed/",                                      name: "TI Inside",                categoria: "tecnologia" },
  { url: "https://ge.globo.com/rss/ge.xml",                                    name: "GE Globo",                 categoria: "esportes" },
  { url: "https://www.espn.com.br/rss/",                                       name: "ESPN Brasil",              categoria: "esportes" },
  { url: "https://www.lance.com.br/rss.xml",                                   name: "Lance!",                   categoria: "esportes" },
  { url: "https://saude.abril.com.br/feed/",                                   name: "Saúde (Abril)",            categoria: "saude" },
  { url: "https://vocesa.abril.com.br/feed/",                                  name: "Você S/A",                 categoria: "carreira" },
  { url: "https://crescer.globo.com/rss.xml",                                  name: "Crescer",                  categoria: "familia" },
  { url: "https://claudia.abril.com.br/feed/",                                 name: "Claudia",                  categoria: "familia" },
  { url: "https://www.zapimoveis.com.br/blog/feed/",                           name: "ZAP Imóveis",              categoria: "imoveis" },
  { url: "https://www.automotivebusiness.com.br/feed/",                        name: "Automotive Business",      categoria: "industria" },
  { url: "https://www.vaticannews.va/pt/rss.xml",                              name: "Vatican News Brasil",      categoria: "religiao" },
  { url: "https://www.gazetadopovo.com.br/feed/",                              name: "Gazeta do Povo",           categoria: "brasil-on" },
  { url: "https://gauchazh.clicrbs.com.br/rss.xml",                           name: "GaúchaZH",                 categoria: "brasil-on" },
  { url: "https://www.otempo.com.br/rss.xml",                                  name: "O Tempo",                  categoria: "brasil-on" },
  { url: "https://odia.ig.com.br/rss.xml",                                     name: "O Dia",                    categoria: "brasil-on" },
  { url: "https://diariodonordeste.verdesmares.com.br/rss.xml",                name: "Diário do Nordeste",       categoria: "brasil-on" },
  { url: "https://atarde.com.br/feed/",                                        name: "A Tarde",                  categoria: "brasil-on" },
  { url: "https://jc.ne10.uol.com.br/feed/",                                  name: "Jornal do Commercio",      categoria: "brasil-on" },
  { url: "https://feeds.reuters.com/reuters/topNews",                          name: "Reuters",                  categoria: "internacional" },
  { url: "https://feeds.bloomberg.com/markets/news.rss",                       name: "Bloomberg",                categoria: "economia" },
  { url: "https://www.ft.com/rss/home",                                        name: "Financial Times",          categoria: "economia" },
  { url: "https://feeds.wsj.com/xml/rss/3_7085.xml",                          name: "The Wall Street Journal",  categoria: "economia" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",            name: "The New York Times",       categoria: "internacional" },
  { url: "https://feeds.washingtonpost.com/rss/world",                         name: "The Washington Post",      categoria: "internacional" },
  { url: "https://www.theguardian.com/world/rss",                              name: "The Guardian",             categoria: "internacional" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml",                             name: "BBC News",                 categoria: "internacional" },
  { url: "http://rss.cnn.com/rss/edition.rss",                                name: "CNN International",        categoria: "internacional" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                         name: "Al Jazeera",               categoria: "internacional" },
  { url: "https://www.scmp.com/rss/91/feed",                                  name: "South China Morning Post", categoria: "internacional" },
  { url: "https://asia.nikkei.com/rss/feed/nar",                              name: "Nikkei Asia",              categoria: "economia" },
  { url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",  name: "El País",                  categoria: "internacional" },
  { url: "https://www.economist.com/rss.xml",                                  name: "The Economist",            categoria: "economia" },
  { url: "https://www.politico.com/rss/politicopicks.xml",                     name: "Politico",                 categoria: "internacional" },
  { url: "https://foreignpolicy.com/feed/",                                    name: "Foreign Policy",           categoria: "internacional" },
  { url: "https://api.axios.com/feed/",                                        name: "Axios",                    categoria: "internacional" },
  { url: "https://www.lemonde.fr/rss/une.xml",                                 name: "Le Monde",                 categoria: "internacional" },
];

async function handleArchiveOldRss(req, res) {
  const pass = String(req.query.pass || "");
  if (pass !== ADMIN_PASS) return res.status(401).json({ error: "unauthorized" });

  try {
    // 1. Arquivo todas as fontes existentes (active=false)
    const { error: archiveErr } = await supabase
      .from("rss_sources")
      .update({ active: false })
      .neq("active", false);

    if (archiveErr) return res.status(500).json({ ok: false, step: "archive", error: archiveErr.message });

    // 2. Verificar quais das 70 URLs já existem no banco
    const urls70 = FONTES_APROVADAS_70.map(f => f.url);
    const { data: existingRows } = await supabase
      .from("rss_sources")
      .select("url")
      .in("url", urls70);

    const existingUrls = new Set((existingRows || []).map(r => r.url));

    // 3. Reativar as que já existem
    if (existingUrls.size > 0) {
      const { error: updateErr } = await supabase
        .from("rss_sources")
        .update({ active: true })
        .in("url", [...existingUrls]);
      if (updateErr) return res.status(500).json({ ok: false, step: "update_existing", error: updateErr.message });
    }

    // 4. Inserir as que não existem ainda
    const toInsert = FONTES_APROVADAS_70
      .filter(f => !existingUrls.has(f.url))
      .map(f => ({ url: f.url, name: f.name, categoria: f.categoria, active: true }));

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from("rss_sources").insert(toInsert);
      if (insertErr) return res.status(500).json({ ok: false, step: "insert_new", error: insertErr.message });
    }

    return res.status(200).json({
      ok: true,
      arquivadas: "todas as fontes antigas marcadas como active=false",
      reativadas: existingUrls.size,
      inseridas: toInsert.length,
      total_aprovadas: FONTES_APROVADAS_70.length,
      fontes: FONTES_APROVADAS_70.map(f => f.name),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
