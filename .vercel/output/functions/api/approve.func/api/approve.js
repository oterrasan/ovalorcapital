import { publishPost } from "../core/publish_engine.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { id, ids, action, scheduled_at } = req.body || {};

  try {
    if (action === "retry" && id) {
      await supabase.from("posts").update({
        status: "pending", error_msg: null, retry_count: 0,
        updated_at: new Date().toISOString()
      }).eq("id", id);
      return res.status(200).json({ ok: true });
    }

    if (action === "approve" && id) {
      await supabase.from("posts").update({
        status: "approved", approved: true,
        updated_at: new Date().toISOString()
      }).eq("id", id);
      return res.status(200).json({ ok: true });
    }

    if (action === "schedule" && id) {
      await supabase.from("posts").update({
        status: "scheduled", approved: true, scheduled_at,
        updated_at: new Date().toISOString()
      }).eq("id", id);
      return res.status(200).json({ ok: true });
    }

    if (id && !ids) {
      await supabase.from("posts").update({ approved: true, status: "approved", updated_at: new Date().toISOString() }).eq("id", id);
      const result = await publishPost(id);
      return res.status(200).json(result);
    }

    if (ids && Array.isArray(ids)) {
      const results = [];
      for (const pid of ids) {
        await supabase.from("posts").update({ approved: true }).eq("id", pid);
        const r = await publishPost(pid);
        results.push({ id: pid, ...r });
      }
      return res.status(200).json({ status: "batch", results });
    }

    return res.status(400).json({ error: "missing_params" });
  } catch(e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
