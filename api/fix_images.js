import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PIXABAY_KEY = "47979250-ae3f5a24b1e3f7e2fce76eab5";

const TRAD = {
  "lula":"lula brazil president","bolsonaro":"bolsonaro brazil",
  "trump":"trump usa","kremlin":"kremlin russia","obama":"obama politician",
  "zelensky":"ukraine president","petrobras":"petrobras oil",
  "bitcoin":"bitcoin cryptocurrency","selic":"interest rate brazil",
  "palmeiras":"palmeiras football","flamengo":"flamengo football",
  "corinthians":"corinthians football","congresso":"brazil congress",
  "stf":"supreme court brazil","planalto":"brazil government",
  "inflação":"inflation economy","milei":"argentina president",
  "gilmar":"supreme court judge","zema":"governor brazil",
  "haddad":"minister finance","psg":"psg paris football",
  "petróleo":"oil petroleum","futebol":"football soccer",
  "banco":"bank finance","mercado":"stock market",
  "saúde":"health medicine","tecnologia":"technology digital",
  "educação":"education school","reforma":"reform politics",
  "imposto":"tax revenue","eleição":"election voting",
};

function extrairTermos(titulo) {
  const tl = titulo.toLowerCase();
  for (const [pt, en] of Object.entries(TRAD)) {
    if (tl.includes(pt)) return en;
  }
  const stop = new Set(["para","com","sem","por","que","uma","das","dos","nos",
    "após","sobre","não","mais","mas","foi","são","esta","esse","novo","pelo","tem","vai"]);
  const words = titulo.replace(/[^\w\s]/g," ").split(/\s+/).filter(w => w.length>3 && !stop.has(w.toLowerCase()));
  return words.slice(0,3).join(" ") || "brazil news";
}

async function buscarPixabay(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&min_width=800&per_page=8&safesearch=true`;
    const r = await fetch(url, { headers: {"User-Agent":"OVC/1.0"}, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.hits || []).map(h => h.largeImageURL).filter(Boolean);
  } catch { return []; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.headers["x-admin-token"] !== "ovc2026fix") return res.status(401).end();

  const { cursor = null } = req.query;

  try {
    // Buscar posts com imagem Unsplash (as repetidas)
    let query = supabase.from("posts")
      .select("id,titulo,imagem,user_tags,published_at")
      .eq("status", "publicado")
      .ilike("imagem", "%unsplash%")
      .order("published_at", { ascending: true })
      .limit(40);

    if (cursor) query = query.gt("published_at", decodeURIComponent(cursor));

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);
    if (!posts?.length) return res.status(200).json({ done: true, corrigidos: 0, processados: 0 });

    // Imagens já usadas no banco (para anti-repetição)
    const { data: usadas_raw } = await supabase.from("posts")
      .select("imagem").eq("status","publicado")
      .not("imagem","is",null)
      .not("imagem","ilike","%unsplash%")
      .limit(600);
    const usadas = new Set((usadas_raw||[]).map(p => p.imagem).filter(Boolean));

    let corrigidos = 0;
    const inicio = Date.now();

    for (const p of posts) {
      if (Date.now() - inicio > 50000) break;

      const titulo = p.titulo || "";
      const termos = extrairTermos(titulo);

      let nova = null;
      for (const q of [termos, "brazil news politics"]) {
        const candidatos = await buscarPixabay(q);
        const unica = candidatos.find(c => !usadas.has(c));
        if (unica) { nova = unica; break; }
        await new Promise(r => setTimeout(r, 100));
      }

      if (nova) {
        const { error: pe } = await supabase.from("posts").update({ imagem: nova }).eq("id", p.id);
        if (!pe) { usadas.add(nova); corrigidos++; }
      }

      await new Promise(r => setTimeout(r, 80));
    }

    const proxCursor = posts[posts.length - 1]?.published_at || null;
    const done = posts.length < 40;

    return res.status(200).json({ done, corrigidos, processados: posts.length, proxCursor });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
