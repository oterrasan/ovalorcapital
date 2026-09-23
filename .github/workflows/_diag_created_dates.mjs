// Roberto contesta: diz que só 3-4 vídeos foram capturados HOJE, o resto
// (dos 26 que reportei) seria coisa velha de ontem/antes. Verificar com
// dado real — created_at de cada post, agrupado por dia BRT (UTC-3).
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,created_at,updated_at,metrics&metrics->instagram_reel_template=not.is.null&order=created_at.desc&limit=500`,
  { headers: H }
);
const posts = await res.json();
console.log("Total real com template de Reel:", Array.isArray(posts) ? posts.length : JSON.stringify(posts));

function brtDay(iso) {
  // mesmo padrão já usado no projeto (toUtcISO): string sem timezone = UTC
  const d = new Date(/[Z+-]\d{0,2}:?\d{0,2}$/.test(iso) ? iso : iso + "Z");
  const brt = new Date(d.getTime() - 3 * 3600 * 1000);
  return brt.toISOString().slice(0, 10);
}

const byDay = {};
const byDayStatus = {};
for (const p of posts) {
  const day = brtDay(p.created_at);
  const status = p.metrics?.instagram_reel_template?.status || "?";
  byDay[day] = (byDay[day] || 0) + 1;
  byDayStatus[day] = byDayStatus[day] || {};
  byDayStatus[day][status] = (byDayStatus[day][status] || 0) + 1;
}
console.log("\nDistribuição REAL por dia BRT (created_at):", JSON.stringify(byDay, null, 2));
console.log("\nDistribuição por dia BRT x status (Roberto pergunta especificamente: quantos 'ready' HOJE):");
console.log(JSON.stringify(byDayStatus, null, 2));

console.log("\nLista completa, mais recente primeiro:");
for (const p of posts) {
  const t = p.metrics?.instagram_reel_template || {};
  console.log(`- [${brtDay(p.created_at)}] ${p.titulo} | status:${t.status} | created_at:${p.created_at}`);
}
