import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.vercel/.env.production.local');
loadEnvFile('.env.local');
loadEnvFile('.env');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_URL/SUPABASE_KEY ausentes. Rode vercel pull ou configure os secrets.');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function hydrateOpenAIKey() {
  if (process.env.OPENAI_API_KEY) return;
  const { data, error } = await supabase.from('config').select('key,value').in('key', ['OPENAI_API_KEY', 'OPENAI_KEY']);
  if (error) throw error;
  const row = (data || []).find(r => r.value && String(r.value).trim());
  if (row?.value) process.env.OPENAI_API_KEY = String(row.value).trim();
}

await hydrateOpenAIKey();
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY ausente. Configure no Vercel ou na tabela config.');

const { rewritePortalManual } = await import('../core/ai_portal.js');

const limit = Math.min(Math.max(parseInt(process.env.LIMIT || '2', 10) || 2, 1), 5);
const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const includeColunas = String(process.env.INCLUDE_COLUNAS || '').toLowerCase() === 'true';
const ids = (process.env.POST_IDS || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, limit);

function parseTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return String(tags).split(',').map(t => t.trim()).filter(Boolean);
  }
}

function slugify(text) {
  return String(text || 'geral')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'geral';
}

function plain(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferCategoria(post, content) {
  const atual = parseTags(post.user_tags)[0] || post.metrics?.categoria || '';
  return content.categoria && content.categoria !== 'geral' ? content.categoria : (atual || 'economia');
}

function audit(content) {
  const corpo = String(content?.corpo || '');
  const texto = plain(corpo);
  const issues = [];
  if (!content?.titulo || !corpo) issues.push('estrutura incompleta');
  if (texto.length < 1800) issues.push(`texto curto: ${texto.length}`);
  if (!/<p>\s*<strong>Reda/i.test(corpo)) issues.push('assinatura ausente');
  if ((corpo.match(/<p\b/gi) || []).length < 7) issues.push('poucos paragrafos');
  if (!/<h2\b/i.test(corpo)) issues.push('subtitulos ausentes');
  if (!/<h2>\s*Conclus/i.test(corpo)) issues.push('Conclusao OVC ausente');
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|FOCO_KEYWORD:/m.test(corpo)) issues.push('markdown/metadados no corpo');
  if (/nao foi possivel|conteudo insuficiente|não foi possível|conteúdo insuficiente/i.test(texto)) issues.push('recusa vazou no texto');
  return issues;
}

async function fetchPosts() {
  let query = supabase.from('posts')
    .select('id,titulo,conteudo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,metrics,publish_method,created_at')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .limit(ids.length ? ids.length : limit * 4);

  if (ids.length) query = query.in('id', ids);

  const { data, error } = await query;
  if (error) throw error;

  return (data || [])
    .filter(p => includeColunas || !['coluna', 'colunista'].includes(String(p.publish_method || '').toLowerCase()))
    .slice(0, limit);
}

const posts = await fetchPosts();
const now = new Date().toISOString();
const results = [];

console.log(`OVC repair: pendentes selecionados=${posts.length}, limit=${limit}, dryRun=${dryRun}`);

for (const post of posts) {
  try {
    const fonte = [
      post.titulo ? `TITULO ATUAL: ${post.titulo}` : '',
      post.comentario_fixado ? `RESUMO ATUAL: ${post.comentario_fixado}` : '',
      post.conteudo || ''
    ].filter(Boolean).join('\n\n');

    if (plain(fonte).length < 120) {
      results.push({ id: post.id, status: 'ignorado', motivo: 'conteudo original insuficiente' });
      continue;
    }

    const contexto = [
      'Repare esta materia pendente do OVC sem publicar.',
      'Preserve apenas fatos verificaveis do material recebido.',
      'Reescreva integralmente no padrao editorial OVC, com assinatura, paragrafos curtos, subtitulos e Conclusao OVC.',
      'Nao altere imagem. Nao invente dados, fontes, falas, crimes, datas ou acusacoes.',
      'Se a materia atual for pobre, amplie com contexto factual seguro e marque [VERIFICAR] quando houver incerteza.'
    ].join('\n');

    const content = await rewritePortalManual(fonte, post.titulo || '', contexto);
    const issues = audit(content);
    if (issues.length) {
      results.push({ id: post.id, status: 'reprovado', motivo: issues.join('; ') });
      continue;
    }

    const categoria = inferCategoria(post, content);
    const subcategoria = content.subcategoria || post.subcategoria || 'Geral';
    const metaDesc = content.meta_descricao || content.subtitulo || post.comentario_fixado || '';
    const metrics = {
      ...(post.metrics && typeof post.metrics === 'object' ? post.metrics : {}),
      foco_keyword: content.foco_keyword || post.metrics?.foco_keyword || '',
      seo_slug: content.slug || post.metrics?.seo_slug || '',
      meta_descricao: metaDesc,
      meta_title: (content.meta_title || content.titulo || '').slice(0, 55),
      reparo_ovc: true,
      reparo_ovc_em: now
    };

    const update = {
      titulo: content.titulo,
      conteudo: content.corpo,
      comentario_fixado: metaDesc,
      status: 'pendente',
      approved: false,
      user_tags: JSON.stringify([categoria]),
      subcategoria,
      subcategoria_slug: slugify(subcategoria),
      metrics,
      updated_at: now
    };

    if (!dryRun) {
      const { error } = await supabase.from('posts').update(update).eq('id', post.id).eq('status', 'pendente');
      if (error) throw error;
    }

    results.push({
      id: post.id,
      status: dryRun ? 'simulado' : 'corrigido',
      titulo_antigo: post.titulo,
      titulo_novo: content.titulo,
      categoria,
      chars: plain(content.corpo).length
    });
  } catch (error) {
    results.push({ id: post.id, status: 'erro', motivo: error.message });
  }
}

console.log(JSON.stringify({
  ok: true,
  dryRun,
  selecionados: posts.length,
  corrigidos: results.filter(r => r.status === 'corrigido').length,
  simulados: results.filter(r => r.status === 'simulado').length,
  reprovados: results.filter(r => r.status === 'reprovado').length,
  results
}, null, 2));

if (!results.some(r => ['corrigido', 'simulado'].includes(r.status))) process.exitCode = 1;
