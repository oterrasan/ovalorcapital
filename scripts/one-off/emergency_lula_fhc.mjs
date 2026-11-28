// scripts/one-off/emergency_lula_fhc.mjs
// Dispositivo de publicação de emergência (ver scripts/emergency_publish_template.mjs)
// Tema: Lula chama FHC de "morto-vivo" — apurado via WebSearch em 2+ fontes
// confiáveis e independentes (Gazeta do Povo, em.com.br, Jornal de Brasília,
// RIC, O Antagonista, Diário do Poder, Diário PcD) antes de escrever.
// Script one-off — roda uma vez via workflow temporário e é deletado depois.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { scrape } from "/home/runner/work/ovalorcapital/ovalorcapital/core/scraper.js";
import { processAndSaveImage } from "/home/runner/work/ovalorcapital/ovalorcapital/core/image_processor.js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

const SOURCE_URL = "https://jornaldebrasilia.com.br/noticias/politica-e-poder/lula-chama-fhc-de-morto-vivo-em-evento-no-rio/";
const CATEGORIA = "politica";
const SUBCAT_LABEL = "Governo Federal";
const TITULO = "Lula chama FHC de ‘morto-vivo’ ao comentar Alzheimer do ex-presidente";
const META_TITLE = "Lula chama FHC de ‘morto-vivo’ e gera revolta";
const META_DESCRICAO = "Lula chamou Fernando Henrique Cardoso, com Alzheimer avançado, de “morto-vivo” em evento no Rio; Aécio Neves classificou a fala como lamentável.";
const FOCO_KEYWORD = "lula fhc morto-vivo";
const SLUG = "lula-chama-fhc-de-morto-vivo-ao-comentar-alzheimer";
const CORPO_HTML = `
<p>O presidente Luiz Inácio Lula da Silva chamou o ex-presidente Fernando Henrique Cardoso de "morto-vivo" durante um evento sobre envelhecimento saudável no Hospital Universitário Gaffrée e Guinle, no Rio de Janeiro, nesta sexta-feira (27). Segundo relatos de veículos presentes ao evento, a frase foi dita ao comentar o estado de saúde do tucano, que enfrenta Alzheimer em estágio avançado.</p>

<p>De acordo com a transcrição divulgada por parte da imprensa, Lula afirmou que Fernando Henrique "não consegue mais nada" e completou dizendo que uma pessoa nessa condição "não vive" — por isso, segundo o presidente, seria um "morto-vivo". Outros registros da fala trazem formulação ligeiramente diferente da frase, mas convergem no termo usado para descrever o ex-presidente.</p>

<p>Fernando Henrique, de 95 anos, está sob curatela judicial desde abril, decisão tomada depois que a família formalizou o pedido em razão do avanço da doença. O diagnóstico de Alzheimer em estágio avançado já havia se tornado público em novembro, quando vídeos gravados dentro do apartamento do ex-presidente, em São Paulo, passaram a circular nas redes sociais.</p>

<p>A esposa de Fernando Henrique, Patrícia Kundrat, registrou boletim de ocorrência depois da divulgação desses vídeos, segundo informações já publicadas sobre o caso. O episódio reacendeu o debate público sobre a exposição da condição de saúde do ex-presidente — justamente o contexto em que a fala de Lula ocorreu.</p>

<p>A declaração provocou reação imediata de opositores do governo. Em nota, o presidente nacional do PSDB, Aécio Neves, classificou o comentário como lamentável e afirmou que pessoas na mesma condição de saúde de Fernando Henrique devem ser tratadas com cuidado, carinho e respeito.</p>

<p>O ex-governador de Goiás Marconi Perillo também criticou a fala e cobrou mais respeito aos idosos por parte do presidente. Parte da imprensa dedicada a pautas de deficiência classificou o episódio como um caso de capacitismo, ao avaliar que a expressão usada por Lula revela despreparo para tratar da dignidade de pessoas em estágio avançado de demência.</p>

<p>Lula e Fernando Henrique Cardoso se enfrentaram nas disputas presidenciais de 1994 e 1998, ambas vencidas pelo tucano. Desde a redemocratização, os dois mantiveram uma relação pública marcada por rivalidade política, intercalada por momentos pontuais de aproximação institucional em datas oficiais do Estado brasileiro.</p>

<p>Até a publicação desta reportagem, o Palácio do Planalto não havia se manifestado sobre a repercussão da fala, nem Lula havia comentado publicamente as críticas recebidas após o episódio no Rio de Janeiro.</p>
`.trim();

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
