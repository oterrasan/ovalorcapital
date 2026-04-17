import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BASE = "https://graph.facebook.com/v25.0";

export default async function handler(req, res) {
  try {
    // Buscar posts publicados nas últimas 48h com ig_id
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: posts } = await supabase
      .from("posts")
      .select("id,ig_id,ig_account_id")
      .eq("status", "success")
      .not("ig_id", "is", null)
      .gte("published_at", cutoff)
      .limit(20);

    if (!posts?.length) return res.status(200).json({ status: "no_posts" });

    // Buscar tokens das contas
    const accountIds = [...new Set(posts.map(p => p.ig_account_id).filter(Boolean))];
    const { data: accounts } = await supabase
      .from("ig_accounts").select("id,token").in("id", accountIds);
    const tokenMap = {};
    (accounts||[]).forEach(a => tokenMap[a.id] = a.token);

    const results = [];
    for (const post of posts) {
      const token = tokenMap[post.ig_account_id] || process.env.IG_ACCESS_TOKEN;
      if (!token || !post.ig_id) continue;

      try {
        const r = await fetch(
          `${BASE}/${post.ig_id}/insights?metric=impressions,reach,likes_count,comments_count&period=lifetime&access_token=${token}`
        );
        if (!r.ok) continue;
        const data = await r.json();

        const metrics = {};
        (data.data||[]).forEach(m => metrics[m.name] = m.values?.[0]?.value || 0);

        const views = metrics.impressions || metrics.reach || 0;
        const likes = metrics.likes_count || 0;
        const comments = metrics.comments_count || 0;
        const engagement = views > 0 ? ((likes + comments) / views * 100) : 0;

        // Upsert métricas
        await supabase.from("post_metrics").upsert({
          post_id: post.id,
          views, likes, comments,
          engagement_rate: Math.round(engagement * 100) / 100,
          collected_at: new Date().toISOString()
        }, { onConflict: "post_id" });

        // Atualizar metrics no post
        await supabase.from("posts").update({
          metrics: { views, likes, comments, engagement_rate: engagement }
        }).eq("id", post.id);

        results.push({ id: post.id, views, likes, comments });
      } catch(_) { continue; }
    }

    return res.status(200).json({ status: "ok", collected: results.length, results });
  } catch(e) {
    return res.status(200).json({ status: "error", error: e.message });
  }
}
