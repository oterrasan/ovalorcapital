// Diagnóstico único, 25/09/2026 — Roberto: "esperei o dia todo, todas as
// contas aceitam mas NENHUMA curte, TEM ALGUM ERRO". O fix de retry
// (commit d422a62c, 24/09) precisa ser reavaliado com dado FRESCO de hoje
// — ontem só vi tentativas que batiam em rate-limit de accept antes de
// chegar na curtida. Hoje a cota da Meta já deve ter resetado.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

// commit d422a62c (fix de retry) foi deployado 2026-09-24T17:00:47Z
const CUTOFF = "2026-09-24T17:01:00Z";

async function main() {
  const { data, error } = await supabase
    .from("logs")
    .select("created_at,level,message")
    .ilike("message", "%ig-collab%")
    .gte("created_at", CUTOFF)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) { console.log("ERRO:", error.message); return; }
  console.log(`Total de linhas [ig-collab*] desde o deploy do fix (${CUTOFF}): ${data.length}`);

  const acceptedTrue = data.filter(r => /accepted=true/.test(r.message));
  const acceptedFalse = data.filter(r => /accepted=false/.test(r.message));
  console.log(`accepted=true: ${acceptedTrue.length} | accepted=false: ${acceptedFalse.length}`);

  console.log("\n=== TODAS AS LINHAS accepted=true (o que interessa de verdade) ===");
  for (const row of acceptedTrue) {
    console.log(`${row.created_at} [${row.level}] ${row.message}`);
  }

  if (!acceptedTrue.length) {
    console.log("\nNenhum accepted=true ainda desde o fix — sem isso não dá pra saber se a curtida funciona ou não.");
  }

  // Amostra de erros de accept (só pra contexto, não é o foco)
  console.log(`\n=== amostra de accepted=false (contexto, ${Math.min(5, acceptedFalse.length)} de ${acceptedFalse.length}) ===`);
  for (const row of acceptedFalse.slice(0, 5)) {
    console.log(`${row.created_at} ${row.message.slice(0, 200)}`);
  }
}

main().then(() => console.log("\nDONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
