import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Feeds organizados por grupo de categoria — garante cobertura de todas as editorias
const FEEDS_POR_GRUPO = {
  politica: [
    { url: "https://g1.globo.com/politica/rss2.xml", name: "G1 Política" },
    { url: "https://news.google.com/rss/search?q=politica+governo+congresso+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Política" },
    { url: "https://www.correiobraziliense.com.br/rss/politica.xml", name: "Correio Brasiliense Política" },
  ],
  economia: [
    { url: "https://feeds.folha.uol.com.br/mercado/rss091.xml", name: "Folha Mercado" },
    { url: "https://www.valor.com.br/rss", name: "Valor Econômico" },
    { url: "https://news.google.com/rss/search?q=economia+brasil+pib+inflacao+juros&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Economia" },
  ],
  negocios_mercados: [
    { url: "https://www.infomoney.com.br/feed/", name: "Infomoney" },
    { url: "https://exame.com/feed/", name: "Exame" },
    { url: "https://epocanegocios.globo.com/rss/Feed.xml", name: "Época Negócios" },
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
    { url: "https://crescer.globo.com/rss2.xml", name: "Crescer" },
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
    { url: "https://g1.globo.com/pop-arte/rss2.xml", name: "G1 Cultura" },
    { url: "https://news.google.com/rss/search?q=cultura+arte+cinema+musica+teatro+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Cultura" },
    { url: "https://news.google.com/rss/search?q=variedades+entretenimento+comportamento+estilo+vida&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Variedades" },
    { url: "https://ge.globo.com/rss/ge.xml", name: "GE Esportes" },
  ],
  espiritualidade: [
    { url: "https://news.google.com/rss/search?q=espiritualidade+fe+religiao+igrejas+evangelico+catolicismo+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Espiritualidade" },
    { url: "https://www.vaticannews.va/pt/rss.xml", name: "Vatican News PT" },
  ],
  investigativo: [
    { url: "https://apublica.org/feed/", name: "Agência Pública" },
    { url: "https://news.google.com/rss/search?q=investigacao+corrupcao+denuncia+operacao+policia+federal&hl=pt-BR&gl=BR&ceid=BR:pt-BR", name: "Google Investigativo" },
  ],
};

// Busca 1-2 feeds de cada grupo — garante cobertura de todas as categorias
function selecionarFeedsBalanceados() {
  const selecionados = [];
  for (const grupo of Object.values(FEEDS_POR_GRUPO)) {
    // Escolhe 1 ou 2 feeds aleatórios do grupo
    const embaralhado = grupo.sort(() => Math.random() - 0.5);
    selecionados.push(...embaralhado.slice(0, 2));
  }
  return selecionados;
}

export async function getNews() {
  try {
    // Verificar se há fontes customizadas no Supabase (admin → Fontes RSS)
    const { data: sources } = await supabase
      .from("rss_sources")
      .select("url,name")
      .eq("active", true);

    // Fontes do admin têm prioridade — completar com os defaults balanceados
    const feedsCustom = sources?.length ? sources : [];
    const feedsDefault = selecionarFeedsBalanceados();

    // Combinar: custom primeiro, depois balanceados por categoria
    const todosFeed = [...feedsCustom, ...feedsDefault];

    // Buscar até 20 feeds em paralelo
    const feedsSelecionados = todosFeed.slice(0, 20);

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
    return allItems.sort(() => Math.random() - 0.5);

  } catch(e) {
    return [];
  }
}
