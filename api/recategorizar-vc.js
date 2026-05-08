import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Mapa: palavras-chave na subcategoria → categoria correta
const SUBCAT_PARA_CAT = [
  [/internacional|rela..es exteriores|geopolítica|diplomacia|exterior/i, 'internacional'],
  [/segurança pública|policia|crime|violência|criminalidade|tráfico|pcc|cv |facção/i, 'seguranca'],
  [/investigat|corrupção|operação policial|mpf|pf |polícia federal/i, 'investigativo'],
  [/defesa nacional|forças armadas|exército|marinha|aeronáutica|militar/i, 'defesa'],
  [/saúde|medicina|sus |hospital|doença|tratamento|vacina/i, 'saude'],
  [/tecnologia|inteligência artificial|startup|software|digital|ti |programação/i, 'tecnologia'],
  [/sustentabilidade|meio ambiente|esg|ambiental|clima|carbono/i, 'esg'],
  [/cultura|cinema|música|teatro|arte|literatura/i, 'cultura'],
  [/esportes|futebol|olimp|atletismo|basquete/i, 'esportes'],
  [/variedades|entretenimento|comportamento|estilo de vida/i, 'variedades'],
  [/educação|escola|universidade|enem|ensino/i, 'educacao'],
  [/emprego|vagas|contratação|trabalho|rh /i, 'vagas'],
  [/concurso público|edital|gabarito/i, 'concursos'],
  [/imóveis|mercado imobiliário|construtora|financiamento habitacional/i, 'imoveis'],
  [/profissão|carreira|médico|advogado|engenheiro|contador|enfermeiro/i, 'profissoes'],
  [/tributo|imposto|irpf|receita federal|reforma tributária|icms|iss/i, 'tributacao'],
  [/regulação|bacen|cvm|anbima|susep|ans |regulador/i, 'regulacao'],
  [/parceria|acordo|joint venture|aliança/i, 'parcerias'],
  [/indústria|manufatura|produção industrial|exportação/i, 'industria'],
  [/família|filhos|herança|casamento|patrimônio/i, 'familia'],
  [/investimento|renda fixa|bolsa|ações|fundo|tesouro direto|cripto/i, 'investimentos'],
  [/seguro|previdência privada|plano de saúde/i, 'seguros'],
  [/mercado|commodities|petróleo|ouro|b3|ibovespa/i, 'mercados'],
  [/negócio|empresa|fusão|aquisição|startup/i, 'negocios'],
  [/política|governo|congresso|eleição|partido|presidente|ministro/i, 'politica'],
  [/economia|pib|inflação|juros|selic|câmbio|fiscal/i, 'economia'],
  [/fé|espiritualidade|religião|igreja|evangelico|catolicismo/i, 'religiao'],
];

function inferirCategoria(subcategoria, titulo) {
  const texto = `${subcategoria} ${titulo}`.toLowerCase();
  for (const [regex, cat] of SUBCAT_PARA_CAT) {
    if (regex.test(texto)) return cat;
  }
  return null; // não conseguiu inferir
}

export default async function handler(req, res) {
  // Só aceita POST com header de admin
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const adminKey = req.headers['x-admin-key'] || req.body?.admin_key;
  if (adminKey !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'forbidden' });

  const dryRun = req.body?.dry_run === true;

  // Buscar todos os artigos categorizados como 'vc' ou 'colunistas'
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
      titulo: post.titulo?.slice(0, 80),
      subcategoria: post.subcategoria,
      de: catAtual,
      para: novaCategoria || '(não inferida — manter)'
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
