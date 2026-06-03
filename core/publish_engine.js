import { createClient } from "@supabase/supabase-js";
import { publish, postComment } from "./instagram.js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

async function getConfig() {
  const { data } = await supabase.from("config").select("key,value");
  const cfg = {};
  (data||[]).forEach(c => cfg[c.key] = c.value);
  return {
    maxPostsDia: parseInt(cfg.MAX_POSTS_DIA)||300,
    minInterval: parseInt(cfg.MIN_INTERVAL)||180,
    maxInterval: parseInt(cfg.MAX_INTERVAL)||900,
    enableExecutor: cfg.ENABLE_EXECUTOR === 'true',
    autoRetry: cfg.AUTO_RETRY !== 'false',
    dailyTarget: parseInt(cfg.DAILY_TARGET)||100,
  };
}

async function countTodayByAccount(accountId) {
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("ig_account_id", accountId)
    .eq("status", "success")
    .gte("published_at", today);
  return count || 0;
}

async function getBestAccount(preferredId) {
  if (preferredId) {
    const { data } = await supabase.from("ig_accounts").select("*").eq("id", preferredId).single();
    if (data?.active) return data;
  }
  const { data: accounts } = await supabase
    .from("ig_accounts")
    .select("*")
    .eq("active", true)
    .eq("distribuicao_automatica", true)
    .order("posts_hoje", { ascending: true });

  for (const acc of (accounts||[])) {
    const todayCount = await countTodayByAccount(acc.id);
    if (todayCount < (acc.limite_diario||25)) return acc;
  }
  return null;
}

async function createAlert(type, message) {
  await supabase.from("alerts").insert([{ type, message }]);
}

async function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay * 1000));
}

export async function publishPost(postId) {
  const { data: post, error } = await supabase
    .from("posts").select("*").eq("id", postId).single();

  if (error || !post) return { ok: false, error: "post_not_found" };
  if (!["pending", "approved", "scheduled", "error", "pendente"].includes(post.status)) {
    return { ok: false, error: "invalid_status: " + post.status };
  }

  const cfg = await getConfig();

  if (post.status === "error") {
    if (post.retry_count >= post.max_retries) {
      return { ok: false, error: "max_retries_reached" };
    }
  }

  const account = await getBestAccount(post.ig_account_id);
  if (!account) {
    await createAlert("error", `Nenhuma conta disponível para publicar: ${post.titulo}`);
    return { ok: false, error: "no_account_available" };
  }

  const todayCount = await countTodayByAccount(account.id);
  const method = todayCount < 25 ? "api" : "executor";

  await supabase.from("posts").update({
    status: "publishing",
    publish_method: method,
    ig_account_id: account.id,
    updated_at: new Date().toISOString()
  }).eq("id", postId);

  try {
    // USAR image_override se existir, senão imagem padrão
    const image = post.image_override || post.imagem;

    const ig = await publish(image, post.conteudo, account.id);

    if (post.comentario_fixado) {
      try {
        await postComment(ig.id, post.comentario_fixado, account.token);
      } catch(e) {
        await createAlert("error", `Erro ao postar comentário em ${post.titulo}: ${e.message}`);
      }
    }

    await supabase.from("post_metrics").insert([{
      post_id: postId,
      views: 0, likes: 0, comments: 0, engagement_rate: 0
    }]);

    await supabase.from("posts").update({
      status: "success",
      ig_id: ig.id,
      ig_account_id: account.id,
      published_at: new Date().toISOString(),
      approved: true,
      updated_at: new Date().toISOString()
    }).eq("id", postId);

    await supabase.from("ig_accounts").update({
      posts_hoje: (account.posts_hoje||0) + 1,
      ultima_atividade: new Date().toISOString()
    }).eq("id", account.id);

    return { ok: true, ig_id: ig.id, method, account: account.username };

  } catch(e) {
    const newRetry = (post.retry_count||0) + 1;
    const nextStatus = newRetry >= post.max_retries ? "error" : "pending";

    await supabase.from("posts").update({
      status: nextStatus,
      retry_count: newRetry,
      error_msg: e.message,
      updated_at: new Date().toISOString()
    }).eq("id", postId);

    await createAlert("error", `Falha ao publicar "${post.titulo}": ${e.message}`);
    return { ok: false, error: e.message, retry_count: newRetry };
  }
}

export async function runScheduler() {
  const now = new Date().toISOString();
  const cfg = await getConfig();

  const { data: scheduled } = await supabase
    .from("posts")
    .select("*")
    .in("status", ["approved", "scheduled"])
    .lte("scheduled_at", now)
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (!scheduled?.length) return { processed: 0 };

  const results = [];
  for (const post of scheduled) {
    if (results.length > 0) {
      await randomDelay(cfg.minInterval, cfg.maxInterval);
    }
    const result = await publishPost(post.id);
    results.push({ id: post.id, titulo: post.titulo, ...result });
  }

  return { processed: results.length, results };
}
