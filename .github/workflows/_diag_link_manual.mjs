import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const src = readFileSync("api/manage.js", "utf8");
const key = src.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"]+/)[0];
const sb = createClient("https://yntwvfcxjardzafdqanj.supabase.co", key);
const { data, error } = await sb.from("posts")
  .select("id,titulo,status,imagem,video_url,created_at,error_msg,metrics")
  .eq("publish_method", "link_manual").order("created_at", { ascending: false }).limit(20);
if (error) { console.log("ERRO", error.message); process.exit(0); }
for (const p of data) {
  const m = typeof p.metrics === "string" ? JSON.parse(p.metrics || "{}") : (p.metrics || {});
  const t = m.instagram_reel_template || null;
  console.log(JSON.stringify({
    id: p.id, created: p.created_at, status: p.status, titulo: (p.titulo || "").slice(0, 70),
    imagem: !!p.imagem, video_url: !!p.video_url, link: m.fonte_link_manual,
    tpl: t ? { status: t.status, kind: t.source_kind, attempts: t.attempts, exhausted: t.exhausted, err: (t.last_error || "").slice(0, 300) } : null,
    reel: m.instagram_reel ? { ig_id: m.instagram_reel.ig_id } : null,
    error_msg: (p.error_msg || "").slice(0, 200)
  }));
}
const { data: logs } = await sb.from("logs").select("created_at,level,message").ilike("message", "%link_manual%").order("created_at", { ascending: false }).limit(20);
console.log("--- LOGS ---");
for (const l of logs || []) console.log(l.created_at, l.level, String(l.message).slice(0, 250));
