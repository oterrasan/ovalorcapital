// Diagnóstico único — deletar após uso. Roberto reportou que o status
// "amarelo" (processando/aguardando) fica travado por muito tempo há
// vários dias. Quantifica o backlog real agora: quantos reels estão
// pending/processing, idade de cada um.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("posts")
    .select("id,titulo,metrics,created_at")
    .not("metrics->instagram_reel_template", "is", null)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) { console.log("ERRO:", error.message); return; }

  const now = Date.now();
  const porStatus = {};
  const pendentesOuProcessando = [];
  for (const p of data || []) {
    const m = typeof p.metrics === "object" && p.metrics ? p.metrics : {};
    const t = m.instagram_reel_template || {};
    const status = t.exhausted ? "exhausted" : (t.status || "?");
    porStatus[status] = (porStatus[status] || 0) + 1;
    if (status === "pending" || status === "processing") {
      const ref = t.queued_at || t.processing_at || p.created_at;
      const idadeMin = Math.round((now - new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(ref) ? ref : ref + "Z").getTime()) / 60000);
      pendentesOuProcessando.push({ titulo: p.titulo, status, idadeMin, attempts: t.attempts || 0 });
    }
  }
  console.log("Distribuição por status (últimos 300 com template):", JSON.stringify(porStatus));
  pendentesOuProcessando.sort((a, b) => b.idadeMin - a.idadeMin);
  console.log(`\nTotal pending/processing agora: ${pendentesOuProcessando.length}`);
  console.log("Os 15 mais antigos:");
  pendentesOuProcessando.slice(0, 15).forEach((x) => {
    console.log(`  ${x.idadeMin}min | status:${x.status} | attempts:${x.attempts} | ${x.titulo?.slice(0, 60)}`);
  });
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
