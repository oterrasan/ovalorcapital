// Diagnóstico único, 24/09/2026 — depois do fix de @oterrasan aceitar
// collab automático só em Reels, confirmar (não suposição) se a conta
// @oterrasan tem token/ig_user_id ativo em ig_accounts — sem isso o fix
// de lógica está certo mas nunca vai ter efeito de verdade.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

async function main() {
  const { data, error } = await supabase
    .from("ig_accounts")
    .select("id,username,active,ig_user_id,token,updated_at")
    .ilike("username", "oterrasan");
  if (error) {
    console.log("ERRO:", error.message);
    return;
  }
  if (!data || !data.length) {
    console.log("RESULTADO: nenhuma linha pra 'oterrasan' em ig_accounts — conta NUNCA foi cadastrada.");
    return;
  }
  for (const row of data) {
    console.log(`RESULTADO: id=${row.id} username=${row.username} active=${row.active} ig_user_id=${row.ig_user_id ? "presente" : "AUSENTE"} token=${row.token ? "presente" : "AUSENTE"} updated_at=${row.updated_at}`);
  }
}

main().then(() => console.log("DONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
