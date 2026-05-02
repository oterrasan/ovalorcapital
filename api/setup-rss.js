import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sources = [
      { name: "Google News Brasil", url: "https://news.google.com/rss/search?q=brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR" },
      { name: "G1 Brasil", url: "https://g1.globo.com/rss/feeds/latest.xml" },
      { name: "Folha de S.Paulo", url: "https://feeds.folha.uol.com.br/mercado/rss091.xml" },
      { name: "Valor Econômico", url: "https://www.valor.com.br/rss" },
      { name: "Infomoney", url: "https://www.infomoney.com.br/feed/" }
    ];

    const { data, error } = await supabase
      .from("rss_sources")
      .insert(sources.map(s => ({ ...s, active: true })));

    if (error) {
      console.error("Erro ao inserir RSS sources:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      status: "ok", 
      inserted: sources.length,
      message: "RSS sources adicionadas com sucesso"
    });
  } catch(e) {
    console.error("Erro:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
