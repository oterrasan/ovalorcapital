import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Limpeza dos 3 posts confirmados presos pra sempre com source_url igual
// ao placeholder "live_stream" do YouTube — video_url já é null pros três
// (não existe arquivo bruto real pra recuperar), então não há nada a
// perder: só remove o instagram_reel_template quebrado, liberando os
// slots de render que ele desperdiçaria até chegar em exhausted.
const IDS_QUEBRADOS = [
  "d2deb9a7-d797-448c-81d5-f98c6356ba01",
  "fd536d8d-798d-484a-b1a0-21e2d1cd1b78",
  "8cd605b4-6037-414e-af6e-4af59d066e1d"
];

for (const id of IDS_QUEBRADOS) {
  const { data: post, error: readErr } = await sb.from("posts").select("id,titulo,video_url,metrics").eq("id", id).maybeSingle();
  if (readErr || !post) { console.log("ERRO lendo", id, readErr?.message); continue; }
  let m = {};
  try { m = typeof post.metrics === "string" ? JSON.parse(post.metrics) : (post.metrics || {}); } catch (_) {}
  const sourceUrl = m.instagram_reel_template?.source_url || "";
  if (!sourceUrl.includes("live_stream")) {
    console.log("PULADO (source_url já não é mais o placeholder):", id, post.titulo);
    continue;
  }
  if (post.video_url) {
    console.log("PULADO POR SEGURANÇA (video_url não é null, não é o caso esperado):", id, post.titulo, post.video_url);
    continue;
  }
  delete m.instagram_reel_template;
  delete m.instagram_reel;
  const { error: writeErr } = await sb.from("posts").update({ metrics: m, updated_at: new Date().toISOString() }).eq("id", id);
  if (writeErr) { console.log("ERRO gravando", id, writeErr.message); continue; }
  console.log("LIMPO:", id, "-", post.titulo);
}

console.log("=== VERIFICAÇÃO FINAL ===");
const { data: verify } = await sb.from("posts").select("id,titulo,metrics").in("id", IDS_QUEBRADOS);
for (const p of verify || []) {
  let m = {};
  try { m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : (p.metrics || {}); } catch (_) {}
  console.log(p.id, "reel_template agora:", m.instagram_reel_template || null);
}
