import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PASS = 'ovc-admin-2026-secreto';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Usa a tabela config existente com chaves ig_q_{id}
// Sem necessidade de criar nova tabela

function newId() { return crypto.randomBytes(8).toString('hex'); }

async function listJobs(status) {
  const { data, error } = await sb.from('config').select('key,value').like('key', 'ig_q_%');
  if (error) return { error: error.message };
  const jobs = (data || []).map(r => { try { return JSON.parse(r.value); } catch { return null; } }).filter(Boolean);
  return { jobs: status ? jobs.filter(j => j.status === status) : jobs };
}

async function updateJob(id, patch) {
  const key = `ig_q_${id}`;
  const { data } = await sb.from('config').select('value').eq('key', key).single();
  if (!data) return { error: 'job not found' };
  const job = JSON.parse(data.value);
  const updated = { ...job, ...patch };
  await sb.from('config').update({ value: JSON.stringify(updated) }).eq('key', key);
  return { ok: true };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const op = req.query.op;

  // ── SETUP (verifica conexão apenas) ─────────────────────────────────────────
  if (op === 'setup') {
    if (req.query.pass !== PASS) return res.status(403).json({ error: 'Acesso negado' });
    const { error } = await sb.from('config').select('key').limit(1);
    if (error) return res.status(200).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, message: 'Sistema pronto! A fila usa a tabela config existente.' });
  }

  // ── QUEUE ───────────────────────────────────────────────────────────────
  if (op === 'queue') {
    if (req.method === 'GET') {
      const { status } = req.query;
      const result = await listJobs(status);
      if (result.error) return res.status(500).json(result);
      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const action = req.query.action;
      const body = req.body || {};

      if (action === 'done') {
        if (!body.id) return res.status(400).json({ error: 'id required' });
        return res.status(200).json(await updateJob(body.id, { status: 'done', published_at: new Date().toISOString() }));
      }
      if (action === 'error') {
        if (!body.id) return res.status(400).json({ error: 'id required' });
        return res.status(200).json(await updateJob(body.id, { status: 'error', error_msg: body.message || 'unknown' }));
      }
      if (action === 'retry') {
        if (!body.id) return res.status(400).json({ error: 'id required' });
        return res.status(200).json(await updateJob(body.id, { status: 'pending', error_msg: null }));
      }

      // Adicionar à fila
      const { post_id, titulo, imagem, resumo, categoria } = body;
      if (!post_id || !titulo || !imagem)
        return res.status(400).json({ error: 'post_id, titulo e imagem obrigatórios' });

      // Verifica duplicata
      const { jobs: existing } = await listJobs('pending');
      const dup = (existing || []).find(j => j.post_id === post_id);
      if (dup) return res.status(200).json({ ok: true, duplicate: true, id: dup.id });

      const id = newId();
      const job = { id, post_id, titulo, imagem, resumo: resumo || '', categoria: categoria || 'geral', status: 'pending', created_at: new Date().toISOString() };
      const { error } = await sb.from('config').insert({ key: `ig_q_${id}`, value: JSON.stringify(job) });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true, job });
    }

    return res.status(405).json({ error: 'method not allowed' });
  }

  return res.status(400).json({ error: 'op param required: setup or queue' });
}
