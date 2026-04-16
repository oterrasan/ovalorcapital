import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    const { data } = await supabase.from("config").select("value").eq("key","AUTOMATION").single();
    if (!data || data.value !== "on") return res.status(200).json({ status: "automation_paused" });
    
    const { data: news } = await supabase.from("rss_sources").select("url,name").eq("active",true).limit(1);
    return res.status(200).json({ status: "ok", sources: news?.length || 0, env_ok: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
