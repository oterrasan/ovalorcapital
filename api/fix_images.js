import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const FONTES = [
  "https://g1.globo.com/busca/?q=",
  "https://www.cnnbrasil.com.br/busca/?q=",
  "https://www.metropoles.com/busca?q=",
  "https://www.infomoney.com.br/busca/?q=",
  "https://www.gazetadopovo.com.br/busca/?q=",
];

const TRAD = {
  "lula":"lula brazil","bolsonaro":"bolsonaro brazil","trump":"trump usa",
  "kremlin":"kremlin russia","petrobras":"petrobras","bitcoin":"bitcoin",
  "selic":"taxa selic","palmeiras":"palmeiras","flamengo":"flamengo",
  "corinthians":"corinthians","congresso":"congresso nacional",
  "stf":"stf","inflação":"inflação","milei":"milei argentina",
};

function extrairTermos(titulo) {
  const tl = titulo.toLowerCase();
  for (const [pt,en] of Object.entries(TRAD)) {
    if (tl.includes(pt)) return titulo.slice(0,50);
  }
  return titulo.slice(0,50);
}

async function buscarImagemOriginal(titulo) {
  // Buscar no Google News via scraping
  try {
    const q = encodeURIComponent(titulo.slice(0,60));
    const url = `https://news.google.com/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    const html = await r.text();
    const $ = cheerio.load(html);
    
    // Pegar primeira imagem de artigo
    const img = $("article img").first().attr("src") || $("figure img").first().attr("src");
    if (img && img.startsWith("http") && img.match(/\.(jpg|jpeg|png|webp)/i)) {
      return img;
    }
  } catch {}

  // Fallback: buscar via Bing Images
  try {
    const q = encodeURIComponent(titulo.slice(0,50));
    const url = `https://www.bing.com/images/search?q=${q}&first=1&count=5&mkt=pt-BR`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    const html = await r.text();
    // Extrair primeira URL de imagem dos resultados
    const match = html.match(/mediaurl=(https?[^&"]+\.(jpg|jpeg|png|webp))/i);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  } catch {}

  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.headers["x-admin-token"] !== "ovc2026fix") return res.status(401).end();

  const { cursor = null } = req.query;

  try {
    let query = supabase.from("posts")
      .select("id,titulo,imagem,user_tags,published_at")
      .eq("status", "publicado")
      .ilike("imagem", "%unsplash%")
      .order("published_at", { ascending: true })
      .limit(20);

    if (cursor) query = query.gt("published_at", decodeURIComponent(cursor));

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);
    if (!posts?.length) return res.status(200).json({ done: true, corrigidos: 0, processados: 0 });

    const usadas_raw = await supabase.from("posts")
      .select("imagem").eq("status","publicado")
      .not("imagem","is",null).not("imagem","ilike","%unsplash%").limit(600);
    const usadas = new Set((usadas_raw.data||[]).map(p => p.imagem).filter(Boolean));

    let corrigidos = 0;
    const inicio = Date.now();

    for (const p of posts) {
      if (Date.now() - inicio > 50000) break;

      const nova = await buscarImagemOriginal(p.titulo || "");

      if (nova && !usadas.has(nova)) {
        const { error: pe } = await supabase.from("posts").update({ imagem: nova }).eq("id", p.id);
        if (!pe) { usadas.add(nova); corrigidos++; }
      }

      await new Promise(r => setTimeout(r, 200));
    }

    const proxCursor = posts[posts.length - 1]?.published_at || null;

    return res.status(200).json({
      done: posts.length < 20,
      corrigidos,
      processados: posts.length,
      proxCursor
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
