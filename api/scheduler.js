import { runScheduler } from "../core/publish_engine.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const { data: cfg } = await supabase
      .from("config").select("value").eq("key", "AUTOMATION").single();
    if (!cfg || cfg.value !== "on") {
      return res.status(200).json({ status: "automation_paused" });
    }

    const result = await runScheduler();

    if (result.processed > 0) {
      await supabase.from("logs").insert([{
        level: "info",
        message: `scheduler executado: ${result.processed} post(s) publicado(s)`
      }]);
    }

    return res.status(200).json({ status: "ok", scheduler: "ran", ...result });
  } catch(e) {
    await supabase.from("logs").insert([{
      level: "error",
      message: `scheduler error: ${e.message}`
    }]).catch(()=>{});
    return res.status(200).json({ status: "error", error: e.message });
  }
}
