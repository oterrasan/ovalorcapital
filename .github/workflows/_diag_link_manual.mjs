import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const src = readFileSync("api/manage.js", "utf8");
const key = src.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"]+/)[0];
const sb = createClient("https://yntwvfcxjardzafdqanj.supabase.co", key);
const { data: acc } = await sb.from("ig_accounts").select("username,ig_user_id,token").eq("username", "ovalorcapital").eq("active", true).limit(1);
const a = acc?.[0];
if (!a?.token) { console.log("sem conta"); process.exit(0); }
for (const alvo of ["g1", "cnnbrasil", "metropoles"]) {
  const url = `https://graph.facebook.com/v25.0/${a.ig_user_id}?fields=business_discovery.username(${alvo}){username,media.limit(6){media_type,media_product_type,permalink,caption,media_url,thumbnail_url}}&access_token=${encodeURIComponent(a.token)}`;
  const r = await fetch(url); const j = await r.json();
  if (j.error) { console.log(alvo, "ERRO", JSON.stringify(j.error).slice(0, 300)); continue; }
  for (const m of j.business_discovery?.media?.data || []) {
    console.log(alvo, JSON.stringify({ tipo: m.media_type, prod: m.media_product_type, link: m.permalink, tem_video_url: !!m.media_url && m.media_type === "VIDEO", host: m.media_url ? new URL(m.media_url).host : null, legenda: (m.caption || "").slice(0, 80) }));
  }
}
