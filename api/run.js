import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const log = [];
  try {
    log.push("checking automation...");
    const { data } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!data || data.value !== "on") return res.status(200).json({ status: "automation_paused" });
    
    log.push("importing pipeline...");
    const { run_pipeline } = await import("../core/pipeline.js");
    
    log.push("running pipeline...");
    const result = await run_pipeline();
    return res.status(200).json({ ...result, log });
  } catch (e) {
    return res.status(200).json({ error: e.message, stack: e.stack?.split("
").slice(0,5), log });
  }
}
