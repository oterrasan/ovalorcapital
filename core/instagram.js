import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");
const BASE = "https://graph.facebook.com/v25.0";

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
  const { data } = await supabase.from("ig_accounts").select("*").eq("active", true).not("token", "is", null).order("posts_hoje", { ascending: true }).limit(1);
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
  const createRes = await fetch(`${BASE}/${ig_user_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token })
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Erro ao criar container: " + JSON.stringify(createData));

  // 2. Publicar
  const pubRes = await fetch(`${BASE}/${ig_user_id}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createData.id, access_token: token })
  });
  const pubData = await pubRes.json();
  if (!pubData.id) throw new Error("Erro ao publicar: " + JSON.stringify(pubData));

  // 3. Atualizar contador
  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  return { id: pubData.id, account_id: account.id, username: account.username, quota_before: limit };
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

export { getAccount };
