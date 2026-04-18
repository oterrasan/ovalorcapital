import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { filename, contentType, data } = req.body;
    if (!filename || !data) return res.status(400).json({ error: "filename e data obrigatorios" });

    // Converter base64 para buffer
    const buffer = Buffer.from(data, "base64");
    const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, buffer, { contentType: contentType || "image/jpeg", upsert: true });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);

    return res.status(200).json({ url: urlData.publicUrl, path });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
