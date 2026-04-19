import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CREDENTIALS = {
  "ovalorcapital": "2025acabando!",
  "oterrasan": "11061983éanovasenh@!",
};

const clients = {};

async function getClient(username) {
  if (clients[username]) return clients[username];
  const password = CREDENTIALS[username];
  if (!password) throw new Error("Credenciais não encontradas para: " + username);
  const { IgApiClient } = require("instagram-private-api");
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  await ig.simulate.preLoginFlow();
  await ig.account.login(username, password);
  await ig.simulate.postLoginFlow();
  clients[username] = ig;
  return ig;
}

export async function getAccount(accountId) {
  if (accountId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", accountId).single();
    if (data?.active) return data;
  }
  // Sem accountId: pega a primeira ativa
  const { data } = await supabase.from("ig_accounts").select("*").eq("active", true).limit(1);
  return data?.[0] || null;
}

export async function publish(imageUrl, caption, accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta Instagram ativa disponível");

  const ig = await getClient(account.username);

  const nodeFetch = (await import("node-fetch")).default;
  const resp = await nodeFetch(imageUrl);
  if (!resp.ok) throw new Error("Falha ao baixar imagem: " + imageUrl);
  const buffer = Buffer.from(await resp.arrayBuffer());

  const result = await ig.publish.photo({ file: buffer, caption });

  await supabase.from("ig_accounts").update({
    posts_hoje: (account.posts_hoje || 0) + 1,
    ultima_atividade: new Date().toISOString()
  }).eq("id", account.id);

  return { id: result.media.id };
}

export async function postComment(mediaId, text, accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Nenhuma conta disponível");
  const ig = await getClient(account.username);
  return await ig.media.comment({ mediaId, text });
}
