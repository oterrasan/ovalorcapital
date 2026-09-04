// core/brasilonMirror.js
// DE-PARA direto OVC → Brasil ON — Roberto, 04/09/2026: "O correto seria
// simplesmente ter um DE-PARA. Tudo o que a categoria BRASIL ON postar no
// OVC, automaticamente posta no BRASIL ON também. isso resolve todos os
// problemas."
//
// Antes disso, o Brasil ON só recebia conteúdo via cron de sync
// (brasilon/api/manage.js, action=sync, a cada 20min, varrendo os últimos
// 72h) — funcional, mas com delay real (até 20min) e sujeito a ficar
// "preso" atrás de posts já carimbados se o topo da janela de busca
// estivesse cheio (foi exatamente essa 2ª causa que fez o Instagram do
// Brasil ON ficar quase 1h sem publicar nada nesta mesma sessão).
//
// Este módulo é chamado no MOMENTO EXATO em que o OVC publica um post nas
// categorias que o Brasil ON espelha (brasil-on/política/polícia/futebol)
// — insere direto em brasilon_posts, mesma tabela, mesmo Supabase, sem
// nenhuma chamada de rede entre os dois deploys Vercel (são bancos
// idênticos, só domínios diferentes). Zero delay: published_at do
// espelho é sempre "agora", nunca desatualizado.
//
// O cron de sync (brasilon/api/manage.js, action=sync) continua ativo
// como rede de segurança — pega qualquer coisa que escape do push direto
// (erro transiente de rede, deploy no meio de uma publicação, etc.).
// Nunca duplica: origem_post_id tem constraint unique real no schema de
// brasilon_posts (confirmado no comentário de handleSync em
// brasilon/api/manage.js), upsert com onConflict é seguro aqui —
// diferente do bug de upsert sem constraint já documentado pra tabela
// config em várias sessões deste projeto.
//
// Classificação: CÓPIA EXATA (mesma lógica, arquivo diferente por
// desenho — Brasil ON nunca importa código do OVC e vice-versa, ver
// brasilon/CLAUDE.md seção 2 "zero import cruzado") de classificar() em
// brasilon/api/manage.js. Se a regra de classificação mudar um dia,
// atualizar os DOIS lugares.
//
// Nunca lança exceção — 100% best-effort. Uma falha aqui jamais pode
// quebrar a publicação real de um post no OVC.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";

let _sb = null;
function sb() { return _sb || (_sb = createClient(SUPABASE_URL, SUPABASE_KEY)); }

const POLICIA_KW = [
  "polícia", "policial", "delegacia", "delegado", "preso em", "prisão de",
  "foi preso", "detido", "suspeito de", "flagrante", "assalto", "assaltou",
  "roubo", "roubou", "furto", "furtou", "homicídio", "assassinato",
  "assassinado", "tráfico de drogas", "operação policial",
  "investigação criminal", "sequestro", "chacina", "crime organizado",
  "facção", "tiroteio", "baleado", "esfaqueado", "estupro", "feminicídio",
  "corpo encontrado", "mandado de prisão"
];
function pareceCrimePolicial(titulo, resumo) {
  const texto = ((titulo || "") + " " + (resumo || "")).toLowerCase();
  return POLICIA_KW.some(kw => texto.includes(kw));
}

// Roberto, 26/08/2026: assinatura do Brasil ON é "BRASIL ON", nunca
// "Redação OVC" (herdado do corpo gerado pelos kernels do OVC).
function assinarBrasilOn(conteudo) {
  return String(conteudo || "").replace(/Reda[çc][ãa]o\s+OVC/gi, "BRASIL ON");
}

// user_tags no schema de posts é TEXT (JSON array) — pode chegar aqui já
// parseado (array) quando o caller monta um objeto sintético na hora, ou
// como string crua quando vem direto de uma linha do banco.
function classificar(post) {
  let tags = [];
  if (Array.isArray(post.user_tags)) tags = post.user_tags;
  else { try { tags = JSON.parse(post.user_tags || "[]"); } catch (_) {} }
  if (tags.includes("esportes") && post.subcategoria_slug === "futebol") return "futebol";
  if (tags.includes("politica")) return "politica";
  if (tags.includes("brasil-on")) {
    return pareceCrimePolicial(post.titulo, post.comentario_fixado) ? "policia" : "brasil-on";
  }
  return null;
}

// post: shape de uma linha da tabela posts (ou um objeto sintético com os
// mesmos campos) — id, titulo, conteudo, comentario_fixado, imagem,
// metrics (objeto, pode ter meta_title), user_tags, subcategoria_slug,
// created_at, published_at, updated_at.
export async function mirrorPostToBrasilOn(post) {
  try {
    if (!post?.id || !post?.titulo || !post?.conteudo) return;
    const categoria = classificar(post);
    if (!categoria) return;
    const nowIso = new Date().toISOString();
    const row = {
      origem_post_id: post.id,
      categoria,
      titulo: post.titulo,
      conteudo: assinarBrasilOn(post.conteudo),
      comentario_fixado: post.comentario_fixado || "",
      meta_title: (post.metrics && post.metrics.meta_title) || post.titulo,
      imagem: post.imagem || "",
      status: "publicado",
      created_at: post.created_at || nowIso,
      published_at: post.published_at || nowIso,
      updated_at: post.updated_at || post.published_at || nowIso
    };
    await sb().from("brasilon_posts").upsert(row, { onConflict: "origem_post_id" });
  } catch (_) {
    // best-effort — nunca pode quebrar a publicação real no OVC. O cron
    // de sync (brasilon/api/manage.js, action=sync) pega o que escapar.
  }
}
