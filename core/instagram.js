import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://graph.facebook.com/v25.0";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function getAccount(accountId) {
  if (accountId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", accountId).single();
    if (data?.active) return data;
  }
  // Distribuição automática — pega conta ativa com menor posts_hoje
  const { data } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("active", true)
    .eq("distribuicao_automatica", true)
    .order("posts_hoje", { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

export async function publish(imageUrl, caption, accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa disponível");

  const { ig_user_id, token } = account;

  const create = await axios.post(`${BASE}/${ig_user_id}/media`, {
    image_url: imageUrl,
    caption,
    access_token: token
  });

  const pub = await axios.post(`${BASE}/${ig_user_id}/media_publish`, {
    creation_id: create.data.id,
    access_token: token
  });

  // Atualizar contador de posts da conta
  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  return { id: pub.data.id, account_id: account.id, username: account.username };
}

export async function postComment(mediaId, text, token) {
  try {
    const res = await axios.post(`${BASE}/${mediaId}/comments`, {
      message: text,
      access_token: token
    });
    return res.data;
  } catch(e) {
    console.error("Erro ao postar comentário:", e.message);
    return null;
  }
}
