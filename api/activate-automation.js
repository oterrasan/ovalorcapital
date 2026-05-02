import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "https://bfsegqdgscudtdgwdyci.supabase.co",
  process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc2VncWRnc2N1ZHRkZ3dkeWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDUyOTQyMCwiZXhwIjoxOTkwMTA1NDIwfQ.WmkHzK33qqtlvtal92WXVeyIE1DGRZOrw_pZtPGeV50"
);

export default async function handler(req, res) {
  try {
    // 1. Ativar automação
    await supabase.from("config").delete().eq("key", "AUTOMATION");
    const { error: err1 } = await supabase
      .from("config")
      .insert([{ key: "AUTOMATION", value: "on" }]);

    if (err1) throw new Error(err1.message);

    // 2. Adicionar RSS sources
    await supabase.from("rss_sources").delete().gte("id", "00000000-0000-0000-0000-000000000000");
    
    const { error: err2 } = await supabase
      .from("rss_sources")
      .insert([
        { name: "Google News Brasil", url: "https://news.google.com/rss/search?q=brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", active: true },
        { name: "G1 Brasil", url: "https://g1.globo.com/rss/feeds/latest.xml", active: true },
        { name: "Folha de S.Paulo", url: "https://feeds.folha.uol.com.br/mercado/rss091.xml", active: true },
        { name: "Valor Econômico", url: "https://www.valor.com.br/rss", active: true },
        { name: "Infomoney", url: "https://www.infomoney.com.br/feed/", active: true }
      ]);

    if (err2) throw new Error(err2.message);

    return res.status(200).json({ 
      status: "ok",
      automation: "ativada",
      rss_sources: 5
    });
  } catch(e) {
    console.error("Erro:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
