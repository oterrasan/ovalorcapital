// Diagnóstico único — deletar após uso. Roberto quer saber quais dos 4
// projetos Google Cloud (Negocios/Economia/Politica/Default Gemini Project)
// estão de fato em operação — ou seja, quais chaves ele já colocou no
// Supabase config (GEMINI_API_KEY, GEMINI_API_KEY_2...20). Não expõe a
// chave inteira (mesmo padrão já usado no projeto — só um fingerprint, os
// últimos caracteres) — só o suficiente pra ele comparar com a página de
// cada projeto no AI Studio.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const wanted = ["GEMINI_API_KEY"];
  for (let i = 2; i <= 20; i++) wanted.push(`GEMINI_API_KEY_${i}`);
  const { data, error } = await supabase.from("config").select("key,value").in("key", wanted);
  if (error) { console.log("ERRO:", error.message); return; }
  const found = (data || []).sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  console.log(`Total de chaves Gemini configuradas em produção: ${found.length}`);
  for (const row of found) {
    const v = String(row.value || "");
    const fingerprint = v.length > 10 ? `...${v.slice(-10)}` : "(vazia/curta demais)";
    console.log(`${row.key}: fingerprint=${fingerprint} | tamanho=${v.length}`);
  }
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
