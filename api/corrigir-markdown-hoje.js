import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function inlineBold(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function markdownToHtml(text) {
  if (!text) return text;
  const hasMarkdown = /\*\*|^##\s|^[•\-]\s/m.test(text);
  if (!hasMarkdown) return text;

  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (/^Reda[cç][aã]o OVC/i.test(trimmed)) {
      const converted = trimmed.replace(/^(Reda[cç][aã]o OVC)/i, '<strong>$1</strong>');
      output.push(`<p>${converted}</p>`);
      i++;
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^##\s+/, '');
      output.push(`<h2>${inlineBold(heading)}</h2>`);
      i++;
      continue;
    }

    if (/^[•\-]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[•\-]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[•\-]\s+/, '');
        items.push(`  <li>${inlineBold(item)}</li>`);
        i++;
      }
      output.push('<ul>', ...items, '</ul>');
      continue;
    }

    if (/^#[a-zA-Z]/.test(trimmed)) {
      output.push(`<p>${trimmed}</p>`);
      i++;
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim()) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${inlineBold(paraLines.join(' '))}</p>`);
    }
  }

  return output.join('\n');
}

export default async function handler(req, res) {
  const isGet = req.method === 'GET';
  const isPost = req.method === 'POST';

  if (!isGet && !isPost) return res.status(405).json({ error: 'Method not allowed' });

  const forceGet = isGet && req.query?.force === '1';
  const forcePost = isPost && req.body?.force === true;

  if (!forceGet && !forcePost) {
    return res.status(403).json({ error: 'Passe ?force=1 na URL (GET) ou force:true no body (POST)' });
  }

  // 7h BRT = 10h UTC
  const hojeUTC = new Date().toISOString().split('T')[0];
  const desde = `${hojeUTC}T10:00:00Z`;

  try {
    const { data: posts, error: fetchErr } = await supabase
      .from('posts')
      .select('id, conteudo')
      .gte('created_at', desde)
      .limit(2000);

    if (fetchErr) return res.status(500).json({ error: fetchErr.message });

    let fixed = 0;
    let skipped = 0;
    const erros = [];

    for (const post of posts || []) {
      const original = post.conteudo || '';
      if (!/\*\*|^##\s|^[•\-]\s/m.test(original)) { skipped++; continue; }

      const convertido = markdownToHtml(original);
      if (convertido === original) { skipped++; continue; }

      const { error: updateErr } = await supabase
        .from('posts')
        .update({ conteudo: convertido })
        .eq('id', post.id);

      if (updateErr) erros.push({ id: post.id, erro: updateErr.message });
      else fixed++;
    }

    const resultado = {
      status: 'ok',
      total_verificados: (posts || []).length,
      corrigidos: fixed,
      sem_markdown: skipped,
      erros: erros.length ? erros : undefined
    };

    if (isGet) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`<pre style="font-family:monospace;font-size:16px;padding:20px">${JSON.stringify(resultado, null, 2)}</pre>`);
    }
    return res.status(200).json(resultado);
  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}
