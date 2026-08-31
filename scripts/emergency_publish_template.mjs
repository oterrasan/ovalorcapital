// scripts/emergency_publish_template.mjs
//
// DISPOSITIVO DE PUBLICAÇÃO DE EMERGÊNCIA — criado 11/08/2026 a pedido de
// Roberto Terrasan: "PRECISO QUE VOCE CRIE UM DISPOSITIVO DE PUBLICACOES
// COMO ESTA DE AGORA, QUANDO EU SOLICITAR A NIVEL DE EMERGENCIA. EU DOU O
// TEMA, SEMPRE COM UM ASSUNTO QUE JÁ SEI QUE É REAL, VOCE PROCURA E POSTA."
//
// Este arquivo é um TEMPLATE — não roda sozinho no Vercel, não é uma rota de
// API (não conta pra Regra Zero-A). É o script que a próxima sessão do
// Claude cola dentro de um workflow one-off do GitHub Actions (mesmo padrão
// .github/workflows/diag-*.yml usado a sessão inteira de 11/08/2026 — nunca
// vira PR permanente, sempre criado, rodado via push numa branch claude/*,
// e deletado depois de confirmar o resultado).
//
// ═══════════════════════════════════════════════════════════════════════
// COMO USAR NA PRÓXIMA EMERGÊNCIA
// ═══════════════════════════════════════════════════════════════════════
// 1. Roberto dá o TEMA — ele já confirma que é real, mas AINDA ASSIM
//    confirme com WebSearch em 2+ fontes confiáveis antes de escrever
//    qualquer coisa. Nunca publique só com base na palavra dele — ele quer
//    que você vá atrás dos fatos, não que aceite sem checar.
// 2. Preencha a seção CONFIG abaixo com os fatos apurados.
// 3. Cole o conteúdo final (com CONFIG preenchido) dentro de um workflow
//    one-off, ex:
//      cat > $GITHUB_WORKSPACE/emergency.mjs << 'EOF'
//      ...conteúdo deste arquivo com CONFIG preenchido...
//      EOF
//      node $GITHUB_WORKSPACE/emergency.mjs
//    (ver qualquer .github/workflows/diag-*.yml antigo no histórico de
//    commits desta sessão como referência de estrutura do workflow)
// 4. Rode o workflow (push numa branch claude/*, poll via actions_list +
//    get_job_logs até completar).
// 5. Confirme o resultado nos logs e DELETE o workflow one-off — só este
//    arquivo TEMPLATE fica permanente no repo.
//
// ═══════════════════════════════════════════════════════════════════════
// REGRA DE PUBLICAÇÃO — Roberto, 11/08/2026: "SE TIVER COMO PEGAR IMAGEM
// REAL, SEM ERRO, PUBLICA DIRETO"
// ═══════════════════════════════════════════════════════════════════════
// - COM imagem real da fonte, processada sem erro → publica DIRETO
//   (status: publicado, approved: true, published_at: agora). Não passa
//   pela fila de aprovação.
// - SEM imagem (fonte não tem og:image válida, ou processAndSaveImage()
//   falha) → cai como PENDENTE (status: pendente, approved: false) — igual
//   ao resto do pipeline (Regra Zero-D, Staging Protocol). Avise o Roberto
//   que ficou pendente por falta de imagem, pra ele decidir se aprova sem
//   foto ou espera outra fonte com imagem.
// Esta regra NUNCA foi estendida pro pipeline automático normal — só se
// aplica a este dispositivo de emergência, sob pedido explícito dele.
//
// ═══════════════════════════════════════════════════════════════════════
// DUAS TENTATIVAS DE ESCRITA — tenta a IA real primeiro, cai pra Claude
// escrever direto se a chave estiver fora do ar
// ═══════════════════════════════════════════════════════════════════════
// TENTATIVA 1 (preferível, mais rápida) — usar o pipeline real: importar o
// handler default de api/run_portal.js e chamar com
// { method:"POST", body:{ url, categoria, force:true } } — isso aciona
// manual() → scrape() + rewritePortal() (MASTER_PROMPT protegido, sem
// alterar nada) + validar(). Só funciona se:
//   a) scrape() da fonte conseguir ≥300 chars de texto, e
//   b) o Gemini estiver respondendo (ver CAVEATS abaixo — 31/08/2026: é o
//      ÚNICO motor de IA do sistema, sem nenhum fallback pra outro
//      provedor — Roberto: "as outras nem usamos mais", ver
//      IA_KEYS_POLICY.md).
//
// TENTATIVA 2 (fallback manual) — se a Tentativa 1 falhar por causa do
// Gemini fora do ar, Claude escreve o texto diretamente,
// seguindo à risca as regras do MASTER_PROMPT V8.0 (não é preciso importar
// nada do prompt — só seguir as mesmas regras manualmente):
//   - Voz Reuters em português, lead direto no primeiro parágrafo
//   - TODA declaração/fato atribuído: "segundo X", "de acordo com Y"
//   - Nunca afirmar crime sem condenação; nunca inventar perícia, reação,
//     declaração não confirmada na fonte
//   - Nunca citar o nome de veículo concorrente no corpo do texto
//   - Mínimo 8 parágrafos, mínimo ~2000 caracteres de texto puro (sem tags)
//   - HTML puro, <p> por parágrafo, nunca markdown
//   - Zero termos de "cheiro de IA" (ver lista VICIO_IA em api/run_portal.js
//     linha ~30 — vale ressaltar, cabe destacar, nesse sentido, em suma,
//     robusto, ecossistema, disruptivo, sinergia, nova era, etc.)
//   - Último parágrafo é um FATO seco — nunca conclusão, moral ou previsão
// Depois insere direto no Supabase com o MESMO schema que inserir()/
// manual() usam em api/run_portal.js — replicado abaixo, já testado e
// funcionando (usado de verdade em 11/08/2026 pra matéria real sobre o
// ônibus do São Paulo apreendido na Bolívia).
//
// ═══════════════════════════════════════════════════════════════════════
// CAVEATS CONHECIDOS — confira se ainda procedem antes de cada emergência
// (podem ter sido corrigidos por sessão futura)
// ═══════════════════════════════════════════════════════════════════════
// - 31/08/2026 — Gemini é o ÚNICO motor de IA do sistema (Roberto removeu
//   OpenAI e Groq por completo — "as outras nem usamos mais"). Se o Gemini
//   falhar (cota diária esgotada, modelo descontinuado pelo Google como já
//   aconteceu em 15-16/08/2026 com o "gemini-2.0-flash", etc.), a Tentativa
//   1 propaga o erro sem cair em nenhum fallback automático — vá direto pra
//   Tentativa 2 (Claude escreve manualmente). NÃO mude o nome do modelo em
//   core/ai_portal.js sem autorização explícita de Roberto (mesmo espírito
//   da Regra Zero-B — parâmetros de IA são sensíveis) e nunca testando até
//   exaurir a cota real, não só 1-2 chamadas de sucesso — ver
//   IA_KEYS_POLICY.md pro histórico completo dessa lição.
//
// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE — TENTATIVA 2 (fallback manual), já testado e funcionando
// ═══════════════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "/home/runner/work/ovalorcapital/ovalorcapital/core/scraper.js";
import { processAndSaveImage } from "/home/runner/work/ovalorcapital/ovalorcapital/core/image_processor.js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

// ===================== CONFIG — editar a cada emergência =====================
const SOURCE_URL = "";        // URL da fonte principal confirmada por WebSearch
const CATEGORIA = "";         // uma de: brasil-on|politica|economia|financas|negocios|tecnologia|internacional|industria|familia|esportes|colunistas|vc
const SUBCAT_LABEL = "";      // rótulo humano da subcategoria (ex: "Futebol", "Governo Federal" — ver SUBCAT em api/run_portal.js linha ~26)
const TITULO = "";            // factual, 35-115 caracteres
const META_TITLE = "";        // SEO, máx 55 caracteres
const META_DESCRICAO = "";    // 120-160 caracteres
const FOCO_KEYWORD = "";      // 1 keyword principal
const SLUG = "";              // url-com-hifens
const CORPO_HTML = `

`.trim();                     // HTML puro, <p> por parágrafo, mínimo 8 parágrafos / ~2000 chars de texto puro
// ================================================================================

const hash = crypto.createHash("md5").update(SOURCE_URL.slice(0, 300) + "_manual").digest("hex");
const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
if (dup) { console.log("JA EXISTE — nao duplica. id:", dup.id); process.exit(0); }

console.log("Fazendo scrape de:", SOURCE_URL);
const a = await scrape(SOURCE_URL);
console.log("scrape() -> image:", a.image || "(vazio)", "| title:", (a.title || "").slice(0, 80), "| text.length:", (a.text || "").length);

let img = null;
if (a.image) {
  try {
    img = await processAndSaveImage(a.image, hash.slice(0, 12), Date.now(), {});
    console.log("Imagem processada:", img || "(falhou)");
  } catch (e) {
    console.log("Erro ao processar imagem:", e.message);
  }
}

// Regra Roberto 11/08/2026: com imagem real sem erro -> publica direto.
// Sem imagem -> cai pendente, igual ao resto do pipeline (Regra Zero-D).
const temImagemReal = !!img;
const post = {
  titulo: TITULO,
  conteudo: CORPO_HTML,
  comentario_fixado: META_DESCRICAO,
  imagem: img,
  hash,
  status: temImagemReal ? "publicado" : "pendente",
  approved: temImagemReal,
  publish_method: "portal",
  published_at: temImagemReal ? new Date().toISOString() : null,
  user_tags: JSON.stringify([CATEGORIA]),
  subcategoria: SUBCAT_LABEL,
  subcategoria_slug: SUBCAT_LABEL.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  collaborators: "[]",
  metrics: {
    foco_keyword: FOCO_KEYWORD,
    seo_slug: SLUG,
    meta_descricao: META_DESCRICAO,
    meta_title: META_TITLE,
    tipo_conteudo: "manual_emergencia",
    source_url: SOURCE_URL,
    source_title: a.title || "",
    source_image_url: a.image || "",
    image_strategy: img ? "source_article" : "none",
    image_original_url: a.image || ""
  },
  priority: 1,
  retry_count: 0,
  max_retries: 3
};

const { data: saved, error } = await supabase.from("posts").insert(post).select("id").maybeSingle();
if (error) { console.log("ERRO INSERT:", error); process.exit(1); }

console.log(temImagemReal ? "PUBLICADO DIRETO (com imagem)" : "SALVO COMO PENDENTE (sem imagem)", "— id:", saved?.id);
console.log("URL provavel: https://www.ovalorcapital.com.br/" + CATEGORIA + "/" + SLUG.slice(0, 55) + "-" + String(saved.id).slice(0, 8) + "/");
