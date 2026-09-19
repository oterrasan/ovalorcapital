import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");
const BASE = "https://graph.facebook.com/v25.0";
// 03/09/2026 — Roberto pediu pra cadastrar mais 3 perfis junto do @oterrasan,
// todos recebendo collab em TODO post automaticamente. Limite real do
// Instagram: até 4 collaborators + o autor original (5 contas no total) —
// com exatamente 4 nomes aqui, cabem todos sem rodízio.
const DEFAULT_COLLABORATORS = ["oterrasan", "souabetaferreira", "adriana.ferreirasp", "amichelefroes"];
const DEFAULT_ACCOUNT_USERNAME = "ovalorcapital";
// 17/09/2026 — Roberto: "demorar 40 minutos para uma conta aceitar as
// collabs é inadmissível". Exclusão fixa, não lê config — mesma regra já
// usada no aceite por polling (core/instagram_collab_policy.js).
const NEVER_AUTO_ACCEPT = "oterrasan";

async function writeLog(level, message) {
  try { await supabase.from("logs").insert({ level, message }); } catch (_) {}
}

function collaboratorsFor(publisherUsername) {
  const publisher = String(publisherUsername || "").replace(/^@/, "").toLowerCase();
  return DEFAULT_COLLABORATORS.filter(c => c.toLowerCase() !== publisher);
}

function normalizePublishingLimit(raw) {
  const item = Array.isArray(raw?.data) ? raw.data[0] : raw;
  const config = item?.config || {};
  const quotaUsage = Number(item?.quota_usage);
  const quotaTotal = Number(config?.quota_total);
  const quotaDuration = Number(config?.quota_duration);
  return {
    quota_usage: Number.isFinite(quotaUsage) ? quotaUsage : null,
    quota_total: Number.isFinite(quotaTotal) ? quotaTotal : null,
    quota_duration: Number.isFinite(quotaDuration) ? quotaDuration : null,
    quota_remaining: Number.isFinite(quotaUsage) && Number.isFinite(quotaTotal) ? Math.max(0, quotaTotal - quotaUsage) : null
  };
}

async function getAccount(accountId) {
  if (accountId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", accountId).single();
    if (data?.active && data?.token) return data;
  }
  const { data: preferred } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("active", true)
    .eq("username", DEFAULT_ACCOUNT_USERNAME)
    .not("token", "is", null)
    .limit(1);
  if (preferred?.[0]) return preferred[0];

  const { data } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("active", true)
    .not("token", "is", null)
    .order("posts_hoje", { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

async function getPublishingLimitForAccount(account) {
  const params = new URLSearchParams({
    fields: "quota_usage,config",
    access_token: account.token
  });
  const res = await fetch(`${BASE}/${account.ig_user_id}/content_publishing_limit?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error("Erro ao consultar limite de publicação: " + JSON.stringify(data));
  return normalizePublishingLimit(data);
}

export async function getContentPublishingLimit(accountId) {
  const account = await getAccount(accountId);
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta sem ig_user_id ou token para consultar limite");
  return {
    account_id: account.id,
    username: account.username,
    ...(await getPublishingLimitForAccount(account))
  };
}

export async function publish(imageUrl, caption, accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa com token disponível");

  const { ig_user_id, token } = account;
  if (!ig_user_id || !token) throw new Error("Conta sem ig_user_id ou token: " + account.username);

  const limit = await getPublishingLimitForAccount(account);
  if (limit.quota_total !== null && limit.quota_usage !== null && limit.quota_usage >= limit.quota_total) {
    throw new Error(`Limite de publicação do Instagram atingido (${limit.quota_usage}/${limit.quota_total} em ${limit.quota_duration || 86400}s)`);
  }

  // 1. Criar container
  const createPayload = { image_url: imageUrl, caption, access_token: token };
  const collaborators = collaboratorsFor(account.username);
  if (collaborators.length) {
    createPayload.collaborators = collaborators;
  }
  const createRes = await fetch(`${BASE}/${ig_user_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload)
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Erro ao criar container: " + JSON.stringify(createData));

  // 2. Aguardar o processamento da imagem pela Meta
  let containerStatus = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 2000));

    const statusRes = await fetch(
      `${BASE}/${createData.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`
    );
    containerStatus = await statusRes.json();

    if (containerStatus?.status_code === "FINISHED") break;
    if (["ERROR", "EXPIRED"].includes(containerStatus?.status_code)) {
      throw new Error("Erro ao processar container: " + JSON.stringify(containerStatus));
    }
  }

  if (containerStatus?.status_code !== "FINISHED") {
    throw new Error("Tempo esgotado ao processar container: " + JSON.stringify(containerStatus));
  }

  // 3. Publicar
  let pubData = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 3000));

    const pubRes = await fetch(`${BASE}/${ig_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token })
    });
    pubData = await pubRes.json();

    if (pubData?.id) break;
    if (pubData?.error?.code !== 9007) break;
  }

  if (!pubData?.id) throw new Error("Erro ao publicar: " + JSON.stringify(pubData));

  // 4. Atualizar contador
  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  // 5. Aceitar na hora os convites de collab que ACABAMOS de enviar —
  // 17/09/2026, Roberto: "demorar 40 minutos... é inadmissível". Sem cron:
  // já sabemos o media_id e quem foi convidado, aceitamos direto por
  // media_id. Best-effort — nunca pode quebrar a publicação em si.
  if (collaborators.length) {
    try { await acceptCollabsForMedia(pubData.id, collaborators, "feed"); } catch (_) {}
  }

  return { id: pubData.id, account_id: account.id, username: account.username, quota_before: limit };
}

// ══════════════════════════════════════════════════════
// REELS (vídeo) — 07/09/2026, a pedido de Roberto: "construa a automacao
// dos videos". Mesmo client/conta/collaborators/quota de sempre — só o
// media_type e o payload mudam (video_url em vez de image_url). O
// Instagram exige um link DIRETO pro arquivo de vídeo (mp4/mov real,
// hospedado por nós) — nunca uma página/embed do YouTube, que a Meta não
// consegue baixar. Isso é filtrado do lado de quem chama (api/manage.js),
// não aqui — este módulo só publica o que já chegou como video_url direto.
// ══════════════════════════════════════════════════════
export async function createReelContainer(videoUrl, caption, accountId, opts = {}) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa com token disponível");
  const { ig_user_id, token } = account;
  if (!ig_user_id || !token) throw new Error("Conta sem ig_user_id ou token: " + account.username);

  const limit = await getPublishingLimitForAccount(account);
  if (limit.quota_total !== null && limit.quota_usage !== null && limit.quota_usage >= limit.quota_total) {
    throw new Error(`Limite de publicação do Instagram atingido (${limit.quota_usage}/${limit.quota_total} em ${limit.quota_duration || 86400}s)`);
  }

  const createPayload = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    access_token: token,
    share_to_feed: opts.shareToFeed !== false
  };
  const collaborators = collaboratorsFor(account.username);
  if (collaborators.length) createPayload.collaborators = collaborators;
  if (opts.coverUrl) createPayload.cover_url = opts.coverUrl;

  const createRes = await fetch(`${BASE}/${ig_user_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload)
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Erro ao criar container de Reel: " + JSON.stringify(createData));

  return { creation_id: createData.id, account_id: account.id, username: account.username, quota_before: limit };
}

// 18/09/2026 — a pedido de Roberto: "isso não precisa ficar no supabase,
// os reels podem ir só pro instagram". Em vez do método hospedado
// (video_url — a Meta busca o arquivo numa URL pública nossa, hoje
// Supabase Storage, que tem teto de 50MB no projeto), cria o container já
// como upload_type=resumable — a Meta devolve uma URL de rupload própria
// pra receber os bytes DIRETO de quem está rodando o render (o runner do
// GitHub Actions), sem nenhum storage nosso no meio. Documentado como o
// caminho oficial da Meta pra Reels sem hospedagem pública:
// https://developers.facebook.com/docs/instagram-platform/content-publishing/
export async function createReelContainerResumable(caption, accountId, opts = {}) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa com token disponível");
  const { ig_user_id, token } = account;
  if (!ig_user_id || !token) throw new Error("Conta sem ig_user_id ou token: " + account.username);

  const limit = await getPublishingLimitForAccount(account);
  if (limit.quota_total !== null && limit.quota_usage !== null && limit.quota_usage >= limit.quota_total) {
    throw new Error(`Limite de publicação do Instagram atingido (${limit.quota_usage}/${limit.quota_total} em ${limit.quota_duration || 86400}s)`);
  }

  const createPayload = {
    media_type: "REELS",
    upload_type: "resumable",
    caption,
    access_token: token,
    share_to_feed: opts.shareToFeed !== false
  };
  const collaborators = collaboratorsFor(account.username);
  if (collaborators.length) createPayload.collaborators = collaborators;
  if (opts.coverUrl) createPayload.cover_url = opts.coverUrl;

  const createRes = await fetch(`${BASE}/${ig_user_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload)
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Erro ao criar container resumível de Reel: " + JSON.stringify(createData));

  return {
    creation_id: createData.id,
    account_id: account.id,
    username: account.username,
    upload_url: createData.uri || `https://rupload.facebook.com/ig-api-upload/v25.0/${createData.id}`,
    upload_token: token,
    quota_before: limit
  };
}

// Publica um Reel cujo vídeo JÁ foi enviado direto pra Meta (via
// createReelContainerResumable + upload de bytes pro rupload) — nunca cria
// um segundo container, só confirma o processamento e publica.
export async function publishAlreadyUploadedReel(creationId, accountId, opts = {}) {
  let status = null;
  const maxAttempts = opts.maxPollAttempts ?? 5;
  const pollDelayMs = opts.pollDelayMs ?? 3000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, pollDelayMs));
    status = await checkReelStatus(creationId, accountId);
    if (status?.status_code === "FINISHED") break;
    if (["ERROR", "EXPIRED"].includes(status?.status_code)) {
      throw new Error("Erro ao processar vídeo do Reel: " + JSON.stringify(status));
    }
  }

  if (status?.status_code !== "FINISHED") {
    const err = new Error("Vídeo do Reel ainda em processamento pela Meta — tentar de novo depois: " + JSON.stringify(status));
    err.pending = true;
    err.creation_id = creationId;
    err.account_id = accountId;
    throw err;
  }

  const published = await publishReelContainer(creationId, accountId);
  const collaborators = collaboratorsFor(published.username);
  if (collaborators.length) {
    try { await acceptCollabsForMedia(published.id, collaborators, "reel"); } catch (_) {}
  }
  return published;
}

export async function checkReelStatus(creationId, accountId) {
  const account = await getAccount(accountId);
  if (!account?.token) throw new Error("Conta sem token para checar status do Reel");
  const statusRes = await fetch(`${BASE}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(account.token)}`);
  return statusRes.json();
}

export async function publishReelContainer(creationId, accountId) {
  const account = await getAccount(accountId);
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta sem ig_user_id ou token para publicar");

  let pubData = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 3000));
    const pubRes = await fetch(`${BASE}/${account.ig_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: account.token })
    });
    pubData = await pubRes.json();
    if (pubData?.id) break;
    if (pubData?.error?.code !== 9007) break;
  }
  if (!pubData?.id) throw new Error("Erro ao publicar Reel: " + JSON.stringify(pubData));

  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  return { id: pubData.id, account_id: account.id, username: account.username };
}

// Cria + aguarda o processamento do vídeo pela Meta (pode levar bem mais
// tempo que uma imagem) + publica, tudo numa chamada só. Se o vídeo ainda
// não tiver terminado de processar dentro do orçamento de polling, lança
// um erro com `.pending=true` — quem chamou decide se tenta de novo depois
// (nunca deixamos a function serverless travada esperando indefinidamente).
export async function publishReel(videoUrl, caption, accountId, opts = {}) {
  const { creation_id, account_id, quota_before } = await createReelContainer(videoUrl, caption, accountId, opts);

  let status = null;
  const maxAttempts = opts.maxPollAttempts ?? 15;
  const pollDelayMs = opts.pollDelayMs ?? 3000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, pollDelayMs));
    status = await checkReelStatus(creation_id, account_id);
    if (status?.status_code === "FINISHED") break;
    if (["ERROR", "EXPIRED"].includes(status?.status_code)) {
      throw new Error("Erro ao processar vídeo do Reel: " + JSON.stringify(status));
    }
  }

  if (status?.status_code !== "FINISHED") {
    const err = new Error("Vídeo do Reel ainda em processamento pela Meta — tentar de novo depois: " + JSON.stringify(status));
    err.pending = true;
    err.creation_id = creation_id;
    err.account_id = account_id;
    throw err;
  }

  const published = await publishReelContainer(creation_id, account_id);

  // Mesmo aceite instantâneo do feed — ver publish() acima.
  const collaborators = collaboratorsFor(published.username);
  if (collaborators.length) {
    try { await acceptCollabsForMedia(published.id, collaborators, "reel"); } catch (_) {}
  }

  return { ...published, quota_before };
}

export async function postComment(mediaId, text, token) {
  if (!token) throw new Error("Token ausente para comentar no Instagram");
  const res = await fetch(`${BASE}/${mediaId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: token })
  });
  const data = await res.json();
  if (!res.ok || !data?.id) throw new Error("Erro ao postar comentário: " + JSON.stringify(data));
  return data;
}

export async function likeMedia(mediaId, accountId) {
  const account = await getAccount(accountId);
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta sem ig_user_id ou token para curtir");

  const res = await fetch(`${BASE}/${account.ig_user_id}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_id: mediaId, access_token: account.token })
  });
  const data = await res.json();
  if (!res.ok || data?.success !== true) throw new Error("Erro ao curtir publicação: " + JSON.stringify(data));
  return data;
}

export async function getCollaborationInvites(accountId) {
  const account = await getAccount(accountId);
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta sem ig_user_id ou token para consultar collabs");

  const params = new URLSearchParams({
    fields: "media_id,media_owner_username,caption,media_url",
    limit: "50",
    access_token: account.token
  });
  const res = await fetch(`${BASE}/${account.ig_user_id}/collaboration_invites?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error("Erro ao consultar convites de collab: " + JSON.stringify(data));
  return Array.isArray(data?.data) ? data.data : [];
}

export async function acceptCollaborationInvite(mediaId, accountId) {
  const account = await getAccount(accountId);
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta sem ig_user_id ou token para aceitar collab");
  if (!mediaId) throw new Error("Convite de collab sem media_id");

  const res = await fetch(`${BASE}/${account.ig_user_id}/collaboration_invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_id: String(mediaId), accept: true, access_token: account.token })
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error("Erro ao aceitar convite de collab: " + JSON.stringify(data));
  return data;
}

// 17/09/2026 — aceite instantâneo pra invite que NÓS MESMOS acabamos de
// criar (via `collaborators` em publish/publishReel acima). Vai direto no
// accept por media_id — sem getCollaborationInvites (GET) — porque já
// sabemos o media_id, sem precisar "descobrir" nada. Contas em PARALELO
// (nunca sequencial: 3 contas × retry sequencial passaria dos 120s de
// maxDuration da function). Cada conta tenta com pequenos retries (a Meta
// pode levar alguns segundos pra registrar o convite do lado dela), depois
// curte. Best-effort completo — nenhum erro aqui escapa pra quem chamou.
async function acceptCollabsForMedia(mediaId, invitedUsernames, tag) {
  const attempts = [0, 5000, 15000, 30000];
  const jobs = (invitedUsernames || []).map(async (raw) => {
    const username = String(raw || "").replace(/^@/, "").toLowerCase();
    if (username === NEVER_AUTO_ACCEPT) {
      return { username, skipped: true, reason: "nunca_aceita_automatico" };
    }
    try {
      const { data: acc } = await supabase
        .from("ig_accounts")
        .select("id")
        .eq("username", username)
        .eq("active", true)
        .not("token", "is", null)
        .limit(1)
        .maybeSingle();
      if (!acc?.id) return { username, skipped: true, reason: "conta_nao_encontrada_ou_sem_token" };

      let accepted = false, lastError = null;
      for (const delay of attempts) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        try { await acceptCollaborationInvite(mediaId, acc.id); accepted = true; break; }
        catch (e) { lastError = e?.message || String(e); }
      }

      let liked = false, likeError = null;
      if (accepted) {
        try { await likeMedia(mediaId, acc.id); liked = true; }
        catch (e) { likeError = e?.message || String(e); }
      }

      await writeLog(
        accepted ? "info" : "error",
        `[ig-collab-instant] @${username} media=${mediaId} (${tag}) accepted=${accepted}${liked ? " liked" : ""}${accepted ? "" : ` erro=${lastError}`}`
      );
      return { username, accepted, liked, error: accepted ? null : lastError, like_error: likeError };
    } catch (e) {
      return { username, ok: false, error: e?.message || String(e) };
    }
  });
  return Promise.all(jobs);
}

export { getAccount };
