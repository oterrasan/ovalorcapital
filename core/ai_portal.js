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
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY nao configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Voce e redator jornalistico senior de um portal de noticias brasileiro. Sua funcao e produzir materias originais e completas a partir de pautas editoriais. O texto do usuario contem o TEMA e o ANGULO EDITORIAL -- escreva com seu proprio estilo jornalistico, sem copiar frases da fonte." },
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
  throw new Error("Gemini indisponivel");
}

// Subcategorias validas por categoria — IA deve escolher exatamente uma desta lista
const SUBCATS_POR_CAT = {
  politica:      ["Governo Federal","Congresso Nacional","Eleicoes","Partidos Politicos","STF & Judiciario","Politica Estadual","Camara dos Deputados","Senado Federal","Poder Executivo"],
  economia:      ["Politica Economica","Inflacao & Precos","Taxa Selic","PIB & Crescimento","Cambio & Dolar","Fiscal & Orcamento","Emprego & Renda","Banco Central"],
  negocios:      ["Empresas & Corporacoes","Fusoes & Aquisicoes","Startups","Empreendedorismo","Grandes Corporacoes","Setor Privado","Varejo","Agronegocio Empresarial"],
  investimentos: ["Bolsa de Valores","Renda Fixa","Fundos de Investimento","Tesouro Direto","Criptomoedas","Analise de Mercado","Financas Pessoais","FIIs"],
  seguros:       ["Seguro de Vida","Planos de Saude","Seguro Auto","Previdencia Privada","Seguro Residencial","SUSEP & ANS","Seguro Empresarial","Corretoras de Seguros"],
  mercados:      ["Commodities","Petroleo & Energia","Ouro & Metais","B3 & Ibovespa","Cambio Internacional","Indices Globais","Agro & Graos"],
  educacao:      ["Ensino Superior","ENEM","Educacao Basica","Cursos & Certificacoes","Pos-Graduacao","Tecnologia na Educacao","Bolsas de Estudo","Ensino Tecnico"],
  industria:     ["Agronegocio","Manufatura","Energia","Infraestrutura","Exportacoes","Cadeia Produtiva","Mineracao","Construcao Civil"],
  tecnologia:    ["Inteligencia Artificial","Seguranca Digital","E-commerce","Telecomunicacoes","Inovacao","Startups Tech","Blockchain","Computacao em Nuvem"],
  esportes:      ["Futebol","Olimpiadas","Formula 1","Tenis","Basquete","Natacao","Atletismo","Outros Esportes"],
  saude:         ["Medicina & Tratamentos","SUS","Saude Mental","Medicamentos","Bem-estar","Epidemiologia","Pediatria","Nutricao"],
  familia:       ["Educacao dos Filhos","Planejamento Familiar","Heranca & Patrimonio","Casamento & Divorcio","Financas Pessoais","Criacao de Filhos"],
  tributacao:    ["IRPF","Reforma Tributaria","ICMS & ISS","Receita Federal","Planejamento Tributario","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  regulacao:     ["BACEN","CVM","ANBIMA","SUSEP","ANS","ANATEL","ANEEL","Regulacao Setorial"],
  parcerias:     ["Acordos Comerciais","Joint Ventures","Aliancas Estrategicas","Contratos Publicos","PPP"],
  internacional: ["Relacoes Exteriores","Geopolitica","Conflitos Globais","America Latina","Estados Unidos","Europa","China & Asia","Oriente Medio","Diplomacia"],
  variedades:    ["Comportamento","Lifestyle","Entretenimento","Tendencias","Gastronomia","Turismo","Moda"],
  investigativo: ["Corrupcao","Operacoes Policiais","Denuncias","Jornalismo de Dados","Fiscalizacao Publica","Lavagem de Dinheiro"],
  seguranca:     ["Seguranca Publica","Crime Organizado","Violencia Urbana","Policia Federal","Narcotrafico","Faccoes","Homicidios"],
  cultura:       ["Cinema","Musica","Arte","Teatro","Literatura","Patrimonio Cultural","Streaming","Festivais"],
  profissoes:    ["Medicina","Direito","Engenharia","Contabilidade","TI & Programacao","Administracao","Arquitetura","Recursos Humanos"],
  vagas:         ["Oportunidades CLT","Trabalho Remoto","Recrutamento & Selecao","Estagio","Trainee","Mercado de Trabalho"],
  concursos:     ["Concursos Federais","Concursos Estaduais","Concursos Municipais","Militares & Policiais","Judiciario","Saude Publica"],
  imoveis:       ["Mercado Imobiliario","Financiamento Habitacional","Construtoras","Aluguel","Lancamentos","Minha Casa Minha Vida"],
  esg:           ["Sustentabilidade","Meio Ambiente","Governanca Corporativa","Energia Limpa","Impacto Social","Carbono & Emissoes"],
  defesa:        ["Forcas Armadas","Seguranca Nacional","Politica de Defesa","Exercito","Marinha","Aeronautica","Fronteiras"],
  religiao:      ["Evangelicalismo","Catolicismo","Espiritualidade","Igrejas","Fe & Sociedade","Missoes","Religioes Afro-brasileiras"],
};

const PROMPT = (data, text) => `Voce e redator senior do portal O Valor Capital (OVC), especializado em jornalismo economico e financeiro com foco em SEO. Sua tarefa e REESCREVER a noticia abaixo com outras palavras, mantendo EXATAMENTE os mesmos fatos, numeros, nomes e informacoes da fonte. Voce NAO pode inventar nada. Se a fonte nao informa algo, voce nao escreve.

REGRA ABSOLUTA: Use SOMENTE as informacoes do texto fonte. Nada alem disso.

FORMATO DE SAIDA OBRIGATORIO -- copie os rotulos exatamente:

TITULO: manchete entre 50 e 65 caracteres -- palavra-chave principal no inicio, verbo obrigatorio, factual, sem clickbait
FOCO_KEYWORD: 2 a 4 palavras que definem o tema central para SEO (ex: taxa selic, reforma tributaria, dolar bolsa)
SLUG: 3 a 5 palavras-chave do titulo em portugues, hifenizadas, sem acentos, sem artigos (ex: selic-sobe-inflacao-alta)
META_DESCRICAO: 145 a 160 caracteres -- resumo factual com a palavra-chave principal integrada de forma natural, sem cortar no meio
CATEGORIA: escolha exatamente uma das categorias abaixo -- escolha pela RELEVANCIA TEMATICA do artigo:
  politica, economia, negocios, investimentos, seguros, mercados, educacao, industria, tecnologia,
  esportes, saude, familia, tributacao, regulacao, parcerias, internacional, variedades,
  investigativo, seguranca, cultura, profissoes, vagas, concursos, imoveis, esg, defesa, religiao
SUBCATEGORIA: escolha EXATAMENTE uma das subcategorias validas para a CATEGORIA escolhida -- nao invente, nao use outra
CORPO:
Redacao OVC -- ${data}

[Paragrafo de abertura -- 4 a 5 frases. Responda quem, o que, quando, onde e por que usando os fatos da fonte. Inclua a palavra-chave principal na primeira frase. Este paragrafo e o mais importante para SEO.]

## [Subheading H2 -- variacao natural da palavra-chave, factual, 4 a 7 palavras]

[Paragrafo -- 4 frases. Desdobramentos e contexto que estao NA FONTE.]

[Paragrafo -- 4 frases. Dados, numeros e nomes presentes NA FONTE.]

## [Subheading H2 -- impacto ou consequencias praticas, factual]

[Paragrafo -- 4 frases. Impacto concreto para o leitor, usando os fatos da fonte.]

[Paragrafo -- 4 frases. Quem e afetado, como e por que -- somente o que a fonte diz.]

## [Subheading H2 -- perspectiva ou proximos passos, factual]

[Paragrafo -- 3 a 4 frases. Proximos passos ou perspectivas mencionados NA FONTE. Nao conclua alem do que a fonte informa.]

#hashtag_tema_1
#hashtag_tema_2
#hashtag_tema_3
#ovalorcapital

REGRAS INVIOLAVEIS:
- CORPO minimo 2.000 caracteres -- escreva paragrafos densos e completos
- Use SOMENTE fatos do texto fonte. Se nao esta na fonte, nao escreva.
- NUNCA invente nomes de pessoas, empresas, valores, datas ou declaracoes.
- NUNCA adicione contexto historico que nao esta na fonte.
- NUNCA mencione o veiculo de origem.
- Primeira linha do CORPO sempre: Redacao OVC -- ${data}
- Os subheadings ## devem aparecer exatamente como marcados (## seguido de espaco e texto)
- TITULO deve ter entre 50 e 65 caracteres -- conte e ajuste
- META_DESCRICAO deve ter entre 145 e 160 caracteres -- conte e ajuste
- Linguagem direta e acessivel, sem academicismo
- NAO comece com saudacao, "Prezado", "Caro", "Ola" ou similar
- NAO use: isso mostra, vale destacar, em meio a, diante disso, chama atencao, acende alerta, especialistas apontam, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista, blindar

PAUTA EDITORIAL (tema, angulo e contexto fornecidos pelo editor -- use como referencia jornalistica e reescreva com seu proprio estilo):
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

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados",
    "educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao",
    "parcerias","internacional","variedades","investigativo","seguranca","cultura",
    "profissoes","vagas","concursos","imoveis","esg","defesa","religiao"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "geral";

  // Valida subcategoria — deve estar na lista da categoria escolhida
  const subcatsValidas = SUBCATS_POR_CAT[categoriaRaw] || [];
  if (subcatsValidas.length > 0) {
    const subcatNorm = subcategoriaRaw.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const match = subcatsValidas.find(s =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim() === subcatNorm ||
      s.toLowerCase().includes(subcatNorm) ||
      subcatNorm.includes(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().slice(0, 6))
    );
    if (match) {
      subcategoriaRaw = match;
    } else {
      subcategoriaRaw = subcatsValidas[0];
    }
  }

  if (!slug && titulo) slug = slugify(titulo).split("-").slice(0, 5).join("-");
  return {
    titulo: titulo || "Sem titulo",
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
    throw new Error("Conteudo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }
  const tituloLower = (result.titulo || "").toLowerCase().trim();
  const corpoInicio = result.corpo.slice(0, 100).toLowerCase();
  const proibidos = ["prezado", "caro usuario", "ola,", "atencao:", "dear", "editor(a)", "redator-chefe"];
  if (proibidos.some(p => tituloLower.startsWith(p) || corpoInicio.includes(p))) {
    throw new Error("Conteudo rejeitado -- titulo ou abertura invalida");
  }
  if (!result.corpo.toLowerCase().includes("redacao ovc")) {
    throw new Error("Conteudo rejeitado -- sem assinatura Redacao OVC");
  }
  return result;
}
