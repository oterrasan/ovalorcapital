// scripts/instagram-robo-descobrir.mjs — robô de descoberta automática de
// vídeo novo em perfis do Instagram monitorados (mesmo espírito do robô de
// TikTok já em produção, ver TIKTOK_ROBO_CONTAS em api/run_portal.js). Roda
// SÓ no runner do GitHub Actions (instagram-auto.yml, job capturar_links),
// nunca na Vercel.
//
// 20/11/2026 — Roberto: "Encontre uma forma do nosso sistema conseguir
// capturar videos do instagram. isso agora passa a ser a sua prioridade."
// core/linkCapture.js já documentava (26/09/2026) que Instagram "sem login
// falha" pra um LINK AVULSO colado por Roberto — mas a mesma conta de
// captura (instagram-private-api, já logada e usada por
// scripts/capture-link-jobs.mjs via instagram-login.mjs) também sabe LISTAR
// o feed recente de um perfil (ig.feed.user), não só buscar 1 post por
// código — é exatamente o que faltava pra automatizar, sem credencial nova
// nenhuma. Confirmado de verdade (20/11/2026, instalação real da lib numa
// sandbox) que o item do feed já traz code/taken_at/caption/media_type —
// tudo que o pipeline de captura já espera.
//
// ⚠️ Risco real, não escondido: isto usa a MESMA conta de captura com mais
// frequência (varredura periódica de N perfis, além da captura avulsa já
// existente) — instagram-private-api é um cliente NÃO OFICIAL (engenharia
// reversa do app); aumentar o volume de chamadas automatizadas aumenta de
// verdade a chance da conta levar um checkpoint/desafio ou ban. Mitigado
// aqui com: poucos perfis, 1 página por perfil (sem paginar o feed
// inteiro), e o mesmo intervalo de 10 em 10 min já usado pelo robô de
// TikTok — nada mais agressivo do que já roda hoje. Se a conta de captura
// levar um checkpoint, capturarInstagram() (link avulso) já trata esse erro
// (core/linkCapture.js/capture-link-jobs.mjs) e este robô, com o mesmo
// try/catch por perfil, nunca derruba o job inteiro — só aquele perfil
// fica sem listar naquela rodada.
//
// Limite desta primeira versão: só media_type===2 (post/reel de vídeo
// "puro"). Carrossel com slide de vídeo (media_type===8) fica fora por
// agora — manter o parsing simples e confiável até confirmar que o volume
// de vídeo puro já atende.
import { igCliente } from "./instagram-login.mjs";

const API = "https://www.ovalorcapital.com.br/api/run_portal";
const TOKEN = process.env.OVC_ADMIN_TOKEN || "";

async function api(body) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000)
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch (_) { return { ok: false, error: `HTTP ${r.status}: ${text.slice(0, 200)}` }; }
}

// Mesma lista de contas/categorias já aprovada por Roberto pro robô de
// TikTok (10/11/2026) — mesmos veículos, agora também pelo Instagram. A
// categoria de cada conta mora em TIKTOK_ROBO_CONTAS (api/run_portal.js) —
// reaproveitada lá pelo handler, não duplicada aqui.
const CONTAS = ["metropolesoficial", "g1", "reinaldogottino", "sbtnews", "revista_veja", "plenonews", "cnnbrasil", "profdanuzioneto"];

async function main() {
  let ig;
  try {
    ig = await igCliente(api);
  } catch (e) {
    console.log("robô Instagram: não foi possível logar na conta de captura —", e?.message || e);
    return;
  }
  for (const username of CONTAS) {
    try {
      const userId = await ig.user.getIdByUsername(username);
      const items = await ig.feed.user(userId).items();
      const videos = items
        .filter((it) => Number(it?.media_type) === 2 && it?.code)
        .map((it) => ({ code: String(it.code), timestamp: Number(it.taken_at || 0), title: String(it.caption?.text || "").slice(0, 120) }));
      console.log(`@${username} — itens no feed: ${items.length}, vídeos: ${videos.length}`);
      const resp = await api({ action: "instagram_robo_registrar", user: username, videos });
      console.log(`@${username} —`, JSON.stringify(resp));
    } catch (e) {
      console.log(`@${username} — falhou:`, e?.message || e);
    }
  }
}

await main();
