# Política oficial de chaves de IA — O Valor Capital

Atualizado em 24/08/2026 por determinação de Roberto Terrasan.
Substitui integralmente a versão anterior (30/05/2026), que ficou obsoleta e conflitante com a realidade do sistema desde a crise de 15-17/08/2026.

## Regra oficial

O motor de IA oficial e único do portal O Valor Capital é o **Google Gemini**, modelo `gemini-flash-lite-latest`.

O fallback oficial, usado quando o Gemini falha (orçamento diário esgotado, 429, 503), é o **Groq**, modelo `openai/gpt-oss-120b`.

**A OpenAI está morta e não deve ser usada nem sugerida.** A chave está sem crédito (429 "no credits remaining"), a chave hardcoded de emergência em `core/ai_portal.js` está revogada (401), e Roberto decidiu, de forma definitiva, ignorá-la — nunca mais oferecer OpenAI como solução, mesmo em cenário de emergência.

## Onde as chaves reais vivem

- `GEMINI_API_KEY` e `GEMINI_API_KEY_2` — tabela `config` do Supabase, lidas em runtime por `_getGeminiKeys()` (`core/ai_portal.js`). As duas chaves parecem compartilhar o mesmo projeto Google Cloud (dividem o mesmo pool de cota, não somam).
- `GROQ_API_KEY` — tabela `config` do Supabase, lida em runtime por `_getGroqKey()` (`core/ai_portal.js`).
- Nenhuma chave real deve ser commitada em `.md`, código-fonte, log, print, comentário ou workflow do GitHub Actions. GitHub tem secret-scanning ativo e já bloqueou pushes com chave em texto puro e em base64 nesta sessão.

## Ordem de fallback em produção (`callIA()`, `core/ai_portal.js`)

```
Gemini (key1) → Gemini (key2, se 429/503) → Groq (openai/gpt-oss-120b) → [FIM — nunca tenta OpenAI]
```

- Gemini tem retry automático em 429 (troca de chave) e 503 (espera 2s e tenta de novo).
- Gemini tem gate de orçamento diário interno (`GEMINI_DAILY_BUDGET`) só pra evitar gastar tempo de execução em chamadas fadadas a falhar — não é uma alegação sobre o teto real do Google, que segue sendo confirmado só por teste direto, nunca por suposição.
- Groq tem teto real medido de ~100.000 tokens/dia (não os 14.400 requisições/dia anunciados na documentação pública — esse número é sobre contagem de chamadas, não sobre volume de texto).

## Histórico da mudança (por que a política antiga caiu)

- 30/05/2026: política original travava o sistema em `OPENAI_API_KEY` exclusiva, proibindo Gemini/Groq.
- 15-16/08/2026: crise real — `gemini-2.0-flash` (modelo em uso até então) foi descontinuado pelo Google (404 "no longer available"), e ao mesmo tempo a OpenAI (fallback da época) ficou sem crédito. As duas engines caíram juntas, portal ficou 24h+ sem gerar nenhum conteúdo em nenhum canal.
- 17/08/2026: testado e confirmado que `gemini-flash-lite-latest` tem quota diária maior que os outros modelos Flash do free tier (44 chamadas reais sem bater 429 diário, contra 20/dia confirmado nos outros). Groq integrado como segundo fallback real.
- Nessa mesma janela, Roberto decidiu formalmente: **"esquece OpenAI, vamos trabalhar só com Gemini"** — reafirmado em 24/08/2026 como decisão definitiva, incluindo o fallback Groq.

## Regras invioláveis

```
❌ NUNCA sugerir OpenAI como solução, fallback de emergência ou alternativa — mesmo que
   pareça a saída mais rápida num incidente. Decisão de Roberto é definitiva.
❌ NUNCA registrar valor real de chave (Gemini, Groq ou qualquer outra) em nenhum arquivo
   do repositório — `.md`, código, comentário, workflow, log. Se aparecer, é vazamento:
   revogar imediatamente e trocar por chave nova.
❌ NUNCA reduzir GEMINI_DAILY_BUDGET nem alterar o modelo Gemini/Groq em uso sem testar até
   EXAURIR a cota real em produção — nome de modelo "parecido" não garante o mesmo teto.
✅ Se as duas engines (Gemini + Groq) falharem ao mesmo tempo: é prioridade máxima de
   investigação, igual a qualquer automação parada — nunca aceitar "generated:0" como
   resposta final sem confirmar causa real e provar correção com evidência em produção.
```
