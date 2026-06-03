import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PASS = 'ovc-admin-2026-secreto';
const _SB_URL = process.env.SUPABASE_URL || Buffer.from('aHR0cHM6Ly95bnR3dmZjeGphcmR6YWZkcWFuai5zdXBhYmFzZS5jbw==','base64').toString();
const _SB_KEY = process.env.SUPABASE_KEY || Buffer.from('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5sdWRIZDJabU40YW1GeVpIcGhhRFJ4WVc1cUlpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGM0TURNMU5UTXdNeXdpWlhod0lqb3lNRGsxT1RNeE16QXpmUS5CWDFOXzB3SG9JQ3dLNVY4LTk2S1hhTU1iQTh0UU1hblZlbHhTMS1wTzQw','base64').toString();
const sb = createClient(_SB_URL, _SB_KEY);

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

  // ── PROXY DE IMAGEM (resolve CORS da extensão Chrome) ───────────────────────
  if (op === 'proxy') {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'url required' });
    if (!url.startsWith('http://') && !url.startsWith('https://'))
      return res.status(400).json({ error: 'invalid url' });
    try {
      const r = await fetch(url);
      if (!r.ok) return res.status(502).json({ error: 'upstream error', status: r.status });
      const buf = await r.arrayBuffer();
      const ct = r.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(Buffer.from(buf));
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  // ── SETUP ───────────────────────────────────────────────────────────────────
  if (op === 'setup') {
    if (req.query.pass !== PASS) return res.status(403).json({ error: 'Acesso negado' });
    const { error } = await sb.from('config').select('key').limit(1);
    if (error) return res.status(200).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, message: 'Sistema pronto! A fila usa a tabela config existente.' });
  }

  // ── QUEUE ───────────────────────────────────────────────────────────────────
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

      const { post_id, titulo, imagem, resumo, categoria } = body;
      if (!post_id || !titulo || !imagem)
        return res.status(400).json({ error: 'post_id, titulo e imagem obrigatórios' });

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

  return res.status(400).json({ error: 'op param required: setup, queue or proxy' });
}
