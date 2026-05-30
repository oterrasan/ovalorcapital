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

async function hydrateAIKeys() {
  const { data, error } = await supabase.from('config').select('key,value').in('key', ['OPENAI_API_KEY', 'OPENAI_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY']);
  if (error) throw error;
  for (const row of data || []) if (row?.key && row?.value && !process.env[row.key]) process.env[row.key] = String(row.value).trim();
  if (!process.env.OPENAI_API_KEY && process.env.OPENAI_KEY) process.env.OPENAI_API_KEY = process.env.OPENAI_KEY;
}
await hydrateAIKeys();

const limit = Math.min(Math.max(parseInt(process.env.LIMIT || '2', 10) || 2, 1), 5);
const dryRun = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const includeColunas = String(process.env.INCLUDE_COLUNAS || '').toLowerCase() === 'true';
const ids = (process.env.POST_IDS || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, limit);

function hoje() { return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }); }
function parseTags(tags) { if (Array.isArray(tags)) return tags; if (!tags) return []; try { const parsed = JSON.parse(tags); return Array.isArray(parsed) ? parsed : []; } catch (_) { return String(tags).split(',').map(t => t.trim()).filter(Boolean); } }
function slugify(text) { return String(text || 'geral').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'geral'; }
function plain(html = '') { return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function inferCategoria(post, content) { const atual = parseTags(post.user_tags)[0] || post.metrics?.categoria || ''; return content.categoria && content.categoria !== 'geral' ? content.categoria : (atual || 'economia'); }
function field(raw, name) { const rx = new RegExp(`^${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|\\nCORPO:|$)`, 'mi'); return (String(raw || '').match(rx)?.[1] || '').trim(); }
function parseOVC(raw) {
  const txt = String(raw || '').replace(/```(?:html|json)?/gi, '').replace(/```/g, '').trim();
  return { titulo: field(txt, 'TITULO').replace(/\*\*/g, '').trim(), meta_title: field(txt, 'META_TITLE').replace(/\*\*/g, '').trim(), foco_keyword: field(txt, 'FOCO_KEYWORD'), slug: slugify(field(txt, 'SLUG')), meta_descricao: field(txt, 'META_DESCRICAO'), categoria: field(txt, 'CATEGORIA').toLowerCase().replace(/[^a-z]/g, ''), subcategoria: field(txt, 'SUBCATEGORIA'), corpo: (txt.match(/CORPO:\s*([\s\S]*)$/i)?.[1] || '').trim() };
}
function audit(content) {
  const corpo = String(content?.corpo || ''); const texto = plain(corpo); const issues = [];
  if (!content?.titulo || !corpo) issues.push('estrutura incompleta');
  if (texto.length < 1600) issues.push(`texto curto: ${texto.length}`);
  if (!/<p>\s*<strong>Reda/i.test(corpo)) issues.push('assinatura ausente');
  if ((corpo.match(/<p\b/gi) || []).length < 7) issues.push('poucos paragrafos');
  if (!/<h2\b/i.test(corpo)) issues.push('subtitulos ausentes');
  if (!/<h2>\s*Conclus/i.test(corpo)) issues.push('Conclusao OVC ausente');
  if (/\*\*|^##|\n##|TITULO:|META_TITLE:|FOCO_KEYWORD:/m.test(corpo)) issues.push('markdown/metadados no corpo');
  if (/nao foi possivel|conteudo insuficiente|não foi possível|conteúdo insuficiente/i.test(texto)) issues.push('recusa vazou no texto');
  return issues;
}
async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.45, max_tokens: 5200, messages: [{ role: 'system', content: 'Voce e um editor jornalistico senior do O Valor Capital. Responda apenas no formato pedido.' }, { role: 'user', content: prompt }] }) });
  const data = await res.json(); if (!res.ok) throw new Error(data.error?.message || 'Erro OpenAI'); return data.choices?.[0]?.message?.content || '';
}
async function callGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.45, maxOutputTokens: 6000 } }) });
  const data = await res.json(); if (!res.ok) throw new Error(data.error?.message || 'Erro Gemini'); return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', temperature: 0.45, max_tokens: 5200, messages: [{ role: 'system', content: 'Voce e um editor jornalistico senior do O Valor Capital. Responda apenas no formato pedido.' }, { role: 'user', content: prompt }] }) });
  const data = await res.json(); if (!res.ok) throw new Error(data.error?.message || 'Erro Groq'); return data.choices?.[0]?.message?.content || '';
}
async function callAI(prompt) {
  if (process.env.OPENAI_API_KEY) return callOpenAI(prompt);
  if (process.env.GEMINI_API_KEY) return callGemini(prompt);
  if (process.env.GROQ_API_KEY) return callGroq(prompt);
  throw new Error('Nenhuma chave de IA disponivel: OPENAI_API_KEY, GEMINI_API_KEY ou GROQ_API_KEY.');
}
function buildPrompt(fonte) {
  return `# REPARO EDITORIAL OVC - MATERIA PENDENTE

Voce deve reescrever a materia abaixo no padrao oficial do portal O Valor Capital.

REGRAS ABSOLUTAS:
- Nao publicar. Apenas devolver texto corrigido.
- Nao inventar fatos, datas, fontes, falas, crimes, acusacoes, numeros ou estatisticas.
- Se houver incerteza factual, use [VERIFICAR].
- Preserve apenas fatos verificaveis do material recebido.
- Texto deve parecer redacao jornalistica senior, nunca IA.
- Diferenciar da fonte: novo angulo, nova abertura, nova estrutura e linguagem propria.
- Portugues brasileiro formal contemporaneo.
- Paragrafos curtos: cada <p> com no maximo 3 frases e preferencialmente ate 350 caracteres.
- CORPO entre 2.000 e 4.500 caracteres quando houver material suficiente; se a fonte for pobre, amplie apenas com contexto factual seguro.
- Obrigatorio: assinatura inicial, 8 a 12 paragrafos, 2 a 4 <h2>, e ultima secao <h2>Conclusao OVC</h2>.
- FAQ e Temas relacionados sao opcionais; use apenas se fizer sentido.
- Proibido markdown, listas com asterisco, blocos gigantes e metadados dentro do CORPO.
- Proibido: vale destacar, cabe ressaltar, nesse contexto, diante desse cenario, em suma, por fim, robusto, ecossistema, disruptivo, sinergia.

FORMATO EXATO:
TITULO: [55 a 75 caracteres]
META_TITLE: [ate 55 caracteres]
FOCO_KEYWORD: [2 a 4 palavras]
SLUG: [3 a 5 palavras hifenizadas sem acento]
META_DESCRICAO: [141 a 155 caracteres]
CATEGORIA: [politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | variedades | investigativo | seguranca | cultura | profissoes | vagas | concursos | imoveis | esg | defesa | religiao | radar]
SUBCATEGORIA: [subcategoria especifica]
CORPO:
<p><strong>Redacao OVC</strong> — ${hoje()}</p>
[HTML usando apenas <p>, <h2>, <strong>, <ul>, <li>]

MATERIA ATUAL PENDENTE:
${fonte.slice(0, 9000)}`;
}
async function repairWithReview(fonte) {
  let raw = await callAI(buildPrompt(fonte)); let content = parseOVC(raw); let issues = audit(content);
  if (issues.length) { raw = await callAI(`${buildPrompt(fonte)}\n\nA resposta anterior falhou nestes pontos: ${issues.join('; ')}. Reescreva integralmente corrigindo tudo.`); content = parseOVC(raw); issues = audit(content); }
  if (issues.length) throw new Error(`Conteudo fora do padrao: ${issues.join('; ')}`);
  return content;
}
async function fetchPosts() {
  let query = supabase.from('posts').select('id,titulo,conteudo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,metrics,publish_method,created_at').eq('status', 'pendente').order('created_at', { ascending: true }).limit(ids.length ? ids.length : limit * 4);
  if (ids.length) query = query.in('id', ids);
  const { data, error } = await query; if (error) throw error;
  return (data || []).filter(p => includeColunas || !['coluna', 'colunista'].includes(String(p.publish_method || '').toLowerCase())).slice(0, limit);
}
const posts = await fetchPosts(); const now = new Date().toISOString(); const results = [];
console.log(`OVC repair: pendentes selecionados=${posts.length}, limit=${limit}, dryRun=${dryRun}, provider=${process.env.OPENAI_API_KEY ? 'openai' : process.env.GEMINI_API_KEY ? 'gemini' : process.env.GROQ_API_KEY ? 'groq' : 'none'}`);
for (const post of posts) {
  try {
    const fonte = [post.titulo ? `TITULO ATUAL: ${post.titulo}` : '', post.comentario_fixado ? `RESUMO ATUAL: ${post.comentario_fixado}` : '', post.conteudo || ''].filter(Boolean).join('\n\n');
    if (plain(fonte).length < 120) { results.push({ id: post.id, status: 'ignorado', motivo: 'conteudo original insuficiente' }); continue; }
    const content = await repairWithReview(fonte); const categoria = inferCategoria(post, content); const subcategoria = content.subcategoria || post.subcategoria || 'Geral'; const metaDesc = content.meta_descricao || post.comentario_fixado || '';
    const metrics = { ...(post.metrics && typeof post.metrics === 'object' ? post.metrics : {}), foco_keyword: content.foco_keyword || post.metrics?.foco_keyword || '', seo_slug: content.slug || post.metrics?.seo_slug || '', meta_descricao: metaDesc, meta_title: (content.meta_title || content.titulo || '').slice(0, 55), reparo_ovc: true, reparo_ovc_em: now };
    const update = { titulo: content.titulo, conteudo: content.corpo, comentario_fixado: metaDesc, status: 'pendente', approved: false, user_tags: JSON.stringify([categoria]), subcategoria, subcategoria_slug: slugify(subcategoria), metrics, updated_at: now };
    if (!dryRun) { const { error } = await supabase.from('posts').update(update).eq('id', post.id).eq('status', 'pendente'); if (error) throw error; }
    results.push({ id: post.id, status: dryRun ? 'simulado' : 'corrigido', titulo_antigo: post.titulo, titulo_novo: content.titulo, categoria, chars: plain(content.corpo).length });
  } catch (error) { results.push({ id: post.id, status: 'erro', motivo: error.message }); }
}
console.log(JSON.stringify({ ok: true, dryRun, selecionados: posts.length, corrigidos: results.filter(r => r.status === 'corrigido').length, simulados: results.filter(r => r.status === 'simulado').length, reprovados: results.filter(r => r.status === 'reprovado').length, results }, null, 2));
if (!results.some(r => ['corrigido', 'simulado'].includes(r.status))) process.exitCode = 1;
