import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

function diaAtualBRT() {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}
const hoje = diaAtualBRT();
const y = hoje.slice(0,4), m = hoje.slice(4,6), d = hoje.slice(6,8);
const inicioHojeBRT = new Date(`${y}-${m}-${d}T00:00:00-03:00`).toISOString();

// 1) Primeira ocorrência REAL de 429/orçamento esgotado hoje (não filtrado por hora)
const { data: logsGemini } = await supabase
  .from("logs")
  .select("level,message,created_at")
  .gte("created_at", inicioHojeBRT)
  .or("message.ilike.%gemini 429%,message.ilike.%orçamento diário do gemini esgotado%,message.ilike.%orcamento diario do gemini esgotado%")
  .order("created_at", { ascending: true })
  .limit(1);
console.log("PRIMEIRA_FALHA_GEMINI_HOJE:", JSON.stringify(logsGemini?.[0] || null));

// 2) Todas as linhas de resumo de rodada hoje, agrupadas por canal (prefixo [xxx])
const { data: resumos } = await supabase
  .from("logs")
  .select("message,created_at")
  .gte("created_at", inicioHojeBRT)
  .ilike("message", "%resumo da rodada%")
  .order("created_at", { ascending: true });

const porCanal = {};
for (const l of resumos || []) {
  const m2 = String(l.message || "").match(/^\[([a-z0-9_-]+)\]/i);
  const canal = m2 ? m2[1] : "desconhecido";
  if (!porCanal[canal]) porCanal[canal] = { rodadas: 0, gerados: 0, falhasGeminiReal: 0, falhasOrcamentoInterno: 0, outrasFalhas: 0 };
  porCanal[canal].rodadas++;
  const gm = l.message.match(/gerados:(\d+)/);
  if (gm) porCanal[canal].gerados += Number(gm[1]);
  // conta quantos itens falharam por 429 real vs pelo nosso gate interno vs outro motivo,
  // somando os números entre aspas de cada motivo dentro do JSON de falhas
  const falhasMatch = l.message.match(/falhas:(\{.*\})\s*$/);
  if (falhasMatch) {
    try {
      // o JSON pode vir truncado (log cortado em 220 chars às vezes) — tenta parsear, senão soma na marra via regex
      const bruto = falhasMatch[1];
      const pares = [...bruto.matchAll(/"([^"]+)":(\d+)/g)];
      for (const [, motivo, qtd] of pares) {
        const n = Number(qtd);
        if (/gemini 429/i.test(motivo)) porCanal[canal].falhasGeminiReal += n;
        else if (/orçamento di[aá]rio do gemini esgotado|orcamento di[aá]rio do gemini esgotado/i.test(motivo)) porCanal[canal].falhasOrcamentoInterno += n;
        else porCanal[canal].outrasFalhas += n;
      }
    } catch (_) {}
  }
}
console.log("CONSUMO_POR_CANAL_HOJE:", JSON.stringify(porCanal, null, 0));

// 3) Volume de captura de link (link_manual) hoje — feature nova de 25-26/09
const { count: linkManualHoje } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true })
  .eq("publish_method", "link_manual")
  .gte("created_at", inicioHojeBRT);
console.log("POSTS_LINK_MANUAL_HOJE:", linkManualHoje);

// 4) Mesma métrica só de ontem, pra comparar (se a tabela guardar log de ontem)
function diaAnteriorYYYYMMDD(offsetDias) {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000 - offsetDias * 24 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}
const ontem = diaAnteriorYYYYMMDD(1);
const oy = ontem.slice(0,4), om = ontem.slice(4,6), od = ontem.slice(6,8);
const inicioOntemBRT = new Date(`${oy}-${om}-${od}T00:00:00-03:00`).toISOString();
const fimOntemBRT = new Date(`${oy}-${om}-${od}T23:59:59-03:00`).toISOString();
const { count: linkManualOntem } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true })
  .eq("publish_method", "link_manual")
  .gte("created_at", inicioOntemBRT)
  .lte("created_at", fimOntemBRT);
console.log("POSTS_LINK_MANUAL_ONTEM:", linkManualOntem);

// 5) Volume real de materias (pipeline geral) hoje vs ontem, pra ver se especificamente
// esse canal (o que Roberto quer que gere 300+/dia) caiu mais que o resto
const { count: materiasHoje } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true })
  .eq("publish_method", "portal")
  .gte("created_at", inicioHojeBRT);
const { count: materiasOntem } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true })
  .eq("publish_method", "portal")
  .gte("created_at", inicioOntemBRT)
  .lte("created_at", fimOntemBRT);
console.log("MATERIAS_PORTAL_HOJE:", materiasHoje, "MATERIAS_PORTAL_ONTEM:", materiasOntem);
