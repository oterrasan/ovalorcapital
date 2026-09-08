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
//
// 🔴 08/09/2026 — CAUSA RAIZ REAL de o mirror nunca ter gravado nada:
// a afirmação anterior deste comentário ("origem_post_id tem constraint
// unique real") estava ERRADA — nunca foi confirmada com dado real, só
// assumida. Testado ao vivo contra o Supabase: `.upsert(row,
// {onConflict:"origem_post_id"})` sempre retorna
// `{"code":"42P10","message":"there is no unique or exclusion constraint
// matching the ON CONFLICT specification"}` (HTTP 400) — MESMA classe de
// bug já documentada extensivamente pra tabela `config` (coluna `key`
// sem constraint unique). O `try/catch` best-effort engolia esse erro
// silenciosamente, 100% das chamadas, desde a criação deste arquivo —
// todo o histórico real de posts em `brasilon_posts` sempre veio do cron
// de sync, nunca deste caminho direto.
//
// FIX: select-then-update-or-insert (mesmo padrão seguro já usado no
// projeto pra `config` e pra `_salvarPesquisa`) — nunca mais depender de
// `ON CONFLICT` numa coluna sem constraint unique CONFIRMADA com dado
// real (nunca assumir/comentar que existe sem testar).
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
// 08/09/2026 — "giro" adicionada aqui em sincronia com a cópia real em
// brasilon/api/manage.js (Roberto pediu explicitamente que Giro fosse
// integrada ao Brasil ON — antes dessa data nunca era espelhada).
function classificar(post) {
  let tags = [];
  if (Array.isArray(post.user_tags)) tags = post.user_tags;
  else { try { tags = JSON.parse(post.user_tags || "[]"); } catch (_) {} }
  if (tags.includes("esportes") && post.subcategoria_slug === "futebol") return "futebol";
  if (tags.includes("giro")) return "giro";
  if (tags.includes("politica")) return "politica";
  if (tags.includes("brasil-on")) {
    return pareceCrimePolicial(post.titulo, post.comentario_fixado) ? "policia" : "brasil-on";
  }
  return null;
}

// Grava uma linha em brasilon_posts sem depender de ON CONFLICT (ver
// comentário acima — origem_post_id NÃO tem constraint unique real).
// Sempre confere se já existe uma linha com esse origem_post_id: se sim,
// UPDATE; senão, INSERT. Nunca duplica, nunca lança (a única exceção
// tratada é 42703 — coluna video_url ainda não existe em brasilon_posts —
// que refaz a escrita sem esse campo).
async function _writeRow(row) {
  const { data: existing } = await sb()
    .from("brasilon_posts")
    .select("id")
    .eq("origem_post_id", row.origem_post_id)
    .limit(1);
  let error;
  if (existing && existing.length) {
    ({ error } = await sb().from("brasilon_posts").update(row).eq("origem_post_id", row.origem_post_id));
  } else {
    ({ error } = await sb().from("brasilon_posts").insert(row));
  }
  if (error && error.code === "42703" && "video_url" in row) {
    const { video_url, ...semVideo } = row;
    await _writeRow(semVideo);
  }
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
    // 07/09/2026 — vídeo (Roberto: "construa a automacao dos videos") —
    // espelha video_url também, pra Brasil ON poder gerar Reel a partir do
    // mesmo vídeo do OVC. brasilon_posts ainda PODE não ter essa coluna
    // (mesma migração manual de video_url que posts já recebeu, no
    // Supabase, ainda pendente pra brasilon_posts) — tenta com o campo, e
    // se o Postgres reclamar de coluna inexistente (42703), refaz sem ele.
    // Zero coordenação necessária: assim que a coluna existir, passa a
    // funcionar sozinho, sem precisar tocar em código de novo.
    if (post.video_url) row.video_url = post.video_url;
    await _writeRow(row);
  } catch (_) {
    // best-effort — nunca pode quebrar a publicação real no OVC. O cron
    // de sync (brasilon/api/manage.js, action=sync) pega o que escapar.
  }
}
