import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Feeds padrão por grupo de categoria — só usados se admin não tiver fontes cadastradas
const FEEDS_POR_GRUPO = {
  politica: [
    { url: "https://g1.globo.com/politica/rss2.xml", name: "G1 Política" },
    { url: "https://news.google.com/rss/search?q=politica+governo+congresso+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Política" },
  ],
  economia: [
    { url: "https://www.valor.com.br/rss", name: "Valor Econômico" },
    { url: "https://news.google.com/rss/search?q=economia+brasil+pib+inflacao+juros&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Economia" },
  ],
  negocios_mercados: [
    { url: "https://exame.com/feed/", name: "Exame" },
    { url: "https://news.google.com/rss/search?q=empresas+negocios+fusao+aquisicao+mercado&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Negócios" },
  ],
  seguros_investimentos: [
    { url: "https://www.seudinheiro.com/feed/", name: "Seu Dinheiro" },
    { url: "https://news.google.com/rss/search?q=seguro+vida+plano+saude+previdencia+privada&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Seguros" },
    { url: "https://news.google.com/rss/search?q=investimentos+renda+fixa+acoes+fundos+tesouro+direto&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Investimentos" },
    { url: "https://news.google.com/rss/search?q=SUSEP+ANS+seguradoras+corretoras+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google SUSEP ANS" },
  ],
  tributacao_regulacao: [
    { url: "https://news.google.com/rss/search?q=imposto+renda+reforma+tributaria+receita+federal&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Tributos" },
    { url: "https://news.google.com/rss/search?q=regulacao+BACEN+CVM+ANBIMA+regulador+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Regulação" },
  ],
  tecnologia_industria: [
    { url: "https://canaltech.com.br/rss/", name: "Canaltech" },
    { url: "https://news.google.com/rss/search?q=tecnologia+inteligencia+artificial+inovacao+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Tecnologia" },
    { url: "https://news.google.com/rss/search?q=industria+manufatura+producao+exportacao+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Indústria" },
  ],
  saude_familia: [
    { url: "https://g1.globo.com/saude/rss2.xml", name: "G1 Saúde" },
    { url: "https://news.google.com/rss/search?q=saude+medicina+tratamento+doenca+sus&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Saúde" },
    { url: "https://news.google.com/rss/search?q=familia+filhos+criancas+educacao+casamento+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Família" },
  ],
  educacao_profissoes: [
    { url: "https://g1.globo.com/educacao/rss2.xml", name: "G1 Educação" },
    { url: "https://news.google.com/rss/search?q=educacao+escola+universidade+enem+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Educação" },
    { url: "https://news.google.com/rss/search?q=profissoes+carreira+mercado+trabalho+salario+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Profissões" },
  ],
  vagas_concursos: [
    { url: "https://news.google.com/rss/search?q=vagas+emprego+contratacao+recrutamento+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Vagas" },
    { url: "https://news.google.com/rss/search?q=concurso+publico+edital+inscricoes+gabarito&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Concursos" },
  ],
  imoveis_parcerias: [
    { url: "https://news.google.com/rss/search?q=imoveis+mercado+imobiliario+lancamento+construtora&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Imóveis" },
    { url: "https://news.google.com/rss/search?q=parceria+acordo+alianca+joint+venture+empresa+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Parcerias" },
  ],
  esg_internacional: [
    { url: "https://news.google.com/rss/search?q=ESG+sustentabilidade+ambiental+social+governanca+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google ESG" },
    { url: "https://news.google.com/rss/search?q=internacional+geopolitica+exterior+diplomacia+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Internacional" },
  ],
  defesa_seguranca: [
    { url: "https://news.google.com/rss/search?q=forcas+armadas+defesa+nacional+exercito+marinha+aeronautica&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Defesa" },
    { url: "https://news.google.com/rss/search?q=seguranca+publica+policia+crime+violencia+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Segurança" },
  ],
  cultura_variedades_esportes: [
    { url: "https://news.google.com/rss/search?q=cultura+arte+cinema+musica+teatro+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Cultura" },
    { url: "https://news.google.com/rss/search?q=variedades+entretenimento+comportamento+estilo+vida&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Variedades" },
    { url: "https://ge.globo.com/rss/ge.xml", name: "GE Esportes" },
  ],
  espiritualidade: [
    { url: "https://news.google.com/rss/search?q=espiritualidade+fe+religiao+igrejas+evangelico+catolicismo+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Espiritualidade" },
  ],
  investigativo: [
    { url: "https://apublica.org/feed/", name: "Agência Pública" },
    { url: "https://news.google.com/rss/search?q=investigacao+corrupcao+denuncia+operacao+policia+federal&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Investigativo" },
  ],
};

// Seleciona 1-2 feeds aleatórios de cada grupo para cobertura balanceada
function selecionarFeedsBalanceados() {
  const selecionados = [];
  for (const grupo of Object.values(FEEDS_POR_GRUPO)) {
    const embaralhado = [...grupo].sort(() => Math.random() - 0.5);
    selecionados.push(...embaralhado.slice(0, 2));
  }
  return selecionados;
}

// Detecta títulos similares — evita artigos quase iguais da mesma rodada
function titulosSimilares(a, b) {
  const norm = t => (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return false;
  const intersect = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return (intersect / union) >= 0.45; // 45% de palavras em comum = similar demais
}

// Remove itens cujo título é muito parecido com um já selecionado
function dedupPorTitulo(items) {
  const unicos = [];
  for (const item of items) {
    if (!unicos.some(u => titulosSimilares(u.title, item.title))) {
      unicos.push(item);
    }
  }
  return unicos;
}

export async function getNews() {
  try {
    // Buscar TODAS as fontes do admin (ativas e inativas) para saber se o admin customizou
    const { data: allSources } = await supabase
      .from("rss_sources")
      .select("url,name,active")
      .order("created_at", { ascending: false });

    let feedsParaUsar;

    if (allSources && allSources.length > 0) {
      // Admin tem fontes cadastradas: usa SOMENTE as ativas, ignora hardcoded
      // Assim feeds pausados pelo admin são realmente excluídos
      feedsParaUsar = allSources.filter(s => s.active !== false);
    } else {
      // Sem fontes no admin: usa seleção balanceada dos defaults
      feedsParaUsar = selecionarFeedsBalanceados();
    }

    // Limitar a 20 feeds por chamada
    const feedsSelecionados = feedsParaUsar.slice(0, 20);

    const results = await Promise.allSettled(
      feedsSelecionados.map(source =>
        parser.parseURL(source.url)
          .then(feed => (feed.items || []).slice(0, 4).map(i => ({
            title: i.title,
            link: i.link || i.guid,
            source: source.name,
            description: i.contentSnippet || i.summary || i.description || i.content || ""
          })).filter(i => i.link && i.title))
          .catch(() => [])
      )
    );

    const allItems = results
      .filter(r => r.status === "fulfilled")
      .flatMap(r => r.value);

    // Embaralhar para variar categorias a cada chamada
    const embaralhado = allItems.sort(() => Math.random() - 0.5);

    // Deduplicar por título similar — elimina notícias quase iguais de fontes diferentes
    return dedupPorTitulo(embaralhado);

  } catch(e) {
    return [];
  }
}
