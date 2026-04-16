import { createClient } from "@supabase/supabase-js";
import { publish, postComment, sendCollabInvite } from "./instagram.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const COLAB_ACCOUNTS = [
  "oterrasan",
  "blogdoterra",
  "adriana.ferreirasp",
  "redacao_ovc",
  "grupoterrasan"
];

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
    return supabase.from("posts").insert([data]);
  },

  async approve(id) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return { ok: false, error: "post_not_found" };
    if (data.status !== "pendente") return { ok: false, error: "not_pending" };

    try {
      // Publicar no Instagram
      const ig = await publish(data.imagem, data.conteudo);
      const mediaId = ig.id;

      // Postar comentário fixado
      if (data.comentario_fixado) {
        try {
          await postComment(mediaId, data.comentario_fixado);
        } catch(e) {
          console.error("Erro comentario fixado:", e.message);
        }
      }

      // Enviar convites de colaboração
      try {
        await sendCollabInvite(mediaId, COLAB_ACCOUNTS);
      } catch(e) {
        console.error("Erro colabs:", e.message);
      }

      await supabase.from("posts").update({
        status: "success",
        ig_id: mediaId,
        colabs_enviados: true
      }).eq("id", id);

      return { ok: true, ig_id: mediaId };
    } catch (e) {
      await supabase.from("posts").update({ status: "error" }).eq("id", id);
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
  }
};
