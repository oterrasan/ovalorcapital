import { createClient } from "@supabase/supabase-js";
import { publish, postComment, getAccount } from "./instagram.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MAX_POSTS_DIA = 60;

export const db = {
  async countToday() {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .eq("status", "success");
    return count || 0;
  },

  async exists(hash) {
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("hash", hash)
      .limit(1);
    return data && data.length > 0;
  },

  async insert(data) {
    const { data: result, error } = await supabase.from("posts").insert([{
      ...data,
      updated_at: new Date().toISOString()
    }]).select().single();
    if (error) throw new Error(error.message);
    return result;
  },

  async approve(id) {
    const { data, error } = await supabase
      .from("posts").select("*").eq("id", id).single();
    if (error || !data) return { ok: false, error: "post_not_found" };
    if (data.status !== "pendente") return { ok: false, error: "not_pending" };

    // Verificar limite diário
    const count = await this.countToday();
    if (count >= MAX_POSTS_DIA) return { ok: false, error: "limite_diario_atingido" };

    try {
      const ig = await publish(data.imagem, data.conteudo, data.ig_account_id);

      // Postar comentário fixado
      if (data.comentario_fixado) {
        const account = await getAccount(data.ig_account_id);
        if (account) await postComment(ig.id, data.comentario_fixado, account.token);
      }

      await supabase.from("posts").update({
        status: "success",
        ig_id: ig.id,
        ig_account_id: ig.account_id,
        updated_at: new Date().toISOString()
      }).eq("id", id);

      return { ok: true, ig_id: ig.id };
    } catch(e) {
      await supabase.from("posts").update({
        status: "error",
        error_msg: e.message,
        updated_at: new Date().toISOString()
      }).eq("id", id);
      return { ok: false, error: e.message };
    }
  },

  async approveBatch(ids) {
    const results = [];
    for (const id of ids) {
      const r = await this.approve(id);
      results.push({ id, ...r });
    }
    return results;
  },

  async retry(id) {
    await supabase.from("posts").update({
      status: "pendente",
      error_msg: null,
      updated_at: new Date().toISOString()
    }).eq("id", id).eq("status", "error");
    return { ok: true };
  }
};
