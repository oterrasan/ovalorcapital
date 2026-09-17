import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import { processAndSaveImage } from "/home/runner/work/ovalorcapital/ovalorcapital/core/image_processor.js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SITE = "https://www.ovalorcapital.com.br";
const ADMIN_TOKEN = "ovc-admin-2026-secreto";

const SOURCE_URL = "https://www.cnnbrasil.com.br/internacional/no-equador-piloto-controla-aviao-e-segue-voando-apos-ser-atingido-por-ave-veja-video/";
const COVER_IMAGE_URL = "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/06/aviao-colide-com-passaro-video-e1686860965340.jpg?w=676&h=380&crop=1";

const CATEGORIA = "internacional";
const SUBCAT_LABEL = "Aviação";
const TITULO = "Piloto controla avião após colisão com ave que rompeu para-brisa no Equador";
const META_TITLE = "Ave rompe para-brisa e piloto controla avião no Equador";
const META_DESCRICAO = "Uma ave atingiu o para-brisa de uma aeronave agrícola durante voo no Equador; o piloto manteve o controle e conseguiu pousar em segurança.";
const FOCO_KEYWORD = "piloto avião ave Equador";
const SLUG = "piloto-controla-aviao-apos-colisao-ave-equador";

const CORPO_HTML = `
<p>Uma aeronave agrícola foi atingida por uma ave de grande porte poucos minutos após decolar de Vinces, na província de Los Ríos, no Equador, e teve o para-brisa da cabine rompido pelo impacto. O piloto manteve o controle da aeronave mesmo após a colisão e concluiu o voo com segurança, segundo relatos que acompanharam a repercussão do caso nas redes sociais.</p>
<p>De acordo com testemunhos e registros que circularam sobre o episódio, a aeronave realizava um voo de pulverização agrícola quando a ave colidiu de frente com o vidro dianteiro da cabine, cerca de dois minutos após a decolagem. O modelo identificado nos relatos é um Turbo Thrush 510P, aeronave de pequeno porte normalmente utilizada para aplicação aérea de defensivos em lavouras na região.</p>
<p>O impacto quebrou parte do para-brisa e o corpo do animal ficou parcialmente preso na estrutura da cabine, com as garras da ave ficando visíveis, penduradas próximas à cabeça do piloto. Imagens gravadas de dentro da aeronave mostraram o instante em que o animal atravessou parte do vidro dianteiro e permaneceu preso ao teto do compartimento.</p>
<p>O piloto identificado nos relatos como Ariel Valiente aparece nas imagens com o rosto manchado de sangue, mas relatos que analisaram o episódio afirmam que o sangue visível nas cenas seria do animal, e não do piloto, que teria seguido em condições físicas normais durante e após o pouso.</p>
<p>Mesmo com a obstrução parcial da visão provocada pelo corpo da ave e pelos estilhaços do para-brisa, Valiente manteve as mãos nos comandos e não perdeu a estabilidade da aeronave. O voo foi concluído e o pouso ocorreu sem registro de ferimentos a bordo, segundo as mesmas fontes que descreveram o episódio.</p>
<p>A espécie da ave envolvida na colisão não foi confirmada oficialmente até o momento. Relatos sobre o caso especulam que o animal poderia ser um condor-dos-andes, espécie de grande porte encontrada na região andina e conhecida pela envergadura de asas, que pode ultrapassar três metros entre as pontas.</p>
<p>Colisões entre aves e aeronaves de pequeno porte, chamadas no setor da aviação de "bird strikes", são um risco reconhecido em operações realizadas em baixa altitude, como voos agrícolas, pousos e decolagens em pistas regionais, sobretudo em áreas rurais com maior concentração de aves de grande porte.</p>
<p>O vídeo do momento da colisão, gravado de dentro da cabine, circulou amplamente em redes sociais e passou a ser reproduzido por veículos de imprensa em diferentes países após a repercussão do caso nas plataformas digitais em 2023.</p>
<p>Até a publicação desta matéria, não havia registro de manifestação oficial de autoridades de aviação civil do Equador sobre o incidente.</p>
`.trim();

function slugifyLabel(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const hash = crypto.createHash("md5").update(SOURCE_URL.slice(0, 300) + "_manual").digest("hex");
  const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
  if (dup) {
    console.log("JA_EXISTE_ID:", dup.id);
    return;
  }

  console.log("Processando imagem de capa (fonte real):", COVER_IMAGE_URL);
  const img = await processAndSaveImage(COVER_IMAGE_URL, hash.slice(0, 12), Date.now(), {});
  console.log("IMAGEM_PROCESSADA:", img || "(falhou)");
  if (!img) {
    console.log("ERRO_FATAL: imagem nao processou, abortando (sem publicar sem imagem real).");
    process.exit(1);
  }

  console.log("Fazendo upload do video local para o Supabase Storage...");
  const videoPath = "/home/runner/work/ovalorcapital/ovalorcapital/_oneoff/source-video.mp4";
  const videoBuffer = fs.readFileSync(videoPath);
  const storagePath = `videos/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.mp4`;
  try {
    await supabase.storage.createBucket("post-videos", { public: true, fileSizeLimit: 150 * 1024 * 1024 });
  } catch (_) { /* ja existe */ }
  const { error: upErr } = await supabase.storage.from("post-videos").upload(storagePath, videoBuffer, {
    contentType: "video/mp4", upsert: true, cacheControl: "31536000"
  });
  if (upErr) { console.log("ERRO_UPLOAD_VIDEO:", JSON.stringify(upErr)); process.exit(1); }
  const { data: pub } = supabase.storage.from("post-videos").getPublicUrl(storagePath);
  const videoUrl = pub?.publicUrl;
  console.log("VIDEO_URL:", videoUrl);

  const post = {
    titulo: TITULO,
    conteudo: CORPO_HTML,
    comentario_fixado: META_DESCRICAO,
    imagem: img,
    video_url: videoUrl,
    hash,
    status: "publicado",
    approved: true,
    publish_method: "portal",
    published_at: new Date().toISOString(),
    user_tags: JSON.stringify([CATEGORIA]),
    subcategoria: SUBCAT_LABEL,
    subcategoria_slug: slugifyLabel(SUBCAT_LABEL),
    collaborators: "[]",
    metrics: {
      foco_keyword: FOCO_KEYWORD,
      seo_slug: SLUG,
      meta_descricao: META_DESCRICAO,
      meta_title: META_TITLE,
      tipo_conteudo: "manual_teste",
      source_url: SOURCE_URL,
      image_strategy: "source_article",
      image_original_url: COVER_IMAGE_URL
    },
    priority: 1,
    retry_count: 0,
    max_retries: 3
  };

  const { data: saved, error } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (error) { console.log("ERRO_INSERT:", JSON.stringify(error)); process.exit(1); }

  const postId = saved.id;
  const url = `${SITE}/${CATEGORIA}/${SLUG.slice(0, 55)}-${String(postId).slice(0, 8)}/`;
  console.log("PUBLICADO_ID:", postId);
  console.log("URL_REAL:", url);

  // ===== Pipeline de Reels =====
  async function callApi(action, extra = {}) {
    const res = await fetch(`${SITE}/api/manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, token: ADMIN_TOKEN, ...extra })
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }
    return { status: res.status, json };
  }

  console.log("\n--- reels_set_source ---");
  const setSrc = await callApi("reels_set_source", { post_id: postId, video_url: videoUrl });
  console.log(setSrc.status, JSON.stringify(setSrc.json));

  console.log("\n--- reels_render_job ---");
  const job = await callApi("reels_render_job", {});
  console.log(job.status, JSON.stringify(job.json));

  if (!job.json?.job?.upload_url) {
    console.log("SEM_JOB_DE_RENDER — abortando pipeline de reels (post ja esta publicado no portal normalmente).");
    return;
  }

  const { upload_url, output_path, public_url, claim_id, post_id: jobPostId } = job.json.job;
  if (String(jobPostId) !== String(postId)) {
    console.log("ABORTANDO: reels_render_job pegou um post_id DIFERENTE do nosso (concorrencia com outra fila real de render). jobPostId:", jobPostId, "nosso:", postId, "— nao vamos mexer no video de outro post.");
    return;
  }

  console.log("\n--- upload do video (ja pronto, sem reencode) para a signed URL ---");
  const signedToken = new URL(upload_url).searchParams.get("token");
  const { data: signedUpData, error: signedUpErr } = await supabase.storage
    .from("post-videos")
    .uploadToSignedUrl(output_path, signedToken, videoBuffer, { contentType: "video/mp4", upsert: true });
  console.log("SIGNED_UPLOAD:", JSON.stringify(signedUpData), signedUpErr ? JSON.stringify(signedUpErr) : "sem_erro");
  if (signedUpErr) { console.log("ABORTANDO: falha no upload via signed URL."); return; }

  console.log("\n--- reels_render_complete ---");
  const complete = await callApi("reels_render_complete", { post_id: jobPostId, claim_id, public_url });
  console.log(complete.status, JSON.stringify(complete.json));

  console.log("\n--- reels_publish ---");
  const publish = await callApi("reels_publish", { post_id: jobPostId });
  console.log(publish.status, JSON.stringify(publish.json));
}

main().catch(e => { console.log("ERRO_GERAL:", e.message, e.stack); process.exit(1); });
