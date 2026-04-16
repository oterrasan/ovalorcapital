import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const { data } = await supabase
      .from("config").select("value").eq("key", "AUTOMATION").single();
    const running = data?.value === "on";

    const today = new Date().toISOString().split("T")[0];
    const { count: postsHoje } = await supabase
      .from("posts").select("*", { count: "exact", head: true })
      .gte("created_at", today).eq("status", "success");

    const { count: pendentes } = await supabase
      .from("posts").select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    const { count: erros } = await supabase
      .from("posts").select("*", { count: "exact", head: true })
      .eq("status", "error");

    return res.status(200).json({
      running,
      posts_hoje: postsHoje || 0,
      max_posts: 60,
      pendentes: pendentes || 0,
      erros: erros || 0
    });
  } catch(e) {
    return res.status(200).json({ running: false, posts_hoje: 0, max_posts: 60, pendentes: 0, erros: 0 });
  }
}
