import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://yntwvfcxjardzafdqanj.supabase.co",
  process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
);

const { data, error } = await supabase
  .from("ig_accounts")
  .select("username,active,ig_user_id,token,ultima_atividade,posts_hoje")
  .order("username");

if (error) {
  console.log("ERRO:", JSON.stringify(error));
  process.exit(0);
}

for (const row of data || []) {
  console.log(
    JSON.stringify({
      username: row.username,
      active: row.active,
      tem_ig_user_id: Boolean(row.ig_user_id),
      tem_token: Boolean(row.token),
      token_len: row.token ? String(row.token).length : 0,
      ultima_atividade: row.ultima_atividade,
      posts_hoje: row.posts_hoje
    })
  );
}

// Testa direto o mesmo token contra a Graph API (debug_token nunca expõe o valor,
// só metadados/escopos concedidos) pra confirmar se o token do oterrasan tem
// as permissões reais exigidas pra criar um container de Reel resumível.
const oterrasan = (data || []).find((r) => r.username === "oterrasan");
if (oterrasan?.token) {
  try {
    const params = new URLSearchParams({
      input_token: oterrasan.token,
      access_token: oterrasan.token
    });
    const res = await fetch(`https://graph.facebook.com/v25.0/debug_token?${params}`);
    const json = await res.json();
    console.log("DEBUG_TOKEN oterrasan:", JSON.stringify(json));
  } catch (e) {
    console.log("DEBUG_TOKEN oterrasan ERRO:", String(e));
  }

  // Testa se o ig_user_id do oterrasan de fato aceita criar um container de mídia
  // (sem publicar) — pega o erro real da Meta, se houver, em vez de suposição.
  try {
    const params = new URLSearchParams({
      media_type: "REELS",
      upload_type: "resumable",
      caption: "teste diagnostico ovc (nunca publicado)",
      access_token: oterrasan.token
    });
    const res = await fetch(`https://graph.facebook.com/v25.0/${oterrasan.ig_user_id}/media`, {
      method: "POST",
      body: params
    });
    const json = await res.json();
    console.log("TESTE_CONTAINER_RESUMABLE oterrasan:", res.status, JSON.stringify(json));
  } catch (e) {
    console.log("TESTE_CONTAINER_RESUMABLE oterrasan ERRO:", String(e));
  }
} else {
  console.log("oterrasan SEM TOKEN — nao da pra testar contra a Meta");
}

// Confirma também quantos Reels aprovados hoje têm conta_publicacao=oterrasan
// e qual o último erro real registrado neles.
const { data: posts, error: postsError } = await supabase
  .from("posts")
  .select("id,titulo,metrics,updated_at")
  .not("metrics->instagram_reel_template", "is", null)
  .order("updated_at", { ascending: false })
  .limit(300);

if (!postsError) {
  const comOterrasan = (posts || []).filter((p) => {
    try {
      const t = p.metrics?.instagram_reel_template || (typeof p.metrics === "string" ? JSON.parse(p.metrics)?.instagram_reel_template : null);
      return t?.conta_publicacao === "oterrasan";
    } catch (_) {
      return false;
    }
  });
  console.log("REELS_COM_CONTA_OTERRASAN:", comOterrasan.length);
  for (const p of comOterrasan.slice(0, 8)) {
    const t = typeof p.metrics === "string" ? JSON.parse(p.metrics)?.instagram_reel_template : p.metrics?.instagram_reel_template;
    console.log(
      JSON.stringify({
        id: p.id,
        titulo: (p.titulo || "").slice(0, 60),
        status: t?.status,
        last_error: t?.last_error,
        ig_creation_id: t?.ig_creation_id || null,
        ig_username: t?.ig_username || null,
        updated_at: p.updated_at
      })
    );
  }
} else {
  console.log("ERRO_POSTS:", JSON.stringify(postsError));
}
