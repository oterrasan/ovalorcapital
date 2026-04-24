import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BASE = "https://graph.facebook.com/v25.0";

async function getAccount(accountId) {
  if (accountId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", accountId).single();
    if (data?.active && data?.token) return data;
  }
  const { data } = await supabase.from("ig_accounts").select("*").eq("active", true).not("token", "is", null).order("posts_hoje", { ascending: true }).limit(1);
  return data?.[0] || null;
}

export async function publish(imageUrl, caption, accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa com token disponível");

  const { ig_user_id, token } = account;
  if (!ig_user_id || !token) throw new Error("Conta sem ig_user_id ou token: " + account.username);

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

  return { id: pubData.id, account_id: account.id, username: account.username };
}

export async function postComment(mediaId, text, token) {
  if (!token) return null;
  const res = await fetch(`${BASE}/${mediaId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: token })
  });
  return await res.json();
}

export { getAccount };
