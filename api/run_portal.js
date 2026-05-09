import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getNews } from "../core/rss.js";
import { scrape } from "../core/scraper.js";
import { rewritePortal } from "../core/ai_portal.js";
import { findImage } from "../core/image_finder.js";
import { processAndSaveImage } from "../core/image_processor.js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ─── DOMÍNIOS CONCORRENTES ────────────────────────────────────────────────
const COMPETITOR_IMG_HOSTS = new Set([
  'glbimg.com','s2.glbimg.com','s3.glbimg.com','i.s3.glbimg.com',
  'globo.com','g1.globo.com','ge.globo.com','oglobo.globo.com',
  'extra.globo.com','valor.com.br',
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
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return [...COMPETITOR_IMG_HOSTS].some(d => hostname === d || hostname.endsWith('.' + d));
  } catch(_) { return false; }
}

// ─── CORRETOR DE CATEGORIA POR PALAVRAS-CHAVE DO TÍTULO ─────────────────────
// Sobrescreve a categoria gerada pela IA quando o título contém sinais
// inequívocos. Evita erros como "vaga de emprego" indo para "seguros".
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
    'fórmula 1', 'olimpíadas', 'nba ', 'nfl ', 'futebol brasileiro',
    'brasileirão', 'seleção brasileira',
  ]},
  { cat: 'politica', sinal: [
    'senado aprova', 'câmara aprova', 'lula sanciona',
    'presidente veta', 'stf decide', 'eleições 2026',
    'deputados votam', 'senadores aprovam',
  ]},
];

// Primeira subcategoria válida por categoria (fallback quando categoria é corrigida)
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

function slugify(t) {
  return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

function corrigirCategoria(titulo, categoriaAI) {
  const t = titulo.toLowerCase();
  for (const { cat, sinal } of REGRAS_CATEGORIA) {
    if (sinal.some(s => t.includes(s))) return cat;
  }
  return categoriaAI;
}

// ─── VALIDAÇÃO DE CONTEÚDO ────────────────────────────────────────────────
function validarConteudo(content) {
  if (!content || !content.titulo) return false;
  const titulo = content.titulo.toLowerCase().trim();
  if (titulo.length < 15) return false;
  if (titulo.length > 120) return false;
  if (/^(prezado|caro|ol[aá]|sem t[ií]tulo|t[ií]tulo:|headline:|assunto:|erro:|teste:|not[ií]cia:|texto:|mat[eé]ria:)/.test(titulo)) return false;
  if ((content.corpo || '').length < 1000) return false;
  if (!content.corpo.toLowerCase().includes('redação ovc')) return false;
  const falhasTecnicas = [
    /jornal da oeste|revista oeste/,
    /programa.{0,20}ao ar.*transmis/,
    /colunista.{0,10}folha|colunista.{0,10}globo/,
  ];
  const corpoInicio = (content.corpo || '').toLowerCase().slice(0, 300);
  for (const r of falhasTecnicas) {
    if (r.test(titulo) || r.test(corpoInicio)) return false;
  }
  return true;
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
      const inicioDia = new Date(Date.UTC(
        agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()
      ) + (agora.getUTCHours() < 3 ? -1 : 0) * 86400000 + 3 * 3600000);
      const { count } = await supabase.from('posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', inicioDia.toISOString())
        .eq('publish_method', 'portal');
      if ((count || 0) >= MAX_DIA) return res.status(200).json({ status: 'limit_reached', count, max: MAX_DIA });
    }

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
      try {
        content = await rewritePortal(sourceText, item.title);
      } catch(e) {
        continue;
      }

      if (!validarConteudo(content)) continue;
      if (!content.categoria || content.categoria === 'geral') continue;

      // Corrigir categoria com base em sinais objetivos do título
      const categoriaCorrigida = corrigirCategoria(content.titulo, content.categoria);
      if (categoriaCorrigida !== content.categoria) {
        content.categoria = categoriaCorrigida;
        content.subcategoria = SUBCAT_DEFAULT[categoriaCorrigida] || 'Geral';
        content.subcategoria_slug = slugify(content.subcategoria);
      }

      if (!content.subcategoria) {
        content.subcategoria = SUBCAT_DEFAULT[content.categoria] || 'Geral';
        content.subcategoria_slug = slugify(content.subcategoria);
      }

      // Imagem: nunca usar domínio concorrente
      let imagemFinal = null;
      const imgOriginal = article.image && article.image.length > 10 ? article.image : null;
      const imgAprovada = imgOriginal && !isCompetitorDomain(imgOriginal) ? imgOriginal : null;
      if (imgAprovada) {
        imagemFinal = await processAndSaveImage(imgAprovada, hash.slice(0, 12));
      }
      if (!imagemFinal) {
        imagemFinal = await findImage(content.titulo, content.categoria, '', '');
      }

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
        metrics: {
          foco_keyword: content.foco_keyword || '',
          seo_slug: content.slug || '',
          meta_descricao: content.meta_descricao || ''
        },
        priority: 0,
        retry_count: 0,
        max_retries: 3
      }).select().single();

      if (error) continue;

      artigos.push({
        titulo: content.titulo,
        categoria: content.categoria,
        subcategoria: content.subcategoria,
        id: post?.id
      });
    }

    try { await seoBackfill(artigos.length > 0 ? 2 : 5); } catch(_) {}

    if (artigos.length > 0) {
      return res.status(200).json({
        status: 'ok',
        artigos,
        total: artigos.length,
        titulo: artigos[0].titulo,
        categoria: artigos[0].categoria,
        id: artigos[0].id
      });
    }
    return res.status(200).json({ status: 'no_valid_news' });

  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}

// ─── SEO BACKFILL ─────────────────────────────────────────────────────────
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

async function seoBackfill(limite) {
  if (!OPENAI_KEY) return;
  const { data: posts } = await supabase
    .from('posts')
    .select('id, titulo, conteudo, metrics')
    .eq('status', 'publicado')
    .or('metrics.is.null,metrics->>seo_otimizado.neq.true')
    .order('created_at', { ascending: true })
    .limit(limite);
  if (!posts || !posts.length) return;
  for (const post of posts) {
    try {
      const prompt = `Gere SEO para este artigo do portal O Valor Capital.\nTÍTULO: ${post.titulo}\nCONTEÚDO: ${(post.conteudo||'').slice(0,600)}\n\nFormato exato:\nTITULO: manchete 50-65 chars\nFOCO_KEYWORD: 2-4 palavras\nSLUG: 3-5 palavras hifenizadas sem acentos\nMETA_DESCRICAO: 145-160 chars`;
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 300 })
      });
      const d = await r.json();
      const raw = d.choices?.[0]?.message?.content || '';
      let novoTitulo = '', focoKeyword = '', slug = '', metaDescricao = '';
      for (const line of raw.split('\n')) {
        const t = line.trim();
        if (/^TITULO:/i.test(t))              novoTitulo    = t.replace(/^TITULO:/i,'').trim();
        else if (/^FOCO_KEYWORD:/i.test(t))   focoKeyword   = t.replace(/^FOCO_KEYWORD:/i,'').trim();
        else if (/^SLUG:/i.test(t))           slug          = slugify(t.replace(/^SLUG:/i,'').trim());
        else if (/^META_DESCRICAO:/i.test(t)) metaDescricao = t.replace(/^META_DESCRICAO:/i,'').trim();
      }
      if (!slug && novoTitulo) slug = slugify(novoTitulo).split('-').slice(0,5).join('-');
      const m = (typeof post.metrics === 'object' && post.metrics) ? post.metrics : {};
      await supabase.from('posts').update({
        titulo: novoTitulo || post.titulo,
        comentario_fixado: metaDescricao || '',
        metrics: { ...m, foco_keyword: focoKeyword, seo_slug: slug, meta_descricao: metaDescricao, seo_otimizado: true }
      }).eq('id', post.id);
    } catch(_) {}
  }
}
