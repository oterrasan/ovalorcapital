import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

function diaAtualBRT() {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}

const GEMINI_MODEL = "gemini-flash-lite-latest";
const hoje = diaAtualBRT();

// 1) Quantas chaves Gemini reais existem hoje no config
const wanted = ["GEMINI_API_KEY"];
for (let i = 2; i <= 20; i++) wanted.push(`GEMINI_API_KEY_${i}`);
const { data: keysRows } = await supabase.from("config").select("key,value").in("key", wanted);
const chaves = (keysRows || []).filter((r) => r.value);
console.log("CHAVES_GEMINI_CONFIGURADAS:", chaves.map((r) => r.key).join(", "));
console.log("TOTAL_CHAVES:", chaves.length);

// 2) Testa cada chave real, isolada, contra a API do Google (sem passar pelo nosso código)
for (const row of chaves) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${row.value}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "responda só a palavra: teste" }] }],
        generationConfig: { maxOutputTokens: 20 }
      })
    });
    const d = await res.json();
    if (res.ok) {
      console.log(`${row.key}: OK (200) — ${JSON.stringify(d.candidates?.[0]?.content?.parts?.[0]?.text || "").slice(0, 60)}`);
    } else {
      console.log(`${row.key}: ERRO ${res.status} — ${JSON.stringify(d.error || d).slice(0, 300)}`);
    }
  } catch (e) {
    console.log(`${row.key}: EXCECAO — ${String(e)}`);
  }
}

// 3) Contador de orçamento local de hoje (quantas tentativas reais já foram feitas)
const { count: orcamentoHoje } = await supabase
  .from("config")
  .select("key", { count: "exact", head: true })
  .like("key", `GEMINI_BUDGET_${hoje}_${GEMINI_MODEL}%`);
console.log("ORCAMENTO_LOCAL_HOJE:", orcamentoHoje);

// 4) Volume de posts publicados hoje (BRT) vs ontem, pra confirmar a queda real
async function contarPostsDoDia(diaYYYYMMDD) {
  const y = diaYYYYMMDD.slice(0, 4), m = diaYYYYMMDD.slice(4, 6), d = diaYYYYMMDD.slice(6, 8);
  const inicioBRT = new Date(`${y}-${m}-${d}T00:00:00-03:00`).toISOString();
  const fimBRT = new Date(`${y}-${m}-${d}T23:59:59.999-03:00`).toISOString();
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", inicioBRT)
    .lte("created_at", fimBRT);
  return count;
}
function ontemYYYYMMDD() {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}
console.log("POSTS_HOJE:", await contarPostsDoDia(hoje));
console.log("POSTS_ONTEM:", await contarPostsDoDia(ontemYYYYMMDD()));

// 5) Últimos erros reais de IA/Gemini nos logs de hoje à tarde em diante (>= 15h BRT)
const desde = new Date(`${hoje.slice(0,4)}-${hoje.slice(4,6)}-${hoje.slice(6,8)}T15:00:00-03:00`).toISOString();
const { data: logs, error: logsErr } = await supabase
  .from("logs")
  .select("level,message,created_at")
  .gte("created_at", desde)
  .or("message.ilike.%gemini%,message.ilike.%orçamento%,message.ilike.%orcamento%,message.ilike.%429%")
  .order("created_at", { ascending: false })
  .limit(20);
if (logsErr) console.log("ERRO_LOGS:", JSON.stringify(logsErr));
for (const l of logs || []) console.log(JSON.stringify({ level: l.level, msg: (l.message || "").slice(0, 220), at: l.created_at }));
