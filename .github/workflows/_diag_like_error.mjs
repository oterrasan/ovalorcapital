// Diagnóstico único, 24/09/2026 — o erro real de likeMedia() nunca é
// gravado no log (só accepted=true/false aparece, "liked" ou nada — o
// erro em si fica só no objeto de retorno, que ninguém loga). Chama
// likeMedia() de verdade (código de produção, core/instagram.js) contra
// um media_id real que JÁ teve accept confirmado (accepted=true, sem
// "liked") pra ver o erro exato que a Meta devolve.
import { createClient } from "@supabase/supabase-js";
import { likeMedia } from "../../core/instagram.js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

// media=18179817478425677 @adriana.ferreirasp (feed) accepted=true, sem "liked" — log real, 24/09/2026
const MEDIA_ID = "18179817478425677";
const USERNAME = "adriana.ferreirasp";

async function main() {
  const { data: acc, error } = await supabase
    .from("ig_accounts")
    .select("id,username,active,ig_user_id,token")
    .ilike("username", USERNAME)
    .limit(1)
    .maybeSingle();
  if (error) { console.log("ERRO ao buscar conta:", error.message); return; }
  if (!acc) { console.log("Conta não encontrada:", USERNAME); return; }
  console.log(`Conta: id=${acc.id} active=${acc.active} ig_user_id=${acc.ig_user_id ? "presente" : "AUSENTE"} token=${acc.token ? "presente" : "AUSENTE"}`);

  try {
    const result = await likeMedia(MEDIA_ID, acc.id);
    console.log("SUCESSO (inesperado — já devia ter curtido antes):", JSON.stringify(result));
  } catch (e) {
    console.log("ERRO REAL da Meta ao curtir:", e?.message || String(e));
  }
}

main().then(() => console.log("DONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
