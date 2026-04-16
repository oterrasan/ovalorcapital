import { createClient } from "@supabase/supabase-js";
import { run_pipeline } from "../core/pipeline.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const { data } = await supabase
      .from("config").select("value").eq("key", "AUTOMATION").single();
    if (!data || data.value !== "on") {
      return res.status(200).json({ status: "automation_paused" });
    }
    const result = await run_pipeline();
    return res.status(200).json(result);
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
