// Busca DIRETA pelas duas matérias exatas dos prints do Roberto — não
// confiar em leitura manual de log. Se o video_url das duas for
// IDÊNTICO, é confirmação de 100%.
const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function buscar(padrao) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,comentario_fixado,video_url,metrics,published_at,updated_at&titulo=ilike.*${encodeURIComponent(padrao)}*&order=published_at.desc&limit=5`,
    { headers: H }
  );
  return r.json();
}

console.log("=== Buscando 'dentista' ===");
const dentista = await buscar("dentista");
console.log(JSON.stringify(dentista, null, 2));

console.log("\n=== Buscando 'liberado' + Rick (corpo liberado) ===");
const rLiberado = await fetch(
  `${SUPABASE_URL}/rest/v1/posts?select=id,titulo,comentario_fixado,video_url,metrics,published_at,updated_at&titulo=ilike.*liberado*&order=published_at.desc&limit=5`,
  { headers: H }
);
console.log(JSON.stringify(await rLiberado.json(), null, 2));

console.log("\n=== Buscando 'Itu' ===");
const itu = await buscar("Itu");
console.log(JSON.stringify(itu, null, 2));
