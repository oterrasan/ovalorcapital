export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_KEY || "";
  if (!url || !key) {
    return res.status(200).json({ running: false, posts_hoje: 0, max_posts: 60, error: "env_missing" });
  }
  try {
    const r = await fetch(`${url}/rest/v1/config?select=value&key=eq.AUTOMATION`, {
      headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    const data = await r.json();
    const running = Array.isArray(data) && data[0]?.value === "on";
    return res.status(200).json({ running, posts_hoje: 0, max_posts: 60 });
  } catch(e) {
    return res.status(200).json({ running: false, posts_hoje: 0, max_posts: 60, error: e.message });
  }
}
