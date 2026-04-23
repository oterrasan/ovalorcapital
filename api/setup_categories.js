
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"method"});

  const results = [];

  // 1. Inserir todas as categorias e subcategorias
  const CATEGORIAS = [
    // VC
    {slug:"vc",nome:"VC",categoria_pai:null,nivel:1},
    {slug:"vc/quem-somos",nome:"Quem somos",categoria_pai:"vc",nivel:2},
    {slug:"vc/principios-editoriais",nome:"Princípios editoriais",categoria_pai:"vc",nivel:2},
    {slug:"vc/liberdade-economica",nome:"Liberdade econômica",categoria_pai:"vc",nivel:2},
    {slug:"vc/familia-e-patrimonio",nome:"Família & Patrimônio",categoria_pai:"vc",nivel:2},
    {slug:"vc/linha-ideologica",nome:"Linha ideológica",categoria_pai:"vc",nivel:2},
    {slug:"vc/governanca",nome:"Governança & transparência",categoria_pai:"vc",nivel:2},
    // POLÍTICA
    {slug:"politica",nome:"Política",categoria_pai:null,nivel:1},
    {slug:"politica/executivo",nome:"Executivo",categoria_pai:"politica",nivel:2},
    {slug:"politica/legislativo",nome:"Legislativo (Congresso ao vivo)",categoria_pai:"politica",nivel:2},
    {slug:"politica/judiciario",nome:"Judiciário",categoria_pai:"politica",nivel:2},
    {slug:"politica/projetos-de-lei",nome:"Projetos de lei",categoria_pai:"politica",nivel:2},
    {slug:"politica/eleicoes",nome:"Eleições",categoria_pai:"politica",nivel:2},
    {slug:"politica/agenda-regulatoria",nome:"Agenda regulatória",categoria_pai:"politica",nivel:2},
    {slug:"politica/geral",nome:"Geral",categoria_pai:"politica",nivel:2},
    // ECONOMIA
    {slug:"economia",nome:"Economia",categoria_pai:null,nivel:1},
    {slug:"economia/monetaria",nome:"Monetária (Copom, Selic)",categoria_pai:"economia",nivel:2},
    {slug:"economia/fiscal",nome:"Fiscal (Orçamento, Dívida/PIB, Primário)",categoria_pai:"economia",nivel:2},
    {slug:"economia/conjuntura",nome:"Conjuntura (PIB, Emprego, Consumo, Focus)",categoria_pai:"economia",nivel:2},
    {slug:"economia/internacional",nome:"Internacional (EUA, Europa, China, Commodities)",categoria_pai:"economia",nivel:2},
    {slug:"economia/minuto-fiscal",nome:"Minuto Fiscal",categoria_pai:"economia",nivel:2},
    {slug:"economia/geral",nome:"Geral",categoria_pai:"economia",nivel:2},
    // NEGÓCIOS
    {slug:"negocios",nome:"Negócios",categoria_pai:null,nivel:1},
    {slug:"negocios/empreender",nome:"Empreender (MEI, ME, Ltda)",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/tributacao-pj",nome:"Tributação PJ",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/gestao-financeira",nome:"Gestão Financeira",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/credito",nome:"Crédito",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/vendas-e-preco",nome:"Vendas & Preço",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/contratos",nome:"Contratos & Societário",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/lgpd",nome:"LGPD & Compliance",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/startups",nome:"Startups",categoria_pai:"negocios",nivel:2},
    {slug:"negocios/geral",nome:"Geral",categoria_pai:"negocios",nivel:2},
    // INVESTIMENTOS
    {slug:"investimentos",nome:"Investimentos",categoria_pai:null,nivel:1},
    {slug:"investimentos/renda-fixa",nome:"Renda Fixa",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/renda-variavel",nome:"Renda Variável",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/fundos",nome:"Fundos",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/previdencia",nome:"Previdência",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/alternativos",nome:"Alternativos",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/estrategias",nome:"Estratégias",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/calendario",nome:"Calendário & Dividendos",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/educacao",nome:"Educação do investidor",categoria_pai:"investimentos",nivel:2},
    {slug:"investimentos/geral",nome:"Geral",categoria_pai:"investimentos",nivel:2},
    // SEGUROS
    {slug:"seguros",nome:"Seguros",categoria_pai:null,nivel:1},
    {slug:"seguros/saude-odonto",nome:"Saúde & Odonto",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/vida",nome:"Vida",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/auto",nome:"Auto",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/residencial",nome:"Residencial",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/empresarial",nome:"Empresarial & RC",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/viagem",nome:"Viagem",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/kpis",nome:"KPIs",categoria_pai:"seguros",nivel:2},
    {slug:"seguros/geral",nome:"Geral",categoria_pai:"seguros",nivel:2},
    // MERCADOS
    {slug:"mercados",nome:"Mercados",categoria_pai:null,nivel:1},
    {slug:"mercados/bolsa",nome:"Bolsa / Earnings / Dividendos",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/juros",nome:"Juros / DI",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/cambio",nome:"Câmbio",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/commodities",nome:"Commodities",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/cripto",nome:"Cripto",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/ipos",nome:"IPOs/FOs",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/indices",nome:"Índices",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/cotacoes",nome:"Cotações em tempo real",categoria_pai:"mercados",nivel:2},
    {slug:"mercados/geral",nome:"Geral",categoria_pai:"mercados",nivel:2},
    // EDUCAÇÃO
    {slug:"educacao",nome:"Educação",categoria_pai:null,nivel:1},
    {slug:"educacao/trilha-zero",nome:"Trilha Zero",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/financas-pessoais",nome:"Finanças Pessoais",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/carreira",nome:"Carreira & Empregos",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/cursos",nome:"Cursos & Certificações",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/parcerias",nome:"Parcerias Acadêmicas",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/glossario",nome:"Glossário",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/workshops",nome:"Workshops & Aulas",categoria_pai:"educacao",nivel:2},
    {slug:"educacao/geral",nome:"Geral",categoria_pai:"educacao",nivel:2},
    // INDÚSTRIA
    {slug:"industria",nome:"Indústria",categoria_pai:null,nivel:1},
    {slug:"industria/construcao",nome:"Construção & Imobiliário",categoria_pai:"industria",nivel:2},
    {slug:"industria/energia",nome:"Energia & Infra",categoria_pai:"industria",nivel:2},
    {slug:"industria/agro",nome:"Agro",categoria_pai:"industria",nivel:2},
    {slug:"industria/mineracao",nome:"Mineração & Siderurgia",categoria_pai:"industria",nivel:2},
    {slug:"industria/quimica",nome:"Química & Materiais",categoria_pai:"industria",nivel:2},
    {slug:"industria/automotivo",nome:"Automotivo",categoria_pai:"industria",nivel:2},
    {slug:"industria/logistica",nome:"Logística & Portos & Ferrovias",categoria_pai:"industria",nivel:2},
    {slug:"industria/industria40",nome:"Indústria 4.0",categoria_pai:"industria",nivel:2},
    {slug:"industria/geral",nome:"Geral",categoria_pai:"industria",nivel:2},
    // TECNOLOGIA
    {slug:"tecnologia",nome:"Tecnologia",categoria_pai:null,nivel:1},
    {slug:"tecnologia/ia-dados",nome:"IA & Dados",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/fintechs",nome:"Fintechs & Pagamentos",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/ecommerce",nome:"E-commerce",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/telecom",nome:"Telecom & 5G",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/ciberseguranca",nome:"Cibersegurança",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/govtech",nome:"GovTech",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/saude-digital",nome:"Saúde Digital",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/transformacao",nome:"Transformação Digital",categoria_pai:"tecnologia",nivel:2},
    {slug:"tecnologia/geral",nome:"Geral",categoria_pai:"tecnologia",nivel:2},
    // ESPORTES
    {slug:"esportes",nome:"Esportes",categoria_pai:null,nivel:1},
    {slug:"esportes/futebol",nome:"Futebol",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/basquete",nome:"Basquete",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/nfl",nome:"NFL",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/mlb",nome:"MLB",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/mma",nome:"MMA",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/automobilismo",nome:"Automobilismo",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/tenis",nome:"Tênis",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/esports",nome:"eSports",categoria_pai:"esportes",nivel:2},
    {slug:"esportes/geral",nome:"Geral",categoria_pai:"esportes",nivel:2},
    // SAÚDE
    {slug:"saude",nome:"Saúde",categoria_pai:null,nivel:1},
    {slug:"saude/preventiva",nome:"Preventiva",categoria_pai:"saude",nivel:2},
    {slug:"saude/mental",nome:"Mental",categoria_pai:"saude",nivel:2},
    {slug:"saude/politicas",nome:"Políticas",categoria_pai:"saude",nivel:2},
    {slug:"saude/digital",nome:"Saúde Digital",categoria_pai:"saude",nivel:2},
    {slug:"saude/custos",nome:"Custos & Indicadores",categoria_pai:"saude",nivel:2},
    {slug:"saude/geral",nome:"Geral",categoria_pai:"saude",nivel:2},
    // FAMÍLIA
    {slug:"familia",nome:"Família",categoria_pai:null,nivel:1},
    {slug:"familia/orcamento",nome:"Orçamento",categoria_pai:"familia",nivel:2},
    {slug:"familia/educacao-filhos",nome:"Educação dos Filhos",categoria_pai:"familia",nivel:2},
    {slug:"familia/habitacao",nome:"Habitação",categoria_pai:"familia",nivel:2},
    {slug:"familia/seguros",nome:"Seguros da família",categoria_pai:"familia",nivel:2},
    {slug:"familia/lazer",nome:"Lazer & Esportes",categoria_pai:"familia",nivel:2},
    {slug:"familia/sucessao",nome:"Sucessão & Patrimônio",categoria_pai:"familia",nivel:2},
    {slug:"familia/seguranca",nome:"Segurança",categoria_pai:"familia",nivel:2},
    {slug:"familia/geral",nome:"Geral",categoria_pai:"familia",nivel:2},
    // TRIBUTOS
    {slug:"tributos",nome:"Tributos",categoria_pai:null,nivel:1},
    {slug:"tributos/irpf",nome:"IRPF",categoria_pai:"tributos",nivel:2},
    {slug:"tributos/investimentos",nome:"Investimentos",categoria_pai:"tributos",nivel:2},
    {slug:"tributos/obrigacoes",nome:"Obrigações",categoria_pai:"tributos",nivel:2},
    {slug:"tributos/planejamento",nome:"Planejamento",categoria_pai:"tributos",nivel:2},
    {slug:"tributos/simuladores",nome:"Simuladores",categoria_pai:"tributos",nivel:2},
    {slug:"tributos/geral",nome:"Geral",categoria_pai:"tributos",nivel:2},
    // REGULAÇÃO
    {slug:"regulacao",nome:"Regulação",categoria_pai:null,nivel:1},
    {slug:"regulacao/financeiro",nome:"Financeiro",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/saude",nome:"Saúde",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/infra-energia",nome:"Infra & Energia",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/telecom",nome:"Telecom & Mídia",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/transporte",nome:"Transporte & Logística",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/mineracao",nome:"Mineração & Indústria",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/concorrencia",nome:"Concorrência & Controle",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/fiscal",nome:"Fiscal & Receita",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/consumidor",nome:"Consumidor & Normas",categoria_pai:"regulacao",nivel:2},
    {slug:"regulacao/geral",nome:"Geral",categoria_pai:"regulacao",nivel:2},
    // PARCERIAS
    {slug:"parcerias",nome:"Parcerias",categoria_pai:null,nivel:1},
    {slug:"parcerias/universidades",nome:"Universidades & Faculdades",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/empresas",nome:"Empresas & Startups",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/orgaos",nome:"Órgãos & Associações",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/comunidades",nome:"Comunidades & Influenciadores",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/beneficios",nome:"Benefícios & Descontos",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/programas",nome:"Programas & Editais",categoria_pai:"parcerias",nivel:2},
    {slug:"parcerias/geral",nome:"Geral",categoria_pai:"parcerias",nivel:2}
  ];

  // Inserir categorias em lote
  const { error: catError } = await supabase.from("categories")
    .upsert(CATEGORIAS, { onConflict: "slug" });

  if (catError) {
    // Tabela não existe ainda — retornar erro claro
    return res.status(500).json({ error: "Tabela categories não existe: " + catError.message });
  }

  // Adicionar coluna subcategoria nos posts (via update de um post fictício para ver se existe)
  const { data: testPost } = await supabase.from("posts").select("subcategoria").limit(1);
  const subcatExists = testPost !== null;

  return res.status(200).json({
    categorias_inseridas: CATEGORIAS.length,
    subcategoria_coluna: subcatExists ? "existe" : "nao existe",
    message: "Estrutura criada com sucesso"
  });
}
