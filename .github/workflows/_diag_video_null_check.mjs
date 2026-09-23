// Read-only: confirma se existe, agora, backlog real de posts com
// instagram_reel_template mas video_url NULO (Bacci/YouTube) — a
// hipótese concreta do bug antes de reportar qualquer coisa como
// resolvido.
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";

const r = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,video_url,status,metrics,published_at&metrics->instagram_reel_template=not.is.null&order=published_at.desc&limit=500`,
  { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
);
const posts = await r.json();
console.log("Total com instagram_reel_template:", Array.isArray(posts) ? posts.length : "ERRO: " + JSON.stringify(posts).slice(0, 300));

let comVideoUrlNulo = [];
let statusCount = {};
for (const p of posts || []) {
  const t = p.metrics?.instagram_reel_template || {};
  statusCount[t.status || "?"] = (statusCount[t.status || "?"] || 0) + 1;
  if (!p.video_url) {
    comVideoUrlNulo.push({
      id: p.id,
      titulo: p.titulo,
      status: t.status,
      source_kind: t.source_kind,
      ig_creation_id: t.ig_creation_id || null,
      ready_at: t.ready_at || null,
      already_published: !!(p.metrics?.instagram_reel?.ig_id)
    });
  }
}
console.log("\nDistribuição de status dos templates:", JSON.stringify(statusCount, null, 2));
console.log("\nPosts com video_url NULO mas template presente (total:", comVideoUrlNulo.length, "):");
console.log(JSON.stringify(comVideoUrlNulo, null, 2));

const readyNuncaPublicados = comVideoUrlNulo.filter(p => p.status === "ready" && !p.already_published);
console.log("\n🔴 READY, video_url null, NUNCA publicados (backlog real do bug):", readyNuncaPublicados.length);
