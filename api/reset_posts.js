
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function detectCategoria(titulo, conteudo) {
  const t = (titulo + " " + (conteudo||"").slice(0,800)).toLowerCase();
  if (/futebol|gol |gols|placar|partida|campeonato|clube|técnico|jogador|botafogo|flamengo|palmeiras|corinthians|são paulo fc|grêmio|sport club|real madrid|barcelona|premier league|champions|libertadores|brasileirão|série a |série b |neymar|mbappé|cristiano ronaldo|messi|militão|vini jr|rodrygo|olimpíada|copa do mundo|world cup|nba |nfl |tênis|vôlei|basquete|natação|fórmula 1|f1 |piloto|boxe|ufc|seleção brasileira|torcida|estádio/.test(t)) return "esportes";
  if (/lula|bolsonaro|stf|câmara dos deputados|senado federal|governo federal|ministério|ministro |presidente da república|reforma judiciária|partido político|eleição|deputado|senador|alexandre de moraes|flávio dino|pgr|mpf|pec |planalto|psol|pt |pl |psd |mdb |pp |união brasil|voto|urna|tse|impeachment|cassação|vereador|prefeito|governador|assembleia legislativa/.test(t)) return "politica";
  if (/trump|biden|putin|zelensky|guerra na ucrânia|israel|hamas|gaza|otan|nato|china|eua |estados unidos|europa|reino unido|alemanha|frança|oriente médio|geopolítica|diplomacia|sanção|embargo|g7|g20|fmi |banco mundial|onu |nações unidas/.test(t)) return "internacional";
  if (/seguro de vida|seguro saúde|seguro auto|seguro residencial|seguro empresarial|apólice|sinistro|corretora de seguros|susep|seguradora|previdência privada|pgbl|vgbl|seguro rural|resseguro/.test(t)) return "seguros";
  if (/plano de saúde|operadora de saúde|unimed|hapvida|amil|bradesco saúde|sul américa saúde|ans |convênio médico|sus |saúde pública|enfermagem|farmácia|remédio|medicamento|cirurgia|paciente|câncer|diabetes|hipertensão|obesidade|saúde mental|hospital|clínica|médico|vacina|doença|tratamento/.test(t)) return "saude";
  if (/tesouro direto|renda fixa|fundo de investimento|cdi |carteira de investimento|cripto|bitcoin|ethereum|corretora|xp investimentos|btg pactual|dividendo|yield|rentabilidade|portfólio|ibovespa|b3 |bolsa de valores|ação da|ações da/.test(t)) return "investimentos";
  if (/pib|inflação|selic|copom|banco central|déficit|superávit|dólar|câmbio|exportação|importação|balança comercial|desemprego|emprego formal|caged|ibge|ipca|igpm|juros |taxa de juros|fiscal|orçamento federal|dívida pública/.test(t)) return "economia";
  if (/imposto de renda|irpf|irpj|receita federal|tributação|carga tributária|reforma tributária|imposto sobre|alíquota|isenção fiscal|restituição do ir|declaração ir/.test(t)) return "tributacao";
  if (/anatel|anvisa|bacen|cvm|susep|ans |regulação|regulatório|compliance|norma regulamentadora|instrução normativa|agência reguladora/.test(t)) return "regulacao";
  if (/inteligência artificial|machine learning|chatgpt|software|hardware|iphone|samsung|data center|cloud computing|5g|cibersegurança|hack|vazamento de dados/.test(t)) return "tecnologia";
  if (/fusão|aquisição|m&a|ipo |valuation|startup|empreendedor|ceo |resultado trimestral|lucro líquido|receita líquida|ebitda/.test(t)) return "negocios";
  if (/família|filho|criança|adolescente|escola|educação|maternidade|paternidade|guarda|divórcio|adoção|bullying|vestibular|enem|faculdade/.test(t)) return "familia";
  if (/indústria|manufatura|fábrica|industrial|agronegócio|commodities|petróleo|minério|siderurgia/.test(t)) return "industria";
  if (/cultura|arte|música|cinema|livro|teatro|show|festival|exposição|série documental|filme |novela|streaming/.test(t)) return "cultura";
  return "geral";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"method"});

  // Buscar todos os posts publicados
  const { data: posts, error } = await supabase.from("posts")
    .select("id,titulo,conteudo")
    .eq("status", "publicado")
    .limit(1000);

  if (error) return res.status(500).json({error: error.message});

  let moved = 0, errors = 0;

  for (const post of posts) {
    const novaCat = detectCategoria(post.titulo, post.conteudo);
    
    const { error: updateError } = await supabase.from("posts")
      .update({ 
        status: "pendente",
        approved: false,
        user_tags: JSON.stringify([novaCat])
      })
      .eq("id", post.id);

    if (updateError) errors++;
    else moved++;
  }

  return res.status(200).json({ 
    moved, 
    errors, 
    total: posts.length,
    message: `${moved} posts movidos para pendente com categorias corrigidas`
  });
}
