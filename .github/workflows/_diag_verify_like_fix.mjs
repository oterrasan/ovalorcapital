// Diagnóstico único, 24/09/2026 — confirmar com dado real (não suposição)
// se o fix de retry na curtida (commit d422a62c) já teve efeito em algum
// evento real de collab desde o deploy.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

// deploy.yml pra d422a62c: completed_at real 2026-09-24T17:00:47Z (confirmado
// via API) — corte com folga de 1min.
const CUTOFF = "2026-09-24T17:01:00Z";

async function main() {
  const { data, error } = await supabase
    .from("logs")
    .select("created_at,level,message")
    .ilike("message", "%ig-collab%")
    .gte("created_at", CUTOFF)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) { console.log("ERRO:", error.message); return; }
  console.log(`Linhas [ig-collab*] desde ${CUTOFF}: ${data.length}`);
  if (!data.length) { console.log("Nenhum evento novo ainda desde o deploy."); return; }
  for (const row of data) {
    console.log(`${row.created_at} [${row.level}] ${row.message}`);
  }
}

main().then(() => console.log("DONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
