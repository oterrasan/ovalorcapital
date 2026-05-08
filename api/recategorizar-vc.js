import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const SUBCAT_PARA_CAT = [
  [/internacional|rela[cç][oõ]es exteriores|geopolit|diplomacia|exterior/i, 'internacional'],
  [/seguran[cç]a p[uú]blica|policia|crime|viol[eê]ncia|criminalidade|tr[aá]fico|pcc|fac[cç][aã]o/i, 'seguranca'],
  [/investigat|corrup[cç][aã]o|opera[cç][aã]o policial|mpf|pol[ií]cia federal/i, 'investigativo'],
  [/defesa nacional|for[cç]as armadas|ex[eé]rcito|marinha|aeron[aá]utica|militar/i, 'defesa'],
  [/sa[uú]de|medicina|sus |hospital|doen[cç]a|tratamento|vacina/i, 'saude'],
  [/tecnologia|intelig[eê]ncia artificial|startup|software|digital|\bti\b|programa[cç][aã]o/i, 'tecnologia'],
  [/sustentabilidade|meio ambiente|\besg\b|ambiental|clima|carbono/i, 'esg'],
  [/cultura|cinema|m[uú]sica|teatro|arte|literatura/i, 'cultura'],
  [/esportes|futebol|olimp|atletismo|basquete/i, 'esportes'],
  [/variedades|entretenimento|comportamento|estilo de vida/i, 'variedades'],
  [/educa[cç][aã]o|escola|universidade|enem|ensino/i, 'educacao'],
  [/emprego|vagas|contrata[cç][aã]o|\btrabalho\b|\brh\b/i, 'vagas'],
  [/concurso p[uú]blico|edital|gabarito/i, 'concursos'],
  [/im[oó]veis|mercado imobili[aá]rio|construtora|financiamento habitacional/i, 'imoveis'],
  [/profiss[aã]o|carreira|m[eé]dico|advogado|engenheiro|contador|enfermeiro/i, 'profissoes'],
  [/tribut|imposto|irpf|receita federal|reforma tribut[aá]ria|\bicms\b|\biss\b/i, 'tributacao'],
  [/regula[cç][aã]o|\bbacen\b|\bcvm\b|\banbima\b|\bsusep\b|\bans\b|regulador/i, 'regulacao'],
  [/parceria|acordo|joint venture|alian[cç]a/i, 'parcerias'],
  [/ind[uú]stria|manufatura|produ[cç][aã]o industrial|exporta[cç][aã]o/i, 'industria'],
  [/fam[ií]lia|filhos|heran[cç]a|casamento|patrim[oô]nio/i, 'familia'],
  [/investimento|renda fixa|bolsa|a[cç][oõ]es|fundo|tesouro direto|cripto/i, 'investimentos'],
  [/seguro|previd[eê]ncia privada|plano de sa[uú]de/i, 'seguros'],
  [/mercado|commodities|petr[oó]leo|ouro|\bb3\b|ibovespa/i, 'mercados'],
  [/neg[oó]cio|empresa|fus[aã]o|aquisi[cç][aã]o/i, 'negocios'],
  [/pol[ií]tica|governo|congresso|elei[cç][aã]o|partido|presidente|ministro/i, 'politica'],
  [/economia|\bpib\b|infla[cç][aã]o|juros|selic|c[aâ]mbio|fiscal/i, 'economia'],
  [/f[eé]|espiritualidade|religi[aã]o|igreja|evangelico|catolicismo/i, 'religiao'],
];

function inferirCategoria(subcategoria, titulo) {
  const texto = `${subcategoria} ${titulo}`.toLowerCase();
  for (const [regex, cat] of SUBCAT_PARA_CAT) {
    if (regex.test(texto)) return cat;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const dryRun = req.body?.dry_run === true;

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, titulo, subcategoria, user_tags')
    .or('user_tags.like.%"vc"%,user_tags.like.%"colunistas"%')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return res.status(500).json({ error: error.message });

  const resultados = [];
  const updates = [];

  for (const post of (posts || [])) {
    let tags = [];
    try { tags = typeof post.user_tags === 'string' ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) {}
    const catAtual = tags[0] || 'geral';
    if (catAtual !== 'vc' && catAtual !== 'colunistas') continue;

    const novaCategoria = inferirCategoria(post.subcategoria || '', post.titulo || '');

    resultados.push({
      id: post.id,
      titulo: (post.titulo || '').slice(0, 80),
      subcategoria: post.subcategoria,
      de: catAtual,
      para: novaCategoria || '(nao inferida)'
    });

    if (novaCategoria && !dryRun) {
      updates.push(
        supabase.from('posts').update({ user_tags: JSON.stringify([novaCategoria]) }).eq('id', post.id)
      );
    }
  }

  if (!dryRun && updates.length > 0) {
    await Promise.allSettled(updates);
  }

  return res.status(200).json({
    dry_run: dryRun,
    total_encontrados: resultados.length,
    total_recategorizados: dryRun ? 0 : updates.length,
    artigos: resultados
  });
}
