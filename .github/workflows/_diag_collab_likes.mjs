// Diagnóstico único, 24/09/2026 — Roberto: "@oterrasan aceita E curte
// automaticamente. os outros perfis (souabetaferreira, adriana.ferreirasp,
// amichelefroes) NUNCA curtiram automaticamente, só aceitam". Puxa os logs
// reais de [ig-collab-instant] (aceite instantâneo, publish()/publishReel())
// e [ig-collab] (aceite por polling, rede de segurança) pra ver o padrão
// real por perfil — accepted vs liked vs like_error — antes de mexer em
// qualquer código.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

async function main() {
  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("logs")
    .select("created_at,level,message")
    .ilike("message", "%ig-collab%")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) { console.log("ERRO:", error.message); return; }
  console.log(`Total de linhas [ig-collab*] nos últimos 10 dias: ${data.length}`);

  const porPerfil = {};
  for (const row of data) {
    const m = row.message.match(/@([a-zA-Z0-9_.]+)/);
    const user = m ? m[1] : "?";
    if (!porPerfil[user]) porPerfil[user] = { accepted_true: 0, accepted_false: 0, liked_true: 0, liked_false_no_error: 0, like_error_examples: [], accept_error_examples: [] };
    const p = porPerfil[user];
    if (/accepted=true/.test(row.message)) {
      p.accepted_true++;
      if (/\bliked\b/.test(row.message) && !/liked=false/.test(row.message)) {
        // formato do log: "accepted=true liked" quando curtiu, "accepted=true" sozinho quando não
        if (row.message.includes(" liked")) p.liked_true++;
        else { p.liked_false_no_error++; if (p.like_error_examples.length < 2) p.like_error_examples.push(row.message); }
      } else {
        p.liked_false_no_error++;
        if (p.like_error_examples.length < 2) p.like_error_examples.push(row.message);
      }
    } else if (/accepted=false/.test(row.message)) {
      p.accepted_false++;
      if (p.accept_error_examples.length < 2) p.accept_error_examples.push(row.message);
    }
  }

  console.log("\n=== RESUMO POR PERFIL ===");
  for (const [user, p] of Object.entries(porPerfil)) {
    console.log(`\n@${user}: accepted_true=${p.accepted_true} accepted_false=${p.accepted_false} liked_true=${p.liked_true} accepted_mas_sem_curtir=${p.liked_false_no_error}`);
    if (p.like_error_examples.length) console.log("  exemplos (accepted, sem 'liked' no texto):", p.like_error_examples);
    if (p.accept_error_examples.length) console.log("  exemplos de accepted=false:", p.accept_error_examples);
  }

  console.log("\n=== ÚLTIMAS 20 LINHAS BRUTAS (mais recentes primeiro) ===");
  for (const row of data.slice(0, 20)) {
    console.log(`${row.created_at} [${row.level}] ${row.message}`);
  }
}

main().then(() => console.log("\nDONE")).catch((e) => { console.log("FATAL:", e); process.exit(1); });
