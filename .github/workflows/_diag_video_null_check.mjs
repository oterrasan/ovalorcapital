// Comparação direta no banco: pega os posts reais mostrados nos prints do
// Roberto (Rick/helicóptero vs. dentista morto em Itu) e compara o
// source_url/kind gravado em metrics.instagram_reel_template — se forem
// idênticos, confirma 100% que o mesmo vídeo foi atribuído a matérias
// diferentes, sem precisar re-raspar a Bacci ao vivo.
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const r = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,video_url,metrics,published_at,updated_at&metrics->instagram_reel_template=not.is.null&order=published_at.desc&limit=500`,
  { headers: H }
);
const posts = await r.json();

const rows = (posts || []).map(p => {
  const t = p.metrics?.instagram_reel_template || {};
  return {
    id: p.id, titulo: p.titulo,
    published_at: p.published_at,
    queued_at: t.queued_at, ready_at: t.ready_at,
    status: t.status, source_kind: t.source_kind || null,
    source_url: t.source_url, video_url: p.video_url
  };
});

console.log("=== TODOS os posts com template de Reel — source_url completo ===");
console.log(JSON.stringify(rows, null, 2));

console.log("\n=== Contagem de source_url repetido entre posts DIFERENTES ===");
const contagem = {};
for (const row of rows) {
  if (!row.source_url) continue;
  (contagem[row.source_url] ||= []).push({ id: row.id, titulo: row.titulo });
}
const repetidos = Object.entries(contagem).filter(([, arr]) => arr.length > 1);
console.log(JSON.stringify(repetidos, null, 2));
console.log("\n🔴 source_url repetido entre posts diferentes:", repetidos.length > 0 ? "SIM, CONFIRMADO" : "não encontrado");
