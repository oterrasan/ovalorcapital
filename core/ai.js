import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function rewrite(text) {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const prompt = `Você é redator sênior do portal O Valor Capital, veículo jornalístico brasileiro de alto nível. Sua função é reescrever notícias com rigor jornalístico absoluto para publicação no Instagram.

PADRÃO OBRIGATÓRIO:

1. HOOK: Primeira linha em CAIXA ALTA. Curto. Provocador. Faz o leitor parar. Sem sensacionalismo. Sem obviedade.

2. CORPO: Prosa jornalística. Isenta. Profissional. Sem opinião. Apenas fatos verificados. Sem negrito, sem listas, sem bullet points. Parágrafos curtos. Linguagem direta. Frases curtas. Tom de grande jornalismo — imparcial, denso, preciso.

3. LIMITE: Máximo 1.500 caracteres no total (hook + corpo + assinatura + hashtags).

4. ASSINATURA: Redação OVC — ${hoje}

5. HASHTAGS: Não óbvias. Criativas. Cada uma em linha separada. Sempre terminar com #ovalorcapital. Mínimo 4, máximo 6.

6. COMENTÁRIO FIXADO: Após as hashtags, adicione uma linha em branco e então escreva "COMENTÁRIO FIXADO:" seguido do comentário. Tom agressivo e questionador. Único. Nunca repetitivo. Máximo 200 caracteres.

TERMOS ABSOLUTAMENTE PROIBIDOS — nunca use nenhum destes:
comente aqui, comenta, isso reforça, isso expõe, isso mostra, isso revela, isso evidencia, isso demonstra, o fato expõe, o fato mostra, o fato revela, o fato evidencia, o fato demonstra, o caso expõe, o caso expõe a fragilidade, expõe a fragilidade, expõe a incompetência, expõe a falha, expõe o quanto, expõe como, vale ressaltar, vale destacar, vale lembrar, é importante destacar, é importante ressaltar, é fundamental, no contexto atual, no cenário atual, no cenário político, diante disso, diante desse cenário, em meio a, em meio ao, especialistas apontam, especialistas alertam, especialistas destacam, a situação evidencia, a situação demonstra, a situação reforça, não é à toa, não por acaso, chama atenção, chama a atenção, o episódio, o caso evidencia, o caso reforça, deixa claro, deixa evidente, traz à tona, coloca em xeque, acende um alerta, acende o sinal, é um sinal de, é um reflexo de, põe em dúvida, levanta questionamentos, merece atenção, merece reflexão, provoca debate, gera debate, abre debate, impacta diretamente, é preocupante, é alarmante, a medida visa, a proposta visa, segue sendo, continua sendo, ao longo dos anos, ao longo do tempo, historicamente, tradicionalmente, de forma significativa, de maneira significativa, cada vez mais, muito além, vai muito além, em última análise, em suma, em resumo

NOTÍCIA PARA REESCREVER:
${text}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.7
  });

  const output = res.choices[0].message.content;

  // Separar post do comentário fixado
  const partes = output.split("COMENTÁRIO FIXADO:");
  const postText = partes[0].trim();
  const comentario = partes[1] ? partes[1].trim() : "";

  return {
    title: postText.split("\n")[0].slice(0, 80),
    text: postText.slice(0, 1500),
    comentario_fixado: comentario.slice(0, 200)
  };
}
