// Diagnóstico único — deletar após uso. Testa uma chave Gemini nova de
// verdade (chamada real contra a API, mesmo modelo de produção) e só
// insere no Supabase config como GEMINI_API_KEY_3 se o teste passar — nunca
// insere uma chave morta às cegas. NUNCA imprime a chave em texto puro nos
// logs (só resultado sucesso/falha).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const GEMINI_MODEL = "gemini-flash-lite-latest"; // mesmo modelo usado em produção (core/ai_portal.js)

async function main() {
  const key = process.env.GEMINI_KEY_INPUT || "";
  if (!key) { console.log("Nenhuma chave recebida no input."); process.exit(1); }

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
    console.log(`FALHA no teste real — HTTP ${res.status}: ${d?.error?.message || "sem detalhe"}`);
    console.log("Chave NAO inserida no Supabase (teste falhou).");
    process.exit(0);
  }
  const texto = d?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log(`Chave respondeu com sucesso real (HTTP 200). Resposta: "${texto.trim().slice(0, 30)}"`);

  const { data: existing } = await supabase.from("config").select("key").eq("key", "GEMINI_API_KEY_3");
  if (existing && existing.length) {
    console.log("GEMINI_API_KEY_3 já existe no banco — não inserindo de novo (evita duplicata).");
    return;
  }
  const { error } = await supabase.from("config").insert({ key: "GEMINI_API_KEY_3", value: key });
  if (error) { console.log("ERRO ao inserir no Supabase:", error.message); process.exit(1); }
  console.log("✅ GEMINI_API_KEY_3 inserida com sucesso no Supabase config — já entra no rodízio (cache de 5min de core/ai_portal.js).");
}
main().catch((e) => { console.error("FALHA GERAL:", e.message); process.exit(1); });
