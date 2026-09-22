import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await sb
  .from("posts")
  .select("id,titulo,video_url,metrics")
  .not("metrics->instagram_reel_template", "is", null)
  .limit(250);

if (error) { console.log("ERRO:", error.message); process.exit(1); }

let total = 0, comLiveStream = 0, exhausted = 0, ready = 0, processing = 0, errorStatus = 0, pending = 0;
const stuck = [];
for (const p of data || []) {
  let m = {};
  try { m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : (p.metrics || {}); } catch (_) {}
  const t = m.instagram_reel_template;
  if (!t) continue;
  total++;
  if (t.status === "ready") ready++;
  else if (t.status === "processing") processing++;
  else if (t.status === "error") errorStatus++;
  else pending++;
  if (t.exhausted) exhausted++;
  if (String(t.source_url || "").includes("live_stream")) {
    comLiveStream++;
    stuck.push({
      id: p.id,
      titulo: p.titulo,
      status: t.status,
      attempts: t.attempts,
      exhausted: !!t.exhausted,
      source_url: t.source_url,
      queued_at: t.queued_at,
      failed_at: t.failed_at,
      video_url: p.video_url || null
    });
  }
}

console.log("=== RESUMO GERAL (templates de reel encontrados) ===");
console.log(JSON.stringify({ total, ready, processing, errorStatus, pending, exhausted, comLiveStream }, null, 2));
console.log("\n=== POSTS COM source_url QUEBRADO (live_stream) ===");
console.log(JSON.stringify(stuck, null, 2));
