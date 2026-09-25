// Diagnóstico único, 25/09/2026 — o fix de retry (2s/5s/10s) NÃO resolveu:
// dado fresco (log de ontem) mostra adriana.ferreirasp/souabetaferreira
// falhando 100% das vezes, sempre com o mesmo erro Meta code=100/subcode=33,
// mesmo com o retry já aplicado. Preciso distinguir duas hipóteses:
//
// (A) é só propagação MUITO mais lenta que 17s — se eu tentar de novo AGORA,
//     várias HORAS depois do accept original, deveria funcionar.
// (B) é um bloqueio estrutural/permanente daquela conta/token pra curtir
//     conteúdo que não é dela — nesse caso vai falhar com o MESMO erro,
//     mesmo horas depois.
//
// Testa direto contra a Meta, usando o mesmo likeMedia() de produção,
// sem simular nada.
import { likeMedia, getAccount } from "../../core/instagram.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

// media já aceito ontem por adriana e souabetaferreira, ambos falharam ao
// curtir com code=100/subcode=33 às 23:58:39 (adriana) e antes disso
// (souabetaferreira). oterrasan curtiu esse MESMO media com sucesso às
// 23:58:22 — serve de controle (deve continuar likeable pra ele).
const MEDIA_ID = "17903936358570963";

async function main() {
  console.log(`=== Metadado das contas (sem token) — comparar oterrasan vs os que falham ===`);
  const { data: accounts } = await supabase
    .from("ig_accounts")
    .select("id,username,active,ig_user_id,posts_hoje,ultima_atividade")
    .in("username", ["oterrasan", "souabetaferreira", "adriana.ferreirasp", "amichelefroes"]);
  for (const a of accounts || []) {
    console.log(`${a.username} | id=${a.id} | active=${a.active} | ig_user_id=${a.ig_user_id ? "presente" : "AUSENTE"} | posts_hoje=${a.posts_hoje} | ultima_atividade=${a.ultima_atividade}`);
  }

  console.log(`\n=== Reteste AGORA (horas depois do accept original) — media=${MEDIA_ID} ===`);
  for (const username of ["oterrasan", "adriana.ferreirasp", "souabetaferreira"]) {
    const acc = (accounts || []).find(a => a.username === username);
    if (!acc) { console.log(`${username}: conta não encontrada no metadado acima`); continue; }
    try {
      const result = await likeMedia(MEDIA_ID, acc.id);
      console.log(`${username}: SUCESSO AGORA — ${JSON.stringify(result)}`);
    } catch (e) {
      console.log(`${username}: FALHOU AGORA — ${e?.message || String(e)}`);
    }
  }
}

main().then(() => console.log("\nDONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
