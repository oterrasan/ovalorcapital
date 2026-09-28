import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

function diaBRT(offset = 0) {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000 - offset * 24 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}
const hoje = diaBRT(0), ontem = diaBRT(1);
const inicioHoje = `${hoje}T00:00:00-03:00`;
const inicioOntem = `${ontem}T00:00:00-03:00`;
const fimOntem = `${ontem}T23:59:59-03:00`;

// Sucessos reais por canal (log "info" de sucesso), hoje vs ontem — a fonte
// mais confiável, já que autoMaterias/autoBrasilOn/etc só logam em sucesso
// (a "resumo da rodada" só existe em outros-esportes-jornal/futebol-jornal).
async function contarLog(padrao, desde, ate) {
  let q = supabase.from("logs").select("id", { count: "exact", head: true }).ilike("message", padrao).gte("created_at", desde);
  if (ate) q = q.lte("created_at", ate);
  const { count } = await q;
  return count || 0;
}

const canais = [
  ["[materias] gerado", "%[materias] gerado%"],
  ["[brasilon]", "%[brasilon]%"],
  ["[jovempan", "%[jovempan%"],
  ["[internacional]", "%[internacional]%"],
  ["[fofocas]", "%[fofocas]%"],
  ["[futebol-jornal]", "%[futebol-jornal]%"],
  ["[outros-esportes-jornal]", "%[outros-esportes-jornal]%"],
  ["[link-manual] ou reescrita por link", "%link%manual%"]
];
console.log("--- LOGS HOJE (desde 00:00 BRT) vs ONTEM (dia inteiro) ---");
for (const [nome, padrao] of canais) {
  const h = await contarLog(padrao, inicioHoje, null);
  const o = await contarLog(padrao, inicioOntem, fimOntem);
  console.log(`${nome}: hoje=${h} ontem=${o}`);
}

// Total de linhas "429" hoje, sem filtro de canal, pra bater com o
// ORCAMENTO_LOCAL_HOJE já visto (5002) e achar quem realmente gerou o volume
const total429Hoje = await contarLog("%gemini 429%", inicioHoje, null);
const totalOrcamentoEsgotadoHoje = await contarLog("%orçamento di%rio do gemini esgotado%", inicioHoje, null);
console.log("TOTAL_429_REAL_HOJE(logado):", total429Hoje, "TOTAL_ORCAMENTO_INTERNO_ESGOTADO_HOJE(logado):", totalOrcamentoEsgotadoHoje);

// Quantas linhas de log NO TOTAL hoje (qualquer nivel/mensagem) — pra saber
// se o volume de 429 logado bate com o contador GEMINI_BUDGET_* (5002) ou
// se a maioria dos 429 reais simplesmente NUNCA vira log (autoMateria etc.
// só loga sucesso, não falha, no formato atual)
const { count: totalLogsHoje } = await supabase.from("logs").select("id", { count: "exact", head: true }).gte("created_at", inicioHoje);
console.log("TOTAL_LINHAS_DE_LOG_HOJE (qualquer msg):", totalLogsHoje);

// posts publicados hoje, agrupados por publish_method real (fonte da verdade,
// evita minha suposição errada anterior de que materias = publish_method='portal')
const { data: postsHoje } = await supabase.from("posts").select("publish_method").gte("created_at", inicioHoje).limit(1000);
const porMetodo = {};
(postsHoje || []).forEach(p => { const k = p.publish_method || "(vazio)"; porMetodo[k] = (porMetodo[k] || 0) + 1; });
console.log("POSTS_HOJE_POR_PUBLISH_METHOD:", JSON.stringify(porMetodo));

const { data: postsOntem } = await supabase.from("posts").select("publish_method").gte("created_at", inicioOntem).lte("created_at", fimOntem).limit(1000);
const porMetodoOntem = {};
(postsOntem || []).forEach(p => { const k = p.publish_method || "(vazio)"; porMetodoOntem[k] = (porMetodoOntem[k] || 0) + 1; });
console.log("POSTS_ONTEM_POR_PUBLISH_METHOD:", JSON.stringify(porMetodoOntem));
