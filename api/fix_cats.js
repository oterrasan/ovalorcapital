
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function detectCategoria(texto) {
  const t = (texto || "").toLowerCase();
  if (/futebol|nba|nfl|esporte|campeonato|clube|partida|atleta|gol|jogador|técnico|time|botafogo|flamengo|palmeiras|são paulo|corinthians|grêmio|sport|real madrid|barcelona|premier|neymar|mbappé|ronaldo|messi|militão|pelé|olimpíada|copa|mundial|tênis|vôlei|basquete|natação|ciclismo|f1|fórmula/.test(t)) return "esportes";
  if (/lula|stf|congresso|câmara|senado|governo federal|ministro|presidente|reforma|judiciário|partido|eleição|política|bolsonaro|petista|deputado|senador|moraes|barroso|pgr|mpf|pec|planalto|psol|pt |pl |psd |mdb |pp |união brasil/.test(t)) return "politica";
  if (/ibovespa|bolsa|dólar|pib|inflação|selic|copom|juros|banco central|fiscal|orçamento|déficit|economia|recessão|crescimento|gdp|fed |reserva federal|câmbio|exportação|importação/.test(t)) return "economia";
  if (/seguro de vida|seguro saúde|seguro auto|seguro residencial|apólice|sinistro|corretora de seguros|susep|seguradora|seguro empresarial|seguro rural|previdência privada|pgbl|vgbl/.test(t)) return "seguros";
  if (/plano de saúde|operadora|unimed|hapvida|amil|bradesco saúde|sul américa saúde|ans |convênio médico|hospital|clínica|médico|vacina|doença|tratamento|sus |saúde pública|enfermagem|farmácia/.test(t)) return "saude";
  if (/investimento|renda fixa|tesouro direto|fundo de investimento|cdi|ação|carteira|portfólio|cripto|bitcoin|ethereum|defi|corretora|xp |btg|itaú invest|rico |clear |dividendo|yield|rentabilidade/.test(t)) return "investimentos";
  if (/consórcio|carta de crédito|grupo de consórcio/.test(t)) return "seguros";
  if (/imposto|tributação|ir 2026|irpf|receita federal|tributário|carga tributária|reforma tributária|irs|tax/.test(t)) return "tributacao";
  if (/regulação|anatel|anvisa|bacen|cvm|regulatório|compliance|norma|resolução|instrução normativa/.test(t)) return "regulacao";
  if (/empresa|startup|negócio|empreend|fusão|aquisição|m&a|ipo|valuation|corporat|gestão|liderança|ceo|board/.test(t)) return "negocios";
  if (/família|filho|educação|escola|criança|adolescente|pais|mãe|pai|maternidade|paternidade/.test(t)) return "familia";
  if (/tecnologia|inteligência artificial|ia |machine learning|software|hardware|iphone|samsung|google|meta |microsoft|apple|data center|cloud|5g/.test(t)) return "tecnologia";
  if (/indústria|manufatura|produção|fábrica|industrial|agronegócio|commodit|petróleo|minério/.test(t)) return "industria";
  if (/eua|estados unidos|china|europa|guerra|ucrânia|israel|hamas|trump|biden|otan|geopolítica|internacional|oriente médio|rússia|putin|zelensky/.test(t)) return "internacional";
  if (/cultura|arte|música|cinema|livro|teatro|show|festival|exposição|série|filme/.test(t)) return "cultura";
  return "geral";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"method"});
  
  // Buscar todos os posts publicados
  const { data: posts, error } = await supabase.from("posts")
    .select("id,titulo,conteudo,user_tags")
    .eq("status", "publicado")
    .limit(500);
  
  if (error) return res.status(500).json({error: error.message});
  
  let fixed = 0;
  let errors = 0;
  
  for (const post of posts) {
    const texto = (post.titulo || "") + " " + (post.conteudo || "").slice(0, 500);
    const newCat = detectCategoria(texto);
    const newTags = JSON.stringify([newCat]);
    
    const { error: updateError } = await supabase.from("posts")
      .update({ user_tags: newTags })
      .eq("id", post.id);
    
    if (updateError) errors++;
    else fixed++;
  }
  
  return res.status(200).json({ fixed, errors, total: posts.length });
}
