import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
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

const REGRAS_CATEGORIA = [
  { cat: 'vagas',      sinal: ['vaga para','vagas para','vaga de ','vagas de ','oferece vaga','abre vaga','home office','processo seletivo','trainee','estagio ','estágio ','auxiliar de vendas','auxiliar de atendimento','analista de rh','gerente de vendas','coordenador de','clique e candidate'] },
  { cat: 'concursos', sinal: ['concurso público','concurso publico','edital do concurso','gabarito oficial','inscrições abertas para concurso','provas do concurso'] },
  { cat: 'imoveis',   sinal: ['mercado imobiliário','financiamento imobiliário','minha casa minha vida','metro quadrado','lançamento imobiliário','incorporadora'] },
  { cat: 'saude',     sinal: ['anvisa aprova','novo medicamento','vacina contra','ministério da saúde anuncia','plano de saúde aumenta'] },
  { cat: 'tecnologia',sinal: ['inteligência artificial','ia generativa','chatgpt','machine learning','cibersegurança','startup lança','iphone ','android '] },
  { cat: 'esportes',  sinal: ['copa do mundo','campeonato brasileiro','libertadores','fórmula 1','olimpíadas','nba ','nfl ','futebol brasileiro','brasileirão','seleção brasileira'] },
  { cat: 'politica',  sinal: ['senado aprova','câmara aprova','lula sanciona','presidente veta','stf decide','eleições 2026','deputados votam'] },
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

// Corrige automaticamente posts com categoria/subcategoria errada ou imagem de concorrente
async function corrigirPostsExistentes() {
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id,titulo,user_tags,subcategoria,imagem,status')
      .in('status', ['publicado','pendente'])
      .order('created_at', { ascending: false })
      .limit(100);

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
  const targetCount = Math.min(parseInt(meta.count || body.count || '1', 10), 4);

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

    // Corrige posts existentes com problemas automaticamente a cada execucao
    corrigirPostsExistentes().catch(() => {});

    const news = await getNews();
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

    try { await seoBackfill(artigos.length > 0 ? 2 : 5); } catch(_) {}

    if (artigos.length > 0) {
      return res.status(200).json({ status: 'ok', artigos, total: artigos.length, titulo: artigos[0].titulo, categoria: artigos[0].categoria, id: artigos[0].id });
    }
    return res.status(200).json({ status: 'no_valid_news' });

  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

async function seoBackfill(limite) {
  if (!OPENAI_KEY) return;
  const { data: posts } = await supabase.from('posts').select('id,titulo,conteudo,metrics').eq('status','publicado').or('metrics.is.null,metrics->>seo_otimizado.neq.true').order('created_at',{ascending:true}).limit(limite);
  if (!posts || !posts.length) return;
  for (const post of posts) {
    try {
      const prompt = `Gere SEO para este artigo do portal O Valor Capital.\nTÍTULO: ${post.titulo}\nCONTEÚDO: ${(post.conteudo||'').slice(0,600)}\n\nFormato exato:\nTITULO: manchete 50-65 chars\nFOCO_KEYWORD: 2-4 palavras\nSLUG: 3-5 palavras hifenizadas sem acentos\nMETA_DESCRICAO: 145-160 chars`;
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENAI_KEY}`}, body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:prompt}],temperature:0.2,max_tokens:300}) });
      const d = await r.json();
      const raw = d.choices?.[0]?.message?.content || '';
      let novoTitulo='',focoKeyword='',slug='',metaDescricao='';
      for (const line of raw.split('\n')) {
        const t = line.trim();
        if (/^TITULO:/i.test(t)) novoTitulo=t.replace(/^TITULO:/i,'').trim();
        else if (/^FOCO_KEYWORD:/i.test(t)) focoKeyword=t.replace(/^FOCO_KEYWORD:/i,'').trim();
        else if (/^SLUG:/i.test(t)) slug=slugify(t.replace(/^SLUG:/i,'').trim());
        else if (/^META_DESCRICAO:/i.test(t)) metaDescricao=t.replace(/^META_DESCRICAO:/i,'').trim();
      }
      if (!slug && novoTitulo) slug=slugify(novoTitulo).split('-').slice(0,5).join('-');
      const m=(typeof post.metrics==='object'&&post.metrics)?post.metrics:{};
      await supabase.from('posts').update({titulo:novoTitulo||post.titulo,comentario_fixado:metaDescricao||'',metrics:{...m,foco_keyword:focoKeyword,seo_slug:slug,meta_descricao:metaDescricao,seo_otimizado:true}}).eq('id',post.id);
    } catch(_) {}
  }
}
