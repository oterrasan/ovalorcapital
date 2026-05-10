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
  // GET: acessível pelo browser
  // GET /api/recategorizar-vc          → dry_run (só mostra o que mudaria)
  // GET /api/recategorizar-vc?executar=1 → executa a correção
  // POST: usado pelo painel admin (body.dry_run)
  let dryRun;
  if (req.method === 'GET') {
    dryRun = req.query.executar !== '1';
  } else if (req.method === 'POST') {
    dryRun = req.body?.dry_run === true;
  } else {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, titulo, subcategoria, user_tags')
    .or('user_tags.like.%"vc"%,user_tags.like.%"colunistas"%')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(`<h2>Erro: ${error.message}</h2>`);
    }
    return res.status(500).json({ error: error.message });
  }

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

  const result = {
    dry_run: dryRun,
    total_encontrados: resultados.length,
    total_recategorizados: dryRun ? 0 : updates.length,
    artigos: resultados
  };

  // Resposta HTML para requisições GET (browser)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const titulo = dryRun
      ? `PRÉ-VISUALIZAÇÃO — ${result.total_encontrados} artigos encontrados com categoria VC/Colunistas`
      : `CORREÇÃO EXECUTADA — ${result.total_recategorizados} artigos recategorizados`;

    const linhas = resultados.map(a =>
      `<tr>
        <td style="padding:4px 8px;color:#888;font-size:12px">${a.id.slice(0,8)}</td>
        <td style="padding:4px 8px;color:#c00;font-weight:bold">${a.de}</td>
        <td style="padding:4px 8px">→</td>
        <td style="padding:4px 8px;color:#060;font-weight:bold">${a.para}</td>
        <td style="padding:4px 8px;color:#555">${a.subcategoria || ''}</td>
        <td style="padding:4px 8px">${a.titulo}</td>
      </tr>`
    ).join('');

    const btnExecutar = dryRun
      ? `<p style="margin-top:20px"><a href="/api/recategorizar-vc?executar=1" style="background:#c00;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;font-size:16px">▶ EXECUTAR CORREÇÃO AGORA</a></p>`
      : `<p style="margin-top:20px;color:#060;font-size:18px">✅ Correção aplicada com sucesso! <a href="/vc/">Ver página VC →</a></p>`;

    return res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Recategorizar VC — OVC</title>
<style>body{font-family:sans-serif;padding:20px;max-width:1100px;margin:0 auto} table{border-collapse:collapse;width:100%} tr:nth-child(even){background:#f5f5f5}</style>
</head>
<body>
<h2>${titulo}</h2>
${btnExecutar}
<table><thead><tr><th>ID</th><th>De</th><th></th><th>Para</th><th>Subcategoria</th><th>Título</th></tr></thead>
<tbody>${linhas}</tbody>
</table>
${btnExecutar}
</body></html>`);
  }

  return res.status(200).json(result);
}
