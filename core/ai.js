import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function rewrite(text) {
  const prompt = `
Reescreva:

- até 1500 caracteres
- até 8 parágrafos
- linguagem jornalística
- não citar fonte

Finalize com:
Redação OVC
${new Date().toLocaleDateString("pt-BR")}

Texto:
${text}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const output = res.choices[0].message.content;

  return {
    title: output.split("\n")[0].slice(0, 80),
    text: output.slice(0, 1500)
  };
}
