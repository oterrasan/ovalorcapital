// Diagnóstico único — deletar após uso. Roberto: "voce ja disse que teria
// feito isso ontem" — investigação confirmou que SIM, já existe código real
// (handleDispatchReelsWorkflow em api/manage.js, cron em vercel.json a cada
// 15min). Preciso saber, com dado real, se está de fato funcionando ou só
// falhando silenciosamente (ex: GH_DISPATCH_TOKEN ausente na Vercel).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("logs")
    .select("level,message,created_at")
    .ilike("message", "%reels-dispatch%")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) { console.log("ERRO ao consultar logs:", error.message); return; }
  console.log(`Total de logs [reels-dispatch] encontrados: ${data?.length || 0}`);
  (data || []).forEach((l) => console.log(`  ${l.created_at} | ${l.level} | ${l.message}`));

  // Teste direto: dispara agora mesmo e mostra a resposta real
  console.log("\n=== Chamando a action AGORA, ao vivo ===");
  const res = await fetch("https://www.ovalorcapital.com.br/api/manage?action=dispatch_reels_workflow&pass=ovc-admin-2026-secreto");
  const d = await res.json().catch(() => ({}));
  console.log("HTTP status:", res.status);
  console.log("Resposta:", JSON.stringify(d));
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
