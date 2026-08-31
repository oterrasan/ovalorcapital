# Política oficial de chaves de IA — O Valor Capital

Atualizado em 31/08/2026 por determinação de Roberto Terrasan.
Substitui integralmente a versão anterior (24/08/2026), que ainda documentava Groq como fallback oficial — Roberto decidiu remover Groq também: **"remova tudo que tiver de chaves, só devem ficar as do gemini, as outras nem usamos mais."**

## Regra oficial

O motor de IA oficial e **único** do portal O Valor Capital é o **Google Gemini**, modelo `gemini-flash-lite-latest`.

**Não existe mais nenhum fallback pra outro provedor.** Se o Gemini falhar (as duas chaves esgotadas, 429/503 persistente), a chamada propaga o erro — não cai mais em OpenAI nem em Groq.

**A OpenAI está morta e não deve ser usada nem sugerida.** A chave está sem crédito (429 "no credits remaining"), a chave hardcoded de emergência que existia em `core/ai_portal.js` foi removida (estava revogada, 401), e Roberto decidiu, de forma definitiva, ignorá-la — nunca mais oferecer OpenAI como solução, mesmo em cenário de emergência.

**O Groq também foi removido por completo em 31/08/2026** — chegou a ser integrado como segundo fallback real (16-30/08/2026, várias correções de TPM/modelo/markdown documentadas no histórico de `core/ai_portal.js`), mas Roberto decidiu que o sistema deve rodar só com Gemini.

## Onde as chaves reais vivem

- `GEMINI_API_KEY` e `GEMINI_API_KEY_2` — tabela `config` do Supabase, lidas em runtime por `_getGeminiKeys()` (`core/ai_portal.js`). As duas chaves parecem compartilhar o mesmo projeto Google Cloud (dividem o mesmo pool de cota, não somam).
- Nenhuma chave real deve ser commitada em `.md`, código-fonte, log, print, comentário ou workflow do GitHub Actions. GitHub tem secret-scanning ativo e já bloqueou pushes com chave em texto puro e em base64 nesta sessão.
- Se Roberto quiser mais capacidade grátis, o caminho já confirmado funcionando é criar mais projetos/contas Google novos no AI Studio (não só chave nova na mesma conta — não soma cota) e adicionar como `GEMINI_API_KEY_3`, `_4`, etc. — `_getGeminiKeys()` já busca dinamicamente até `GEMINI_API_KEY_20`, plugam sozinhas sem novo deploy.

## Ordem de chamada em produção (`callIA()`, `core/ai_portal.js`)

```
Gemini (key1) → Gemini (key2, se 429/503) → [FIM — propaga o erro, sem fallback pra outro provedor]
```

- Gemini tem retry automático em 429 (troca de chave) e 503 (espera 2s e tenta de novo).
- Gemini tem gate de orçamento diário interno (`GEMINI_DAILY_BUDGET`) só pra evitar gastar tempo de execução em chamadas fadadas a falhar — não é uma alegação sobre o teto real do Google, que segue sendo confirmado só por teste direto, nunca por suposição.

## Histórico da mudança

- 30/05/2026: política original travava o sistema em `OPENAI_API_KEY` exclusiva, proibindo Gemini/Groq.
- 15-16/08/2026: crise real — `gemini-2.0-flash` (modelo em uso até então) foi descontinuado pelo Google (404 "no longer available"), e ao mesmo tempo a OpenAI (fallback da época) ficou sem crédito. As duas engines caíram juntas, portal ficou 24h+ sem gerar nenhum conteúdo em nenhum canal.
- 17/08/2026: testado e confirmado que `gemini-flash-lite-latest` tem quota diária maior que os outros modelos Flash do free tier (44 chamadas reais sem bater 429 diário, contra 20/dia confirmado nos outros). Groq integrado como fallback real (~16-19/08/2026), com vários ajustes de TPM/modelo/markdown ao longo dos dias seguintes.
- 24/08/2026: Roberto confirma "esquece OpenAI, só Gemini e Groq" — OpenAI proibida, Groq mantido como fallback.
- 31/08/2026: Roberto vai além e remove Groq também — **"remova tudo que tiver de chaves, só devem ficar as do gemini, as outras nem usamos mais"**. `_getGroqKey()`, `_callGroq()` e `_sanitizarMarkdownGroq()` deletados de `core/ai_portal.js`; `callIA()` virou um passthrough direto pra `callGemini()`, sem try/catch de fallback. `OPENAI_KEY`/`analyzeImageVision()` (GPT-4o-mini) também removidos de `core/image_processor.js` — já estavam mortos na prática (sem chave configurada, sempre fail-open). Workflow `.github/workflows/sync_ai_keys.yml` (que ativamente sincronizava `OPENAI_API_KEY` pra Vercel e removia `GEMINI_API_KEY` de lá) deletado por completo.

## Regras invioláveis

```
❌ NUNCA sugerir OpenAI ou Groq como solução, fallback de emergência ou alternativa —
   mesmo que pareça a saída mais rápida num incidente. Decisão de Roberto é definitiva.
❌ NUNCA registrar valor real de chave (Gemini ou qualquer outra) em nenhum arquivo
   do repositório — `.md`, código, comentário, workflow, log. Se aparecer, é vazamento:
   revogar imediatamente e trocar por chave nova.
❌ NUNCA reduzir GEMINI_DAILY_BUDGET nem alterar o modelo Gemini em uso sem testar até
   EXAURIR a cota real em produção — nome de modelo "parecido" não garante o mesmo teto.
✅ Se o Gemini falhar (as duas chaves): é prioridade máxima de investigação, igual a
   qualquer automação parada — nunca aceitar "generated:0" como resposta final sem
   confirmar causa real e provar correção com evidência em produção. Sem fallback
   automático, um erro real de Gemini agora derruba o canal até ser corrigido — não
   fica mascarado atrás de outro provedor como acontecia antes.
✅ Se Roberto pedir mais capacidade: a saída é mais projetos Google (GEMINI_API_KEY_3
   em diante), nunca reintroduzir OpenAI/Groq por conta própria.
```
