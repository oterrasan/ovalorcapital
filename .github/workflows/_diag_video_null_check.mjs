// Limpeza real do post já afetado — "Corpo do cantor Rick é liberado e
// segue para velório em Sorocaba" (id 69d5be19-2c6c-44b0-bc3a-d4a410a01388)
// tinha gravado, ANTES do fix, o vídeo errado (do caso do dentista,
// confirmado real por hash sha256 idêntico). O fix novo previne casos
// futuros, mas não corrige dado já gravado — remove aqui o video_url e o
// template de Reel desse post especificamente, pra garantir que não
// publique com conteúdo errado. NÃO toca em nenhum outro post (o post do
// dentista tem o vídeo CORRETO — legitimamente sobre o próprio caso —
// confirmado pelo title do iframe bater com o assunto real).
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const POST_ID = "69d5be19-2c6c-44b0-bc3a-d4a410a01388";

console.log("=== ANTES ===");
const before = await (await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,titulo,video_url,metrics&id=eq.${POST_ID}`, { headers: H })).json();
console.log(JSON.stringify(before, null, 2));

const post = before[0];
if (!post) { console.log("🔴 POST NAO ENCONTRADO — nada feito, abortando"); process.exit(1); }
if (post.titulo !== "Corpo do cantor Rick é liberado e segue para velório em Sorocaba") {
  console.log("🔴 TITULO NAO BATE COM O ESPERADO — nada feito, abortando por segurança");
  process.exit(1);
}

const metrics = { ...(post.metrics || {}) };
delete metrics.instagram_reel_template;
delete metrics.instagram_reel;

const patch = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${POST_ID}`, {
  method: "PATCH",
  headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ video_url: null, metrics, updated_at: new Date().toISOString() })
});
console.log("\nPATCH status:", patch.status);
console.log(await patch.text());

console.log("\n=== DEPOIS ===");
const after = await (await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id,titulo,video_url,metrics&id=eq.${POST_ID}`, { headers: H })).json();
console.log(JSON.stringify(after, null, 2));
