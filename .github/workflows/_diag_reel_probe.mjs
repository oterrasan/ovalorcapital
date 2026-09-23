// Segunda rodada de investigação — a primeira já descartou "é o
// encoding do vídeo": rodei o mesmo teste com 3 configurações de
// encoding diferentes (padrão, GOP fechado, level 5.1) em dias
// diferentes e a Meta devolveu o MESMO erro genérico idêntico nas 3.
// Se fosse mesmo um problema técnico do arquivo, mudar parâmetro de
// encoding deveria ter mudado alguma coisa — não mudou nada, nem uma
// vírgula na resposta. Isso desloca a suspeita pra permissão/capacidade
// da conta de publicar Reels via API (não do arquivo em si) — o feed de
// imagem funciona normalmente com a MESMA conta/token, então a pergunta
// real é: esse token tem de fato o escopo/capacidade específica de
// Reels, ou só de imagem?
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("=== 1) Algum Reel JÁ foi publicado com sucesso, alguma vez? ===");
const { data: posts, error } = await sb
  .from("posts")
  .select("id,titulo,metrics")
  .not("metrics->instagram_reel", "is", null)
  .limit(50);
if (error) { console.log("ERRO:", error.message); process.exit(1); }
console.log("Posts com metrics.instagram_reel (publicado com sucesso):", posts.length);
for (const p of posts.slice(0, 10)) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : p.metrics;
  console.log("-", p.id, p.titulo, "| ig_id:", m.instagram_reel?.ig_id, "| published_via:", m.instagram_reel?.published_via);
}

console.log("\n=== 2) Quantas tentativas reais de Reel já existem no total, e quantas falharam? ===");
const { data: allTemplates } = await sb
  .from("posts")
  .select("id,metrics")
  .not("metrics->instagram_reel_template", "is", null)
  .limit(500);
let statusCounts = {};
for (const p of allTemplates || []) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : p.metrics;
  const s = m.instagram_reel_template?.status || "?";
  statusCounts[s] = (statusCounts[s] || 0) + 1;
}
console.log("Distribuição de status:", JSON.stringify(statusCounts));

console.log("\n=== 3) Checando o TOKEN da conta ovalorcapital direto na Meta (debug_token) ===");
const { data: accounts } = await sb.from("ig_accounts").select("*").eq("username", "ovalorcapital").eq("active", true).limit(1);
const account = accounts?.[0];
if (!account?.token) { console.log("Conta ovalorcapital sem token."); process.exit(1); }
console.log("Conta:", account.username, "| ig_user_id:", account.ig_user_id, "| posts_hoje:", account.posts_hoje);

const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(account.token)}&access_token=${encodeURIComponent(account.token)}`);
const debugData = await debugRes.json();
// Nunca imprimir o token em si — só os campos derivados que a própria
// Meta devolve sobre ele (permissões, validade, app, escopos).
if (debugData?.data) {
  const d = debugData.data;
  console.log("app_id:", d.application, "| type:", d.type, "| is_valid:", d.is_valid);
  console.log("expires_at:", d.expires_at ? new Date(d.expires_at * 1000).toISOString() : d.expires_at);
  console.log("scopes concedidos:", JSON.stringify(d.scopes || d.granular_scopes || "(nenhum campo scopes/granular_scopes na resposta)"));
  console.log("resposta completa (sem o token):", JSON.stringify(d));
} else {
  console.log("Resposta do debug_token (sem 'data'):", JSON.stringify(debugData));
}

console.log("\n=== 4) Checando limite/elegibilidade de publicação (content_publishing_limit) ===");
const limitRes = await fetch(`https://graph.facebook.com/v21.0/${account.ig_user_id}/content_publishing_limit?fields=config,quota_usage&access_token=${encodeURIComponent(account.token)}`);
const limitData = await limitRes.json();
console.log(JSON.stringify(limitData));

console.log("\n=== 5) Checando o objeto da conta IG (fields de capacidade) ===");
const acctRes = await fetch(`https://graph.facebook.com/v21.0/${account.ig_user_id}?fields=id,username,name,ig_id,account_type&access_token=${encodeURIComponent(account.token)}`);
const acctData = await acctRes.json();
console.log(JSON.stringify(acctData));

console.log("\n=== FIM ===");
