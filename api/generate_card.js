import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import path from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { titulo, categoria, imagem_url, post_id } = req.body || {};
  if (!titulo || !categoria) return res.status(400).json({ error: "titulo e categoria obrigatórios" });

  try {
    const scriptPath = path.join(process.cwd(), "core", "card_generator.py");
    const outPath = `/tmp/card_${post_id || Date.now()}.jpg`;

    // Gerar card via Python
    const args = [
      JSON.stringify(titulo),
      categoria,
      imagem_url || ""
    ].map(a => `'${a.replace(/'/g, "\\'")}'`).join(" ");

    execSync(`python3 ${scriptPath} ${args} > ${outPath}`, { timeout: 30000 });

    const cardBuffer = readFileSync(outPath);
    unlinkSync(outPath);

    // Upload para Supabase Storage
    const fileName = `cards/${post_id || Date.now()}_${categoria}.jpg`;
    const { data, error } = await supabase.storage
      .from("ovc-media")
      .upload(fileName, cardBuffer, {
        contentType: "image/jpeg",
        upsert: true
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from("ovc-media").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // Atualizar post se post_id fornecido
    if (post_id) {
      await supabase.from("posts").update({ imagem: publicUrl }).eq("id", post_id);
    }

    return res.status(200).json({ ok: true, url: publicUrl });

  } catch(e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
