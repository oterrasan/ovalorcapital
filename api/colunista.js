import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function hashSenha(senha) {
  return crypto.createHash("sha256").update(senha + "ovc_salt_2026").digest("hex");
}

function gerarToken() {
  return crypto.randomBytes(32).toString("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = (req.method === "GET" ? req.query.action : req.body?.action) || "";

  try {
    if (action === "login") return await handleLogin(req, res);
    if (action === "list_posts") return await handleListPosts(req, res);
    if (action === "submit_post") return await handleSubmitPost(req, res);
    if (action === "list_colunistas") return await handleListColunistas(req, res);
    if (action === "create_colunista") return await handleCreateColunista(req, res);
    if (action === "toggle_colunista") return await handleToggleColunista(req, res);
    if (action === "delete_colunista") return await handleDeleteColunista(req, res);
    return res.status(400).json({ error: "acao_invalida" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function handleLogin(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: "email e senha obrigatórios" });

  const { data: colunista } = await supabase
    .from("colunistas")
    .select("id,nome,email,senha_hash,ativo")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!colunista) return res.status(401).json({ error: "Credenciais inválidas" });
  if (!colunista.ativo) return res.status(401).json({ error: "Conta inativa. Contate o administrador." });
  if (colunista.senha_hash !== hashSenha(senha)) return res.status(401).json({ error: "Credenciais inválidas" });

  const token = gerarToken();
  await supabase
    .from("colunistas")
    .update({ session_token: token, last_login: new Date().toISOString() })
    .eq("id", colunista.id);

  return res.status(200).json({ ok: true, token, colunista_id: colunista.id, nome: colunista.nome, email: colunista.email });
}

async function validarToken(colunista_id, token) {
  if (!colunista_id || !token) return null;
  const { data } = await supabase
    .from("colunistas")
    .select("id,nome,email,ativo")
    .eq("id", colunista_id)
    .eq("session_token", token)
    .eq("ativo", true)
    .single();
  return data || null;
}

async function handleListPosts(req, res) {
  const { colunista_id, token } = req.query;
  const colunista = await validarToken(colunista_id, token);
  if (!colunista) return res.status(401).json({ error: "Sessão inválida" });

  const { data } = await supabase
    .from("posts")
    .select("id,titulo,status,imagem,created_at,published_at,comentario_fixado")
    .eq("publish_method", "colunista")
    .contains("collaborators", JSON.stringify([colunista_id]))
    .order("created_at", { ascending: false })
    .limit(50);

  return res.status(200).json({ ok: true, posts: data || [] });
}

async function handleSubmitPost(req, res) {
  const { colunista_id, token, titulo, conteudo, imagem } = req.body || {};
  const colunista = await validarToken(colunista_id, token);
  if (!colunista) return res.status(401).json({ error: "Sessão inválida" });

  if (!titulo || !conteudo) return res.status(400).json({ error: "título e conteúdo obrigatórios" });
  if (titulo.length < 10) return res.status(400).json({ error: "Título muito curto" });
  if (conteudo.length < 200) return res.status(400).json({ error: "Conteúdo mínimo de 200 caracteres" });

  const hash = crypto.createHash("md5").update(titulo + colunista_id + Date.now()).digest("hex");
  const nomeSlug = colunista.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      titulo,
      conteudo,
      imagem: imagem || null,
      comentario_fixado: `Artigo de ${colunista.nome}`,
      hash,
      status: "pendente",
      approved: false,
      publish_method: "colunista",
      user_tags: JSON.stringify(["colunistas"]),
      subcategoria: colunista.nome,
      subcategoria_slug: nomeSlug,
      collaborators: JSON.stringify([colunista_id]),
      metrics: {},
      priority: 0,
      retry_count: 0,
      max_retries: 0
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, post_id: post.id, message: "Artigo enviado para revisão!" });
}

async function handleListColunistas(req, res) {
  const { data } = await supabase
    .from("colunistas")
    .select("id,nome,email,ativo,created_at,last_login")
    .order("nome");
  return res.status(200).json({ ok: true, colunistas: data || [] });
}

async function handleCreateColunista(req, res) {
  const { nome, email, senha } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ error: "nome, email e senha obrigatórios" });
  if (senha.length < 6) return res.status(400).json({ error: "Senha mínima de 6 caracteres" });

  const { error } = await supabase.from("colunistas").insert({
    nome: nome.trim(),
    email: email.toLowerCase().trim(),
    senha_hash: hashSenha(senha),
    ativo: true
  });

  if (error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ ok: true });
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
