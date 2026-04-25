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

// Mapeamento COMPLETO de categoria → subcategoria padrão
const SUBCATEGORIAS = {
  politica: { nome: "Executivo", slug: "executivo" },
  economia: { nome: "Conjuntura & Focus", slug: "conjuntura" },
  negocios: { nome: "Geral", slug: "geral" },
  investimentos: { nome: "Renda Variável", slug: "renda-variavel" },
  seguros: { nome: "Geral", slug: "geral" },
  mercados: { nome: "Bolsa & Índices", slug: "bolsa-indices" },
  educacao: { nome: "Finanças Pessoais", slug: "financas-pessoais" },
  industria: { nome: "Geral", slug: "geral" },
  tecnologia: { nome: "IA & Dados", slug: "ia-dados" },
  esportes: { nome: "Geral", slug: "geral" },
  saude: { nome: "Geral", slug: "geral" },
  familia: { nome: "Orçamento", slug: "orcamento" },
  tributacao: { nome: "IRPF", slug: "irpf" },
  regulacao: { nome: "Financeiro", slug: "financeiro" },
  parcerias: { nome: "Geral", slug: "geral" },
  internacional: { nome: "Internacional", slug: "internacional" },
  geral: { nome: "Geral", slug: "geral" }
};

function detectCategoria(texto) {
  const t = texto.toLowerCase();
  if (/lula|stf|congresso|câmara|senado|governo federal|ministro|presidente|reforma|judiciário|partido|eleição|política/.test(t)) return "politica";
  if (/ibovespa|bolsa|dólar|pib|inflação|selic|copom|juros|banco central|economia|fiscal|orçamento|déficit/.test(t)) return "economia";
  if (/empresa|negócio|startup|mercado|empreend|fusão|aquisição|corporat/.test(t)) return "negocios";
  if (/renda fixa|tesouro direto|fundo de investimento|cdi|bitcoin|cripto|ação|carteira|dividendo/.test(t)) return "investimentos";
  if (/imposto|tributação|irpf|receita federal|tributário/.test(t)) return "tributacao";
  if (/regulação|anatel|anvisa|susep|ans|bacen|cvm|regulatório/.test(t)) return "regulacao";
  if (/seguro|proteção|apólice|sinistro|previdência privada|pgbl|vgbl/.test(t)) return "seguros";
  if (/saúde|médico|hospital|vacina|doença|tratamento|sus|plano de saúde/.test(t)) return "saude";
  if (/família|filho|educação|escola|criança|adolescente/.test(t)) return "familia";
  if (/tecnologia|inteligência artificial|ia |tech|software|hardware|iphone|samsung/.test(t)) return "tecnologia";
  if (/indústria|manufatura|produção|fábrica|industrial|agro|logística/.test(t)) return "industria";
  if (/futebol|nba|esporte|campeonato|clube|jogo|partida|atleta|olimpíada/.test(t)) return "esportes";
  if (/eua|estados unidos|china|europa|guerra|ucrânia|israel|trump|biden|internacional/.test(t)) return "internacional";
  return "geral";
}

const PROMPT = (data, text) => `Você é redator-chefe do portal O Valor Capital. Sua única tarefa é reescrever a notícia abaixo como uma matéria jornalística completa no padrão OVC.

ATENÇÃO: ESCREVA O TEXTO REAL, NÃO DESCREVA O QUE VAI ESCREVER. CADA PARÁGRAFO DEVE TER CONTEÚDO REAL SOBRE A NOTÍCIA.

FORMATO DE SAÍDA — copie exatamente esta estrutura, substituindo pelo conteúdo real:

TITULO: escreva aqui a manchete real com máximo 8 palavras e verbo obrigatório
SUBTITULO: escreva aqui uma frase direta de até 100 caracteres
CATEGORIA: escolha exatamente uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional
SUBCATEGORIA: escreva aqui a subcategoria específica
CORPO:
Redação OVC — ${data}

Escreva aqui o primeiro parágrafo com mínimo 4 frases. Abra com o fato mais impactante, número concreto ou contradição da notícia. Seja direto. Use linguagem de rua, não acadêmica. Prenda o leitor na primeira linha.

Escreva aqui o segundo parágrafo com mínimo 4 frases. Explique por que isso importa agora para o brasileiro. Conecte o fato ao dia a dia real — emprego, conta bancária, custo de vida, negócio. Sem enrolação.

Escreva aqui o terceiro parágrafo com mínimo 4 frases. Traga números, datas, nomes verificáveis da notícia. Dados concretos que comprovam o que foi dito. Cite a fonte original quando houver.

Escreva aqui o quarto parágrafo com mínimo 4 frases. Explique o histórico ou o que levou a este momento. O que aconteceu antes. Qual é o contexto que a maioria não sabe.

Escreva aqui o quinto parágrafo com mínimo 4 frases. Descreva o impacto prático. O que muda para o cidadão, empresa ou mercado a partir de agora. Seja específico — quem paga, quem ganha, quem perde.

Escreva aqui o sexto parágrafo com mínimo 4 frases. Quem reagiu e o que disse. Posições diferentes sobre o tema. Reproduza falas sem tomar partido. Deixe os fatos falarem.

Escreva aqui o sétimo parágrafo com mínimo 4 frases. Compare com situações anteriores ou com outros países. Coloque em perspectiva histórica ou internacional. Dê profundidade ao leitor.

Escreva aqui o oitavo parágrafo com mínimo 3 frases. Feche com uma tensão real, uma pergunta implícita ou uma consequência que ainda está em aberto. Não conclua. Deixe o leitor pensando.

#hashtag_relevante_1
#hashtag_relevante_2
#hashtag_relevante_3
#ovalorcapital

REGRAS INVIOLÁVEIS:
- O CORPO inteiro deve ter MÍNIMO 1.600 caracteres e MÁXIMO 2.200 caracteres — conte e ajuste
- São obrigatórios EXATAMENTE 8 parágrafos separados por linha em branco
- A primeira linha do CORPO deve ser sempre: Redação OVC — ${data}
- Linguagem direta, de rua, sem academicismo
- Voz editorial centro-direita nos fatos — fiscalização do Estado, liberdade econômica, família — nunca panfletária
- Frases curtas e médias alternadas. Ritmo jornalístico
- NUNCA use estas palavras: muralha, blindar, colapso, castelo, blueprint, catalisador, ecossistema, disruptivo, paradigma, sinergia, protagonista, robusto, resiliente, isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam, desafios e oportunidades, no bojo, no seio, à luz de, no âmbito, cabe ressaltar, é importante destacar, em linha com, pari passu, não por acaso, nesse sentido, pimenta amarga, mister, fulcral, hodierno, notadamente, outrossim

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

  // Fallback corpo
  if (!corpo) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = firstLine;
  }

  // Categoria: validar e usar detectCategoria como fallback
  const CATS_VALIDAS = ["politica","economia","negocios","investimentos","seguros","mercados",
    "educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao",
    "parcerias","internacional"];
  let categoria = CATS_VALIDAS.includes(categoriaRaw) ? categoriaRaw : detectCategoria(titulo + " " + corpo);

  // Subcategoria: usar o que a IA gerou, ou fallback padrão da categoria
  const subcategoriaDefault = SUBCATEGORIAS[categoria] || { nome: "Geral", slug: "geral" };
  const subcategoria = subcategoriaRaw || subcategoriaDefault.nome;
  const subcategoria_slug = subcategoriaRaw
    ? subcategoriaRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")
    : subcategoriaDefault.slug;

  return {
    titulo: titulo || "Sem título",
    subtitulo: subtitulo || "",
    categoria,
    subcategoria,
    subcategoria_slug,
    corpo
  };
}

export async function rewritePortal(text, title) {
  const prompt = PROMPT(hoje(), text);
  const raw = await callGemini(prompt);
  const result = parse(raw);
  if (!result || !result.corpo || result.corpo.length < 1500) {
    throw new Error("Conteúdo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }

  // Rejeitar lixo — título inválido
  const tituloLower = (result.titulo || "").toLowerCase().trim();
  const proibidos = ["prezado", "caro usuário", "olá", "atenção:", "aviso:", "dear", "hello", "editor"];
  if (proibidos.some(p => tituloLower.startsWith(p))) {
    throw new Error("Título inválido rejeitado: " + result.titulo);
  }
  if (!result.corpo.toLowerCase().includes("redação ovc")) {
    throw new Error("Sem assinatura Redação OVC");
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

