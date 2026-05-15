import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import axios from 'axios';
import { getNews, getNewsByCategoria, FAMILIA_CAT } from "../core/rss.js";
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

const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];

const CATS_VALIDAS = new Set([
  'politica','economia','negocios','investimentos','seguros','mercados',
  'educacao','industria','tecnologia','esportes','saude','familia',
  'tributacao','regulacao','parcerias','internacional','variedades',
  'investigativo','seguranca','cultura','profissoes','vagas',
  'concursos','imoveis','esg','defesa','religiao'
]);

const REGRAS_CATEGORIA = [
  { cat: 'vagas',      sinal: ['oferece vaga','abre vaga','processo seletivo','trainee','estagio ','estágio ','auxiliar de vendas','auxiliar de atendimento','analista de rh','gerente de vendas','clique e candidate'] },
  { cat: 'concursos', sinal: ['concurso público','concurso publico','edital do concurso','gabarito oficial','inscrições abertas para concurso','provas do concurso'] },
  { cat: 'imoveis',   sinal: ['mercado imobiliário','financiamento imobiliário','minha casa minha vida','metro quadrado','lançamento imobiliário','incorporadora'] },
  { cat: 'saude',     sinal: ['anvisa aprova','novo medicamento','vacina contra','ministério da saúde anuncia','plano de saúde aumenta','sus atende','hospital federal','doença crônica'] },
  { cat: 'tecnologia',sinal: ['inteligência artificial','ia generativa','chatgpt','machine learning','cibersegurança','startup lança','iphone ','android ','inteligencia artificial'] },
  { cat: 'esportes',  sinal: ['copa do mundo','campeonato brasileiro','libertadores','fórmula 1','olimpíadas','nba ','nfl ','futebol brasileiro','brasileirão','seleção brasileira'] },
  { cat: 'politica',  sinal: ['senado aprova','câmara aprova','lula sanciona','presidente veta','stf decide','eleições 2026','deputados votam','governo federal anuncia','ministério anuncia'] },
  { cat: 'economia',  sinal: ['taxa selic','banco central eleva','inflação acelerou','ipca sobe','ipca cai','pib cresce','pib cai','câmbio fecha','dólar sobe','dólar cai','déficit fiscal','superávit primário','copom decide','desemprego cai','desemprego sobe','emprego formal','caged aponta','mercado de trabalho'] },
  { cat: 'tributacao',sinal: ['imposto de renda','reforma tributária','receita federal autua','irpf 2025','irpf 2026','simples nacional','desoneracao','isenção fiscal','alíquota zero','declaração do ir','restituição do ir','sonegação fiscal','nota fiscal eletrônica'] },
  { cat: 'seguranca', sinal: ['polícia prende','operação policial','tráfico de drogas','homicídio','assalto a banco','chacina','milícia','facção criminosa','crime organizado','feminicídio','sequestro em'] },
  { cat: 'internacional', sinal: ['guerra na ucrânia','conflito em gaza','oriente médio','relações exteriores','embaixada brasileira','otan decide','acordo bilateral','sanções econômicas','geopolítica','cúpula do g20','diplomacia brasileira'] },
  { cat: 'educacao',  sinal: ['enem 2025','enem 2026','vestibular','universidade federal','mec anuncia','prouni','fies ','base curricular','escola pública','ensino fundamental','ensino médio','nota do enem'] },
  { cat: 'religiao',  sinal: ['igreja evangélica','bispo ','papa francisco','vaticano','culto religioso','fé cristã','dízimo','templo universal','assembleia de deus'] },
  { cat: 'familia',   sinal: ['guarda dos filhos','pensão alimentícia','divórcio ','adoção de crianças','planejamento familiar','herança e inventário','violência doméstica','lei maria da penha'] },
  { cat: 'cultura',   sinal: ['festival de cinema','oscar ','grammy ','exposição de arte','netflix lança','série da netflix','lançamento de livro','carnaval 2026','carnaval 2025'] },
  { cat: 'defesa',    sinal: ['exército brasileiro','marinha do brasil','força aérea brasileira','forças armadas','ministério da defesa','segurança nacional','fronteiras do brasil','defesa nacional'] },
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

const HOMEPAGE_FALLBACK = [
  { url: 'https://agenciabrasil.ebc.com.br', domain: 'agenciabrasil.ebc.com.br' },
  { url: 'https://www.infomoney.com.br', domain: 'infomoney.com.br' },
  { url: 'https://exame.com', domain: 'exame.com' },
  { url: 'https://canaltech.com.br', domain: 'canaltech.com.br' },
  { url: 'https://www.metropoles.com', domain: 'metropoles.com' },
  { url: 'https://www.moneytimes.com.br', domain: 'moneytimes.com.br' },
  { url: 'https://www.seudinheiro.com', domain: 'seudinheiro.com' },
  { url: 'https://techcrunch.com', domain: 'techcrunch.com' },
];

async function getLinksFromHomepages() {
  const results = await Promise.allSettled(
    HOMEPAGE_FALLBACK.map(async ({ url, domain }) => {
      try {
        const res = await axios.get(url, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
          },
          maxRedirects: 5,
          validateStatus: s => s < 400,
          responseType: 'text',
        });
        const html = typeof res.data === 'string' ? res.data : '';
        if (!html) return [];
        const links = new Set();
        const hrefRx = /href="(https?:\/\/[^"#?]+)"/g;
        let m;
        while ((m = hrefRx.exec(html)) !== null) {
          const link = m[1];
          if (!link.includes(domain)) continue;
          const path = link.replace(/^https?:\/\/[^\/]+/, '');
          const segs = path.split('/').filter(Boolean);
          const hasYear = /\/20(2[3-9]|[3-9]\d)\//.test(link);
          const hasSlug = segs.length >= 2 && /[a-z]+-[a-z]/.test(segs[segs.length - 1]);
          if ((hasYear || hasSlug) && link.length < 200) links.add(link);
          if (links.size >= 12) break;
        }
        return [...links].map(link => ({ title: '', link, source: domain, description: '' }));
      } catch (_) {
        return [];
      }
    })
  );
  const allLinks = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value);
  const seen = new Set();
  return allLinks
    .filter(item => { if (seen.has(item.link)) return false; seen.add(item.link); return true; })
    .sort(() => Math.random() - 0.5);
}

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
  if ((content.corpo || '').length < 800) return false;
  return true;
}

function tituloSimilar(a, b) {
  const norm = t => (t || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4);
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return false;
  const intersect = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return (intersect / union) >= 0.40;
}

export default async function handler(req, res) {
  const inicio = Date.now();
  const body = req.body || {};
  const meta = req.query || {};
  const targetCount = Math.min(parseInt(meta.count || body.count || '1', 10), 8);

  const catForcada = (body.categoria || '').trim().toLowerCase();
  const subcatRaw = (body.subcategoria || '').trim();
  const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw) ? '' : subcatRaw;

  try {
    if (!body.force) {
      const agoraBR = new Date(Date.now() - 3 * 3600000);
      const horaBR  = agoraBR.getUTCHours();
      const dentroJanela = horaBR >= 7 || horaBR < 1;
      if (!dentroJanela) {
        return res.status(200).json({ status: 'fora_horario', hora: horaBR, janela: '07:00-01:00 BRT' });
      }
    }

    let recentTitles = [];
    try {
      const { data: rt } = await supabase.from('posts')
        .select('titulo')
        .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
        .limit(300);
      recentTitles = (rt || []).map(p => p.titulo || '');
    } catch(_) {}

    const catAlvo = (catForcada && CATS_VALIDAS.has(catForcada))
      ? catForcada
      : HIGH_PRIORITY_CATS[Math.floor(Math.random() * HIGH_PRIORITY_CATS.length)];

    let news;
    let _dbgPrio = 0, _dbgGen = 0;

    if (catForcada && CATS_VALIDAS.has(catForcada)) {
      news = await getNewsByCategoria(catForcada);
      _dbgPrio = news.length;
      if (!news.length) {
        const [prio, gen] = await Promise.all([getNewsByCategoria(catAlvo), getNews()]);
        _dbgPrio = prio.length; _dbgGen = gen.length;
        const seen = new Set();
        news = [...prio, ...gen].filter(i => { if (seen.has(i.link)) return false; seen.add(i.link); return true; });
      }
    } else {
      const [priorityNews, generalNews] = await Promise.all([
        getNewsByCategoria(catAlvo),
        getNews()
      ]);
      _dbgPrio = priorityNews.length;
      _dbgGen = generalNews.length;
      const seenLinks = new Set();
      news = [...priorityNews, ...generalNews].filter(item => {
        if (seenLinks.has(item.link)) return false;
        seenLinks.add(item.link);
        return true;
      });
    }

    if (!news.length) {
      console.log('[pipeline] RSS zerou — tentando fallback de homepages');
      news = await getLinksFromHomepages();
      console.log('[pipeline] fallback homepages:', news.length, 'links');
    }

    if (!news.length) {
      return res.status(200).json({ status: 'no_news', catAlvo, prio: _dbgPrio, gen: _dbgGen, ts: Date.now() });
    }

    const artigos = [];

    for (const item of news.slice(0, 80)) {
      if (Date.now() - inicio > 55000) break;
      if (artigos.length >= targetCount) break;

      const hash = crypto.createHash('md5').update(item.link + '_portal').digest('hex');
      const { data: dup } = await supabase.from('posts').select('id').eq('hash', hash).single();
      if (dup) continue;

      const article = await scrape(item.link);

      // Usa texto do scraper se suficiente; senao usa titulo+descricao do RSS
      let sourceText = (article.text && article.text.length >= 200) ? article.text : null;
      if (!sourceText) {
        const rssText = [item.title, item.description].filter(s => s && s.trim()).join('\n\n').trim();
        if (rssText.length >= 150) sourceText = rssText;
      }
      if (!sourceText) continue;

      let content;
      try { content = await rewritePortal(sourceText, item.title); } catch(e) { continue; }

      if (!validarConteudo(content)) continue;

      if (!content.categoria || content.categoria === 'geral') {
        const catCorrigida = corrigirCategoria(content.titulo, '');
        if (catCorrigida && CATS_VALIDAS.has(catCorrigida)) {
          content.categoria = catCorrigida;
        } else {
          continue;
        }
      }

      if (recentTitles.some(t => tituloSimilar(t, content.titulo))) continue;

      if (catForcada && CATS_VALIDAS.has(catForcada)) {
        const familiaForcada = FAMILIA_CAT[catForcada];
        const familiaConteudo = FAMILIA_CAT[content.categoria];
        if (familiaForcada && familiaConteudo && familiaForcada !== familiaConteudo) continue;
        content.categoria = catForcada;
      } else {
        const catCorrigida = corrigirCategoria(content.titulo, content.categoria);
        if (catCorrigida !== content.categoria) content.categoria = catCorrigida;
      }

      if (subcatForcada) {
        content.subcategoria = subcatForcada;
        content.subcategoria_slug = slugify(subcatForcada);
      } else {
        const lista = SUBCATS_POR_CAT[content.categoria] || [];
        const subcOk = lista.length === 0 || lista.includes(content.subcategoria);
        if (!subcOk || !content.subcategoria) {
          content.subcategoria = SUBCAT_DEFAULT[content.categoria] || lista[0] || 'Geral';
          content.subcategoria_slug = slugify(content.subcategoria);
        }
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
        published_at: null,
        publish_method: 'portal',
        user_tags: JSON.stringify([content.categoria]),
        subcategoria: content.subcategoria,
        subcategoria_slug: content.subcategoria_slug,
        collaborators: '[]',
        metrics: {
          foco_keyword: content.foco_keyword || '',
          seo_slug: content.slug || '',
          meta_descricao: content.meta_descricao || '',
          meta_title: content.meta_title || ''
        },
        priority: 0, retry_count: 0, max_retries: 3
      }).select().single();

      if (error) continue;

      recentTitles.push(content.titulo);
      artigos.push({ titulo: content.titulo, categoria: content.categoria, subcategoria: content.subcategoria, id: post?.id });
    }

    if (artigos.length > 0) {
      return res.status(200).json({ status: 'ok', artigos, total: artigos.length, titulo: artigos[0].titulo, categoria: artigos[0].categoria, id: artigos[0].id });
    }
    return res.status(200).json({ status: 'no_valid_news', ts: Date.now() });

  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}
