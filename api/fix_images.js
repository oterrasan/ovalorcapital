import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PIXABAY_KEY = "47979250-ae3f5a24b1e3f7e2fce76eab5";

const BLOQUEIO = ['autor','reporter','jornalista','author','profile','headshot','avatar','byline','colunista'];
const TRAD = {
  "lula":"lula brazil","bolsonaro":"bolsonaro brazil","trump":"trump usa",
  "kremlin":"kremlin russia","petrobras":"petrobras oil","bitcoin":"bitcoin",
  "selic":"interest rate brazil","palmeiras":"palmeiras football",
  "flamengo":"flamengo football","congresso":"brazil congress",
  "stf":"supreme court brazil","inflação":"inflation brazil",
  "gilmar":"supreme court brazil","zema":"governor brazil","haddad":"minister brazil"
};

function extrairTermos(titulo) {
  const tl = titulo.toLowerCase();
  for (const [pt, en] of Object.entries(TRAD)) {
    if (tl.includes(pt)) return en;
  }
  const stop = new Set(["para","com","sem","por","que","uma","das","dos","nos","após","sobre","não","mais","mas","foi","são","esta","esse"]);
  const words = titulo.replace(/[^\w\s]/g," ").split(/\s+/).filter(w => w.length>3 && !stop.has(w.toLowerCase()));
  return words.slice(0,3).join(" ") || "brazil";
}

function imagemRuim(url) {
  if (!url) return true;
  const ul = url.toLowerCase();
  if (BLOQUEIO.some(p => ul.includes(p))) return true;
  if (ul.endsWith(".svg")) return true;
  const ruim = ["photo-1529107386315","photo-1540910419892","photo-1552674605","photo-1571019613"];
  return ruim.some(p => ul.includes(p));
}

async function buscarPixabay(query) {
  try {
    const q = encodeURIComponent(query);
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`;
    const r = await fetch(url, { headers: { "User-Agent": "OVC/1.0" }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const d = await r.json();
    return d.hits?.[0]?.largeImageURL || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Segurança: só aceita com token
  if (req.headers["x-admin-token"] !== "ovc2026fix") {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { cursor = null, lote = 0 } = req.query;
  const inicio = Date.now();

  try {
    let query = supabase.from("posts")
      .select("id,titulo,imagem,user_tags")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .limit(30);

    if (cursor) query = query.lt("published_at", cursor);

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);
    if (!posts?.length) return res.status(200).json({ done: true, lote, corrigidos: 0 });

    // Buscar imagens já usadas para anti-repetição
    const { data: usadas_raw } = await supabase.from("posts")
      .select("imagem").eq("status","publicado").not("imagem","is",null).limit(300);
    const usadas = new Set((usadas_raw||[]).map(p => p.imagem).filter(Boolean));

    let corrigidos = 0;
    for (const p of posts) {
      if (Date.now() - inicio > 45000) break;

      const img = p.imagem || "";
      if (img && !imagemRuim(img)) continue;

      const titulo = p.titulo || "";
      const termos = extrairTermos(titulo);
      let nova = null;

      for (const q of [termos, "brazil news"]) {
        const c = await buscarPixabay(q);
        if (c && !usadas.has(c)) { nova = c; break; }
        await new Promise(r => setTimeout(r, 80));
      }

      if (nova) {
        await supabase.from("posts").update({ imagem: nova }).eq("id", p.id);
        usadas.add(nova);
        corrigidos++;
      }

      await new Promise(r => setTimeout(r, 40));
    }

    const proxCursor = posts[posts.length - 1]?.published_at || null;

    return res.status(200).json({
      done: posts.length < 30,
      lote: parseInt(lote) + 1,
      corrigidos,
      proxCursor,
      processados: posts.length
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
