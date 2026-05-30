# Politica oficial de chaves de IA - O Valor Capital

Atualizado em 30/05/2026 por determinacao de Roberto Terrasan.

## Regra oficial

A unica chave de IA autorizada para o portal O Valor Capital e a chave OpenAI cadastrada como `OPENAI_API_KEY`.

Nenhuma outra chave, provedor ou fallback de IA deve ser usado no portal, no pipeline, no admin, em scripts de manutencao ou em workflows.

## Proibido

- Usar `GEMINI_API_KEY`.
- Usar `GROQ_API_KEY`.
- Usar `ANTHROPIC_API_KEY`.
- Usar `GOOGLE_API_KEY` para geracao editorial.
- Manter fallback automatico para Gemini, Groq ou outro provedor no fluxo editorial OVC.
- Registrar chave real em arquivo `.md`, codigo-fonte, commit, log, print ou comentario.

## Onde a chave deve existir

A chave real deve existir somente em ambiente seguro, como variavel/segredo de producao ou tabela segura de configuracao operacional.

Nome oficial obrigatorio:

```txt
OPENAI_API_KEY
```

## O que foi limpo

Em 30/05/2026, as chaves antigas de IA foram removidas do `config` do portal e a configuracao operacional foi padronizada para manter somente `OPENAI_API_KEY`.

## Observacao critica

Este documento nunca deve conter o valor real da chave. Se uma chave aparecer neste arquivo ou em qualquer arquivo do repositorio, ela deve ser considerada vazada, revogada imediatamente e substituida por uma nova.
