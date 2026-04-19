import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Credenciais fixas das duas contas
const ACCOUNTS = [
  { username: "ovalorcapital", password: "2025acabando!" },
  { username: "oterrasan",     password: "11061983éanovasenh@!" },
];

const clients = {};

async function getClient(username, password) {
  if (clients[username]) return clients[username];
  const { IgApiClient } = require("instagram-private-api");
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  await ig.simulate.preLoginFlow();
  await ig.account.login(username, password);
  await ig.simulate.postLoginFlow();
  clients[username] = ig;
  return ig;
}

async function getBestAccount() {
  // Pega conta ativa com menos posts hoje
  const { data } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("active", true)
    .eq("distribuicao_automatica", true)
    .order("posts_hoje", { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

export async function publish(imageUrl, caption) {
  const account = await getBestAccount();
  if (!account) throw new Error("Nenhuma conta Instagram ativa disponível");

  const creds = ACCOUNTS.find(a => a.username === account.username);
  if (!creds) throw new Error("Credenciais não encontradas para: " + account.username);

  const ig = await getClient(creds.username, creds.password);

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

export async function postComment(mediaId, text, username) {
  const creds = ACCOUNTS.find(a => a.username === (username || "ovalorcapital"));
  if (!creds) throw new Error("Credenciais não encontradas");
  const ig = await getClient(creds.username, creds.password);
  return await ig.media.comment({ mediaId, text });
}

export async function getAccount(accountId) {
  if (accountId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", accountId).single();
    if (data?.active) return data;
  }
  return await getBestAccount();
}
