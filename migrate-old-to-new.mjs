/**
 * migrate-old-to-new.mjs
 * Migra posts publicados do banco Supabase antigo (bfsegqdgscudtdgwdyci) para o novo (yntwvfcxjardzafdqanj)
 *
 * Executar localmente:
 *   node migrate-old-to-new.mjs
 *
 * Requisito: npm install @supabase/supabase-js  (no diretório do projeto)
 */

import { createClient } from "@supabase/supabase-js";

const OLD_URL = "https://bfsegqdgscudtdgwdyci.supabase.co";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2VncWRnc2N1ZHRkZ3dkeWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ0NjM1MiwiZXhwIjoyMDkxMDIyMzUyfQ.WmkHzK33qqtlvtal92WXVeyIE1DGRZOrw_pZtPGeV50";

const NEW_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";

const PAGE_SIZE = 500;

const oldDb = createClient(OLD_URL, OLD_KEY);
const newDb = createClient(NEW_URL, NEW_KEY);

async function main() {
  console.log("=== MIGRAÇÃO SUPABASE: banco antigo → novo ===\n");

  // 1. Contar total no banco antigo
  const { count: totalOld, error: countErr } = await oldDb
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  if (countErr) {
    console.error("❌ Erro ao conectar no banco ANTIGO:", countErr.message);
    console.log("O banco antigo pode estar inacessível. Verifique se a URL ainda funciona.");
    process.exit(1);
  }

  console.log(`📊 Banco antigo: ${totalOld} posts publicados`);

  // 2. Contar total no banco novo
  const { count: totalNew } = await newDb
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  console.log(`📊 Banco novo: ${totalNew} posts publicados`);
  console.log(`📊 Posts a migrar: ~${totalOld - totalNew}\n`);

  // 3. Buscar IDs já existentes no banco novo para não duplicar
  console.log("🔍 Carregando IDs existentes no banco novo...");
  const existingIds = new Set();
  let idPage = 0;
  while (true) {
    const { data: ids } = await newDb
      .from("posts")
      .select("id")
      .range(idPage * 1000, (idPage + 1) * 1000 - 1);
    if (!ids || ids.length === 0) break;
    ids.forEach(r => existingIds.add(r.id));
    if (ids.length < 1000) break;
    idPage++;
  }
  console.log(`✅ ${existingIds.size} IDs já existem no banco novo\n`);

  // 4. Migrar em páginas
  let page = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    console.log(`📥 Buscando página ${page + 1} (${from}–${to}) do banco antigo...`);
    const { data: posts, error: fetchErr } = await oldDb
      .from("posts")
      .select("*")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (fetchErr) {
      console.error(`❌ Erro ao buscar página ${page + 1}:`, fetchErr.message);
      break;
    }

    if (!posts || posts.length === 0) {
      console.log("✅ Todas as páginas processadas.");
      break;
    }

    // Filtrar posts que já existem no novo banco
    const novos = posts.filter(p => !existingIds.has(p.id));
    totalSkipped += posts.length - novos.length;

    if (novos.length === 0) {
      console.log(`  ⏭️  Página ${page + 1}: todos os ${posts.length} posts já existem — pulando`);
      page++;
      continue;
    }

    // Inserir no banco novo em lotes de 100
    for (let i = 0; i < novos.length; i += 100) {
      const lote = novos.slice(i, i + 100);
      const { error: insertErr } = await newDb.from("posts").upsert(lote, {
        onConflict: "id",
        ignoreDuplicates: true,
      });
      if (insertErr) {
        console.error(`  ❌ Erro ao inserir lote (${i}–${i + lote.length}):`, insertErr.message);
        totalErrors += lote.length;
      } else {
        totalInserted += lote.length;
        lote.forEach(p => existingIds.add(p.id));
      }
    }

    console.log(
      `  ✅ Página ${page + 1}: ${novos.length} inseridos, ${posts.length - novos.length} pulados (duplicados)`
    );

    page++;
    if (posts.length < PAGE_SIZE) break;
  }

  console.log("\n=== RESULTADO FINAL ===");
  console.log(`✅ Posts inseridos: ${totalInserted}`);
  console.log(`⏭️  Posts pulados (já existiam): ${totalSkipped}`);
  console.log(`❌ Erros: ${totalErrors}`);

  // 5. Verificar contagem final no novo banco
  const { count: finalCount } = await newDb
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado");

  console.log(`\n📊 Banco novo agora: ${finalCount} posts publicados`);
  console.log("🎉 Migração concluída!");
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
