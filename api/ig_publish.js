import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { post_id, image_url, caption } = req.body || {};

    // Buscar URL do serviço Instagram
    const { data: cfg } = await supabase
      .from("config").select("value").eq("key", "IG_SERVICE_URL").single();
    const serviceUrl = cfg?.value;

    if (!serviceUrl) {
      return res.status(400).json({ ok: false, error: "IG_SERVICE_URL não configurada" });
    }

    // Chamar serviço Instagram server-side (sem CORS)
    const r = await fetch(`${serviceUrl}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url, caption })
    });

    const data = await r.json();

    if (data.ok && post_id) {
      await supabase.from("posts").update({
        ig_published: true,
        ig_published_at: new Date().toISOString()
      }).eq("id", post_id);
    }

    return res.status(r.ok ? 200 : 500).json(data);

  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
