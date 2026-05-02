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

    // Fallback: se não houver sources, usar defaults
    const sourcesToUse = sources?.length ? sources : [
      { url: "https://news.google.com/rss/search?q=brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google News Brasil" },
      { url: "https://g1.globo.com/rss/feeds/latest.xml", name: "G1 Brasil" },
      { url: "https://feeds.folha.uol.com.br/mercado/rss091.xml", name: "Folha de S.Paulo" },
      { url: "https://www.valor.com.br/rss", name: "Valor Econômico" },
      { url: "https://www.infomoney.com.br/feed/", name: "Infomoney" }
    ];

    if (!sourcesToUse?.length) return [];

    // Embaralhar fontes e pegar até 8 fontes diferentes por chamada
    const shuffled = sourcesToUse.sort(() => Math.random() - 0.5).slice(0, 8);

    // Buscar todas em paralelo com timeout individual
    const results = await Promise.allSettled(
      shuffled.map(source =>
        parser.parseURL(source.url)
          .then(feed => (feed.items || []).slice(0, 5).map(i => ({
            title: i.title,
            link: i.link || i.guid,
            source: source.name,
            description: i.contentSnippet || i.summary || i.description || i.content || ""
          })).filter(i => i.link && i.title))
          .catch(() => [])
      )
    );

    // Agregar e embaralhar tudo
    const allItems = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Embaralhar para variar categorias
    return allItems.sort(() => Math.random() - 0.5);

  } catch(e) {
    return [];
  }
}
