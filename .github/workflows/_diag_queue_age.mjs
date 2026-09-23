// Diagnóstico real: Roberto reclamou que o pipeline (captura → publica no
// portal → Reel pronto → publica Instagram → apaga vídeo) está levando até
// 48h, quando devia levar no máximo 10min. Antes de propor qualquer fix,
// medir com dado real: idade de cada template de Reel ainda não resolvido
// (pending/processing), quantos "attempts" já gastou, e a idade real do
// post em si (created_at) até agora.
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,created_at,updated_at,metrics&metrics->instagram_reel_template=not.is.null&order=updated_at.asc&limit=500`,
  { headers: H }
);
const posts = await res.json();
console.log("Total de posts com template de Reel:", Array.isArray(posts) ? posts.length : JSON.stringify(posts));

const now = Date.now();
const byStatus = {};
const pendingOrProcessing = [];
for (const p of posts) {
  const t = p.metrics?.instagram_reel_template || {};
  byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  if (["pending", "processing"].includes(t.status)) {
    const createdAgeH = ((now - new Date(p.created_at + "Z").getTime()) / 3600000).toFixed(1);
    const queuedAt = t.queued_at || t.processing_at;
    const queuedAgeH = queuedAt ? ((now - new Date(queuedAt).getTime()) / 3600000).toFixed(1) : "?";
    pendingOrProcessing.push({ titulo: p.titulo, status: t.status, attempts: t.attempts, created_age_h: createdAgeH, queued_age_h: queuedAgeH });
  }
}
console.log("\nDistribuição por status:", JSON.stringify(byStatus, null, 2));
console.log("\nFila real (pending/processing), da mais antiga pra mais nova:");
pendingOrProcessing.sort((a, b) => Number(b.created_age_h) - Number(a.created_age_h));
for (const x of pendingOrProcessing) console.log(JSON.stringify(x));
console.log("\nTamanho real da fila agora:", pendingOrProcessing.length);

// Config real do BOn de intervalo/limite/janela
const cfgRes = await fetch(
  `${SUPABASE_URL}/rest/v1/config?select=key,value,updated_at&key=in.(REELS_AUTOMATION_ENABLED,REELS_AUTOMATION_LAST_RUN,IG_AUTOMATION_ENABLED)`,
  { headers: H }
);
console.log("\nConfig real:", JSON.stringify(await cfgRes.json(), null, 2));
