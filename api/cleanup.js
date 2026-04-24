import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.query.token !== "ovc2026clean") return res.status(401).json({ error: "unauthorized" });

  const results = {};

  // Limpar posts
  const { error: e1, count: c1 } = await supabase.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  results.posts = e1 ? e1.message : "ok";

  // Limpar alerts
  const { error: e2 } = await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  results.alerts = e2 ? e2.message : "ok";

  // Limpar logs
  const { error: e3 } = await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  results.logs = e3 ? e3.message : "ok";

  return res.status(200).json({ status: "done", results });
}
// Fri Apr 24 20:51:32 UTC 2026
