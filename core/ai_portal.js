import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let geminiKeyIndex = 0;
function nextGeminiKey() {
  const k = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return k;
}

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é redator jornalístico sênior de um portal de notícias brasileiro. Sua função é produzir matérias originais e completas a partir de pautas editoriais. O texto do usuário contém o TEMA e o ÂNGULO EDITORIAL — escreva com seu próprio estilo jornalístico, sem copiar frases da fonte." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 8192
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ""}`);
  const text = d.choices?.[0]?.message?.content;
  if (text && text.length > 100) return text;
  throw new Error("OpenAI retornou resposta vazia ou muito curta");
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextGeminiKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 }
        })
      });
      const d = await res.json();
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 100) return text;
    } catch(e) {
      if (i === GEMINI_KEYS.length - 1) throw e;
    }
  }
  throw new Error("Gemini indisponível");
}

// ─── SUBCATEGORIAS VÁLIDAS POR CATEGORIA ─────────────────────────────────────
// A IA DEVE escolher exatamente uma subcategoria desta lista.
// Fora desta lista = inválido = será substituído pelo primeiro item.
const SUBCATS_POR_CAT = {
  politica:      ["Governo Federal","Congresso Nacional","Eleições","Partidos Políticos","STF & Judiciário","Política Estadual","Câmara dos Deputados","Senado Federal","Poder Executivo"],
  economia:      ["Política Econômica","Inflação & Preços","Taxa Selic","PIB & Crescimento","Câmbio & Dólar","Fiscal & Orçamento","Emprego & Renda","Banco Central"],
  negocios:      ["Empresas & Corporações","Fusões & Aquisições","Startups","Empreendedorismo","Grandes Corporações","Setor Privado","Varejo","Agronegócio Empresarial"],
  investimentos: ["Bolsa de Valores","Renda Fixa","Fundos de Investimento","Tesouro Direto","Criptomoedas","Análise de Mercado","Finanças Pessoais","FIIs"],
  seguros:       ["Seguro de Vida","Planos de Saúde","Seguro Auto","Previdência Privada","Seguro Residencial","SUSEP & ANS","Seguro Empresarial","Corretoras de Seguros"],
  mercados:      ["Commodities","Petróleo & Energia","Ouro & Metais","B3 & Ibovespa","Câmbio Internacional","Índices Globais","Agro & Grãos"],
  educacao:      ["Ensino Superior","ENEM","Educação Básica","Cursos & Certificações","Pós-Graduação","Tecnologia na Educação","Bolsas de Estudo","Ensino Técnico"],
  industria:     ["Agronegócio","Manufatura","Energia","Infraestrutura","Exportações","Cadeia Produtiva","Mineração","Construção Civil"],
  tecnologia:    ["Inteligência Artificial","Segurança Digital","E-commerce","Telecomunicações","Inovação","Startups Tech","Blockchain","Computação em Nuvem"],
  esportes:      ["Futebol","Olimpíadas","Fórmula 1","Tênis","Basquete","Natação","Atletismo","Outros Esportes"],
  saude:         ["Medicina & Tratamentos","SUS","Saúde Mental","Medicamentos","Bem-estar","Epidemiologia","Pediatria","Nutrição"],
  familia:       ["Educação dos Filhos","Planejamento Familiar","Herança & Patrimônio","Casamento & Divórcio","Finanças Pessoais","Criação de Filhos"],
  tributacao:    ["IRPF","Reforma Tributária","ICMS & ISS","Receita Federal","Planejamento Tributário","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  regulacao:     ["BACEN","CVM","ANBIMA","SUSEP","ANS","ANATEL","ANEEL","Regulação Setorial"],
  parcerias:     ["Acordos Comerciais","Joint Ventures","Alianças Estratégicas","Contratos Públicos","PPP"],
  internacional: ["Relações Exteriores","Geopolítica","Conflitos Globais","América Latina","Estados Unidos","Europa","China & Ásia","Oriente Médio","Diplomacia"],
  variedades:    ["Comportamento","Lifestyle","Entretenimento","Tendências","Gastronomia","Turismo","Moda"],
  investigativo: ["Corrupção","Operações Policiais","Denúncias","Jornalismo de Dados","Fiscalização Pública","Lavagem de Dinheiro"],
  seguranca:     ["Segurança Pública","Crime Organizado","Violência Urbana","Polícia Federal","Narcotráfico","Facções","Homicídios"],
  cultura:       ["Cinema","Música","Arte","Teatro","Literatura","Patrimônio Cultural","Streaming","Festivais"],
  profissoes:    ["Medicina","Direito","Engenharia","Contabilidade","TI & Programação","Administração","Arquitetura","Recursos Humanos"],
  vagas:         ["Oportunidades CLT","Trabalho Remoto","Recrutamento & Seleção","Estágio","Trainee","Mercado de Trabalho"],
  concursos:     ["Concursos Federais","Concursos Estaduais","Concursos Municipais","Militares & Policiais","Judiciário","Saúde Pública"],
  imoveis:       ["Mercado Imobiliário","Financiamento Habitacional","Construtoras","Aluguel","Lançamentos","Minha Casa Minha Vida"],
  esg:           ["Sustentabilidade","Meio Ambiente","Governança Corporativa","Energia Limpa","Impacto Social","Carbono & Emissões"],
  defesa:        ["Forças Armadas","Segurança Nacional","Política de Defesa","Exército","Marinha","Aeronáutica","Fronteiras"],
  religiao:      ["Evangelicalismo","Catolicismo","Espiritualidade","Igrejas","Fé & Sociedade","Missões","Religiões Afro-brasileiras"],
};

function subcatsListForPrompt(cat) {
  const list = SUBCATS_POR_CAT[cat];
  return list ? list.join(' | ') : 'subcategoria específica';
}

const PROMPT = (data, text) => `Você é redator sênior do portal O Valor Capital (OVC), especializado em jornalismo econômico e financeiro com foco em SEO. Sua tarefa é REESCREVER a notícia abaixo com outras palavras, mantendo EXATAMENTE os mesmos fatos, números, nomes e informações da fonte. Você NÃO pode inventar nada. Se a fonte não informa algo, você não escreve.

REGRA ABSOLUTA: Use SOMENTE as informações do texto fonte. Nada além disso.

FORMATO DE SAÍDA OBRIGATÓRIO — copie os rótulos exatamente:

TITULO: manchete entre 50 e 65 caracteres — palavra-chave principal no início, verbo obrigatório, factual, sem clickbait
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO (ex: taxa selic, reforma tributária, dólar bolsa)
SLUG: 3 a 5 palavras-chave do título em português, hifenizadas, sem acentos, sem artigos (ex: selic-sobe-inflacao-alta)
META_DESCRICAO: 145 a 160 caracteres — resumo factual com a palavra-chave principal integrada de forma natural, sem cortar no meio
CATEGORIA: escolha exatamente uma das categorias abaixo — escolha pela RELEVÂNCIA TEMÁTICA do artigo:
  politica → governo federal, congresso, eleições, partidos, poder executivo/legislativo/judiciário
  economia → PIB, inflação, juros SELIC, câmbio, fiscal, política econômica
  negocios → empresas, fusões, aquisições, startups, empreendedorismo
  investimentos → bolsa, fundos, renda fixa, tesouro direto, criptomoedas
  seguros → seguros de vida, planos de saúde, previdência privada, SUSEP, ANS
  mercados → commodities, petróleo, ouro, índices, B3
  educacao → escolas, universidades, ENEM, ensino superior, cursos
  industria → manufatura, produção industrial, exportação, cadeia produtiva
  tecnologia → TI, IA, inovação, startups tech, digital
  esportes → futebol, olimpíadas, esportes em geral
  saude → medicina, SUS, medicamentos, doenças, bem-estar
  familia → filhos, casamento, herança, planejamento familiar
  tributacao → imposto de renda, reforma tributária, IRPF, ICMS, receita federal
  regulacao → BACEN, CVM, ANBIMA, reguladores, compliance
  parcerias → acordos, joint ventures, contratos entre empresas
  internacional → geopolítica, diplomacia, relações exteriores, conflitos globais
  variedades → entretenimento, comportamento, estilo de vida, cultura pop
  investigativo → denúncias, corrupção, operações policiais, jornalismo investigativo
  seguranca → segurança pública, crime, polícia, violência
  cultura → arte, cinema, música, teatro, literatura
  profissoes → carreiras específicas, mercado de trabalho por área
  vagas → empregos, contratações, recrutamento, CLT
  concursos → concursos públicos, editais, gabaritos
  imoveis → mercado imobiliário, construtoras, financiamento
  esg → sustentabilidade, meio ambiente, governança corporativa
  defesa → forças armadas, defesa nacional, segurança nacional
  religiao → fé, espiritualidade, igrejas, religiosidade
SUBCATEGORIA: escolha EXATAMENTE uma das subcategorias abaixo para a CATEGORIA escolhida — não invente, não use outra:
  politica → Governo Federal | Congresso Nacional | Eleições | Partidos Políticos | STF & Judiciário | Política Estadual | Câmara dos Deputados | Senado Federal | Poder Executivo
  economia → Política Econômica | Inflação & Preços | Taxa Selic | PIB & Crescimento | Câmbio & Dólar | Fiscal & Orçamento | Emprego & Renda | Banco Central
  negocios → Empresas & Corporações | Fusões & Aquisições | Startups | Empreendedorismo | Grandes Corporações | Setor Privado | Varejo | Agronegócio Empresarial
  investimentos → Bolsa de Valores | Renda Fixa | Fundos de Investimento | Tesouro Direto | Criptomoedas | Análise de Mercado | Finanças Pessoais | FIIs
  seguros → Seguro de Vida | Planos de Saúde | Seguro Auto | Previdência Privada | Seguro Residencial | SUSEP & ANS | Seguro Empresarial | Corretoras de Seguros
  mercados → Commodities | Petróleo & Energia | Ouro & Metais | B3 & Ibovespa | Câmbio Internacional | Índices Globais | Agro & Grãos
  educacao → Ensino Superior | ENEM | Educação Básica | Cursos & Certificações | Pós-Graduação | Tecnologia na Educação | Bolsas de Estudo | Ensino Técnico
  industria → Agronegócio | Manufatura | Energia | Infraestrutura | Exportações | Cadeia Produtiva | Mineração | Construção Civil
  tecnologia → Inteligência Artificial | Segurança Digital | E-commerce | Telecomunicações | Inovação | Startups Tech | Blockchain | Computação em Nuvem
  esportes → Futebol | Olimpíadas | Fórmula 1 | Tênis | Basquete | Natação | Atletismo | Outros Esportes
  saude → Medicina & Tratamentos | SUS | Saúde Mental | Medicamentos | Bem-estar | Epidemiologia | Pediatria | Nutrição
  familia → Educação dos Filhos | Planejamento Familiar | Herança & Patrimônio | Casamento & Divórcio | Finanças Pessoais | Criação de Filhos
  tributacao → IRPF | Reforma Tributária | ICMS & ISS | Receita Federal | Planejamento Tributário | Impostos Federais | Simples Nacional | CSLL & IRPJ
  regulacao → BACEN | CVM | ANBIMA | SUSEP | ANS | ANATEL | ANEEL | Regulação Setorial
  parcerias → Acordos Comerciais | Joint Ventures | Alianças Estratégicas | Contratos Públicos | PPP
  internacional → Relações Exteriores | Geopolítica | Conflitos Globais | América Latina | Estados Unidos | Europa | China & Ásia | Oriente Médio | Diplomacia
  variedades → Comportamento | Lifestyle | Entretenimento | Tendências | Gastronomia | Turismo | Moda
  investigativo → Corrupção | Operações Policiais | Denúncias | Jornalismo de Dados | Fiscalização Pública | Lavagem de Dinheiro
  seguranca → Segurança Pública | Crime Organizado | Violência Urbana | Polícia Federal | Narcotráfico | Facções | Homicídios
  cultura → Cinema | Música | Arte | Teatro | Literatura | Patrimônio Cultural | Streaming | Festivais
  profissoes → Medicina | Direito | Engenharia | Contabilidade | TI & Programação | Administração | Arquitetura | Recursos Humanos
  vagas → Oportunidades CLT | Trabalho Remoto | Recrutamento & Seleção | Estágio | Trainee | Mercado de Trabalho
  concursos → Concursos Federais | Concursos Estaduais | Concursos Municipais | Militares & Policiais | Judiciário | Saúde Pública
  imoveis → Mercado Imobiliário | Financiamento Habitacional | Construtoras | Aluguel | Lançamentos | Minha Casa Minha Vida
  esg → Sustentabilidade | Meio Ambiente | Governança Corporativa | Energia Limpa | Impacto Social | Carbono & Emissões
  defesa → Forças Armadas | Segurança Nacional | Política de Defesa | Exército | Marinha | Aeronáutica | Fronteiras
  religiao → Evangelicalismo | Catolicismo | Espiritualidade | Igrejas | Fé & Sociedade | Missões | Religiões Afro-brasileiras
CORPO:
Redação OVC — ${data}

[Parágrafo de abertura — 4 a 5 frases. Responda quem, o quê, quando, onde e por quê usando os fatos da fonte. Inclua a palavra-chave principal na primeira frase. Este parágrafo é o mais importante para SEO.]

## [Subheading H2 — variação natural da palavra-chave, factual, 4 a 7 palavras]

[Parágrafo — 4 frases. Desdobramentos e contexto que estão NA FONTE.]

[Parágrafo — 4 frases. Dados, números e nomes presentes NA FONTE.]

## [Subheading H2 — impacto ou consequências práticas, factual]

[Parágrafo — 4 frases. Impacto concreto para o leitor, usando os fatos da fonte.]

[Parágrafo — 4 frases. Quem é afetado, como e por quê — somente o que a fonte diz.]

## [Subheading H2 — perspectiva ou próximos passos, factual]

[Parágrafo — 3 a 4 frases. Próximos passos ou perspectivas mencionados NA FONTE. Não conclua além do que a fonte informa.]

#hashtag_tema_1
#hashtag_tema_2
#hashtag_tema_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- CORPO mínimo 2.000 caracteres — escreva parágrafos densos e completos
- Use SOMENTE fatos do texto fonte. Se não está na fonte, não escreva.
- NUNCA invente nomes de pessoas, empresas, valores, datas ou declarações.
- NUNCA adicione contexto histórico que não está na fonte.
- NUNCA mencione o veículo de origem.
- Primeira linha do CORPO sempre: Redação OVC — ${data}
- Os subheadings ## devem aparecer exatamente como marcados (## seguido de espaço e texto)
- TITULO deve ter entre 50 e 65 caracteres — conte e ajuste
- META_DESCRICAO deve ter entre 145 e 160 caracteres — conte e ajuste
- Linguagem direta e acessível, sem academicismo
- NÃO comece com saudação, "Prezado", "Caro", "Olá" ou similar
- NÃO use: isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista, blindar

PAUTA EDITORIAL (tema, ângulo e contexto fornecidos pelo editor — use como referência jornalística e reescreva com seu próprio estilo):
${text}`;

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parse(raw) {
  if (!raw) return null;
  const lines = raw.split("\n");
  let titulo = "", focoKeyword = "", slug = "", metaDescricao = "", categoriaRaw = "", subcategoriaRaw = "", corpo = "";
  let inCorpo = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed)) titulo = trimmed.replace(/^TITULO:/i, "").trim();
    else if (/^FOCO_KEYWORD:/i.test(trimmed)) focoKeyword = trimmed.replace(/^FOCO_KEYWORD:/i, "").trim();
    else if (/^SLUG:/i.test(trimmed)) slug = slugify(trimmed.replace(/^SLUG:/i, "").trim());
    else if (/^META_DESCRICAO:/i.test(trimmed)) metaDescricao = trimmed.replace(/^META_DESCRICAO:/i, "").trim();
    else if (/^SUBTITULO:/i.test(trimmed)) { if (!metaDescricao) metaDescricao = trimmed.replace(/^SUBTITULO:/i, "").trim(); }
    else if (/^CATEGORIA:/i.test(trimmed)) categoriaRaw = trimmed.replace(/^CATEGORIA:/i, "").trim().split(/[\s→|]/)[0].toLowerCase();
    else if (/^SUBCATEGORIA:/i.test(trimmed)) subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    else if (/^CORPO:/i.test(trimmed)) inCorpo = true;
    else if (inCorpo) corpo += line + "\n";
  }
  corpo = corpo.trim();
  if (!corpo && raw.length > 200) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = titulo || firstLine;
  }

  // vc e colunistas NAO sao validos para geracao automatica
  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados",
    "educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao",
    "parcerias","internacional","variedades","investigativo","seguranca","cultura",
    "profissoes","vagas","concursos","imoveis","esg","defesa","religiao"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "geral";

  // Validar e corrigir subcategoria — deve estar na lista da categoria escolhida
  const subcatsValidas = SUBCATS_POR_CAT[categoriaRaw] || [];
  if (subcatsValidas.length > 0) {
    // Verificar se a subcategoria gerada está na lista (comparação case-insensitive parcial)
    const subcatNorm = subcategoriaRaw.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const match = subcatsValidas.find(s =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim() === subcatNorm ||
      s.toLowerCase().includes(subcatNorm) ||
      subcatNorm.includes(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().slice(0, 6))
    );
    if (match) {
      subcategoriaRaw = match; // normaliza para o valor canônico
    } else {
      // Subcategoria inválida — usar o primeiro item da lista da categoria
      subcategoriaRaw = subcatsValidas[0];
    }
  }

  if (!slug && titulo) slug = slugify(titulo).split("-").slice(0, 5).join("-");
  return {
    titulo: titulo || "Sem título",
    subtitulo: metaDescricao || "",
    meta_descricao: metaDescricao || "",
    foco_keyword: focoKeyword || "",
    slug,
    categoria: categoriaRaw,
    subcategoria: subcategoriaRaw || (SUBCATS_POR_CAT[categoriaRaw]?.[0] || "Geral"),
    subcategoria_slug: slugify(subcategoriaRaw || "geral"),
    corpo
  };
}

export async function rewritePortal(text, title, useGemini = false) {
  const prompt = PROMPT(hoje(), (title ? title + "\n\n" : "") + text);
  const raw = useGemini ? await callGemini(prompt) : await callOpenAI(prompt);
  const result = parse(raw);
  if (!result || !result.corpo || result.corpo.length < 1200) {
    throw new Error("Conteúdo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }
  const tituloLower = (result.titulo || "").toLowerCase().trim();
  const corpoInicio = result.corpo.slice(0, 100).toLowerCase();
  const proibidos = ["prezado", "caro usuário", "olá,", "atenção:", "dear", "editor(a)", "redator-chefe"];
  if (proibidos.some(p => tituloLower.startsWith(p) || corpoInicio.includes(p))) {
    throw new Error("Conteúdo rejeitado — título ou abertura inválida");
  }
  if (!result.corpo.toLowerCase().includes("redação ovc")) {
    throw new Error("Conteúdo rejeitado — sem assinatura Redação OVC");
  }
  return result;
}
