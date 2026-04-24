
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function detectCategoria(titulo, conteudo) {
  const t = (titulo + " " + (conteudo||"").slice(0,800)).toLowerCase();

  // ESPORTES — prioridade alta para não cair em outras categorias
  if (/futebol|gol |gols|placar|partida|campeonato|clube|técnico|jogador|botafogo|flamengo|palmeiras|corinthians|são paulo|grêmio|sport club|real madrid|barcelona|premier league|champions|libertadores|brasileirão|série a|série b|neymar|mbappé|cristiano|messi|militão|vini|rodrygo|atleta|olimpíada|copa do mundo|world cup|nba |nfl |mlb |nhl |tênis|vôlei|basquete|natação|ciclismo|fórmula 1|f1 |piloto|corrida|boxe|ufc|luta|esporte|pelada|torcida|estádio|arena|time de|seleção brasileira/.test(t)) return "esportes";

  // POLÍTICA — prioridade alta
  if (/lula|bolsonaro|stf|congresso|câmara dos deputados|senado federal|governo federal|ministério|ministro |presidente da república|reforma judiciária|partido político|eleição|deputado|senador|moraes|barroso|dino|pgr|mpf|pec |planalto|psol|pt |pl |psd |mdb |pp |união brasil|voto|urna|tse|bre |cpi |impeachment|cassação|mandato|vereador|prefeito|governador|assembleia|câmara municipal/.test(t)) return "politica";

  // INTERNACIONAL — prioridade alta  
  if (/trump|biden|putin|zelensky|guerra na ucrânia|israel|hamas|gaza|otan|nato|china|eua |estados unidos|europa|reino unido|alemanha|frança|oriente médio|geopolítica|diplomacia|sanção|embargo|cúpula|g7|g20|fmi |banco mundial|onu |nações unidas/.test(t)) return "internacional";

  // SEGUROS — produtos específicos
  if (/seguro de vida|seguro saúde|seguro auto|seguro residencial|seguro empresarial|apólice|sinistro|corretora de seguros|susep|seguradora|previdência privada|pgbl|vgbl|seguro rural|resseguro/.test(t)) return "seguros";

  // SAÚDE — hospitais, médicos, planos
  if (/plano de saúde|operadora de saúde|unimed|hapvida|amil|bradesco saúde|sul américa saúde|ans |convênio médico|hospital|clínica|médico|vacina|doença|tratamento|sus |saúde pública|enfermagem|farmácia|remédio|medicamento|cirurgia|paciente|câncer|diabetes|hipertensão|obesidade|saúde mental/.test(t)) return "saude";

  // INVESTIMENTOS — produtos financeiros
  if (/tesouro direto|renda fixa|fundo de investimento|cdi |ação da|ações da|carteira de investimento|cripto|bitcoin|ethereum|defi|corretora|xp investimentos|btg|dividendo|yield|rentabilidade|portfólio|ibovespa|b3 |bolsa de valores/.test(t)) return "investimentos";

  // ECONOMIA — macro
  if (/pib|inflação|selic|copom|banco central|déficit|superávit|dólar|câmbio|exportação|importação|balança comercial|desemprego|emprego formal|caged|ibge|ipca|igpm|poupança|juros |taxa de juros|fiscal|orçamento federal|dívida pública/.test(t)) return "economia";

  // TRIBUTAÇÃO
  if (/imposto de renda|irpf|irpj|receita federal|tributação|carga tributária|reforma tributária|irs|imposto sobre|alíquota|isenção fiscal|restituição do ir|declaração ir|tributário/.test(t)) return "tributacao";

  // REGULAÇÃO
  if (/anatel|anvisa|bacen|cvm|susep|ans |regulação|regulatório|compliance|norma regulamentadora|instrução normativa|resolução anp|agência reguladora/.test(t)) return "regulacao";

  // TECNOLOGIA
  if (/inteligência artificial|machine learning|chatgpt|software|hardware|iphone|samsung|google|meta |microsoft|apple|data center|cloud computing|5g|startup de tech|fintech|app |algoritmo|cibersegurança|hack|vazamento de dados/.test(t)) return "tecnologia";

  // NEGÓCIOS
  if (/fusão|aquisição|m&a|ipo |valuation|startup|empreendedor|ceo |gestão|liderança empresarial|resultado trimestral|lucro líquido|receita líquida|ebitda|empresa|negócio/.test(t)) return "negocios";

  // FAMÍLIA/EDUCAÇÃO
  if (/família|filho|criança|adolescente|escola|educação|maternidade|paternidade|guarda|divórcio|adoção|bullying|vestibular|enem|faculdade|universidade/.test(t)) return "familia";

  // INDÚSTRIA
  if (/indústria|manufatura|fábrica|industrial|agronegócio|commodities|petróleo|minério|siderurgia|petroquímica/.test(t)) return "industria";

  // CULTURA
  if (/cultura|arte|música|cinema|livro|teatro|show|festival|exposição|série documental|filme |novela|streaming/.test(t)) return "cultura";

  return "geral";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"method"});
  
  const { data: posts, error } = await supabase.from("posts")
    .select("id,titulo,conteudo,user_tags")
    .eq("status", "publicado")
    .limit(500);
  
  if (error) return res.status(500).json({error: error.message});
  
  let fixed = 0, skipped = 0, errors = 0;
  const changes = [];
  
  for (const post of posts) {
    const newCat = detectCategoria(post.titulo, post.conteudo);
    
    let currentTags = [];
    try { currentTags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch(_) {}
    const currentCat = currentTags[0] || "geral";
    
    if (currentCat === newCat) { skipped++; continue; }
    
    changes.push({ titulo: post.titulo?.slice(0,50), de: currentCat, para: newCat });
    
    const { error: updateError } = await supabase.from("posts")
      .update({ user_tags: JSON.stringify([newCat]) })
      .eq("id", post.id);
    
    if (updateError) errors++;
    else fixed++;
  }
  
  return res.status(200).json({ fixed, skipped, errors, total: posts.length, changes: changes.slice(0,20) });
}
