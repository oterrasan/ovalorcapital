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

    // Linha "Redação OVC — data"
    if (/^Reda[cç][aã]o OVC/i.test(trimmed)) {
      const converted = trimmed.replace(/^(Reda[cç][aã]o OVC)/i, '<strong>$1</strong>');
      output.push(`<p>${converted}</p>`);
      i++;
      continue;
    }

    // H2
    if (/^##\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^##\s+/, '');
      output.push(`<h2>${inlineBold(heading)}</h2>`);
      i++;
      continue;
    }

    // Lista de bullets
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

    // Linha de hashtags
    if (/^#[a-zA-Z]/.test(trimmed)) {
      output.push(`<p>${trimmed}</p>`);
      i++;
      continue;
    }

    // Parágrafo normal — agrega linhas até linha em branco
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!req.body?.force) return res.status(403).json({ error: 'requires force:true' });

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

    return res.status(200).json({
      status: 'ok',
      total_verificados: (posts || []).length,
      corrigidos: fixed,
      sem_markdown: skipped,
      erros: erros.length ? erros : undefined
    });
  } catch(e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
}
