// Diagnóstico único, 25/09/2026 — reteste real (13min depois, não segundos)
// confirmou: adriana.ferreirasp/souabetaferreira continuam falhando com o
// MESMO erro (code=100/subcode=33) mesmo bem depois do accept — isso
// derruba a hipótese de "propagação lenta" (o fix de retry de ontem não
// resolve e não vai resolver, porque não é questão de tempo). Testando
// agora se é diferença de ESCOPO/PERMISSÃO real no token de cada conta —
// via debug_token oficial da Meta, que devolve os scopes concedidos SEM
// nunca expor o valor do token em si.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);
const BASE = "https://graph.facebook.com/v25.0";

async function main() {
  const { data: accounts } = await supabase
    .from("ig_accounts")
    .select("id,username,ig_user_id,token")
    .in("username", ["oterrasan", "adriana.ferreirasp", "souabetaferreira"]);

  for (const acc of accounts || []) {
    if (!acc.token) { console.log(`${acc.username}: SEM TOKEN`); continue; }
    try {
      const params = new URLSearchParams({ input_token: acc.token, access_token: acc.token });
      const res = await fetch(`${BASE}/debug_token?${params}`);
      const data = await res.json();
      const info = data?.data;
      if (!info) {
        console.log(`${acc.username}: resposta sem data — ${JSON.stringify(data).slice(0, 300)}`);
        continue;
      }
      console.log(
        `${acc.username} | is_valid=${info.is_valid} | type=${info.type} | app_id=${info.app_id} | ` +
        `user_id=${info.user_id} | expires_at=${info.expires_at} | data_access_expires_at=${info.data_access_expires_at} | ` +
        `scopes=${JSON.stringify(info.scopes || [])}`
      );
      if (info.granular_scopes) {
        console.log(`  granular_scopes: ${JSON.stringify(info.granular_scopes)}`);
      }
    } catch (e) {
      console.log(`${acc.username}: ERRO na chamada — ${e?.message || String(e)}`);
    }
  }

  // Confirma também se ao menos essas 2 contas têm alguma permissão básica
  // de leitura funcionando — pra descartar token totalmente inválido/
  // revogado (o que já teria quebrado o accept, mas confirmando mesmo assim).
  console.log("\n=== Teste de leitura básica (fields=username) — confirma token vivo ===");
  for (const acc of accounts || []) {
    if (!acc.token || !acc.ig_user_id) continue;
    try {
      const res = await fetch(`${BASE}/${acc.ig_user_id}?fields=username&access_token=${encodeURIComponent(acc.token)}`);
      const data = await res.json();
      console.log(`${acc.username}: ${JSON.stringify(data)}`);
    } catch (e) {
      console.log(`${acc.username}: ERRO — ${e?.message || String(e)}`);
    }
  }
}

main().then(() => console.log("\nDONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
