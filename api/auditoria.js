import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ─── REGRAS DE CATEGORIA (espelho de run_portal.js) ───
const REGRAS_CATEGORIA = [
  { cat: 'vagas', sinal: [
    'vaga para', 'vagas para', 'vaga de ', 'vagas de ',
    'oferece vaga', 'abre vaga', 'oferece vagas', 'abre vagas',
    'home office', 'processo seletivo', 'trainee', 'estágio ',
    'estagio ', 'auxiliar de vendas', 'auxiliar de atendimento',
    'analista de rh', 'gerente de vendas', 'coordenador de',
    'candidature-se', 'clique e candidate',
  ]},
  { cat: 'concursos', sinal: [
    'concurso público', 'concurso publico', 'edital do concurso',
    'inscrições abertas para concurso', 'gabarito oficial',
    'provas do concurso', 'aprovados no concurso',
  ]},
  { cat: 'imoveis', sinal: [
    'mercado imobiliário', 'financiamento imobiliário',
    'minha casa minha vida', 'metro quadrado', 'lançamento imobiliário',
    'incorporadora', 'construção civil avança',
  ]},
  { cat: 'saude', sinal: [
    'anvisa aprova', 'novo medicamento', 'vacina contra',
    'cirurgia de', 'diagnóstico de', 'tratamento de',
    'ministério da saúde anuncia', 'plano de saúde aumenta',
  ]},
  { cat: 'tecnologia', sinal: [
    'inteligência artificial', 'ia generativa', 'chatgpt',
    'machine learning', 'cibersegurança', 'startup lança',
    'iphone ', 'android ', 'aplicativo lança',
  ]},
  { cat: 'esportes', sinal: [
    'copa do mundo', 'campeonato brasileiro', 'libertadores',
    'fórmula 1', 'olimpíadas', 'nba ', 'nfl ',
    'futebol brasileiro', 'brasileirão', 'seleção brasileira',
  ]},
  { cat: 'politica', sinal: [
    'senado aprova', 'câmara aprova', 'lula sanciona',
    'presidente veta', 'stf decide', 'eleições 2026',
    'deputados votam', 'senadores aprovam',
  ]},
];

const SUBCATS_POR_CAT = {
  politica:      ["Governo Federal","Congresso Nacional","Eleições","Partidos Políticos","STF & Judiciário","Política Estadual","Câmara dos Deputados","Senado Federal","Poder Executivo"],
  economia:      ["Política Econômica","Inflação & Preços","Taxa Selic","PIB & Crescimento","Câmbio & Dólar","Fiscal & Orçamento","Emprego & Renda","Banco Central"],
  negocios:      ["Empresas & Corporações","Fusões & Aquisições","Startups","Empreendedorismo","Grandes Corporações","Setor Privado","Varejo","Agronegócio Empresarial"],
  investimentos: ["Bolsa de Valores","Renda Fixa","Fundos de Investimento","Tesouro Direto","Criptomoedas","Análise de Mercado","Finanças Pessoais","FIIs"],
  seguros:       ["Seguro de Vida","Planos de Saúde","Seguro Auto","Previdência Privada","Seguro Residencial","SUSEP & ANS","Seguro Empresarial","Corretoras de Seguros"],
  mercados:      ["Commodities","Petróleo & Energia","Ouro & Metais","B3 & Ibovespa","Câmbio Internacional","Índices Globais","Agro & Grãos"],
  educacao:      ["Ensino Superior","ENEM","Educação Básica","Cursos & Certificações","Pós-Graduação","Tecnologia na Educação","Bolsas de Estudo","Ensino Técnico"],
  industria:     ["Agronegócio","Manufatura","Energia","Infraestrutura","Exportações","Cadeia Produtiva","Mineração","Construção Civil"],
  tecnologia:    ["Inteligência Artificial","Segurança Digital","E-commerce","Telecomunicações","Inovação","Startups Tech","Blockchain","Computação em Nuvem"],
  esportes:      ["Futebol","Olimpíadas","Fórmula 1","Tênis","Basquete","Natação","Atletismo","Outros Esportes"],
  saude:         ["Medicina & Tratamentos","SUS","Saúde Mental","Medicamentos","Bem-estar","Epidemiologia","Pediatria","Nutrição"],
  familia:       ["Educação dos Filhos","Planejamento Familiar","Herança & Patrimônio","Casamento & Divórcio","Finanças Pessoais","Criação de Filhos"],
  tributacao:    ["IRPF","Reforma Tributária","ICMS & ISS","Receita Federal","Planejamento Tributário","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  regulacao:     ["BACEN","CVM","ANBIMA","SUSEP","ANS","ANATEL","ANEEL","Regulação Setorial"],
  parcerias:     ["Acordos Comerciais","Joint Ventures","Alianças Estratégicas","Contratos Públicos","PPP"],
  internacional: ["Relações Exteriores","Geopolítica","Conflitos Globais","América Latina","Estados Unidos","Europa","China & Ásia","Oriente Médio","Diplomacia"],
  variedades:    ["Comportamento","Lifestyle","Entretenimento","Tendências","Gastronomia","Turismo","Moda"],
  investigativo: ["Corrupção","Operações Policiais","Denúncias","Jornalismo de Dados","Fiscalização Pública","Lavagem de Dinheiro"],
  seguranca:     ["Segurança Pública","Crime Organizado","Violência Urbana","Polícia Federal","Narcotráfico","Facções","Homicídios"],
  cultura:       ["Cinema","Música","Arte","Teatro","Literatura","Patrimônio Cultural","Streaming","Festivais"],
  profissoes:    ["Medicina","Direito","Engenharia","Contabilidade","TI & Programação","Administração","Arquitetura","Recursos Humanos"],
  vagas:         ["Oportunidades CLT","Trabalho Remoto","Recrutamento & Seleção","Estágio","Trainee","Mercado de Trabalho"],
  concursos:     ["Concursos Federais","Concursos Estaduais","Concursos Municipais","Militares & Policiais","Judiciário","Saúde Pública"],
  imoveis:       ["Mercado Imobiliário","Financiamento Habitacional","Construtoras","Aluguel","Lançamentos","Minha Casa Minha Vida"],
  esg:           ["Sustentabilidade","Meio Ambiente","Governança Corporativa","Energia Limpa","Impacto Social","Carbono & Emissões"],
  defesa:        ["Forças Armadas","Segurança Nacional","Política de Defesa","Exército","Marinha","Aeronáutica","Fronteiras"],
  religiao:      ["Evangelicalismo","Catolicismo","Espiritualidade","Igrejas","Fé & Sociedade","Missões","Religiões Afro-brasileiras"],
};

const SUBCAT_DEFAULT = {
  vagas:'Oportunidades CLT', concursos:'Concursos Federais',
  imoveis:'Mercado Imobiliário', saude:'Medicina & Tratamentos',
  tecnologia:'Inteligência Artificial', esportes:'Futebol',
  politica:'Governo Federal', economia:'Política Econômica',
  negocios:'Empresas & Corporações', investimentos:'Bolsa de Valores',
  seguros:'Seguro de Vida', mercados:'Commodities',
  educacao:'Ensino Superior', industria:'Agronegócio',
  familia:'Educação dos Filhos', tributacao:'IRPF',
  regulacao:'BACEN', parcerias:'Acordos Comerciais',
  internacional:'Relações Exteriores', variedades:'Comportamento',
  investigativo:'Corrupção', seguranca:'Segurança Pública',
  cultura:'Cinema', profissoes:'Medicina',
  esg:'Sustentabilidade', defesa:'Forças Armadas',
  religiao:'Evangelicalismo',
};

const COMPETITOR_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','globo.com','g1.globo.com',
  'uol.com.br','folha.uol.com.br','estadao.com.br','r7.com','record.com.br',
  'sbt.com.br','jovempan.com.br','band.com.br','cnnbrasil.com.br',
  'veja.com.br','exame.com','cartacapital.com.br','poder360.com.br',
  'gazetadopovo.com.br','metropoles.com','infomoney.com.br',
  'terra.com.br','ig.com.br','reuters.com','ap.org','ebc.com.br',
  'valor.com.br','abril.com.br','seudinheiro.com','canaltech.com.br',
]);

function isCompetitorDomain(url) {
  if (!url || url.length < 10) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_HOSTS].some(d => host === d || host.endsWith('.' + d));
  } catch(_) { return false; }
}

function slugify(t) {
  return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function corrigirCategoria(titulo, categoriaAtual) {
  const t = (titulo||'').toLowerCase();
  for (const { cat, sinal } of REGRAS_CATEGORIA) {
    if (sinal.some(s => t.includes(s))) return cat;
  }
  return categoriaAtual;
}

function subcategoriaValida(subcat, categoria) {
  const lista = SUBCATS_POR_CAT[categoria];
  if (!lista || lista.length === 0) return true;
  return lista.includes(subcat);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const executar = req.query.executar === '1';
  const pagina   = parseInt(req.query.pagina || '0', 10);
  const limite   = 300;
  const offset   = pagina * limite;

  // Buscar posts publicados e pendentes
  const { data: posts, error: fetchErr } = await supabase
    .from('posts')
    .select('id, titulo, user_tags, subcategoria, subcategoria_slug, imagem, status')
    .in('status', ['publicado', 'pendente'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1);

  if (fetchErr) {
    return res.status(500).send(`<pre>Erro ao buscar posts: ${fetchErr.message}</pre>`);
  }

  const totalBuscados = (posts || []).length;
  const problemas = [];
  let corrigidos = 0;
  let erros = 0;

  for (const post of posts || []) {
    let tagsRaw;
    try { tagsRaw = typeof post.user_tags === 'string' ? JSON.parse(post.user_tags) : (post.user_tags || []); }
    catch(_) { tagsRaw = []; }
    const categoriaAtual = (tagsRaw[0] || 'geral').toLowerCase().trim();

    const categoriaCorrigida = corrigirCategoria(post.titulo, categoriaAtual);
    const catFinal = categoriaCorrigida;

    const subcatAtual = post.subcategoria || '';
    const subcatOk = subcategoriaValida(subcatAtual, catFinal);
    const subcatCorrigida = subcatOk ? subcatAtual : (SUBCAT_DEFAULT[catFinal] || 'Geral');

    const imgConcorrente = isCompetitorDomain(post.imagem);

    const temProblema = (
      categoriaCorrigida !== categoriaAtual ||
      !subcatOk ||
      imgConcorrente
    );

    if (!temProblema) continue;

    const problema = {
      id: post.id,
      status: post.status,
      titulo: (post.titulo || '').slice(0, 80),
      categoria_antes: categoriaAtual,
      categoria_depois: categoriaCorrigida !== categoriaAtual ? categoriaCorrigida : null,
      subcat_antes: subcatAtual,
      subcat_depois: !subcatOk ? subcatCorrigida : null,
      img_concorrente: imgConcorrente ? post.imagem : null,
    };
    problemas.push(problema);

    if (executar) {
      const updates = {};
      if (categoriaCorrigida !== categoriaAtual) {
        updates.user_tags = JSON.stringify([catFinal]);
      }
      if (!subcatOk || categoriaCorrigida !== categoriaAtual) {
        updates.subcategoria = subcatCorrigida;
        updates.subcategoria_slug = slugify(subcatCorrigida);
      }
      // Imagem de concorrente: marca para troca mas nao apaga
      if (imgConcorrente) {
        updates.metrics = { imagem_concorrente: true, imagem_original: post.imagem };
        updates.imagem = null;
      }
      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await supabase.from('posts').update(updates).eq('id', post.id);
        if (updErr) erros++; else corrigidos++;
      }
    }
  }

  // ─── HTML REPORT ───
  const css = `
    body{font-family:system-ui,sans-serif;background:#08080f;color:#e0e0e0;margin:0;padding:24px}
    h1{color:#fff;margin-bottom:4px}h2{color:#bbb;font-size:14px;font-weight:400;margin:0 0 24px}
    .summary{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:32px}
    .card{background:#111;border:1px solid #222;border-radius:10px;padding:16px 20px;min-width:140px}
    .card-n{font-size:32px;font-weight:700}.card-n.red{color:#f87171}.card-n.green{color:#4ade80}.card-n.yellow{color:#fbbf24}
    .card-l{font-size:11px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:.06em}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#111;padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #222}
    td{padding:10px 12px;border-bottom:1px solid #1a1a1a;vertical-align:top;max-width:300px;word-break:break-word}
    tr:hover td{background:#111}
    .badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600}
    .pub{background:rgba(74,222,128,.15);color:#4ade80}.pend{background:rgba(251,191,36,.15);color:#fbbf24}
    .tag-old{background:rgba(248,113,113,.15);color:#f87171;text-decoration:line-through}
    .tag-new{background:rgba(74,222,128,.15);color:#4ade80}
    .tag-warn{background:rgba(251,191,36,.15);color:#fbbf24}
    .btn{display:inline-block;padding:12px 24px;background:#c81e1e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:24px}
    .btn:hover{background:#e02222}.btn-ok{background:#16a34a}.btn-ok:hover{background:#15803d}
    .ok{color:#4ade80;font-weight:600}.none{color:#555;font-style:italic}
  `;

  if (problemas.length === 0) {
    return res.status(200).send(`<!DOCTYPE html><html><head><meta charset=UTF-8><style>${css}</style></head><body>
      <h1>Auditoria OVC</h1><h2>Varredura de posts publicados e pendentes</h2>
      <div class="summary">
        <div class="card"><div class="card-n green">${totalBuscados}</div><div class="card-l">Posts verificados</div></div>
        <div class="card"><div class="card-n green">0</div><div class="card-l">Problemas encontrados</div></div>
      </div>
      <p class="ok">✓ Tudo limpo! Nenhum problema encontrado nos ${totalBuscados} posts verificados.</p>
    </body></html>`);
  }

  const catErradas   = problemas.filter(p => p.categoria_depois).length;
  const subcatErradas = problemas.filter(p => p.subcat_depois).length;
  const imgConc      = problemas.filter(p => p.img_concorrente).length;

  const linhas = problemas.map(p => {
    const statusBadge = p.status === 'publicado'
      ? '<span class="badge pub">publicado</span>'
      : '<span class="badge pend">pendente</span>';

    const catCell = p.categoria_depois
      ? `<span class="badge tag-old">${p.categoria_antes}</span> → <span class="badge tag-new">${p.categoria_depois}</span>`
      : `<span style="color:#888">${p.categoria_antes}</span>`;

    const subcatCell = p.subcat_depois
      ? `<span class="badge tag-old">${p.subcat_antes||'(vazio)'}</span> → <span class="badge tag-new">${p.subcat_depois}</span>`
      : `<span style="color:#888">${p.subcat_antes||'<em>ok</em>'}</span>`;

    const imgCell = p.img_concorrente
      ? `<span class="badge tag-warn">⚠ concorrente</span>`
      : '<span class="none">ok</span>';

    return `<tr>
      <td>${statusBadge}</td>
      <td>${p.titulo}</td>
      <td>${catCell}</td>
      <td>${subcatCell}</td>
      <td>${imgCell}</td>
    </tr>`;
  }).join('');

  const acaoBtn = executar
    ? `<a class="btn btn-ok" href="/api/auditoria">Ver relatório limpo</a>`
    : `<a class="btn" href="/api/auditoria?executar=1">▶ Executar correções (${problemas.length} posts)</a>`;

  const resumoExec = executar
    ? `<p style="margin:16px 0;color:#4ade80;font-size:15px">✓ Correção concluída: <strong>${corrigidos}</strong> corrigidos${erros > 0 ? `, <span style="color:#f87171">${erros} erros</span>` : ''}.</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Auditoria OVC</title><style>${css}</style></head>
<body>
  <h1>Auditoria OVC</h1>
  <h2>Posts publicados e pendentes &mdash; página ${pagina + 1} (${offset + 1}–${offset + totalBuscados})</h2>
  <div class="summary">
    <div class="card"><div class="card-n">${totalBuscados}</div><div class="card-l">Posts verificados</div></div>
    <div class="card"><div class="card-n red">${problemas.length}</div><div class="card-l">Com problemas</div></div>
    <div class="card"><div class="card-n yellow">${catErradas}</div><div class="card-l">Categoria errada</div></div>
    <div class="card"><div class="card-n yellow">${subcatErradas}</div><div class="card-l">Subcategoria inválida</div></div>
    <div class="card"><div class="card-n red">${imgConc}</div><div class="card-l">Imagem concorrente</div></div>
  </div>
  ${resumoExec}
  ${acaoBtn}
  ${pagina > 0 ? `<a class="btn btn-ok" href="/api/auditoria?pagina=${pagina-1}" style="margin-left:8px">← Pág anterior</a>` : ''}
  <a class="btn btn-ok" href="/api/auditoria?pagina=${pagina+1}" style="margin-left:8px">Próx página →</a>
  <table style="margin-top:24px">
    <thead><tr><th>Status</th><th>Título</th><th>Categoria</th><th>Subcategoria</th><th>Imagem</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>
</body>
</html>`;

  return res.status(200).send(html);
}
