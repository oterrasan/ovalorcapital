import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const { data: accounts } = await supabase.from("ig_accounts").select("*").eq("active", true).not("token", "is", null);

    const results = [];
    for (const account of (accounts || [])) {
      try {
        const refreshRes = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.token}`);
        const refreshData = await refreshRes.json();

        if (refreshData.access_token) {
          await supabase.from("ig_accounts").update({ token: refreshData.access_token }).eq("id", account.id);
          results.push({ account: account.username, status: "renovado" });
        } else {
          results.push({ account: account.username, status: "erro", detail: refreshData });
        }
      } catch(e) {
        results.push({ account: account.username, status: "erro", detail: e.message });
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
