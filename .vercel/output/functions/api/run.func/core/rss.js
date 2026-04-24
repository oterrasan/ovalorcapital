import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function getNews() {
  try {
    const { data: sources } = await supabase
      .from("rss_sources")
      .select("url,name")
      .eq("active", true);

    if (!sources?.length) return [];

    // Tenta cada fonte em ordem até conseguir itens
    const shuffled = sources.sort(() => Math.random() - 0.5);
    for (const source of shuffled) {
      try {
        const feed = await parser.parseURL(source.url);
        if (feed.items?.length) {
          return feed.items.slice(0, 10).map(i => ({
            title: i.title,
            link: i.link || i.guid,
            source: source.name,
            description: i.contentSnippet || i.summary || i.description || i.content || ""
          })).filter(i => i.link);
        }
      } catch(_) { continue; }
    }
    return [];
  } catch(e) {
    return [];
  }
}