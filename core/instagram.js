import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const IG_USERNAME = process.env.IG_USERNAME || "ovalorcapital";
const IG_PASSWORD = process.env.IG_PASSWORD || "2025acabando!";

let igClient = null;

async function getIgClient() {
  if (igClient) return igClient;
  const { IgApiClient } = require("instagram-private-api");
  const ig = new IgApiClient();
  ig.state.generateDevice(IG_USERNAME);
  await ig.simulate.preLoginFlow();
  await ig.account.login(IG_USERNAME, IG_PASSWORD);
  await ig.simulate.postLoginFlow();
  igClient = ig;
  return ig;
}

export async function publish(imageUrl, caption) {
  const ig = await getIgClient();

  // Baixar imagem como buffer
  const fetch = (await import("node-fetch")).default;
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error("Falha ao baixar imagem: " + imageUrl);
  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await ig.publish.photo({
    file: buffer,
    caption: caption,
  });

  const mediaId = result.media.id;

  // Registrar no Supabase qual conta foi usada
  await supabase.from("ig_accounts")
    .update({ posts_hoje: supabase.rpc("increment", { x: 1 }), ultima_atividade: new Date().toISOString() })
    .eq("username", IG_USERNAME);

  return { id: mediaId };
}

export async function postComment(mediaId, text) {
  const ig = await getIgClient();
  const result = await ig.media.comment({ mediaId, text });
  return result;
}

export async function getAccount() {
  const { data } = await supabase.from("ig_accounts")
    .select("*").eq("username", IG_USERNAME).single();
  return data;
}
