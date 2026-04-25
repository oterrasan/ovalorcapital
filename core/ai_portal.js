import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let keyIndex = 0;
function nextKey() {
  const k = GEMINI_KEYS[keyIndex % GEMINI_KEYS.length];
  keyIndex++;
  return k;
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      });
      const d = await res.json();
      if (res.status === 429) { continue; }
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 100) return text;
    } catch(e) {
      if (i === GEMINI_KEYS.length - 1) throw e;
    }
  }
  throw new Error("Gemini indisponível");
}

// ══════════════════════════════════════════════════════════════════
// MAPEAMENTO COMPLETO DE CATEGORIAS E SUBCATEGORIAS — OVC v1.0
// ══════════════════════════════════════════════════════════════════

const CATS_VALIDAS = [
  "politica","economia","negocios","investimentos","seguros","mercados",
  "educacao","industria","tecnologia","esportes","saude","familia",
  "tributacao","regulacao","parcerias","internacional"
];

const SUBCATEGORIAS = {
  politica: [
    { nome: "Executivo", slug: "executivo", foco: "Presidência, ministérios, decisões federais — decretos, MPs, nomeações, polêmicas do Planalto" },
    { nome: "Legislativo", slug: "legislativo-congresso-ao-vivo", foco: "Câmara e Senado — votações, projetos de lei, emendas, pautas da semana" },
    { nome: "Judiciário", slug: "judiciario", foco: "STF, STJ — julgamentos com impacto econômico ou civil, inquéritos, habeas corpus" },
    { nome: "Projetos de Lei", slug: "projetos-de-lei", foco: "PLs com impacto na vida do leitor: trabalhista, tributário, criminal" },
    { nome: "Eleições", slug: "eleicoes", foco: "Corrida eleitoral 2026 — candidatos, pesquisas, alianças, financiamento" },
    { nome: "Geral", slug: "geral", foco: "Política que não se encaixa nas subcategorias acima" },
  ],
  economia: [
    { nome: "Monetária (Copom, Selic)", slug: "monetaria-copom-selic", foco: "Decisões do Copom, trajetória da Selic, impacto no crédito e investimento" },
    { nome: "Fiscal (Orçamento, Dívida)", slug: "fiscal-orcamento-divida-pib-primario", foco: "Déficit, superávit, arcabouço fiscal, dívida pública, corte de gastos" },
    { nome: "Conjuntura (PIB, Emprego)", slug: "conjuntura-pib-emprego-consumo-focus", foco: "PIB, desemprego, CAGED, IPCA, Focus, consumo das famílias" },
    { nome: "Internacional", slug: "internacional-eua-europa-china-commodities", foco: "Fed, BCE, China, commodities, impacto no câmbio e inflação brasileira" },
    { nome: "Minuto Fiscal", slug: "minuto-fiscal", foco: "Nota rápida sobre contas públicas, resultado primário, execução orçamentária" },
    { nome: "Geral", slug: "geral", foco: "Economia que não se encaixa nas subcategorias acima" },
  ],
  negocios: [
    { nome: "Empreender (MEI, ME, Ltda)", slug: "empreender-mei-me-ltda", foco: "Como abrir empresa, regimes jurídicos, obrigações do MEI, Simples Nacional" },
    { nome: "Tributação PJ", slug: "tributacao-pj", foco: "CNPJ, DAS, ISS, IRPJ, CSLL, lucro presumido vs real, planejamento tributário PJ" },
    { nome: "Gestão Financeira", slug: "gestao-financeira", foco: "Fluxo de caixa, precificação, margem, capital de giro, controle financeiro" },
    { nome: "Crédito", slug: "credito", foco: "BNDES, Pronampe, antecipação de recebíveis, garantias, taxas" },
    { nome: "Vendas & Preço", slug: "vendas-e-preco", foco: "Precificação, margens, estratégia de vendas, canais, sazonalidade" },
    { nome: "Contratos & Societário", slug: "contratos-e-societario", foco: "Contratos, sociedades, holding, proteção patrimonial" },
    { nome: "LGPD & Compliance", slug: "lgpd-e-compliance", foco: "Lei Geral de Proteção de Dados, compliance, governança, riscos" },
    { nome: "Startups", slug: "startups", foco: "Venture capital, aceleradoras, unicórnios, valuation, rodadas" },
    { nome: "Geral", slug: "geral", foco: "Negócios que não se encaixam nas subcategorias acima" },
  ],
  investimentos: [
    { nome: "Renda Fixa", slug: "renda-fixa", foco: "CDB, LCI, LCA, Tesouro, poupança — comparativos, estratégias conservadoras" },
    { nome: "Renda Variável", slug: "renda-variavel", foco: "Bolsa, ações, ETFs, BDRs — earnings, dividendos, análise setorial" },
    { nome: "Fundos", slug: "fundos", foco: "FIIs, fundos multimercado, FIP — cotas, rendimento, tributação" },
    { nome: "Previdência", slug: "previdencia", foco: "PGBL, VGBL — planejamento previdenciário, portabilidade, benefício fiscal" },
    { nome: "Alternativos", slug: "alternativos", foco: "Cripto, consórcio, ouro — risco, regulação, perfil do investidor" },
    { nome: "Estratégias", slug: "estrategias", foco: "Asset allocation, diversificação, perfil de risco, rebalanceamento de carteira" },
    { nome: "Calendário & Dividendos", slug: "calendario-e-dividendos", foco: "Ex-dividendo, JCP, pagamento de proventos, agenda de resultados" },
    { nome: "Educação do Investidor", slug: "educacao-do-investidor", foco: "Primeiros passos, como abrir conta em corretora, conceitos básicos" },
    { nome: "Geral", slug: "geral", foco: "Investimentos pessoais que não se encaixam acima" },
  ],
  seguros: [
    { nome: "Vida", slug: "vida", foco: "Seguro de vida e invalidez — coberturas, capital segurado, seguro em grupo" },
    { nome: "Saúde & Odonto", slug: "saude-e-odonto", foco: "Planos de saúde e odonto — ANS, coberturas, portabilidade, carências" },
    { nome: "Auto", slug: "auto", foco: "Seguro de veículos — coberturas, franquia, tabela FIPE, rastreador" },
    { nome: "Residencial", slug: "residencial", foco: "Seguro para imóveis — incêndio, roubo, responsabilidade civil" },
    { nome: "Empresarial & RC", slug: "empresarial-e-rc", foco: "RC profissional, D&O, seguro de carga, cyber seguro, seguro garantia" },
    { nome: "Viagem", slug: "viagem", foco: "Assistência em viagens — cobertura médica, bagagem, cancelamento" },
    { nome: "KPIs", slug: "kpis", foco: "Dados e indicadores do setor — sinistralidade, prêmios, crescimento, SUSEP" },
    { nome: "Geral", slug: "geral", foco: "Seguros que não se encaixam nas subcategorias acima" },
  ],
  mercados: [
    { nome: "Bolsa / Earnings / Dividendos", slug: "bolsa-earnings-dividendos", foco: "Ibovespa, Small Caps, earnings de empresas, dividendos declarados" },
    { nome: "Juros / DI", slug: "juros-di", foco: "DI futuro, NTN-B, trajetória da Selic, expectativas de mercado" },
    { nome: "Câmbio", slug: "cambio", foco: "PTAX, política cambial, fluxo de capital estrangeiro, reservas" },
    { nome: "Commodities", slug: "commodities", foco: "Petróleo, minério, soja, café — preços internacionais e impacto local" },
    { nome: "Cripto", slug: "cripto", foco: "Bitcoin e criptoativos — preço, regulação, ETFs, adoção institucional" },
    { nome: "IPOs/FOs", slug: "ipos-fos", foco: "Novas listagens na B3, follow-ons, estrutura da oferta, bookbuilding" },
    { nome: "Índices", slug: "indices", foco: "Ibovespa, IFIX, IDIV, S&P 500 — desempenho, composição, rebalanceamento" },
    { nome: "Cotações em Tempo Real", slug: "cotacoes-em-tempo-real", foco: "Dados de mercado, fechamento, variação do dia" },
    { nome: "Geral", slug: "geral", foco: "Mercados financeiros que não se encaixam acima" },
  ],
  educacao: [
    { nome: "Trilha Zero", slug: "trilha-zero", foco: "Primeiros passos — como economizar, pagar dívidas, começar a investir" },
    { nome: "Finanças Pessoais", slug: "financas-pessoais", foco: "Orçamento pessoal, metas financeiras, reserva de emergência" },
    { nome: "Carreira & Empregos", slug: "carreira-e-empregos", foco: "CLT vs PJ, salário, negociação, promoção, tendências do mercado de trabalho" },
    { nome: "Cursos & Certificações", slug: "cursos-e-certificacoes", foco: "CPA-10, CPA-20, CFP, cursos online, certificações do mercado financeiro" },
    { nome: "Glossário", slug: "glossario", foco: "Explicação de termos técnicos em linguagem simples" },
    { nome: "Workshops & Aulas", slug: "workshops-e-aulas", foco: "Aulas, webinars, eventos educacionais do OVC" },
    { nome: "Geral", slug: "geral", foco: "Educação financeira que não se encaixa nas subcategorias acima" },
  ],
  industria: [
    { nome: "Construção & Imobiliário", slug: "construcao-e-imobiliario", foco: "Lançamentos, financiamentos, INCC, mercado de imóveis corporativos" },
    { nome: "Energia & Infra", slug: "energia-e-infra", foco: "Petróleo, gás, energia elétrica, renováveis, concessões de infraestrutura" },
    { nome: "Agro", slug: "agro", foco: "Safras, commodities agrícolas, exportações, crédito rural, defensivos" },
    { nome: "Mineração & Siderurgia", slug: "mineracao-e-siderurgia", foco: "Vale, CSN, Gerdau, exportação de minério, preços internacionais" },
    { nome: "Química & Materiais", slug: "quimica-e-materiais", foco: "Braskem, petroquímica, plásticos, insumos industriais" },
    { nome: "Automotivo", slug: "automotivo", foco: "Montadoras, vendas de veículos, eletrificação, emplacamentos" },
    { nome: "Logística & Portos & Ferrovias", slug: "logistica-e-portos-e-ferrovias", foco: "Frete, portos, ferrovias, concessões, gargalos logísticos" },
    { nome: "Indústria 4.0", slug: "industria-4-0", foco: "Robótica, manufatura avançada, IA industrial, digitalização fabril" },
    { nome: "Geral", slug: "geral", foco: "Indústria que não se encaixa nas subcategorias acima" },
  ],
  tecnologia: [
    { nome: "Fintechs & Pagamentos", slug: "fintechs-e-pagamentos", foco: "Open finance, Pix, carteiras digitais, regulação de fintechs" },
    { nome: "E-commerce", slug: "e-commerce", foco: "Marketplaces, logística, meios de pagamento, tendências do varejo digital" },
    { nome: "Telecom & 5G", slug: "telecom-e-5g", foco: "5G, fibra ótica, cobertura, investimentos em telecomunicações" },
    { nome: "Cibersegurança", slug: "ciberseguranca", foco: "Vazamentos de dados, LGPD, ataques, proteção empresarial e pessoal" },
    { nome: "GovTech", slug: "govtech", foco: "Digitalização de serviços públicos, gov.br, IA no setor público" },
    { nome: "Saúde Digital", slug: "saude-digital", foco: "Telemedicina, prontuário eletrônico, healthtech, wearables" },
    { nome: "Transformação Digital", slug: "transformacao-digital", foco: "IA nas empresas, automação, cloud, ferramentas de produtividade" },
    { nome: "Geral", slug: "geral", foco: "Tecnologia que não se encaixa nas subcategorias acima" },
  ],
  esportes: [
    { nome: "Futebol", slug: "futebol", foco: "Campeonatos, transferências, contratos, SAF, receita dos clubes" },
    { nome: "Basquete", slug: "basquete", foco: "NBA, NBB, transferências, contratos, análise econômica do basquete" },
    { nome: "NFL", slug: "nfl", foco: "NFL, Super Bowl, contratos, franquias, mercado de apostas esportivas" },
    { nome: "MLB", slug: "mlb", foco: "MLB, contratos, franquias, desempenho dos times com brasileiros" },
    { nome: "MMA", slug: "mma", foco: "UFC, Bellator, contratos de lutadores, PPV, mercado do MMA" },
    { nome: "Automobilismo", slug: "automobilismo", foco: "Fórmula 1, temporada, contratos, negócios das equipes, patrocínios" },
    { nome: "Tênis", slug: "tenis", foco: "Grand Slams, ranking, contratos, premiações, brasileiros no circuito" },
    { nome: "eSports", slug: "esports", foco: "Campeonatos, contratos de gamers, mercado de eSports, streaming" },
    { nome: "Geral", slug: "geral", foco: "Esportes que não se encaixam nas subcategorias acima" },
  ],
  saude: [
    { nome: "Custos & Indicadores", slug: "custos-e-indicadores", foco: "Reajustes de planos, custo per capita, IESS, dados da ANS" },
    { nome: "Políticas", slug: "politicas", foco: "SUS, política federal de saúde, ANVISA, programas governamentais" },
    { nome: "Preventiva", slug: "preventiva", foco: "Check-up, vacinas, hábitos saudáveis com impacto na produtividade" },
    { nome: "Mental", slug: "mental", foco: "Burnout, ansiedade, produtividade, saúde mental corporativa" },
    { nome: "Saúde Digital", slug: "saude-digital", foco: "Telemedicina, apps de saúde, prontuário digital, healthtech" },
    { nome: "Geral", slug: "geral", foco: "Saúde que não se encaixa nas subcategorias acima" },
  ],
  familia: [
    { nome: "Orçamento", slug: "orcamento", foco: "Planilha familiar, corte de gastos, reserva de emergência, endividamento" },
    { nome: "Educação dos Filhos", slug: "educacao-dos-filhos", foco: "Escola pública vs particular, financiamento de faculdade, bolsas" },
    { nome: "Habitação", slug: "habitacao", foco: "Compra, aluguel, financiamento, FGTS, mercado imobiliário residencial" },
    { nome: "Lazer & Esportes", slug: "lazer-e-esportes", foco: "Viagem em família, esporte, bem-estar, equilíbrio vida e trabalho" },
    { nome: "Segurança", slug: "seguranca", foco: "Seguro de vida, plano de saúde, proteção patrimonial, gestão de riscos" },
    { nome: "Seguros da Família", slug: "seguros-da-familia", foco: "Seguro de vida família, plano odontológico, seguro residencial" },
    { nome: "Sucessão & Patrimônio", slug: "sucessao-e-patrimonio", foco: "Herança, inventário, testamento, holding familiar, doação em vida" },
    { nome: "Geral", slug: "geral", foco: "Família que não se encaixa nas subcategorias acima" },
  ],
  tributacao: [
    { nome: "IRPF", slug: "irpf", foco: "Declaração anual, deduções, isenções, malha fina, restituição" },
    { nome: "Investimentos (tributação)", slug: "investimentos", foco: "Come-cotas, IR sobre dividendos, ganho de capital, compensação de perdas" },
    { nome: "Obrigações", slug: "obrigacoes", foco: "DIRF, DCTF, ECF, obrigações acessórias, penalidades por atraso" },
    { nome: "Planejamento", slug: "planejamento", foco: "Deduções legais, declaração completa vs simplificada, planejamento fiscal" },
    { nome: "Simuladores", slug: "simuladores", foco: "Como usar simuladores de IR, cálculo de ganho de capital, pró-labore" },
    { nome: "Geral", slug: "geral", foco: "Tributos que não se encaixam nas subcategorias acima" },
  ],
  regulacao: [
    { nome: "Financeiro", slug: "financeiro", foco: "Banco Central, CVM, normas para bancos, fintechs e corretoras" },
    { nome: "Fiscal & Receita", slug: "fiscal-e-receita", foco: "Normas da Receita Federal, IN, portarias com impacto tributário" },
    { nome: "Concorrência & Controle", slug: "concorrencia-e-controle", foco: "CADE, fusões e aquisições, práticas anticompetitivas" },
    { nome: "Consumidor & Normas", slug: "consumidor-e-normas", foco: "PROCON, SENACON, direitos do consumidor, recall, fraudes" },
    { nome: "Infra & Energia", slug: "infra-e-energia", foco: "ANP, ANEEL, ANTT — energia elétrica, gás, transporte" },
    { nome: "Saúde", slug: "saude", foco: "ANS, ANVISA — regulação de planos, medicamentos, dispositivos médicos" },
    { nome: "Telecom & Mídia", slug: "telecom-e-midia", foco: "ANATEL, lei de mídia, internet, conteúdo digital" },
    { nome: "Transporte & Logística", slug: "transporte-e-logistica", foco: "ANTT, portos, aviação — regulação do transporte" },
    { nome: "Mineração & Indústria", slug: "mineracao-e-industria", foco: "ANM, licenças ambientais, INMETRO, normas de segurança industrial" },
    { nome: "Geral", slug: "geral", foco: "Regulação que não se encaixa nas subcategorias acima" },
  ],
  parcerias: [
    { nome: "Empresas & Startups", slug: "empresas-e-startups", foco: "Conteúdo produzido em parceria com empresas e startups" },
    { nome: "Universidades & Faculdades", slug: "universidades-e-faculdades", foco: "Conteúdo em parceria com instituições de ensino superior" },
    { nome: "Órgãos & Associações", slug: "orgaos-e-associacoes", foco: "Conteúdo em parceria com entidades de classe e associações" },
    { nome: "Benefícios & Descontos", slug: "beneficios-e-descontos", foco: "Ofertas exclusivas para a audiência OVC" },
    { nome: "Programas & Editais", slug: "programas-e-editais", foco: "Programas de apoio, editais, concursos patrocinados" },
    { nome: "Geral", slug: "geral", foco: "Parcerias que não se encaixam nas subcategorias acima" },
  ],
  internacional: [
    { nome: "Internacional", slug: "internacional", foco: "Economia e política global com impacto direto no Brasil — Fed, BCE, China, guerras comerciais, câmbio" },
  ],
};

// Regras de classificação por palavras-chave
function detectCategoria(texto) {
  const t = texto.toLowerCase();

  // Política
  if (/lula|bolsonaro|stf|supremo|congresso|câmara|senado|governo federal|ministro|presidente da república|reforma|judiciário|partido|eleição|voto|deputado|senador|planalto|moraes|tarcísio|milei/.test(t)) return "politica";

  // Economia macro
  if (/ibovespa|bolsa|ibov|dólar|pib|inflação|selic|copom|juros|banco central|economia brasileira|fiscal|orçamento|déficit|superávit|arrecadação|receita federal|ipca|focus|caged|desemprego/.test(t)) return "economia";

  // Investimentos PESSOAIS (produtos financeiros)
  if (/renda fixa|tesouro direto|fundo de investimento|cdi|carteira de investimentos|dividendo|previdência privada|pgbl|vgbl|consórcio|poupança|plano de previdência|renda variável|ação na bolsa|etf|bdr|fii|cdb|lci|lca/.test(t)) return "investimentos";

  // Seguros
  if (/seguro de vida|seguro saúde|plano de saúde|seguro auto|seguro residencial|apólice|sinistro|corretora de seguros|susep|seguro empresarial|seguro viagem/.test(t)) return "seguros";

  // Tributos
  if (/imposto de renda|irpf|declaração|malha fina|restituição|tributação|receita federal|irpj|csll|das|mei imposto|come-cotas|ganho de capital|nota fiscal/.test(t)) return "tributacao";

  // Regulação
  if (/regulação|anatel|anvisa|susep|ans|bacen|cvm|regulatório|aneel|anp|antt|cade|procon|lgpd|compliance/.test(t)) return "regulacao";

  // Negócios
  if (/empresa|negócio|startup|empreend|fusão|aquisição|corporat|mei|me |ltda|cnpj|simples nacional|capital de giro|faturamento/.test(t)) return "negocios";

  // Saúde
  if (/saúde pública|sus|hospital|vacina|doença|tratamento|medicamento|anvisa aprovação|plano de saúde aumento|custo de saúde/.test(t)) return "saude";

  // Família
  if (/família|filho|criança|adolescente|escola|colégio|faculdade|herança|inventário|patrimônio familiar|orçamento familiar/.test(t)) return "familia";

  // Tecnologia
  if (/tecnologia|inteligência artificial|ia |fintech|5g|cibersegurança|pix|open finance|e-commerce|marketplace|aplicativo|software|hardware/.test(t)) return "tecnologia";

  // Indústria
  if (/indústria|manufatura|produção|fábrica|agronegócio|agro|logística|porto|ferrovia|petróleo|mineração|siderurgia|energia elétrica|construção civil/.test(t)) return "industria";

  // Esportes
  if (/futebol|nba|nfl|mma|ufc|f1|fórmula 1|campeonato|clube|jogo|partida|atleta|olimpíada|copa|basquete|tênis/.test(t)) return "esportes";

  // Internacional
  if (/eua|estados unidos|china|europa|guerra|ucrânia|israel|trump|fed |federal reserve|banco central europeu|geopolítica|internacional/.test(t)) return "internacional";

  // Mercados
  if (/bolsa de valores|ação|câmbio|commodity|commodities|cripto|bitcoin|ethereum|índice|ibovespa|di futuro/.test(t)) return "mercados";

  return null; // forçar IA a classificar
}

function detectSubcategoria(categoria, texto) {
  const t = texto.toLowerCase();
  const subs = SUBCATEGORIAS[categoria];
  if (!subs) return subs?.[0] || { nome: "Geral", slug: "geral" };

  // Tentar match por palavras-chave da subcategoria
  const matches = {
    politica: {
      "executivo": /ministro|planalto|decreto|mp |medida provisória|presidência/,
      "legislativo": /câmara|senado|deputado|senador|votação|plenário|plenário|projeto de lei aprovado/,
      "judiciario": /stf|supremo|stj|decisão judicial|julgamento|habeas corpus|inquérito|alexandre de moraes/,
      "projetos-de-lei": /projeto de lei|pl \d|pec |emenda constitucional/,
      "eleicoes": /eleição|candidato|pesquisa eleitoral|2026|campanha/,
    },
    economia: {
      "monetaria-copom-selic": /copom|selic|banco central|juros básicos|taxa de juros/,
      "fiscal-orcamento-divida-pib-primario": /orçamento|déficit|superávit|dívida pública|arcabouço fiscal/,
      "conjuntura-pib-emprego-consumo-focus": /pib|emprego|desemprego|caged|focus|ipca|consumo/,
      "internacional-eua-europa-china-commodities": /eua|china|europa|fed|commodities internacionais/,
      "minuto-fiscal": /resultado primário|execução orçamentária/,
    },
    investimentos: {
      "renda-fixa": /renda fixa|cdb|lci|lca|tesouro direto|poupança|cdi/,
      "renda-variavel": /renda variável|ação|etf|bdr|small cap|ibovespa investidor/,
      "fundos": /fundo de investimento|fii|multimercado|fip|cota/,
      "previdencia": /previdência|pgbl|vgbl|aposentadoria|portabilidade previdência/,
      "alternativos": /cripto|bitcoin|ouro|consórcio|ativo alternativo/,
      "estrategias": /carteira|diversificação|asset allocation|perfil de risco/,
      "calendario-e-dividendos": /dividendo|ex-dividendo|jcp|proventos/,
      "educacao-do-investidor": /como investir|começar a investir|abrir conta|corretora/,
    },
  };

  const catMatches = matches[categoria];
  if (catMatches) {
    for (const [slug, regex] of Object.entries(catMatches)) {
      if (regex.test(t)) {
        const sub = subs.find(s => s.slug === slug);
        if (sub) return sub;
      }
    }
  }

  // Fallback: primeira subcategoria não-Geral, ou Geral
  return subs[0] || { nome: "Geral", slug: "geral" };
}

// ══════════════════════════════════════════════════════════════════
// PROMPT PRINCIPAL — PADRÃO OVC COMPLETO
// ══════════════════════════════════════════════════════════════════

const PROMPT = (data, categoria, subcategoria, focoSubcat, text) => `Você é redator-chefe do portal O Valor Capital (OVC). Reescreva a notícia abaixo como matéria jornalística completa no padrão OVC.

CATEGORIA DESTA MATÉRIA: ${categoria.toUpperCase()}
SUBCATEGORIA: ${subcategoria}
FOCO DESTA SUBCATEGORIA: ${focoSubcat}

ATENÇÃO: O conteúdo deve ser ESPECÍFICO para esta categoria e subcategoria. Não é conteúdo genérico.

FORMATO DE SAÍDA — copie exatamente esta estrutura:

TITULO: manchete real com máximo 8 palavras e verbo obrigatório
SUBTITULO: frase direta de até 100 caracteres
CATEGORIA: ${categoria}
SUBCATEGORIA: ${subcategoria}
CORPO:
Redação OVC — ${data}

Parágrafo 1 — mínimo 4 frases: abra com o fato mais impactante, número concreto ou contradição. Prenda o leitor na primeira linha.

Parágrafo 2 — mínimo 4 frases: por que isso importa AGORA para o brasileiro de classe média. Conecte ao dia a dia real: emprego, conta bancária, custo de vida, negócio.

Parágrafo 3 — mínimo 4 frases: números, datas, nomes verificáveis da notícia. Dados concretos que comprovam o que foi dito.

Parágrafo 4 — mínimo 4 frases: histórico ou contexto. O que aconteceu antes. O que a maioria não sabe.

Parágrafo 5 — mínimo 4 frases: impacto prático. O que muda para o cidadão, empresa ou mercado. Quem paga, quem ganha, quem perde.

Parágrafo 6 — mínimo 4 frases: quem reagiu e o que disse. Posições diferentes. Reproduza falas sem tomar partido.

Parágrafo 7 — mínimo 4 frases: perspectiva histórica ou comparação internacional. Profundidade para o leitor.

Parágrafo 8 — mínimo 3 frases: feche com tensão real ou consequência em aberto. Não conclua. Deixe o leitor pensando.

#hashtag_relevante_1
#hashtag_relevante_2
#hashtag_relevante_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- CORPO com MÍNIMO 1.600 e MÁXIMO 2.200 caracteres — conte e ajuste
- EXATAMENTE 8 parágrafos separados por linha em branco
- Primeira linha do CORPO sempre: Redação OVC — ${data}
- Linguagem direta, de rua, sem academicismo
- Viés editorial centro-direita: fiscalização do Estado, liberdade econômica, família, propriedade privada
- Frases curtas e médias alternadas. Ritmo jornalístico
- NUNCA mencione o veículo de origem, nome de repórter ou crédito de foto
- NUNCA use: muralha, blindar, colapso, catalisador, ecossistema, disruptivo, paradigma, sinergia, protagonista, robusto, resiliente, isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, desafios e oportunidades, no âmbito, cabe ressaltar, é importante destacar, não por acaso, nesse sentido, pimenta amarga, mister, fulcral, hodierno, notadamente, outrossim
- INVESTIMENTOS = produtos financeiros pessoais (previdência, consórcio, poupança, renda fixa, fundos, ações de pessoa física). Investimento de governo ou empresa = economia ou negócios
- SEGUROS = apólices, coberturas, sinistros, mercado segurador. Se foco for seguro de saúde = seguros, não saúde
- TRIBUTAÇÃO = impostos, declarações, obrigações fiscais. Não confundir com regulação
- INTERNACIONAL = notícia de fora com impacto econômico direto no Brasil

NOTÍCIA FONTE:
${text}`;

function parse(raw) {
  if (!raw) return null;

  const lines = raw.split("\n");
  let titulo = "";
  let subtitulo = "";
  let categoriaRaw = "";
  let subcategoriaRaw = "";
  let corpo = "";
  let inCorpo = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed)) {
      titulo = trimmed.replace(/^TITULO:/i, "").trim();
    } else if (/^SUBTITULO:/i.test(trimmed)) {
      subtitulo = trimmed.replace(/^SUBTITULO:/i, "").trim();
    } else if (/^CATEGORIA:/i.test(trimmed)) {
      categoriaRaw = trimmed.replace(/^CATEGORIA:/i, "").trim().toLowerCase();
    } else if (/^SUBCATEGORIA:/i.test(trimmed)) {
      subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    } else if (/^CORPO:/i.test(trimmed)) {
      inCorpo = true;
    } else if (inCorpo) {
      corpo += line + "\n";
    }
  }

  corpo = corpo.trim();

  if (!corpo) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = firstLine;
  }

  // Validar e corrigir categoria
  let categoria = CATS_VALIDAS.includes(categoriaRaw) ? categoriaRaw : detectCategoria(titulo + " " + corpo);
  if (!categoria || categoria === "geral") return null; // Rejeitar sem categoria válida

  // Validar e corrigir subcategoria
  const subsDisponiveis = SUBCATEGORIAS[categoria] || [];
  const subMatch = subsDisponiveis.find(s =>
    s.nome.toLowerCase() === subcategoriaRaw.toLowerCase() ||
    s.slug === subcategoriaRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
  );
  const subcategoriaFinal = subMatch || detectSubcategoria(categoria, titulo + " " + corpo);

  return {
    titulo: titulo || "Sem título",
    subtitulo: subtitulo || "",
    categoria,
    subcategoria: subcategoriaFinal.nome,
    subcategoria_slug: subcategoriaFinal.slug,
    corpo
  };
}

export async function rewritePortal(text, title) {
  // Detectar categoria e subcategoria antes de chamar a IA
  const categoriaDetectada = detectCategoria((title || "") + " " + text) || "politica";
  const subcategoriaDetectada = detectSubcategoria(categoriaDetectada, (title || "") + " " + text);

  const prompt = PROMPT(
    hoje(),
    categoriaDetectada,
    subcategoriaDetectada.nome,
    subcategoriaDetectada.foco,
    text
  );

  const raw = await callGemini(prompt);
  const result = parse(raw);

  if (!result || !result.corpo || result.corpo.length < 1500) {
    throw new Error("Conteúdo insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }

  // Filtro de qualidade — rejeitar lixo do Gemini
  const tituloLower = (result.titulo || "").toLowerCase();
  const corpoLower = result.corpo.toLowerCase();
  const proibidos = ["prezado", "caro usuário", "olá,", "atenção:", "aviso:", "sem título", "prezado usuário"];
  if (proibidos.some(p => tituloLower.includes(p) || corpoLower.slice(0,100).includes(p))) {
    throw new Error("Conteúdo rejeitado — título ou abertura inválida");
  }
  if (!corpoLower.includes("redação ovc")) {
    throw new Error("Conteúdo rejeitado — sem assinatura Redação OVC");
  }

  return result;
}

export async function rewriteTitle(titulo, corpo) {
  const prompt = `Crie uma manchete jornalística profissional. Máx 8 palavras. Verbo obrigatório. Específico.
EXEMPLOS: "Lula troca ministro após pressão do Centrão" | "Ibovespa cai 1,8% com temor do Fed"
TÍTULO ATUAL (ruim): ${titulo}
TRECHO: ${(corpo||"").slice(0,300)}
Responda APENAS com o novo título, sem explicação.`;
  const raw = await callGemini(prompt);
  const novo = raw.split("\n")[0].trim().replace(/^["']+|["']+$/g,"");
  return novo.length > 5 ? novo : titulo;
}
