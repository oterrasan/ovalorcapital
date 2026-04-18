import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    // Criar bucket post-images se não existir
    const { error: bucketErr } = await supabase.storage.createBucket("post-images", { public: true });
    const bucketStatus = bucketErr?.message?.includes("already exists") ? "ja_existe" : (bucketErr ? bucketErr.message : "criado");

    return res.status(200).json({ bucket: bucketStatus, info: "Execute no Supabase SQL Editor: ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_override text;" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
