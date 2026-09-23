// Validação real do fix — precisa: (a) REJEITAR o vídeo errado no
// artigo do Rick (o caso confirmado real), (b) continuar ACEITANDO
// vídeos legítimos nos outros artigos (não pode virar falso positivo
// generalizado).
import { descobrirPaginaVideoBacci } from "../../core/brasilon.js";

const casos = [
  { url: "https://baccinoticias.com.br/corpo-de-rick-e-liberado-pelo-iml-e-segue-para-sorocaba-veja-como-sera-despedida/", esperado: "REJEITAR (vídeo do dentista embutido por engano)" },
  { url: "https://baccinoticias.com.br/dentista-desaparece-apos-sair-para-entregar-protese-em-itu-familia-busca-respostas/", esperado: "ACEITAR (vídeo é do próprio caso do dentista)" },
  { url: "https://baccinoticias.com.br/corpo-de-bombeiros-detalha-buscas-por-helicoptero-que-estaria-rick-da-dupla-com-renner/", esperado: "ACEITAR (vídeo bate com o próprio artigo)" },
  { url: "https://baccinoticias.com.br/corpos-de-rick-e-outras-quatro-vitimas-de-queda-de-helicoptero-vao-para-florianopolis/", esperado: "null (sem widget de vídeo nesse artigo mesmo)" }
];

for (const c of casos) {
  const r = await descobrirPaginaVideoBacci(c.url);
  console.log(`${c.url}\n  esperado: ${c.esperado}\n  resultado real: ${JSON.stringify(r)}\n`);
}
