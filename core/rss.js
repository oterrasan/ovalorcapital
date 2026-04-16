import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function getNews() {
  try {
    const { data: sources } = await supabase
      .from("rss_sources")
      .select("url, name")
      .eq("active", true);

    if (!sources?.length) return [];

    const source = sources[Math.floor(Math.random() * sources.length)];
    const feed = await parser.parseURL(source.url);

    return feed.items.slice(0, 10).map(i => ({
      title: i.title,
      link: i.link,
      source: source.name
    }));
  } catch(e) {
    return [];
  }
}
