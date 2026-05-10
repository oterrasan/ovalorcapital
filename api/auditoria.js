import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const COMPETITOR = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','globo.com','g1.globo.com',
  'uol.com.br','folha.uol.com.br','estadao.com.br','r7.com','record.com.br',
  'sbt.com.br','jovempan.com.br','band.com.br','cnnbrasil.com.br',
  'veja.com.br','exame.com','cartacapital.com.br','poder360.com.br',
  'gazetadopovo.com.br','metropoles.com','infomoney.com.br',
  'terra.com.br','ig.com.br','reuters.com','ap.org','ebc.com.br',
  'valor.com.br','abril.com.br','seudinheiro.com','canaltech.com.br',
]);

const SUBCAT = {
  politica:['Governo Federal','Congresso Nacional','Eleicoes','Partidos Politicos','STF & Judiciario','Politica Estadual','Camara dos Deputados','Senado Federal','Poder Executivo'],
  economia:['Politica Economica','Inflacao & Precos','Taxa Selic','PIB & Crescimento','Cambio & Dolar','Fiscal & Orcamento','Emprego & Renda','Banco Central'],
  negocios:['Empresas & Corporacoes','Fusoes & Aquisicoes','Startups','Empreendedorismo','Grandes Corporacoes','Setor Privado','Varejo','Agronegocio Empresarial'],
  investimentos:['Bolsa de Valores','Renda Fixa','Fundos de Investimento','Tesouro Direto','Criptomoedas','Analise de Mercado','Financas Pessoais','FIIs'],
  seguros:['Seguro de Vida','Planos de Saude','Seguro Auto','Previdencia Privada','Seguro Residencial','SUSEP & ANS','Seguro Empresarial','Corretoras de Seguros'],
  mercados:['Commodities','Petroleo & Energia','Ouro & Metais','B3 & Ibovespa','Cambio Internacional','Indices Globais','Agro & Graos'],
  educacao:['Ensino Superior','ENEM','Educacao Basica','Cursos & Certificacoes','Pos-Graduacao','Tecnologia na Educacao','Bolsas de Estudo','Ensino Tecnico'],
  industria:['Agronegocio','Manufatura','Energia','Infraestrutura','Exportacoes','Cadeia Produtiva','Mineracao','Construcao Civil'],
  tecnologia:['Inteligencia Artificial','Seguranca Digital','E-commerce','Telecomunicacoes','Inovacao','Startups Tech','Blockchain','Computacao em Nuvem'],
  esportes:['Futebol','Olimpiadas','Formula 1','Tenis','Basquete','Natacao','Atletismo','Outros Esportes'],
  saude:['Medicina & Tratamentos','SUS','Saude Mental','Medicamentos','Bem-estar','Epidemiologia','Pediatria','Nutricao'],
  familia:['Educacao dos Filhos','Planejamento Familiar','Heranca & Patrimonio','Casamento & Divorcio','Financas Pessoais','Criacao de Filhos'],
  tributacao:['IRPF','Reforma Tributaria','ICMS & ISS','Receita Federal','Planejamento Tributario','Impostos Federais','Simples Nacional','CSLL & IRPJ'],
  regulacao:['BACEN','CVM','ANBIMA','SUSEP','ANS','ANATEL','ANEEL','Regulacao Setorial'],
  parcerias:['Acordos Comerciais','Joint Ventures','Aliancas Estrategicas','Contratos Publicos','PPP'],
  internacional:['Relacoes Exteriores','Geopolitica','Conflitos Globais','America Latina','Estados Unidos','Europa','China & Asia','Oriente Medio','Diplomacia'],
  variedades:['Comportamento','Lifestyle','Entretenimento','Tendencias','Gastronomia','Turismo','Moda'],
  investigativo:['Corrupcao','Operacoes Policiais','Denuncias','Jornalismo de Dados','Fiscalizacao Publica','Lavagem de Dinheiro'],
  seguranca:['Seguranca Publica','Crime Organizado','Violencia Urbana','Policia Federal','Narcotrafico','Faccoes','Homicidios'],
  cultura:['Cinema','Musica','Arte','Teatro','Literatura','Patrimonio Cultural','Streaming','Festivais'],
  profissoes:['Medicina','Direito','Engenharia','Contabilidade','TI & Programacao','Administracao','Arquitetura','Recursos Humanos'],
  vagas:['Oportunidades CLT','Trabalho Remoto','Recrutamento & Selecao','Estagio','Trainee','Mercado de Trabalho'],
  concursos:['Concursos Federais','Concursos Estaduais','Concursos Municipais','Militares & Policiais','Judiciario','Saude Publica'],
  imoveis:['Mercado Imobiliario','Financiamento Habitacional','Construtoras','Aluguel','Lancamentos','Minha Casa Minha Vida'],
  esg:['Sustentabilidade','Meio Ambiente','Governanca Corporativa','Energia Limpa','Impacto Social','Carbono & Emissoes'],
  defesa:['Forcas Armadas','Seguranca Nacional','Politica de Defesa','Exercito','Marinha','Aeronautica','Fronteiras'],
  religiao:['Evangelicalismo','Catolicismo','Espiritualidade','Igrejas','Fe & Sociedade','Missoes','Religioes Afro-brasileiras'],
};

const SUBCAT_DEF = {
  vagas:'Oportunidades CLT',concursos:'Concursos Federais',imoveis:'Mercado Imobiliario',
  saude:'Medicina & Tratamentos',tecnologia:'Inteligencia Artificial',esportes:'Futebol',
  politica:'Governo Federal',economia:'Politica Economica',negocios:'Empresas & Corporacoes',
  investimentos:'Bolsa de Valores',seguros:'Seguro de Vida',mercados:'Commodities',
  educacao:'Ensino Superior',industria:'Agronegocio',familia:'Educacao dos Filhos',
  tributacao:'IRPF',regulacao:'BACEN',parcerias:'Acordos Comerciais',
  internacional:'Relacoes Exteriores',variedades:'Comportamento',investigativo:'Corrupcao',
  seguranca:'Seguranca Publica',cultura:'Cinema',profissoes:'Medicina',
  esg:'Sustentabilidade',defesa:'Forcas Armadas',religiao:'Evangelicalismo',
};

const REGRAS = [
  {cat:'vagas',   s:['vaga para','vagas para','vaga de ','vagas de ','oferece vaga','abre vaga','home office','processo seletivo','trainee','estagio ','auxiliar de vendas','analista de rh','gerente de vendas']},
  {cat:'concursos',s:['concurso publico','concurso público','edital do concurso','gabarito oficial','inscricoes abertas para concurso']},
  {cat:'imoveis', s:['mercado imobiliário','financiamento imobiliário','minha casa minha vida','metro quadrado','lancamento imobiliario']},
  {cat:'saude',   s:['anvisa aprova','novo medicamento','vacina contra','ministerio da saude anuncia']},
  {cat:'tecnologia',s:['inteligencia artificial','inteligência artificial','ia generativa','chatgpt','machine learning','ciberseguranca']},
  {cat:'esportes',s:['copa do mundo','campeonato brasileiro','libertadores','formula 1','olimpiadas','brasileirao','selecao brasileira']},
  {cat:'politica',s:['senado aprova','camara aprova','lula sanciona','presidente veta','stf decide','eleicoes 2026']},
];

function slugify(t) {
  return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 -]/g,'').trim().replace(/ +/g,'-');
}

function isConcorrente(url) {
  if (!url) return false;
  try { const h = new URL(url).hostname.replace(/^www\./,''); return [...COMPETITOR].some(d=>h===d||h.endsWith('.'+d)); } catch(_){return false;}
}

function corrigirCat(titulo, catAtual) {
  const t = (titulo||'').toLowerCase();
  for (const {cat,s} of REGRAS) { if (s.some(x=>t.includes(x))) return cat; }
  return catAtual;
}

export default async function handler(req, res) {
  const executar = req.query.executar === '1';

  const {data:posts, error} = await sb.from('posts')
    .select('id,titulo,user_tags,subcategoria,imagem,status')
    .in('status',['publicado','pendente'])
    .order('created_at',{ascending:false})
    .limit(500);

  if (error) return res.status(500).send('Erro: '+error.message);

  const problemas=[], fixes=[];
  let corrigidos=0, erros=0;

  for (const p of posts||[]) {
    let tags; try{tags=typeof p.user_tags==='string'?JSON.parse(p.user_tags):(p.user_tags||[]);}catch(_){tags=[];}
    const catAtu = (tags[0]||'geral').toLowerCase().trim();
    const catNew = corrigirCat(p.titulo, catAtu);
    const subcAtu = p.subcategoria||'';
    const subcLista = SUBCAT[catNew]||[];
    const subcOk = subcLista.length===0 || subcLista.some(s=>s===subcAtu||s.toLowerCase()===subcAtu.toLowerCase());
    const subcNew = subcOk ? subcAtu : (SUBCAT_DEF[catNew]||'Geral');
    const imgConc = isConcorrente(p.imagem);
    const temProb = catNew!==catAtu || !subcOk || imgConc;
    if (!temProb) continue;
    problemas.push({id:p.id,status:p.status,titulo:(p.titulo||'').slice(0,70),catAtu,catNew:catNew!==catAtu?catNew:null,subcAtu,subcNew:!subcOk?subcNew:null,imgConc});
    if (executar) {
      const u={};
      if (catNew!==catAtu) u.user_tags=JSON.stringify([catNew]);
      if (!subcOk||catNew!==catAtu) { u.subcategoria=subcNew; u.subcategoria_slug=slugify(subcNew); }
      if (imgConc) u.imagem=null;
      if (Object.keys(u).length) { const {error:e}=await sb.from('posts').update(u).eq('id',p.id); if(e)erros++;else corrigidos++; }
    }
  }

  const total=posts?.length||0;
  const catErr=problemas.filter(p=>p.catNew).length;
  const subErr=problemas.filter(p=>p.subcNew).length;
  const imgErr=problemas.filter(p=>p.imgConc).length;

  const rows=problemas.map(p=>`<tr>
    <td><b>${p.status}</b></td>
    <td>${p.titulo}</td>
    <td>${p.catNew?`<s style=color:red>${p.catAtu}</s> => <b style=color:lime>${p.catNew}</b>`:p.catAtu}</td>
    <td>${p.subcNew?`<s style=color:red>${p.subcAtu||'?'}</s> => <b style=color:lime>${p.subcNew}</b>`:p.subcAtu}</td>
    <td>${p.imgConc?'<b style=color:orange>CONCORRENTE</b>':'ok'}</td>
  </tr>`).join('');

  const btn = executar
    ? `<p style=color:lime;font-size:18px>CORRECAO EXECUTADA: ${corrigidos} corrigidos, ${erros} erros.</p><a href=/api/auditoria style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Ver relatorio</a>`
    : `<a href="/api/auditoria?executar=1" style="background:#c81e1e;color:#fff;padding:12px 24px;border-radius:6px;font-size:16px;text-decoration:none;display:inline-block;margin:16px 0">CORRIGIR TUDO AGORA (${problemas.length} posts com problema)</a>`;

  res.setHeader('Content-Type','text/html;charset=utf-8');
  res.status(200).send(`<!DOCTYPE html><html><head><meta charset=UTF-8><title>Auditoria OVC</title>
<style>body{background:#0a0a0a;color:#e0e0e0;font-family:system-ui;padding:24px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}th,td{padding:8px 12px;border-bottom:1px solid #222;text-align:left}th{background:#111;color:#888}tr:hover td{background:#111}.stats{display:flex;gap:12px;margin-bottom:16px}.stat{background:#111;border:1px solid #222;border-radius:8px;padding:12px 16px}.stat-n{font-size:28px;font-weight:700}.red{color:#f87171}.yellow{color:#fbbf24}.green{color:#4ade80}</style>
</head><body>
<h1 style=margin-bottom:4px>Auditoria OVC</h1>
<p style=color:#888;margin-top:0>Posts publicados e pendentes &mdash; ${total} verificados</p>
<div class=stats>
  <div class=stat><div class="stat-n ${problemas.length?'red':'green'}">${problemas.length}</div><div>Com problema</div></div>
  <div class=stat><div class="stat-n yellow">${catErr}</div><div>Categoria errada</div></div>
  <div class=stat><div class="stat-n yellow">${subErr}</div><div>Subcategoria invalida</div></div>
  <div class=stat><div class="stat-n red">${imgErr}</div><div>Imagem concorrente</div></div>
  <div class=stat><div class="stat-n green">${total-problemas.length}</div><div>Corretos</div></div>
</div>
${btn}
${problemas.length?`<table><thead><tr><th>Status</th><th>Titulo</th><th>Categoria</th><th>Subcategoria</th><th>Imagem</th></tr></thead><tbody>${rows}</tbody></table>`:"<p style=color:lime>Tudo limpo!</p>"}
</body></html>`);
}
