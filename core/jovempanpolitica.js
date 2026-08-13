// core/jovempanpolitica.js — Jovem Pan Política: captura de matérias da seção /politica/
//
// Mesma estrutura do Brasil ON (core/brasilon.js) — Roberto Terrasan, 12/08/2026:
// "vamos usar algumas das fontes que ja temos no pipe... fazer a reescrita com
// publicacao automatica, se consefuirmos raspar imagens e elas estiverem limpas
// sem logo, sem marca, sem nada. assim como no bacci." Depois: "tem que ser na
// jovem pan politica, o link certo é o que te mandei aqui agora" (apontando
// especificamente para https://jovempan.com.br/politica/, não o feed geral
// misturado de todas as categorias).
//
// Por que Jovem Pan e não uma fonte nova de fora do pipe: Jovem Pan já é fonte
// RSS aprovada do portal (core/rss.js, cats: brasil-on/politica/economia) —
// Roberto confirmou que editorialmente é "bem de direita". A automação aqui é
// um canal PARALELO e independente do RSS geral: em vez do artigo entrar na
// fila de aprovação via autoMaterias() com o MASTER_PROMPT (matéria longa,
// 4.000+ chars), esse canal publica direto, reescrita fiel ao tamanho da fonte,
// exatamente como o Brasil ON já faz para Bacci Notícias.
//
// CAPTURA — sem sitemap: testado ao vivo (12/08/2026) — jovempan.com.br NÃO
// tem sitemap_index.xml (404). Diferente da Bacci (WordPress+Yoast puro), a
// Jovem Pan usa outra estrutura de CMS. Único caminho viável confirmado:
// raspagem direta da seção https://jovempan.com.br/politica/ — testado com
// 16 links de matéria reais encontrados numa única carga da página.
//
// IMAGENS — testadas e confirmadas limpas (12/08/2026, 4 amostras reais
// verificadas visualmente + confirmação do próprio Roberto por print de
// tela): fotos hospedadas no próprio wp-content/uploads da Jovem Pan, sem
// logotipo nem marca d'água aplicada pela redação. Mesmo padrão da Bacci —
// por isso usa processAndSaveImage() com skipVision:true e watermarkLabel:''
// em api/run_portal.js, igual ao Brasil ON.
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto (mesmo
// espírito da regra em core/rss.js e core/brasilon.js).
import axios from "axios";

export const FONTES_JOVEMPAN_POLITICA = [
  { key: "jovempan-politica", nome: "Jovem Pan Política", homepage: "https://jovempan.com.br/politica/" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Páginas da seção que não são matéria de verdade (tags, paginação, etc).
const JOVEMPAN_EXCLUIR = /\/tag\/|\/page\/|\/autor\/|\/author\/|\/categoria\/|\/videos?\//i;

async function buscarJovempanPoliticaHomepage() {
  try {
    const res = await axios.get("https://jovempan.com.br/politica/", {
      timeout: 10000,
      headers: { "User-Agent": UA }
    });
    const html = String(res.data || "");
    const links = [...html.matchAll(/href="(https:\/\/jovempan\.com\.br\/politica\/[a-z0-9-]{15,}\/?)"/g)].map(m => m[1]);
    const unicos = [...new Set(links)].filter(l => !JOVEMPAN_EXCLUIR.test(l)).slice(0, 15);
    return unicos.map(link => ({
      link, source: "Jovem Pan Política", title: "", description: "", pubDate: new Date().toISOString()
    }));
  } catch (_) {
    return [];
  }
}

// Retorna candidatos da seção Política da Jovem Pan. Único caminho hoje é a
// raspagem direta (sem sitemap disponível) — ver comentário no topo do arquivo.
export async function buscarCandidatosJovempanPolitica() {
  return await buscarJovempanPoliticaHomepage();
}
