// Investigação mais funda: a hipótese "video_url nulo (Bacci/YouTube)"
// não bateu com dado real (0 casos). Agora: dos 29 templates reais (20
// ready, 9 error), quais READY nunca foram publicados de verdade, e por
// quê? Também checa o estado real da automação (REELS_AUTOMATION_ENABLED)
// e o motivo de cada erro.
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const rPosts = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,video_url,status,metrics,published_at,ig_account_id&metrics->instagram_reel_template=not.is.null&order=published_at.desc&limit=500`,
  { headers: H }
);
const posts = await rPosts.json();

const readyNaoPublicados = [];
const readyPublicados = [];
const erros = [];
for (const p of posts || []) {
  const t = p.metrics?.instagram_reel_template || {};
  const jaPublicado = !!(p.metrics?.instagram_reel?.ig_id) || !!p.ig_id;
  if (t.status === "ready") {
    const row = {
      id: p.id, titulo: p.titulo, status_post: p.status,
      video_url: (p.video_url || "").slice(0, 90),
      ig_account_id: p.ig_account_id,
      ready_at: t.ready_at, ig_creation_id: t.ig_creation_id,
      exhausted: !!t.exhausted, attempts: t.attempts
    };
    if (jaPublicado) readyPublicados.push(row); else readyNaoPublicados.push(row);
  } else if (t.status === "error") {
    erros.push({ id: p.id, titulo: p.titulo, attempts: t.attempts, exhausted: !!t.exhausted, last_error: t.last_error, failed_at: t.failed_at });
  }
}

console.log("=== READY já publicados (funcionou):", readyPublicados.length, "===");
console.log(JSON.stringify(readyPublicados, null, 2));
console.log("\n=== 🔴 READY mas NUNCA publicados (o backlog real):", readyNaoPublicados.length, "===");
console.log(JSON.stringify(readyNaoPublicados, null, 2));
console.log("\n=== ERROR (motivo de cada falha):", erros.length, "===");
console.log(JSON.stringify(erros, null, 2));

// Estado real da automação de Reels e do feed de imagem
const rConfig = await fetch(
  `${SUPABASE_URL}/rest/v1/config?select=key,value,updated_at&key=in.(REELS_AUTOMATION_ENABLED,REELS_AUTOMATION_LAST_RUN,IG_AUTOMATION_ENABLED)&order=updated_at.desc`,
  { headers: H }
);
console.log("\n=== Config real (automações) ===");
console.log(JSON.stringify(await rConfig.json(), null, 2));

// Contas Instagram ativas com distribuição automática
const rAccounts = await fetch(
  `${SUPABASE_URL}/rest/v1/ig_accounts?select=id,username,active,distribuicao_automatica&active=eq.true`,
  { headers: H }
);
console.log("\n=== Contas ativas ===");
console.log(JSON.stringify(await rAccounts.json(), null, 2));
