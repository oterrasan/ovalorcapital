// Correção de rota: a rodada anterior mostrou que 14 Reels JÁ publicaram
// com sucesso nesta mesma conta — não é permissão/capacidade da conta.
// A pergunta real agora é: o que os 9 que falharam (ProcessingFailedError
// ou outro erro) têm em comum, e o que os diferencia dos 14 que deram certo?
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: posts, error } = await sb
  .from("posts")
  .select("id,titulo,video_url,metrics")
  .not("metrics->instagram_reel_template", "is", null)
  .limit(500);
if (error) { console.log("ERRO:", error.message); process.exit(1); }

const failed = [];
const succeeded = [];
for (const p of posts) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics) : p.metrics;
  const t = m.instagram_reel_template;
  if (!t) continue;
  if (t.status === "error") failed.push({ p, t, published: !!m.instagram_reel });
  if (m.instagram_reel?.ig_id) succeeded.push({ p, t });
}

console.log("=== FALHARAM (status: error) —", failed.length, "===");
for (const { p, t } of failed) {
  console.log("-", p.id);
  console.log("  titulo:", p.titulo);
  console.log("  source_url:", t.source_url);
  console.log("  attempts:", t.attempts, "| exhausted:", t.exhausted);
  console.log("  last_error:", t.last_error);
  console.log("");
}

console.log("=== SUCESSO (Reel publicado de verdade) —", succeeded.length, "===");
for (const { p, t } of succeeded) {
  console.log("-", p.id, "| source_url:", t.source_url);
}
