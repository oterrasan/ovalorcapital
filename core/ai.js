import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function rewrite(text) {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const prompt = `Você é redator sênior do portal O Valor Capital, veículo jornalístico brasileiro de alto nível. Reescreva a notícia abaixo no padrão OVC para Instagram.

RETORNE APENAS UM JSON VÁLIDO com esta estrutura exata, sem markdown, sem explicações:
{
  "tag_texto": "chamada hard em até 4 palavras, coerente com o conteúdo",
  "tag_tema": "um de: politica, crime, justica, corrupcao, economia, financas, mercado, sociedade, cultura, saude, educacao",
  "resumo_card": "resumo breve da matéria em até 12 palavras, objetivo e chamativo",
  "post": "texto completo do post para Instagram seguindo todas as regras abaixo",
  "comentario_fixado": "comentário agressivo e questionador, máximo 200 caracteres",
  "search_query": "termos em inglês para buscar imagem da pessoa ou instituição da matéria"
}

REGRAS DO POST:
1. Hook em CAIXA ALTA na primeira linha. Curto. Provocador. Sem sensacionalismo.
2. Corpo: prosa jornalística. Isenta. Profissional. Sem opinião. Fatos verificados. Sem negrito, sem listas. Parágrafos curtos. Frases curtas.
3. Máximo 1.500 caracteres no total.
4. Assinatura obrigatória: Redação OVC — ${hoje}
5. Hashtags: não óbvias, cada uma em linha separada, terminando com #ovalorcapital. Mínimo 4, máximo 6.

TERMOS ABSOLUTAMENTE PROIBIDOS:
comente aqui, comenta, isso reforça, isso expõe, isso mostra, isso revela, isso evidencia, isso demonstra, o fato expõe, o fato mostra, o fato revela, o fato evidencia, o fato demonstra, o caso expõe, o caso expõe a fragilidade, expõe a fragilidade, expõe a incompetência, expõe a falha, expõe o quanto, expõe como, vale ressaltar, vale destacar, vale lembrar, é importante destacar, é importante ressaltar, é fundamental, no contexto atual, no cenário atual, no cenário político, diante disso, diante desse cenário, em meio a, em meio ao, especialistas apontam, especialistas alertam, especialistas destacam, a situação evidencia, a situação demonstra, a situação reforça, não é à toa, não por acaso, chama atenção, chama a atenção, o episódio, o caso evidencia, o caso reforça, deixa claro, deixa evidente, traz à tona, coloca em xeque, acende um alerta, acende o sinal, é um sinal de, é um reflexo de, põe em dúvida, levanta questionamentos, merece atenção, merece reflexão, provoca debate, gera debate, abre debate, impacta diretamente, é preocupante, é alarmante, a medida visa, a proposta visa, segue sendo, continua sendo, ao longo dos anos, ao longo do tempo, historicamente, tradicionalmente, de forma significativa, de maneira significativa, cada vez mais, muito além, vai muito além, em última análise, em suma, em resumo

NOTÍCIA:
${text}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.7
  });

  let output = res.choices[0].message.content.trim();
  output = output.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(output);
    return {
      title: parsed.tag_texto || "",
      text: parsed.post || "",
      comentario_fixado: parsed.comentario_fixado || "",
      tag_texto: parsed.tag_texto || "",
      tag_tema: parsed.tag_tema || "sociedade",
      resumo_card: parsed.resumo_card || "",
      search_query: parsed.search_query || ""
    };
  } catch {
    // Fallback se JSON falhar
    return {
      title: output.split("\n")[0].slice(0, 80),
      text: output.slice(0, 1500),
      comentario_fixado: "",
      tag_texto: "",
      tag_tema: "sociedade",
      resumo_card: "",
      search_query: ""
    };
  }
}
