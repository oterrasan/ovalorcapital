// Diagnóstico único — deletar após uso. Confirma que GEMINI_API_KEY_3 foi
// inserida de verdade no Supabase (Roberto rodou o INSERT manualmente) e
// testa contra a API real do Gemini — a chave é lida DO BANCO aqui dentro
// do script, nunca passa por nenhum input/arquivo commitado (evita de novo
// o bloqueio do secret scanning do GitHub que já rejeitou o workflow_dispatch
// anterior). NUNCA imprime a chave inteira.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const GEMINI_MODEL = "gemini-flash-lite-latest"; // mesmo modelo de producao (core/ai_portal.js)

async function main() {
  const { data, error } = await supabase.from("config").select("key,value").eq("key", "GEMINI_API_KEY_3");
  if (error) { console.log("ERRO ao consultar Supabase:", error.message); return; }
  if (!data || !data.length) { console.log("GEMINI_API_KEY_3 NAO encontrada no Supabase config."); return; }
  if (data.length > 1) console.log(`ATENCAO: ${data.length} linhas com essa key (duplicata) — usando a primeira.`);
  const key = String(data[0].value || "");
  console.log(`GEMINI_API_KEY_3 encontrada — fingerprint=...${key.slice(-10)} | tamanho=${key.length}`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Responda apenas: OK" }] }],
      generationConfig: { maxOutputTokens: 10 }
    })
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.log(`TESTE FALHOU — HTTP ${res.status}: ${d?.error?.message || "sem detalhe"}`);
    return;
  }
  const texto = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log(`✅ TESTE REAL PASSOU — HTTP 200. Resposta do Gemini: "${texto.trim().slice(0, 40)}"`);
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
