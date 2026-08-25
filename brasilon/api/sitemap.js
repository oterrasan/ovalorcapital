// Brasil ON — sitemap dinâmico. Volume bem menor que o OVC (só 2
// categorias), então um único urlset é suficiente — sem sitemapindex.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BASE = "https://www.obrasilon.com.br";
const STATIC_PATHS = ["/", "/brasil-on/", "/futebol/"];

function slugify(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 55);
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");

  try {
    const { data: posts, error } = await supabase.from("brasilon_posts")
      .select("id,titulo,categoria,published_at,updated_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(2000);
    if (error) throw error;

    const staticXml = STATIC_PATHS.map(p => `  <url><loc>${BASE}${p}</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`);
    const postsXml = (posts || []).map(p => {
      const id8 = String(p.id).slice(0, 8);
      const slug = slugify(p.titulo || "");
      const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
      return `  <url><loc>${BASE}/${p.categoria}/${slug}-${id8}/</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.8</priority></url>`;
    });

    const xml = [...staticXml, ...postsXml].join("\n");
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
  } catch (error) {
    const xml = STATIC_PATHS.map(p => `  <url><loc>${BASE}${p}</loc></url>`).join("\n");
    res.setHeader("X-Brasilon-Fallback", "static-only");
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
  }
}
