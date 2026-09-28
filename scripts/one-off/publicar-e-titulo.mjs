// Publicação de emergência (pedido explícito de Roberto, 28/09/2026) —
// matéria sobre o app e-Título: documento aceito, prazo, orientações para
// o domingo (4/10, 1º turno das Eleições 2026). Segue o dispositivo
// documentado em scripts/emergency_publish_template.mjs.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

const SITE_BASE = "https://www.ovalorcapital.com.br";
const CATEGORIA = "politica";
const SUBCAT_LABEL = "Eleições 2026";
const TITULO = "TSE libera download do e-Título até no dia da votação de domingo";
const META_TITLE = "e-Título: baixe até domingo (4/10) e veja documentos";
const META_DESCRICAO = "TSE libera o download do e-Título até o dia da votação de domingo (4/10). Veja quais documentos com foto são aceitos e como validar o app antes do prazo.";
const FOCO_KEYWORD = "e-Título 2026";
const SLUG = "e-titulo-baixar-documentos-aceitos-votacao-2026";

const CORPO_HTML = `
<p>O Tribunal Superior Eleitoral (TSE) autorizou o download e a ativação do aplicativo e-Título mesmo durante os dias de votação das Eleições 2026, incluindo o primeiro turno, no domingo, dia 4 de outubro. A decisão foi anunciada pelo presidente do TSE, ministro Kassio Nunes Marques, durante sessão plenária realizada em 24 de setembro, e reverte a prática adotada em pleitos anteriores, quando a emissão do documento era suspensa no dia da eleição para evitar sobrecarga nos sistemas da Justiça Eleitoral.</p>
<p>Segundo o TSE, a mudança de regra só foi possível depois do reforço da infraestrutura que sustenta os serviços digitais do tribunal. A corte eleitoral informou que manterá uma sala de monitoramento em funcionamento entre 24 de setembro e 25 de outubro, data do eventual segundo turno, com equipes dedicadas a acompanhar de perto o funcionamento do e-Título e garantir a estabilidade dos serviços digitais durante todo o período eleitoral. O tribunal também anunciou a criação de um espaço próprio nas dependências do TSE, batizado de Espaço e-Título, para abrigar as equipes responsáveis pelos aplicativos usados pela Justiça Eleitoral.</p>
<p>Apesar da liberação, a Justiça Eleitoral recomenda que o eleitor baixe e valide o aplicativo com antecedência, sem deixar para o próprio dia da votação. De acordo com o TSE, o prazo de referência para concluir o primeiro acesso e a validação das informações cadastrais se encerra às 23h59 de 3 de outubro, véspera do primeiro turno — horário que também serve como parâmetro para quem quer garantir o funcionamento do app antes de sair de casa no domingo. A recomendação vale tanto para quem nunca usou o e-Título quanto para quem já tem o aplicativo instalado, já que a validação das informações cadastrais precisa ser concluída para que o documento seja reconhecido normalmente na seção eleitoral.</p>
<p>O e-Título é gratuito e está disponível na Google Play, para aparelhos Android, e na App Store, para iPhone e iPad. Para que o aplicativo funcione como documento de identificação no momento do voto, é necessário que o eleitor já tenha passado pelo cadastramento biométrico junto à Justiça Eleitoral, etapa que permite ao app exibir a fotografia do eleitor, condição exigida pelo TSE para seu uso como documento oficial. Quem ainda não fez a biometria pode consultar a própria situação eleitoral pelos canais oficiais do TSE antes do dia da votação.</p>
<p>Com a foto vinculada ao cadastro biométrico, o e-Título dispensa a apresentação da versão impressa do título eleitoral no momento de votar. A apresentação do título de eleitor, físico ou digital, não é obrigatória — a exigência da legislação eleitoral é a apresentação de algum documento oficial com foto perante a mesa receptora, independentemente de o eleitor portar ou não o título em si.</p>
<p>Além do e-Título com biometria, o TSE aceita como identificação a carteira de identidade (RG), a Carteira Nacional de Habilitação (CNH), o certificado de reservista, o passaporte e a carteira de categoria profissional reconhecida por lei. A carteira de trabalho física também é aceita, mas a versão digital do documento não vale como prova de identidade, já que não possui fotografia validada por um órgão oficial de registro, segundo o TSE. Certidões de nascimento e de casamento, por não conterem foto, seguem fora da lista de documentos aceitos na seção eleitoral, mesmo quando usadas em outros contextos como prova de identidade civil.</p>
<p>Pela Resolução nº 23.759/2026 do TSE, documentos oficiais com foto poderão ser aceitos mesmo com a validade vencida, desde que seja possível confirmar a identidade do eleitor a partir da fotografia e dos demais dados do documento. Para as Eleições 2026, o e-Título passou a reunir outras funções além da identificação para votar, como o acompanhamento de requerimentos feitos pelo sistema Título Net, a emissão de certidão de filiação partidária nas modalidades simples e histórico, o registro e a consulta do histórico de justificativas de ausência às urnas e a emissão de certidões de quitação eleitoral e de crimes eleitorais.</p>
<p>O aplicativo também permite o pagamento de multas eleitorais por Pix ou cartão de crédito, por meio da plataforma PagTesouro, sem necessidade de guia impressa. As funcionalidades foram incorporadas ao e-Título ao longo de 2026 justamente para concentrar em um único aplicativo os serviços mais procurados pelo eleitor às vésperas da votação. O primeiro turno das Eleições 2026 está marcado para 4 de outubro, com eventual segundo turno em 25 de outubro, conforme o calendário eleitoral divulgado pelo TSE.</p>
`.trim();

async function main() {
  const hash = crypto.createHash("md5").update("e-titulo-emergencia-28092026_manual").digest("hex");
  const { data: dup } = await supabase.from("posts").select("id").eq("hash", hash).maybeSingle();
  if (dup) {
    console.log("JA EXISTE — nao duplica. id:", dup.id);
    console.log("URL:", `${SITE_BASE}/${CATEGORIA}/${SLUG.slice(0, 55)}-${String(dup.id).slice(0, 8)}/`);
    return;
  }

  console.log("Buscando imagem real via GET buscar_imagem...");
  const qs = new URLSearchParams({ action: "buscar_imagem", q: "urna eletronica eleicoes Brasil votacao", categoria: CATEGORIA }).toString();
  const r = await fetch(`${SITE_BASE}/api/run_portal?${qs}`);
  const j = await r.json().catch(() => ({}));
  const img = j && j.url ? j.url : null;
  console.log("Resultado buscar_imagem:", JSON.stringify(j));

  const temImagemReal = !!img;
  const subSlug = SUBCAT_LABEL
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
    subcategoria_slug: subSlug,
    collaborators: "[]",
    metrics: {
      foco_keyword: FOCO_KEYWORD,
      seo_slug: SLUG,
      meta_descricao: META_DESCRICAO,
      meta_title: META_TITLE,
      tipo_conteudo: "manual_emergencia",
      source_url: "",
      source_title: "TSE — apuração multi-fonte (WebSearch)",
      source_image_url: "",
      image_strategy: img ? "buscar_imagem" : "none",
      image_original_url: img || ""
    },
    priority: 1,
    retry_count: 0,
    max_retries: 3
  };

  const { data: saved, error } = await supabase.from("posts").insert(post).select("id").maybeSingle();
  if (error) {
    console.log("ERRO INSERT:", JSON.stringify(error));
    process.exit(1);
  }

  console.log(temImagemReal ? "PUBLICADO DIRETO (com imagem)" : "SALVO COMO PENDENTE (sem imagem)", "— id:", saved?.id);
  console.log("URL:", `${SITE_BASE}/${CATEGORIA}/${SLUG.slice(0, 55)}-${String(saved.id).slice(0, 8)}/`);
  console.log("texto_puro_chars_aprox:", CORPO_HTML.replace(/<[^>]+>/g, "").length);
}

main().catch((e) => {
  console.log("ERRO FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
