import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Mapa titulo (lowercase parcial) -> categoria correta
const MAPA = {
  "morte de moogie": "cultura",
  "censo marinho": "internacional",
  "ronaldinho": "esportes",
  "onda de calor": "saude",
  "prejuizo bilionario": "economia",
  "prejuízo bilionário": "economia",
  "desperdicio de alimentos": "negocios",
  "desperdício de alimentos": "negocios",
  "espelho magico": "seguros",
  "espelho mágico": "seguros",
  "roubo de combustivel": "negocios",
  "roubo de combustível": "negocios",
  "sport renova": "esportes",
  "ibovespa sobe": "economia",
  "big techs": "tecnologia",
  "caiado apoia": "politica",
  "nova lideranca": "politica",
  "nova liderança": "politica",
  "brasil e alemanha": "internacional",
  "trufas no rs": "negocios",
  "violencia no brasil": "politica",
  "violência no brasil": "politica",
  "cantor d4vd": "cultura",
  "reforma do judiciario": "politica",
  "reforma do judiciário": "politica",
  "superman 2026": "cultura",
  "tubarao": "internacional",
  "tubarão": "internacional",
  "teros cresce": "negocios",
  "tim cook deixa": "economia",
  "trump libera pesquisas": "internacional",
  "virada nos playoffs": "esportes",
  "copasa privatizacao": "economia",
  "copasa privatização": "economia",
  "novo ceo da apple": "economia",
  "plano de saude": "saude",
  "plano de saúde": "saude",
  "cfm regras": "saude",
  "decisao judicial": "politica",
  "decisão judicial": "politica",
  "tiradentes": "cultura",
  "gilmar x zema": "politica",
  "lula critica": "politica",
  "risco cibernetico": "tecnologia",
  "risco cibernético": "tecnologia",
  "fii no radar": "economia",
  "lotofacil": "economia",
  "lotofácil": "economia",
  "premio festival": "cultura",
  "prêmio festival": "cultura",
  "lancamento postumo": "cultura",
  "lançamento póstumo": "cultura",
  "ia transforma": "tecnologia",
  "leitura para jovens": "educacao",
  "crise no aave": "mercados",
  "ministro e negocios": "negocios",
  "ministro e negócios": "negocios",
  "jovens subempregados": "economia",
  "brasil lidera homicidios": "politica",
  "brasil lidera homicídios": "politica",
  "festival rock": "cultura",
  "stf em crise": "politica",
  "cenario economico": "economia",
  "cenário econômico": "economia",
  "casal preso": "politica",
  "rio em caos": "politica",
  "extradicao autorizada": "politica",
  "extradição autorizada": "politica",
  "lula fala": "politica",
  "terremoto no afeganistao": "internacional",
  "terremoto no afeganistão": "internacional",
  "orban cai": "politica",
  "orbán cai": "politica",
  "guerra vs ajuda": "internacional",
  "bbq26": "cultura",
  "nova presidencia": "politica",
  "nova presidência": "politica",
  "investimento": "investimentos",
};

function normalizar(str) {
  return (str || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    // Buscar todos os posts publicados
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, titulo, user_tags")
      .eq("status", "publicado")
      .limit(200);

    if (error) throw error;

    let atualizados = 0;
    const resultados = [];

    for (const post of posts) {
      const tituloNorm = normalizar(post.titulo || "");
      let novaCategoria = null;

      // Verificar se alguma chave do mapa está contida no título
      for (const [chave, cat] of Object.entries(MAPA)) {
        const chaveNorm = normalizar(chave);
        if (tituloNorm.includes(chaveNorm)) {
          novaCategoria = cat;
          break;
        }
      }

      if (!novaCategoria) continue;

      // Atualizar user_tags
      let tags = [];
      try { tags = JSON.parse(post.user_tags || "[]"); } catch(_) {}
      const catAtual = tags[0] || "geral";
      if (catAtual === novaCategoria) continue; // já correto

      if (novaCategoria) tags[0] = novaCategoria;
      else tags = [novaCategoria];

      const { error: updErr } = await supabase
        .from("posts")
        .update({ user_tags: JSON.stringify(tags) })
        .eq("id", post.id);

      if (!updErr) {
        atualizados++;
        resultados.push({ titulo: post.titulo, de: catAtual, para: novaCategoria });
      }
    }

    return res.status(200).json({
      ok: true,
      total: posts.length,
      atualizados,
      resultados
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
