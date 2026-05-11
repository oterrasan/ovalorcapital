import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews, getNewsByCategoria } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const COMPETITOR_IMG_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','i.s3.glbimg.com',
  'globo.com','g1.globo.com','ge.globo.com','oglobo.globo.com','extra.globo.com','valor.com.br',
  'uol.com.br','folha.uol.com.br','f.i.uol.com.br','imguol.i.uol.com.br',
  'estadao.com.br','broadcast.com.br',
  'r7.com','record.com.br','sbt.com.br','jovempan.com.br',
  'band.com.br','cnnbrasil.com.br','assets.cnnbrasil.com.br',
  'veja.com.br','abril.com.br','exame.com','cartacapital.com.br',
  'poder360.com.br','gazetadopovo.com.br','metropoles.com',
  'seudinheiro.com','infomoney.com.br','terra.com.br','ig.com.br',
  'agenciabrasil.ebc.com.br','imagens.ebc.com.br',
  'reuters.com','ap.org','canaltech.com.br','apublica.org',
  'correiobraziliense.com.br','nsctotal.com.br',
]);

function isCompetitorDomain(url) {
  if (!url || url.length < 10) return false;
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_IMG_HOSTS].some(d => h === d || h.endsWith('.' + d));
  } catch(_) { return false; }
}

// Categorias de alto engajamento — recebem prioridade de busca por execução
const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];

// Regras de correção de categoria baseadas em palavras-chave do título.
// ORDEM IMPORTA: mais específico primeiro. Primeira regra que casar vence.
const REGRAS_CATEGORIA = [
  // Vagas — muito específico, checado primeiro
  { cat: 'vagas', sinal: [
    'vaga para','vagas para','vaga de ','vagas de ','oferece vaga','abre vaga',
    'processo seletivo','trainee','estagio ','estágio ','home office emprego',
    'auxiliar de vendas','auxiliar de atendimento','analista de rh',
    'gerente de vendas','coordenador de','clique e candidate',
    'vagas abertas','contratando para','oportunidade de emprego',
    'recrutamento e seleção','candidatura ','vaga clt','vaga pj',
    'vaga remota','trabalhe conosco','estágios em',
  ] },
  // Concursos
  { cat: 'concursos', sinal: [
    'concurso público','concurso publico','edital do concurso','gabarito oficial',
    'inscrições abertas para concurso','provas do concurso','concurso para policia',
    'concurso para judiciario','resultado do concurso','banca examinadora',
    'edital publicado','data das provas','vagas no concurso',
    'concurso federal','concurso estadual','concurso municipal',
  ] },
  // Imóveis
  { cat: 'imoveis', sinal: [
    'mercado imobiliário','financiamento imobiliário','minha casa minha vida',
    'metro quadrado','lançamento imobiliário','incorporadora',
    'comprar imóvel','aluguel de imóvel','venda de imóvel',
    'construtora lança','fundo imobiliário','fii de ','fiis ',
    'igpm aluguel','contrato de locação',
  ] },
  // Saúde
  { cat: 'saude', sinal: [
    'anvisa aprova','novo medicamento','vacina contra','ministério da saúde anuncia',
    'plano de saúde aumenta','sus atende','tratamento de','hospital federal',
    'doença crônica','câncer ','diabetes ','hipertensão ','obesidade ',
    'saúde mental','burnout ','depressão clínica','remédio ',
    'farmácia ','clínica médica','hospital universitário',
    'profissionais de saúde','sus lança','unidade de saúde',
  ] },
  // Tecnologia
  { cat: 'tecnologia', sinal: [
    'inteligência artificial','ia generativa','chatgpt','machine learning',
    'cibersegurança','startup lança','iphone ','android ',
    'inteligencia artificial','openai ','google ai','gemini ',
    'llm ','gpt-','robótica','drone ','5g ','blockchain ',
    'fintech ','cloud computing','big data','hack ','ransomware',
    'criptografia digital','software lança','aplicativo lança',
    'plataforma digital','deep learning',
  ] },
  // Esportes — expandido
  { cat: 'esportes', sinal: [
    'copa do mundo','campeonato brasileiro','libertadores','fórmula 1',
    'olimpíadas','nba ','nfl ','futebol brasileiro','brasileirão',
    'seleção brasileira','flamengo ','palmeiras ','corinthians ',
    'são paulo fc','atlético mineiro','grêmio ','internacional rs',
    'santos fc','cruzeiro ','botafogo ','vasco ',
    'champions league','premier league','bundesliga','la liga',
    'messi ','neymar ','cristiano ronaldo',
    'gol de ','artilheiro do','campeão do','título do','final da copa',
    'grand prix','lewis hamilton','max verstappen','ferrari ',
    'atleta olímpico','medalha de ouro','medalha de prata',
    'tênis atp','wimbledon','us open tênis','roland garros',
    'basquete nba','draft nba','mma ufc','luta pelo cinturão',
    'rodada do brasileirão','campeonato paulista','campeonato carioca',
  ] },
  // Política — expandido com mais padrões
  { cat: 'politica', sinal: [
    'senado aprova','câmara aprova','lula sanciona','presidente veta',
    'stf decide','eleições 2026','deputados votam',
    'governo federal anuncia','ministério anuncia',
    'bolsonaro ','congresso nacional','pec ','pl aprovado',
    'votação no senado','votação na câmara','plenário do',
    'partido político','vereador ','prefeito ','governador ',
    'deputado federal','deputado estadual','senador ','ministro de estado',
    'palácio do planalto','brasília ','oposição ','base aliada',
    'impeachment','cpi ','comissão parlamentar',
    'eleição municipal','campanha eleitoral','candidato a ',
    'pesquisa eleitoral','tse ','tribunal superior eleitoral',
    'supremo tribunal','democracia ','crise política',
    'governo do estado','poder legislativo','poder executivo',
    'reforma política','sistema político','voto em',
  ] },
  // Economia
  { cat: 'economia', sinal: [
    'taxa selic','banco central eleva','inflação acelerou',
    'ipca sobe','ipca cai','pib cresce','pib cai',
    'câmbio fecha','dólar sobe','dólar cai','déficit fiscal',
    'superávit primário','copom decide','desemprego cai',
    'desemprego sobe','emprego formal','caged aponta',
    'mercado de trabalho','juros aumenta','taxa de juros',
    'crédito privado','dívida pública','meta fiscal',
    'arco fiscal','orçamento federal','risco brasil',
    'crescimento econômico','recessão ','superavit comercial',
  ] },
  // Tributação
  { cat: 'tributacao', sinal: [
    'imposto de renda','reforma tributária','receita federal autua',
    'irpf 2025','irpf 2026','simples nacional','desoneracao',
    'isenção fiscal','alíquota zero','declaração do ir',
    'restituição do ir','sonegação fiscal','nota fiscal eletrônica',
    'tributação ','imposto sobre ','alíquota do',
    'regime tributário','parcelamento de dívida',
    'refis ','programa de recuperação fiscal',
    'icms ','iss ','pis cofins','csll ','irpj ',
  ] },
  // Segurança Pública
  { cat: 'seguranca', sinal: [
    'polícia prende','operação policial','tráfico de drogas',
    'homicídio','assalto a banco','chacina ','milícia ',
    'facção criminosa','crime organizado','feminicídio',
    'sequestro em','policia civil','polícia federal',
    'polícia militar','delegacia ','delegado ',
    'investigação criminal','suspeito de','acusado de',
    'preso por ','penitênciária','prisão de ',
    'violência urbana','assassinato ','tiroteio ','baleado ',
    'gangue ','narcotráfico ','operação da pf',
  ] },
  // Internacional
  { cat: 'internacional', sinal: [
    'guerra na ucrânia','conflito em gaza','oriente médio',
    'relações exteriores','embaixada brasileira','otan decide',
    'acordo bilateral','sanções econômicas','geopolítica',
    'cúpula do g20','diplomacia brasileira','trump ',
    'estados unidos ','china ','rússia ','europa ',
    'nato ','onu ','banco mundial ','fmi ',
    'mercosul ','g7 ','g20 ','ucrânia','israel ',
    'palestina','hamas','putin ','xi jinping',
    'america latina ','crise internacional',
  ] },
  // Educação
  { cat: 'educacao', sinal: [
    'enem 2025','enem 2026','vestibular','universidade federal',
    'mec anuncia','prouni','fies ','base curricular',
    'escola pública','ensino fundamental','ensino médio',
    'nota do enem','faculdade ','graduação ','pós-graduação ',
    'mestrado ','doutorado ','bolsa de estudos',
    'escola privada','aluno de ','professor de ',
    'educação básica','ensino técnico','ead ',
    'universidade estadual','universidade pública',
  ] },
  // Religião
  { cat: 'religiao', sinal: [
    'igreja evangélica','pastor ','bispo ','papa francisco',
    'vaticano','missa ','culto religioso','fé cristã',
    'dízimo','templo universal','assembleia de deus',
    'congregação ','crente ','evangélico ','catolicismo ',
    'budismo ','islamismo ','judaísmo ','espiritismo ',
    'umbanda ','candomblé ','oração ','fé religiosa',
  ] },
  // Família
  { cat: 'familia', sinal: [
    'guarda dos filhos','pensão alimentícia','divórcio ',
    'adoção de crianças','planejamento familiar',
    'herança e inventário','violência doméstica',
    'lei maria da penha','maternidade ','paternidade ',
    'educação dos filhos','parentalidade ',
    'família brasileira','guarda compartilhada',
  ] },
  // Cultura — expandido
  { cat: 'cultura', sinal: [
    'festival de cinema','oscar ','grammy ','show de ',
    'exposição de arte','museu ','netflix lança',
    'série da netflix','lançamento de livro',
    'carnaval 2026','carnaval 2025','teatro ','concerto de ',
    'arte contemporânea','literatura brasileira',
    'novela da globo','série da globo','disney lança',
    'amazon prime lança','hbo max lança','spotify lança',
    'show musical','disco de ','banda faz show',
    'cantora lança','cantor lança','atriz vive',
    'filme de ','premiação de ','patrimônio cultural',
    'manifestação cultural','semana de arte',
  ] },
  // Variedades — categoria nova com regras próprias
  { cat: 'variedades', sinal: [
    'novela ','estreia de ','big brother','bbb25','bbb26',
    'reality show','viral nas redes','meme do ','meme viral',
    'celebridade ','famoso ','famosa ','influencer ',
    'tiktoker ','youtuber ','comportamento social',
    'lifestyle ','gastronomia ','turismo ',
    'destino turístico','receita de ','bem-estar ',
    'tendência de ','estilo de vida','hábito saudável',
    'moda verao','moda inverno','viagem para ',
  ] },
  // Defesa
  { cat: 'defesa', sinal: [
    'exército brasileiro','marinha do brasil','força aérea brasileira',
    'forças armadas','ministério da defesa','segurança nacional',
    'fronteiras do brasil','defesa nacional',
    'militares ','general ','oficial das forças',
    'arsenal militar','operação das forças',
  ] },
];

const SUBCATS_POR_CAT = {
  politica:['Governo Federal','Congresso Nacional','Eleições','Partidos Políticos','STF & Judiciário','Política Estadual','Câmara dos Deputados','Senado Federal','Poder Executivo'],
  economia:['Política Econômica','Inflação & Preços','Taxa Selic','PIB & Crescimento','Câmbio & Dólar','Fiscal & Orçamento','Emprego & Renda','Banco Central'],
  negocios:['Empresas & Corporações','Fusões & Aquisições','Startups','Empreendedorismo','Grandes Corporações','Setor Privado','Varejo','Agronegócio Empresarial'],
  investimentos:['Bolsa de Valores','Renda Fixa','Fundos de Investimento','Tesouro Direto','Criptomoedas','Análise de Mercado','Finanças Pessoais','FIIs'],
  seguros:['Seguro de Vida','Planos de Saúde','Seguro Auto','Previdência Privada','Seguro Residencial','SUSEP & ANS','Seguro Empresarial','Corretoras de Seguros'],
  mercados:['Commodities','Petróleo & Energia','Ouro & Metais','B3 & Ibovespa','Câmbio Internacional','Índices Globais','Agro & Grãos'],
  educacao:['Ensino Superior','ENEM','Educação Básica','Cursos & Certificações','Pós-Graduação','Tecnologia na Educação','Bolsas de Estudo','Ensino Técnico'],
  industria:['Agronegócio','Manufatura','Energia','Infraestrutura','Exportações','Cadeia Produtiva','Mineração','Construção Civil'],
  tecnologia:['Inteligência Artificial','Segurança Digital','E-commerce','Telecomunicações','Inovação','Startups Tech','Blockchain','Computação em Nuvem'],
  esportes:['Futebol','Olimpíadas','Fórmula 1','Tênis','Basquete','Natação','Atletismo','Outros Esportes'],
  saude:['Medicina & Tratamentos','SUS','Saúde Mental','Medicamentos','Bem-estar','Epidemiologia','Pediatria','Nutrição'],
  familia:['Educação dos Filhos','Planejamento Familiar','Herança & Patrimônio','Casamento & Divórcio','Finanças Pessoais','Criação de Filhos'],
  tributacao:['IRPF','Reforma Tributária','ICMS & ISS','Receita Federal','Planejamento Tributário','Impostos Federais','Simples Nacional','CSLL & IRPJ'],
  regulacao:['BACEN','CVM','ANBIMA','SUSEP','ANS','ANATEL','ANEEL','Regulação Setorial'],
  parcerias:['Acordos Comerciais','Joint Ventures','Alianças Estratégicas','Contratos Públicos','PPP'],
  internacional:['Relações Exteriores','Geopolítica','Conflitos Globais','América Latina','Estados Unidos','Europa','China & Ásia','Oriente Médio','Diplomacia'],
  variedades:['Comportamento','Lifestyle','Entretenimento','Tendências','Gastronomia','Turismo','Moda'],
  investigativo:['Corrupção','Operações Policiais','Denúncias','Jornalismo de Dados','Fiscalização Pública','Lavagem de Dinheiro'],
  seguranca:['Segurança Pública','Crime Organizado','Violência Urbana','Polícia Federal','Narcotráfico','Facções','Homicídios'],
  cultura:['Cinema','Música','Arte','Teatro','Literatura','Patrimônio Cultural','Streaming','Festivais'],
  profissoes:['Medicina','Direito','Engenharia','Contabilidade','TI & Programação','Administração','Arquitetura','Recursos Humanos'],
  vagas:['Oportunidades CLT','Trabalho Remoto','Recrutamento & Seleção','Estágio','Trainee','Mercado de Trabalho'],
  concursos:['Concursos Federais','Concursos Estaduais','Concursos Municipais','Militares & Policiais','Judiciário','Saúde Pública'],
  imoveis:['Mercado Imobiliário','Financiamento Habitacional','Construtoras','Aluguel','Lançamentos','Minha Casa Minha Vida'],
  esg:['Sustentabilidade','Meio Ambiente','Governança Corporativa','Energia Limpa','Impacto Social','Carbono & Emissões'],
  defesa:['Forças Armadas','Segurança Nacional','Política de Defesa','Exército','Marinha','Aeronáutica','Fronteiras'],
  religiao:['Evangelicalismo','Catolicismo','Espiritualidade','Igrejas','Fé & Sociedade','Missões','Religiões Afro-brasileiras'],
};

const SUBCAT_DEFAULT = {
  vagas:'Oportunidades CLT',concursos:'Concursos Federais',imoveis:'Mercado Imobiliário',
  saude:'Medicina & Tratamentos',tecnologia:'Inteligência Artificial',esportes:'Futebol',
  politica:'Governo Federal',economia:'Política Econômica',negocios:'Empresas & Corporações',
  investimentos:'Bolsa de Valores',seguros:'Seguro de Vida',mercados:'Commodities',
  educacao:'Ensino Superior',industria:'Agronegócio',familia:'Educação dos Filhos',
  tributacao:'IRPF',regulacao:'BACEN',parcerias:'Acordos Comerciais',
  internacional:'Relações Exteriores',variedades:'Comportamento',investigativo:'Corrupção',
  seguranca:'Segurança Pública',cultura:'Cinema',profissoes:'Medicina',
  esg:'Sustentabilidade',defesa:'Forças Armadas',religiao:'Evangelicalismo',
};

function slugify(t) {
  return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function corrigirCategoria(titulo, cat) {
  const t = (titulo||'').toLowerCase();
  for (const { cat: c, sinal } of REGRAS_CATEGORIA) {
    if (sinal.some(s => t.includes(s))) return c;
  }
  return cat;
}

function validarConteudo(content) {
  if (!content || !content.titulo) return false;
  const titulo = content.titulo.toLowerCase().trim();
  if (titulo.length < 15 || titulo.length > 120) return false;
  if (/^(prezado|caro|ol[aá]|sem t[ií]tulo|t[ií]tulo:|headline:|assunto:|erro:|teste:)/.test(titulo)) return false;
  if ((content.corpo || '').length < 1000) return false;
  if (!content.corpo.toLowerCase().includes('redação ovc')) return false;
  return true;
}

async function corrigirPostsExistentes() {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id,titulo,user_tags,subcategoria,imagem,status')
      .in('status', ['publicado','pendente'])
      .order('created_at', { ascending: false })
      .limit(500);

    if (!posts || !posts.length) return;

    for (const post of posts) {
      try {
        let tags;
        try { tags = typeof post.user_tags === 'string' ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) { tags = []; }
        const catAtual = (tags[0] || 'geral').toLowerCase().trim();
        const catNew   = corrigirCategoria(post.titulo, catAtual);
        const subcAtual = post.subcategoria || '';
        const lista    = SUBCATS_POR_CAT[catNew] || [];
        const subcOk   = lista.length === 0 || lista.some(s => s === subcAtual || s.toLowerCase() === subcAtual.toLowerCase());
        const subcNew  = subcOk ? subcAtual : (SUBCAT_DEFAULT[catNew] || 'Geral');
        const imgConc  = isCompetitorDomain(post.imagem);

        const temProb = catNew !== catAtual || !subcOk || imgConc;
        if (!temProb) continue;

        const u = {};
        if (catNew !== catAtual) u.user_tags = JSON.stringify([catNew]);
        if (!subcOk || catNew !== catAtual) { u.subcategoria = subcNew; u.subcategoria_slug = slugify(subcNew); }
        if (imgConc) u.imagem = null;

        if (Object.keys(u).length) await supabase.from('posts').update(u).eq('id', post.id);
      } catch(_) {}
    }
  } catch(_) {}
}

export default async function handler(req, res) {
  const inicio = Date.now();
  const body = req.body || {};
  const meta = req.query || {};
  const targetCount = Math.min(parseInt(meta.count || body.count || '1', 10), 8);

  try {
    if (!body.force && !body.batch) {
      const { data: cfg } = await supabase.from('config').select('value').eq('key','AUTOMATION').single();
      if (!cfg || cfg.value !== 'on') return res.status(200).json({ status: 'automation_paused' });
    }

    if (!body.force && !body.batch) {
      const { data: cfgMax } = await supabase.from('config').select('value').eq('key','MAX_POSTS_DIA').single();
      const MAX_DIA = parseInt(cfgMax?.value || '300', 10);
      const agora = new Date();
      const inicioDia = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()) + (agora.getUTCHours() < 3 ? -1 : 0) * 86400000 + 3 * 3600000);
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', inicioDia.toISOString()).eq('publish_method', 'portal');
      if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: 'limit_reached', count, max: MAX_DIA });
    }

    corrigirPostsExistentes().catch(() => {});

    // Busca com prioridade: uma categoria de alto engajamento + pool geral
    const catAlvo = HIGH_PRIORITY_CATS[Math.floor(Math.random() * HIGH_PRIORITY_CATS.length)];
    const [priorityNews, generalNews] = await Promise.all([
      getNewsByCategoria(catAlvo),
      getNews()
    ]);
    const seenLinks = new Set();
    const news = [...priorityNews, ...generalNews].filter(item => {
      if (seenLinks.has(item.link)) return false;
      seenLinks.add(item.link);
      return true;
    });

    if (!news.length) return res.status(200).json({ status: 'no_news' });

    const artigos = [];

    for (const item of news.slice(0, 40)) {
      if (Date.now() - inicio > 50000) break;
      if (artigos.length >= targetCount) break;

      const hash = crypto.createHash('md5').update(item.link + '_portal').digest('hex');
      const { data: dup } = await supabase.from('posts').select('id').eq('hash', hash).single();
      if (dup) continue;

      const article = await scrape(item.link);
      const sourceText = (article.text && article.text.length >= 380) ? article.text : null;
      if (!sourceText) continue;

      let content;
      try { content = await rewritePortal(sourceText, item.title); } catch(e) { continue; }

      if (!validarConteudo(content)) continue;
      if (!content.categoria || content.categoria === 'geral') continue;

      const catCorrigida = corrigirCategoria(content.titulo, content.categoria);
      if (catCorrigida !== content.categoria) {
        content.categoria = catCorrigida;
        content.subcategoria = SUBCAT_DEFAULT[catCorrigida] || 'Geral';
        content.subcategoria_slug = slugify(content.subcategoria);
      }
      if (!content.subcategoria) {
        content.subcategoria = SUBCAT_DEFAULT[content.categoria] || 'Geral';
        content.subcategoria_slug = slugify(content.subcategoria);
      }

      let imagemFinal = null;
      const imgOriginal = article.image && article.image.length > 10 ? article.image : null;
      const imgAprovada = imgOriginal && !isCompetitorDomain(imgOriginal) ? imgOriginal : null;
      if (imgAprovada) imagemFinal = await processAndSaveImage(imgAprovada, hash.slice(0, 12));
      if (!imagemFinal) imagemFinal = await findImage(content.titulo, content.categoria, '', '');

      const { data: post, error } = await supabase.from('posts').insert({
        titulo: content.titulo,
        conteudo: content.corpo,
        comentario_fixado: content.meta_descricao || content.subtitulo || '',
        imagem: imagemFinal,
        hash,
        status: 'pendente',
        approved: false,
        publish_method: 'portal',
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: '[]',
        metrics: { foco_keyword: content.foco_keyword || '', seo_slug: content.slug || '', meta_descricao: content.meta_descricao || '' },
        priority: 0, retry_count: 0, max_retries: 3
      }).select().single();

      if (error) continue;
      artigos.push({ titulo: content.titulo, categoria: content.categoria, subcategoria: content.subcategoria, id: post?.id });
    }

    if (artigos.length > 0) {
      return res.status(200).json({ status: 'ok', artigos, total: artigos.length, titulo: artigos[0].titulo, categoria: artigos[0].categoria, id: artigos[0].id });
    }
    return res.status(200).json({ status: 'no_valid_news' });

  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}
