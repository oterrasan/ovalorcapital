import { createClient } from "@supabase/supabase-js";
import { findImage } from "../core/image_finder.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const COMPETITOR_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','globo.com','g1.globo.com','ge.globo.com',
  'oglobo.globo.com','extra.globo.com','valor.com.br','uol.com.br','folha.uol.com.br',
  'f.i.uol.com.br','imguol.i.uol.com.br','estadao.com.br','broadcast.com.br',
  'r7.com','record.com.br','sbt.com.br','jovempan.com.br','band.com.br',
  'cnnbrasil.com.br','assets.cnnbrasil.com.br','veja.com.br','abril.com.br',
  'exame.com','cartacapital.com.br','poder360.com.br','gazetadopovo.com.br',
  'metropoles.com','seudinheiro.com','infomoney.com.br','terra.com.br','ig.com.br',
  'agenciabrasil.ebc.com.br','imagens.ebc.com.br','reuters.com','ap.org',
  'canaltech.com.br','apublica.org','correiobraziliense.com.br',
]);

function isCompetitorImage(url) {
  if (!url || url.length < 10) return false;
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_HOSTS].some(d => h === d || h.endsWith('.' + d));
  } catch(_) { return false; }
}

function precisaCorrecao(imagem) {
  if (!imagem) return true;
  if (isCompetitorImage(imagem)) return true;
  if (imagem.includes('unsplash.com')) return true;
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.headers["x-admin-token"] !== "ovc2026fix") return res.status(401).end();

  const { cursor = null } = req.query;

  try {
    // Busca posts com imagem de concorrente OU Unsplash (sem nexo)
    let query = supabase.from("posts")
      .select("id,titulo,imagem,user_tags,published_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: true })
      .limit(15);

    if (cursor) query = query.gt("published_at", decodeURIComponent(cursor));

    const { data: posts, error } = await query;
    if (error) throw new Error(error.message);

    // Filtra apenas os que precisam de correção
    const paraCorrigir = (posts || []).filter(p => precisaCorrecao(p.imagem));
    if (!paraCorrigir.length) {
      const proxCursor = posts?.[posts.length - 1]?.published_at || null;
      return res.status(200).json({ done: !posts?.length || posts.length < 15, corrigidos: 0, processados: posts?.length || 0, proxCursor });
    }

    let corrigidos = 0;
    const inicio = Date.now();

    for (const p of paraCorrigir) {
      if (Date.now() - inicio > 50000) break;

      let tags = [];
      try { tags = typeof p.user_tags === 'string' ? JSON.parse(p.user_tags) : (p.user_tags || []); } catch(_) {}
      const categoria = tags[0] || 'geral';

      // Usa o image_finder com Wikipedia/Wikimedia/Pixabay — mesmo sistema do pipeline
      const nova = await findImage(p.titulo || '', categoria, '', '');

      if (nova && nova !== p.imagem) {
        const { error: pe } = await supabase.from("posts").update({ imagem: nova }).eq("id", p.id);
        if (!pe) corrigidos++;
      }
    }

    const proxCursor = posts[posts.length - 1]?.published_at || null;

    return res.status(200).json({
      done: posts.length < 15,
      corrigidos,
      processados: posts.length,
      paraCorrigir: paraCorrigir.length,
      proxCursor
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
