import { createClient } from "@supabase/supabase-js";

const PASS = 'ovc-admin-2026-secreto';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.query.pass !== PASS) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  try {
    // Verifica se a tabela já existe
    const { error: checkErr } = await sb.from("ig_queue").select("id").limit(1);

    if (!checkErr) {
      return res.status(200).json({ ok: true, message: "Tabela ig_queue já existe. Tudo certo!" });
    }

    // Cria a tabela via SQL RPC
    const { error } = await sb.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ig_queue (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id uuid NOT NULL,
          titulo text NOT NULL,
          imagem text NOT NULL,
          resumo text DEFAULT '',
          categoria text DEFAULT 'geral',
          status text DEFAULT 'pending',
          error_msg text,
          created_at timestamptz DEFAULT now(),
          published_at timestamptz
        );
      `
    });

    if (error) {
      // RPC pode não existir — tenta insert direto para forçar criação via Supabase
      return res.status(200).json({
        ok: false,
        manual: true,
        message: "Não foi possível criar automaticamente. Execute o SQL abaixo no Supabase:",
        sql: [
          "CREATE TABLE IF NOT EXISTS ig_queue (",
          "  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,",
          "  post_id uuid NOT NULL,",
          "  titulo text NOT NULL,",
          "  imagem text NOT NULL,",
          "  resumo text DEFAULT '',",
          "  categoria text DEFAULT 'geral',",
          "  status text DEFAULT 'pending',",
          "  error_msg text,",
          "  created_at timestamptz DEFAULT now(),",
          "  published_at timestamptz",
          ");"
        ].join("\n")
      });
    }

    return res.status(200).json({ ok: true, message: "Tabela ig_queue criada com sucesso!" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
