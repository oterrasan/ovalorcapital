import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    return res.status(200).json(data||[]);
  }
  if (req.method === "POST") {
    const { id } = req.body||{};
    if (id) {
      await supabase.from("alerts").update({ read: true }).eq("id", id);
    } else {
      await supabase.from("alerts").update({ read: true }).eq("read", false);
    }
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: "method_not_allowed" });
}
