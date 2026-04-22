import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// IDs e categorias fixas
const FIXES = [
  { id: "75784627-af17-43d7-880c-f4ed4603510b", cat: "tecnologia" },  // Tubarões Quentes
  { id: "601b2e0a-54ec-48b5-a0f9-5f389dbc1243", cat: "cultura"    },  // BBB26 Visita
  { id: "dbd2728f-584a-4ff7-9640-16b063580aae", cat: "tributacao" },  // IR 2026
  { id: "6ba269ba-bb4d-495f-b7ea-ee5a707e837b", cat: "tributacao" },  // IR 2026
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const results = [];
  for (const { id, cat } of FIXES) {
    const { data: post } = await supabase.from("posts").select("user_tags").eq("id", id).single();
    if (!post) { results.push({ id, status: "not_found" }); continue; }
    let tags = [];
    try { tags = JSON.parse(post.user_tags || "[]"); } catch(_) {}
    tags[0] = cat;
    const { error } = await supabase.from("posts")
      .update({ user_tags: JSON.stringify(tags) }).eq("id", id);
    results.push({ id: id.slice(0,8), cat, status: error ? "erro" : "ok" });
  }
  return res.status(200).json({ results });
}
