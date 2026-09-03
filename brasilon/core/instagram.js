// Brasil ON — client da Graph API do Instagram.
// Adaptado de core/instagram.js (raiz, OVC) pro caso mais simples do
// Brasil ON: uma única conta (@obrasilon, tabela ig_accounts do MESMO
// Supabase, discriminada por username — ver brasilon/api/manage.js
// getInstagramAccount()), sem lógica de escolha entre várias contas.
//
// Collab: Roberto, 03/09/2026, direto no chat, assim que a imagem foi
// aprovada: "os posts do brasil on, TODOS em collabs com o @oterrasan" —
// sempre, sem exceção, sem rodízio (só 1 colaborador aqui, bem abaixo do
// limite real de 4 collaborators+autor confirmado pro OVC).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BASE = "https://graph.facebook.com/v25.0";
const USERNAME = "obrasilon";
const DEFAULT_COLLABORATORS = ["oterrasan"];

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

export async function getAccount() {
  const { data, error } = await supabase.from("ig_accounts")
    .select("*")
    .eq("username", USERNAME)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getPublishingLimitForAccount(account) {
  const params = new URLSearchParams({ fields: "quota_usage,config", access_token: account.token });
  const res = await fetch(`${BASE}/${account.ig_user_id}/content_publishing_limit?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error("Erro ao consultar limite de publicação: " + JSON.stringify(data));
  return normalizePublishingLimit(data);
}

export async function getContentPublishingLimit() {
  const account = await getAccount();
  if (!account?.ig_user_id || !account?.token) throw new Error("Conta @obrasilon sem ig_user_id ou token para consultar limite");
  return { username: account.username, ...(await getPublishingLimitForAccount(account)) };
}

export async function publish(imageUrl, caption) {
  const account = await getAccount();
  if (!account) throw new Error("Conta @obrasilon não cadastrada em ig_accounts");
  const { ig_user_id, token } = account;
  if (!ig_user_id || !token) throw new Error("Conta @obrasilon sem ig_user_id ou token");

  const limit = await getPublishingLimitForAccount(account);
  if (limit.quota_total !== null && limit.quota_usage !== null && limit.quota_usage >= limit.quota_total) {
    throw new Error(`Limite de publicação do Instagram atingido (${limit.quota_usage}/${limit.quota_total} em ${limit.quota_duration || 86400}s)`);
  }

  // 1. Criar container
  const createRes = await fetch(`${BASE}/${ig_user_id}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token, collaborators: DEFAULT_COLLABORATORS })
  });
  const createData = await createRes.json();
  if (!createData.id) throw new Error("Erro ao criar container: " + JSON.stringify(createData));

  // 2. Aguardar processamento da Meta
  let containerStatus = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 2000));
    const statusRes = await fetch(`${BASE}/${createData.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    containerStatus = await statusRes.json();
    if (containerStatus?.status_code === "FINISHED") break;
    if (["ERROR", "EXPIRED"].includes(containerStatus?.status_code)) {
      throw new Error("Erro ao processar container: " + JSON.stringify(containerStatus));
    }
  }
  if (containerStatus?.status_code !== "FINISHED") {
    throw new Error("Tempo esgotado ao processar container: " + JSON.stringify(containerStatus));
  }

  // 3. Publicar (retry em 9007 — Meta ainda processando, mesmo padrão do OVC)
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

  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  return { id: pubData.id, username: account.username, quota_before: limit };
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
