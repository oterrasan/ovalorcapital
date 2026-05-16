# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.
> **REGRA PERMANENTE:** Ao final de cada sessão, atualize este arquivo com tudo o que foi feito/planejado. O próximo Claude depende disso.

---

# 🚨🚨🚨 REGRA ZERO — INVIOLÁVEL — NUNCA NEGOCIÁVEL 🚨🚨🚨

## API/: MÁXIMO 10 ARQUIVOS. NUNCA MAIS QUE 10.

> Esta regra foi violada em 16/05/2026 causando build silencioso quebrado e um dia inteiro de caos.
> Roberto (dono) determinou esta regra múltiplas vezes. Ela é inviolável.

```
❌❌❌ PROIBIDO criar qualquer arquivo novo em api/ sem antes deletar um existente
❌❌❌ PROIBIDO ter mais de 10 arquivos em api/ EM QUALQUER MOMENTO
❌❌❌ PROIBIDO criar funções de uso único — cada arquivo DEVE servir 3 ou 4 finalidades
```

### Por que 10 e não 12 (o limite real do Vercel Hobby):
O limite do Hobby é 12. Ficamos no máximo de 12 por um dia e quando o agente criou um arquivo novo, chegou a 13 e o build quebrou silenciosamente. A margem de segurança obrigatória é 2 arquivos. **NUNCA ultrapassar 10.**

### Como consolidar quando precisar de nova funcionalidade:
- Utilitários de manutenção → dentro de `api/manage.js` (ação via `body.action`)
- Correções pontuais de banco → dentro de `api/manage.js`
- Regeneração de conteúdo → dentro de `api/run_portal.js` (ação via `?action=`)
- Scripts de diagnóstico → NUNCA no Vercel. Rodar local com Node.js direto no Supabase.

### Estado atual de api/ (12 arquivos — 2 acima do limite de 10, próximo a consolidar)
```
api/article.js        ← SSR artigos
api/category.js       ← SSR categorias
api/ig_publish.js     ← Instagram
api/institutional.js  ← SSR páginas institucionais
api/landing.js        ← SSR landing pages
api/live.js           ← SSR radar/tv/radio
api/manage.js         ← gestão, aprovação, status, newsletters
api/manual_post.js    ← geração manual de artigos
api/portal-posts.js   ← serve posts para frontend
api/refresh_token.js  ← renova token Instagram
api/run_portal.js     ← pipeline automático RSS→IA→banco
api/sitemap.js        ← sitemap dinâmico
```

### Consolidações pendentes (próxima sessão técnica)
- `api/refresh_token.js` (1.2KB, uso único mensal) → mover para dentro de `api/manage.js`
- `api/portal-posts.js` → avaliar fusão com `api/article.js`
- Meta: chegar a 10 arquivos

---

# 🚨 ALERTA VERCEL HOBBY PLAN

```
❌ NUNCA mais de 10 arquivos em api/ (limite real é 12, margem de segurança é 2)
❌ NUNCA usar maxDuration > 10 no vercel.json — Hobby plan máx é 10s
```

O Vercel não manda email de erro. O dashboard mostra deployment como "falhou" mas o site continua servindo o último deploy bem-sucedido. Parece que as mudanças não surtiram efeito. Isso ficou assim por ~1 semana em mai/2026 e causou o incidente de 16/05/2026.

---

# 🔴 REGRA NÚMERO 1 — TODA PÁGINA TEM SEO 100% COMPLETO

> Estabelecida pelo dono Roberto (Terrasan) em mai/2026. Nunca pode ser revertida.

### CHECKLIST OBRIGATÓRIO

```
✅ <title> único, descritivo, com keywords reais
✅ <meta name="description"> única, entre 120-160 chars
✅ <link rel="canonical"> sempre com www
✅ og:type, og:site_name, og:title, og:description, og:image, og:url, og:locale
✅ twitter:card, twitter:site, twitter:title, twitter:description, twitter:image
✅ JSON-LD schema (NewsArticle para artigos, CollectionPage para categorias)
✅ SSR — Googlebot recebe TODO o HTML sem JS
✅ URL com slug legível (nunca ?id=)
✅ Presente no sitemap.xml dinâmico
```

### PROIBIDO
```
❌ <title> com TITULO completo (65+ chars) — usar META_TITLE (≤55 chars) + " | O Valor Capital"
❌ Página sem canonical
❌ Canonical apontando para ?id=
❌ og:image ausente
❌ Cache-Control: no-cache em páginas de conteúdo
❌ Imagens salvas como JPEG — sempre WebP quality 82
❌ /admin/ indexado pelo Google
```

---

## ⚠️ VISÃO ESTRATÉGICA

Modelo de negócio: `300 artigos/dia → indexação massiva → tráfego orgânico → AdSense/AdX → receita`
Fonte de receita única: Google AdSense / Google AdX.

---

## ⛔ REGRAS SAGRADAS

1. **MAX 10 ARQUIVOS EM `api/`** — Ver Regra Zero no topo deste arquivo.
2. **SEO 100% COMPLETO EM TODA PÁGINA** — Ver Regra #1.
3. **Topo e rodapé do portal NUNCA mudam.**
4. **Pipeline publica direto como `publicado`** — nunca `pendente` sem fluxo de aprovação.
5. **URLs sempre com slug** — nunca `?id=`.
6. **SSR obrigatório** — Googlebot não pode depender de JS.
7. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico.
8. **300 artigos/dia sem falha.**
9. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar CLAUDE.md e BUGS_CORRIGIDOS.md e fazer push para main.
10. **NUNCA usar `p.categoria`** — não existe. Sempre usar `user_tags` (JSON array).
11. **NUNCA exigir strings fixas da IA no corpo** — ver Bug #7.
12. **`getNews()` sempre mistura feeds diretos garantidos.**
13. **Todo INSERT em `posts` usa `status:'publicado'`, `approved:true`, `published_at:now`** — ver Bug #13.
14. **`category.js` redireciona `?id=` para `/og?id=`** — ver Bug #14.
15. **`vc` e `colunistas` NÃO são categorias do pipeline.**
16. **Landing pages têm footer inline** — não usar `.footer-bottom`. Editar diretamente em `api/landing.js` `buildFooter()`.
17. **META_TITLE (≤55 chars) separado do TITULO.**
18. **NUNCA dar push direto para `main` sem revisão do diff** — ver incidente 16/05/2026.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação.

- **URL produção:** https://www.ovalorcapital.com.br
- **Dono:** Roberto Cesar Terrasan (oterrasan)
- **Stack:** Vercel (serverless — plano Hobby, 12 funções máx, 10s máx), Supabase (PostgreSQL + Storage), React (admin via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital` — branch `main` (Vercel deploya em ~2 min após push)
- **Instagram:** 2,6M views/mês
- **Contato:** contato@ovalorcapital.com.br → betoterrasan@gmail.com
- **Endereço:** Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000

---

## 2. ARQUITETURA

### APIs — 12 ARQUIVOS ATUAIS (REDUZIR PARA 10 NA PRÓXIMA SESSÃO)

| Arquivo | Funções que atende |
|---|---|
| `api/article.js` | SSR artigos por slug URL |
| `api/category.js` | SSR listagem de categorias |
| `api/ig_publish.js` | Publica Instagram via Playwright |
| `api/institutional.js` | SSR /quem-somos/ e /politica-editorial/ |
| `api/landing.js` | SSR landing pages temáticas |
| `api/live.js` | SSR radar, tv-ovc, radio-ovc, dados, cotações |
| `api/manage.js` | Status, aprovação, track_view, newsletter |
| `api/manual_post.js` | Geração manual de artigos via URL |
| `api/portal-posts.js` | Serve posts publicados para frontend |
| `api/refresh_token.js` | Renova token Instagram (mensal) |
| `api/run_portal.js` | Pipeline RSS→scrape→IA→banco + `?action=regenerar` |
| `api/sitemap.js` | Sitemap dinâmico |

> ⚠️ Antes de criar qualquer arquivo em api/, deletar um existente. Máximo absoluto: 10 arquivos.

### Core
| Arquivo | Função |
|---|---|
| `core/rss.js` | 240+ feeds RSS em 16 grupos + feeds diretos garantidos |
| `core/scraper.js` | Extrai texto (3 camadas: p → div → og:meta) |
| `core/ai_portal.js` | Prompt OpenAI → META_TITLE, TITULO, CORPO em HTML, etc. |
| `core/image_finder.js` | Busca imagem relevante (timeout 10s) |
| `core/image_processor.js` | Processa → WebP quality 82 → Supabase Storage |

### Frontend
- `public/index.html` — homepage (302KB — não editar via MCP)
- `public/[categoria]/index.html` — 29+ páginas de categoria
- `public/admin/index.html` — painel admin
- `public/js/newsletter-bar.js` — injeta newsletter bar + patcha footer
- `public/robots.txt` — bloqueia /admin/

---

## 3. SISTEMA DE URLs

```
/{categoria}/{slug-do-titulo}-{id8}/
Exemplo: /politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```

- `id8` = primeiros 8 chars do UUID do Supabase
- `slug` = `slugify(titulo).slice(0,55)`
- **Nunca usar `?id=`**
- **Canonical sempre com www**

---

## 4. BANCO DE DADOS

### Tabela `posts`
```
id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash,
status ('pendente' ou 'publicado'), approved, publish_method,
user_tags (TEXT — JSON array: '["politica"]'),
subcategoria, subcategoria_slug, created_at, published_at,
metrics (JSON: {foco_keyword, seo_slug, meta_descricao, meta_title, views}),
priority, retry_count, max_retries
```

**CRÍTICO:** `user_tags` é TEXT (não JSONB). Sempre `.like()`, nunca `.contains()`.
**CRÍTICO:** Não existe coluna `categoria`. Sempre usar `user_tags`.
**CRÍTICO:** `comentario_fixado` = meta description.
**CRÍTICO:** `metrics.meta_title` = título SEO ≤55 chars para `<title>`.

### Tabela `config`
| Chave | Descrição |
|---|---|
| `AUTOMATION` | `"on"` ou `"off"` — liga/desliga pipeline |
| `MAX_POSTS_DIA` | Limite diário (padrão: `"300"`) |
| `POSTS_01_06` … `POSTS_17_00` | Máx posts por faixa horária |
| `YOUTUBE_LIVE_URL` | URL embed YouTube para OVC TV |

---

## 5. CATEGORIAS

### Válidas no pipeline (27 slugs)
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades,
investigativo, seguranca, cultura, profissoes, vagas,
concursos, imoveis, esg, defesa, religiao
```

### Reservadas (NÃO usar no pipeline)
```
vc, colunistas — apenas conteúdo manual
```

### Landing pages
| URL | Categorias |
|---|---|
| `/vc/` | investigativo, variedades, cultura |
| `/trabalho/` | vagas, concursos, profissoes, parcerias, educacao |
| `/financas/` | investimentos, seguros, tributacao, regulacao, mercados |
| `/moradia/` | imoveis |
| `/seguranca/` | seguranca, defesa, investigativo |
| `/bem-estar/` | saude, familia, cultura, religiao, esg |

---

## 6. PIPELINE DE AUTOMAÇÃO

```
GitHub Actions → POST /api/run_portal a cada 2 minutos
body: {"count":1} — sem force
Janela: 07:00–01:00 BRT
Fluxo: getNewsByCategoria() + getNews() → scrape() → rewritePortal() → validar() → salva como publicado
```

### Parâmetros
```js
body.force = true     // bypassa verificação de horário
body.count = N        // artigos a gerar (máx 8, padrão 1)
body.categoria        // forçar categoria
body.subcategoria     // forçar subcategoria
?action=regenerar     // regenerar artigos com markdown das últimas 48h (Vercel Pro apenas)
```

### Diagnóstico
```
{"status":"ok"}            → artigo gerado
{"status":"no_news"}       → RSS vazio
{"status":"no_valid_news"} → RSS retornou itens mas todos falharam
{"status":"fora_horario"}  → fora da janela 07:00-01:00 BRT
{"status":"error"}         → exceção
```

Se `no_news` não tiver campo `ts`: **código novo não deployou** → verificar limite de funções/maxDuration.

---

## 7. META_TITLE

`core/ai_portal.js` gera `META_TITLE` ≤55 chars. `api/run_portal.js` salva em `metrics.meta_title`. `api/article.js` usa no `<title>` → `metaTitleRaw + " | O Valor Capital"`. `og:title` e JSON-LD usam o TITULO completo.

---

## 8. PÁGINAS INSTITUCIONAIS

- `/quem-somos/` e `/politica-editorial/` → `api/institutional.js`
- Responsável: Roberto Cesar Terrasan
- Email display: `contato@ovalorcapital.com.br` → href: `betoterrasan@gmail.com`

---

## 9. FOOTER

- **Categorias e homepage:** `newsletter-bar.js` injeta + patcha
- **Landing pages:** footer inline em `api/landing.js` `buildFooter()` — editar direto lá

---

## 10. SEO — STATUS

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs | `api/article.js` + `vercel.json` | ✅ |
| SSR artigos | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| META_TITLE ≤55 chars | `api/article.js` + `core/ai_portal.js` | ✅ |
| Meta description artigos | `api/article.js` | ✅ |
| SSR categorias (29) | `api/category.js` | ✅ |
| SSR landing pages | `api/landing.js` | ✅ |
| SSR institucionais | `api/institutional.js` | ✅ |
| WebP quality 82 | `core/image_processor.js` | ✅ |
| robots.txt | `public/robots.txt` | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| Canonical www | Todos handlers SSR | ✅ |

### Ações pendentes (Roberto faz manualmente)
1. Search Console → submeter sitemap.xml
2. AdSense → verificar aprovação
3. Google Publisher Center → cadastrar portal
4. Quando ovalorcapital@gmail.com ativado → atualizar `EMAIL_REAL` em `api/institutional.js`

---

## 11. BUGS CORRIGIDOS — RESUMO

Documentação completa em `BUGS_CORRIGIDOS.md`.

| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| 1 | `</script>` em JSON → página branca | `api/article.js` | ✅ |
| 2 | `isHoje()` rejeita itens sem data | `core/rss.js` | ✅ |
| 3 | Feeds gerais misturados na geração forçada | `api/run_portal.js` | ✅ |
| 4 | Subcategoria "Geral" salva no banco | `api/run_portal.js` | ✅ |
| 5 | targetCount=1, pool=40, sem dedup | `api/run_portal.js` | ✅ |
| 6 | Sem faixas horárias | `api/run_portal.js` | ✅ |
| 7 | validar() exigia 'redação ovc' | `api/manage.js` | ✅ |
| 8 | forcarExecucao() enviava GET | `automacao.html` | ✅ |
| 9 | p.categoria inexistente | `automacao.html` | ✅ |
| 10 | getNews() fallback usava GN | `core/rss.js` | ✅ |
| 11 | Scraper só `<p>` | `core/scraper.js` | ✅ |
| 12 | no_news persistente | `core/rss.js` | ✅ |
| 13 | Pipeline salvava como pendente | `run_portal.js` + `manage.js` | ✅ |
| 14 | Links ?id= abriam categoria vazia | `api/category.js` | ✅ |
| 15 | /vc/ mostrava conteúdo sem sentido | `api/landing.js` | ✅ |
| 16 | Footer landing sem copyright/links | `api/landing.js` | ✅ |
| 17 | Build Vercel falhando silenciosamente | `vercel.json` + `api/` | ✅ 14/05/2026 |
| 18 | Prompt gerava markdown em vez de HTML | `core/ai_portal.js` | ✅ 16/05/2026 |
| 19 | Agente criou 13º arquivo em api/ → build quebrado | `api/corrigir-markdown-hoje.js` deletado | ✅ 16/05/2026 |

---

## 12. COMO RETOMAR EM NOVA SESSÃO

1. **Ler este arquivo completamente**
2. Ler `BUGS_CORRIGIDOS.md`
3. **CONTAR os arquivos em `api/`** — se tiver mais de 10, parar e consolidar antes de qualquer coisa
4. **NUNCA adicionar maxDuration > 10 no vercel.json**
5. Checklist SEO em toda página nova
6. Verificar GitHub Actions rodando
7. **Ao terminar:** atualizar CLAUDE.md + BUGS_CORRIGIDOS.md e fazer push para main
8. **Ler `INCIDENTE_16_05_2026.md`** — entender o que foi quebrado em 16/05 e se os artigos já foram corrigidos

---

## 13. CONTATO

- **Nome:** Roberto Cesar Terrasan
- **Objetivo:** maior portal premium de notícias do Brasil
- **Perfil técnico:** não é programador — implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais. Não quer links nem status — quer feito e funcionando.
- **Comunicação:** português, direto ao ponto
- **NUNCA perguntar** coisas óbvias sobre infraestrutura que claramente está no ar

---

## 14. HISTÓRICO DE SESSÕES

### Sessão mai/2026 — Rodada 1
- isRecente, catForcada, subcatForcada (Bugs #2, #3, #4)
- validar() Bug #7, automacao.html Bugs #8, #9
- scraper 3 camadas Bug #11, getNews() fallback Bugs #10, #12
- faixas horárias Bug #6

### Sessão mai/2026 — Rodada 2 (14/mai/2026)
- Bug #13: pipeline e manage.js salvam como publicado
- Bug #14: category.js redireciona ?id=

### Sessão mai/2026 — Rodada 3 (14/mai/2026)
- robots.txt, WebP, META_TITLE, institutional.js, vercel.json, newsletter-bar.js
- Bug #15: /vc/ cats corrigidas
- Bug #16: buildFooter() com copyright 2026

### Sessão mai/2026 — Rodada 4 (14/mai/2026) — BUG #17 CRÍTICO
- Build Vercel falhando silenciosamente por ~1 semana
- Causa: maxDuration:60 (Hobby máx 10s) + 20 arquivos em api/ (Hobby máx 12)
- Correção: deletados 8 arquivos, vercel.json limpo, rss.js restaurado

### Sessão 16/05/2026 — INCIDENTE GRAVE
- Agente alterou `core/ai_portal.js` sem autorização → prompt passou a gerar markdown
- Admin derrubado (public/admin/index.html sobrescrito com placeholder)
- Centenas de artigos gerados com markdown bruto, conteúdo raso
- Tentativas de correção criaram 13º arquivo em api/ → build quebrado novamente
- **Estado ao final do dia:**
  - Prompt corrigido (gera HTML desde 22:07 UTC)
  - Build corrigido (13º arquivo deletado)
  - **Artigos quebrados de 07:00–22:07 BRT permanecem no banco — precisam ser corrigidos**
  - Ver `INCIDENTE_16_05_2026.md` para SQL de correção
