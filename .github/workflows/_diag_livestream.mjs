import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await sb
  .from("posts")
  .select("id,titulo,video_url,status,created_at,updated_at,metrics")
  .ilike("titulo", "%Renner%")
  .order("created_at", { ascending: false })
  .limit(10);

if (error) { console.log("ERRO:", error.message); process.exit(1); }

console.log("=== POSTS COM 'Renner' NO TITULO ===");
for (const p of data || []) {
  let m = {};
  try { m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : (p.metrics || {}); } catch (_) {}
  console.log(JSON.stringify({
    id: p.id,
    titulo: p.titulo,
    post_status: p.status,
    created_at: p.created_at,
    updated_at: p.updated_at,
    video_url: p.video_url,
    reel_template: m.instagram_reel_template || null
  }, null, 2));
}
