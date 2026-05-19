# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.
> **REGRA PERMANENTE:** Ao final de cada sessão, atualize este arquivo com tudo o que foi feito/planejado. O próximo Claude depende disso.

---

# ══════════════════════════════════════════════════════
# 🚨🚨🚨 REGRAS ABSOLUTAMENTE INVIOLÁVEIS 🚨🚨🚨
# ══════════════════════════════════════════════════════

## ❌ REGRA ZERO-A — MAX 10 ARQUIVOS EM `api/` — NUNCA MAIS QUE 10

> Esta regra foi violada em 16/05/2026 causando build silencioso quebrado e um dia inteiro de caos.
> Roberto (dono) determinou esta regra dezenas de vezes. É inviolável.

```
❌❌❌ PROIBIDO criar qualquer arquivo novo em api/ sem antes deletar um existente
❌❌❌ PROIBIDO ter mais de 10 arquivos em api/ EM QUALQUER MOMENTO
❌❌❌ PROIBIDO criar funções de uso único — cada arquivo DEVE servir 3+ finalidades
❌❌❌ PROIBIDO atingir 11, 12 ou mais — nem que seja por 1 commit
```

**Por que 10 e não 12 (o limite real do Vercel Hobby):**
O limite do Hobby é 12. Quando chegamos a 12 e o agente criou mais 1, foi para 13 e o build quebrou silenciosamente sem aviso nenhum. A margem de segurança obrigatória é 2 arquivos. NUNCA ultrapassar 10.

**Como adicionar nova funcionalidade sem criar arquivo:**
- Utilitários/manutenção/correções de banco → `api/manage.js` (ação via `body.action`)
- Regeneração/processamento de conteúdo → `api/run_portal.js` (ação via `?action=`)
- Scripts de diagnóstico → NUNCA no Vercel. Rodar local com Node.js direto no Supabase.
- Qualquer outra coisa → avaliar fusão com arquivo existente antes de criar novo

---

## ❌ REGRA ZERO-B — NUNCA TOCAR NO PROMPT DE IA SEM AUTORIZAÇÃO EXPLÍCITA DO DONO

> O prompt em `core/ai_portal.js` foi definido e aprovado pelo dono Roberto após semanas de iteração.
> Alterar sem autorização causou centenas de artigos quebrados em 16/05/2026.

```
❌❌❌ PROIBIDO alterar core/ai_portal.js sem aprovação verbal explícita de Roberto
❌❌❌ PROIBIDO mudar o formato de saída (HTML, markdown, estrutura de campos)
❌❌❌ PROIBIDO mudar parâmetros da OpenAI (model, temperature, max_tokens)
❌❌❌ PROIBIDO mudar a system message
❌❌❌ PROIBIDO "melhorar" o prompt por iniciativa própria
```

**O comentário no código deixa claro:**
```js
// PROMPT OFICIAL OVC — TRAVADO EM PRODUÇÃO — NÃO ALTERAR SEM AUTORIZAÇÃO
```

**Prompt atual (aprovado pelo dono em 17/05/2026):**
- Estilo: Reuters/Bloomberg, jornalístico sênior
- SEO: Google News + Google Discover
- Formato de saída: HTML puro (nunca markdown)
- META_DESCRICAO: 141–155 chars
- Parágrafos: máx 3 frases (MobileUX)
- Jargão proibido: 21 termos listados
- Gancho final proibido (ex: "Acompanhe o portal...")
- gpt-4o-mini, temperature 0.3, max_tokens 8192

---

## ❌ REGRA ZERO-C — NUNCA DAR PUSH PARA MAIN SEM REVISAR O DIFF

```
❌❌❌ PROIBIDO push em api/ sem antes listar os arquivos de api/ e contar quantos são
❌❌❌ PROIBIDO push em core/ai_portal.js sem aprovação do dono
❌❌❌ PROIBIDO push que sobrescreva public/admin/index.html (admin crítico)
❌❌❌ PROIBIDO push que sobrescreva public/index.html (302KB — homepage crítica)
```

---

## ❌ REGRA ZERO-D — STAGING PROTOCOL ATIVO (Block 6 — 17/05/2026)

```
✅ Pipeline automático salva: status:'pendente', approved:false (SEM published_at)
✅ Aprovação humana obrigatória antes de publicar — via admin > Postagens > filtro 'pendente'
❌ NUNCA alterar de volta para publicado+approved:true no pipeline sem autorização de Roberto
```

> Esta regra foi originalmente "SEMPRE publicado+approved:true" (mai/2026).
> Foi invertida pelo Block 6 do MASTER_ARCHITECTURAL_BLUEPRINT em 17/05/2026 a pedido de Roberto.
> O admin já tem: badge de notificação no sidebar, filtro 'pendente', botão 'Publicar no Portal'.
> Posts manuais (handleManual) CONTINUAM salvando como publicado — só o pipeline automático virou pendente.

---

## 🚨❌ REGRA ZERO-E — O PORTAL NUNCA PODE FICAR OFFLINE — JAMAIS

> **INCIDENTE 18/05/2026:** Um merge de PR destruiu 734 linhas do `public/index.html`, deixando a homepage com 1 linha de conteúdo. O portal ficou completamente fora do ar. Roberto ficou furioso. NUNCA MAIS.

```
❌❌❌ PROIBIDO fazer push de public/index.html para main sem verificar que o arquivo tem 700+ linhas
❌❌❌ PROIBIDO fazer merge de qualquer PR que altere public/index.html em mais de 50 linhas sem revisar o diff completo
❌❌❌ PROIBIDO usar agentes/subagents para push de arquivos HTML críticos (eles podem enviar base64 em vez de HTML)
❌❌❌ PROIBIDO resolver merge conflict em public/index.html automaticamente — sempre revisar manualmente
❌❌❌ PROIBIDO deixar qualquer arquivo crítico com conteúdo inválido no main, mesmo por 1 minuto
```

**Arquivos críticos que NUNCA podem ser corrompidos em main:**
- `public/index.html` — homepage (302KB, 741 linhas) → NUNCA pode ter menos de 700 linhas
- `public/admin/index.html` — painel admin
- `api/article.js` — SSR de artigos
- `api/portal-posts.js` — feed de posts
- `vercel.json` — configuração de deploy

**Protocolo obrigatório antes de qualquer push que toque public/index.html:**
1. Verificar número de linhas do arquivo: deve ser ≥700
2. Verificar que começa com `<!DOCTYPE html>` e termina com `</html>`
3. Verificar que o diff NÃO mostra centenas de linhas deletadas
4. Se o diff mostrar -100 linhas ou mais: PARAR e investigar antes de fazer o push

**Como o incidente aconteceu (18/05/2026):**
- PR #44 tinha um merge conflict em `public/index.html`
- A resolução do conflito apagou 734 linhas (o conteúdo inteiro), deixando só 1 linha
- O commit foi para main sem revisão do diff
- Portal ficou offline imediatamente
- Dois agentes de restauração subsequentes enviaram base64 em vez de HTML (bug de subagent)
- Levou ~40 minutos para restaurar completamente

**Lição:** Nunca confiar em agentes para push de arquivos binários ou HTML de grande porte. Sempre usar `mcp__github__create_or_update_file` diretamente com o conteúdo literal — nunca via subagent.

---

# ══════════════════════════════════════════════════════
# 🚨 ALERTA VERCEL HOBBY PLAN
# ══════════════════════════════════════════════════════

```
❌ NUNCA mais de 10 arquivos em api/ (limite real 12, margem segurança 2)
❌ NUNCA maxDuration > 10 no vercel.json (Hobby máx 10s)
❌ O Vercel NÃO manda email de erro — o site continua servindo código antigo silenciosamente
❌ O dashboard mostra "falhou" mas parece que "não surtiu efeito" — MUITO perigoso
```

**Como saber se o deploy está funcionando:**
- Artigo gerado com campo `ts` no JSON de resposta → código novo deployou
- `{"status":"no_news"}` sem campo `ts` → código antigo ainda em execução
- Verificar: contar arquivos em api/ + checar maxDuration

---

# 🔴 REGRA NÚMERO 1 — TODA PÁGINA TEM SEO 100% COMPLETO

> Estabelecida pelo dono Roberto em mai/2026. Nunca pode ser revertida.

```
✅ <title> único, descritivo, com keywords reais (META_TITLE ≤55 chars + " | O Valor Capital")
✅ <meta name="description"> única, entre 120-160 chars
✅ <link rel="canonical"> sempre com www
✅ og:type, og:site_name, og:title, og:description, og:image, og:url, og:locale
✅ twitter:card, twitter:site, twitter:title, twitter:description, twitter:image
✅ JSON-LD schema (NewsArticle para artigos, CollectionPage para categorias)
✅ SSR — Googlebot recebe TODO o HTML sem JS
✅ URL com slug legível (nunca ?id=)
✅ Presente no sitemap.xml dinâmico
```

```
❌ <title> com TITULO completo (65+ chars)
❌ Página sem canonical
❌ Canonical apontando para ?id=
❌ og:image ausente
❌ Cache-Control: no-cache em páginas de conteúdo
❌ Imagens salvas como JPEG — sempre WebP quality 82
❌ /admin/ indexado pelo Google
```

---

## ⚠️ VISÃO ESTRATÉGICA

Modelo de negócio: `artigos/dia → indexação massiva → tráfego orgânico → AdSense/AdX → receita`
Fonte de receita única: Google AdSense / Google AdX.

---

## ⛔ REGRAS SAGRADAS — LISTA COMPLETA

1. **MAX 10 ARQUIVOS EM `api/`** — Ver Regra Zero-A. NUNCA, em hipótese alguma, ter 11 ou mais.
2. **NUNCA TOCAR NO PROMPT SEM AUTORIZAÇÃO** — Ver Regra Zero-B.
3. **NUNCA PUSH SEM REVISAR DIFF** — Ver Regra Zero-C.
4. **STAGING ATIVO** — Pipeline salva como `pendente`. Admin aprova antes de publicar. Ver Regra Zero-D.
5. **PORTAL NUNCA OFFLINE** — Ver Regra Zero-E. public/index.html NUNCA pode ter menos de 700 linhas em main.
6. **SEO 100% COMPLETO EM TODA PÁGINA** — Ver Regra #1.
7. **Topo e rodapé do portal NUNCA mudam** sem aprovação do dono.
8. **URLs sempre com slug** — nunca `?id=`.
9. **SSR obrigatório** — Googlebot não pode depender de JS.
10. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico.
11. **Pipeline gera artigos para fila — Roberto aprova antes de publicar.**
12. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar CLAUDE.md + BUGS_CORRIGIDOS.md e fazer push para main.
13. **NUNCA usar `p.categoria`** — não existe. Sempre usar `user_tags` (JSON array TEXT, usar `.like()`).
14. **NUNCA exigir strings fixas da IA no corpo** — ver Bug #7.
15. **`getNews()` sempre mistura feeds diretos garantidos.**
16. **`category.js` redireciona `?id=` para `/og?id=`** — ver Bug #14.
17. **`vc` e `colunistas` NÃO são categorias do pipeline.**
18. **Landing pages têm footer inline** — editar direto em `api/landing.js` `buildFooter()`.
19. **META_TITLE (≤55 chars) separado do TITULO.**
20. **`renderCorpo()` em `public/js/internal-page-v2.js` detecta HTML vs markdown** — não reverter.
21. **Artigos gerados SEMPRE em HTML** — nunca markdown. Validar antes de salvar: conteúdo deve conter `<p>`.
22. **`core/ai_portal.js`** tem comentário `// PROMPT OFICIAL OVC — TRAVADO EM PRODUÇÃO — NÃO ALTERAR SEM AUTORIZAÇÃO` — respeitar.
23. **`banners.json` em `data/`** — não tem coluna `categoria`, usa array `categories[]`. Ver seção 2.
24. **Links de banner usam `rel="sponsored"`** — obrigatório por compliance Google.
25. **`home.js` e `ovc-cards.js` usam 1 fetch bulk** — NUNCA retornar para múltiplos fetches por categoria. Ver Perf #1 (18/05/2026).
26. **Dedup de conteúdo: Jaccard 55% + tópico (≥3 keywords)** — NUNCA reduzir threshold Jaccard abaixo de 0.55. Ver Qualidade #1 (18/05/2026).
27. **Dedup de entidade NÃO EXISTE** — removido por instrução de Roberto. Em eleições/Copa/política a mesma figura aparece legitimamente o dia todo. Ver Qualidade #1 (18/05/2026).
28. **Imagens: 3 camadas de rejeição** — BLOQUEIO_PATTERNS URL + filtro título Wikimedia + Vision API (is_illustration). NUNCA remover nenhuma camada. Ver Qualidade #2 (18/05/2026).
29. **`recentTitles` janela 24h é INVIOLÁVEL** — "portal busca APENAS conteúdos DO DIA, NUNCA DO DIA ANTERIOR PARA TRÁS" (Roberto, 18/05/2026).
30. **PORTAL NUNCA OFFLINE** — public/index.html ≥700 linhas em main. Verificar SEMPRE antes de qualquer push que toque esse arquivo. Ver Regra Zero-E (18/05/2026).

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

### APIs — 10 ARQUIVOS ✅ (Regra Zero-A satisfeita)

| Arquivo | Funções que atende |
|---|---|
| `api/article.js` | SSR artigos por slug URL + Organization JSON-LD + links internos + banners.js inject |
| `api/category.js` | SSR listagem de categorias |
| `api/ig_publish.js` | Publica Instagram via Playwright |
| `api/institutional.js` | SSR /quem-somos/ e /politica-editorial/ |
| `api/landing.js` | SSR landing pages temáticas |
| `api/live.js` | SSR radar, tv-ovc, radio-ovc, dados, cotações |
| `api/manage.js` | Status, aprovação, track_view, newsletter, **banners** (`?action=banners`), **refresh token IG** (`GET ?action=refresh_token`), **colunistas** (login/list/create/toggle/delete via `body.action` ou `?action=`) |
| `api/portal-posts.js` | Serve posts publicados para frontend + **endpoint bulk `?recentes=true`** (1 query, Cache-Control 60s) |
| `api/run_portal.js` | Pipeline RSS→scrape→IA→banco (salva como **pendente**) + `?action=regenerar` + **geração manual** (`POST body.url\|body.texto`) |
| `api/sitemap.js` | Sitemap dinâmico |

> ⚠️⚠️⚠️ ANTES DE CRIAR QUALQUER ARQUIVO EM api/, DELETAR UM EXISTENTE. MÁXIMO ABSOLUTO: 10 ARQUIVOS.

**Consolidações realizadas (17/05/2026):**
- `api/refresh_token.js` **DELETADO** → lógica em `api/manage.js` via `GET ?action=refresh_token`
- `api/manual_post.js` **DELETADO** → lógica em `api/run_portal.js` via `POST body.url|body.texto`
- Cron `vercel.json` atualizado: `/api/refresh_token` → `/api/manage?action=refresh_token`

**Consolidações realizadas (19/05/2026):**
- `api/colunista.js` **CRIADO e IMEDIATAMENTE DELETADO** (violaria REGRA ZERO-A — 11º arquivo)
- Toda lógica de colunistas integrada em `api/manage.js` como novas actions

### Core (NUNCA alterar sem autorização do dono)
| Arquivo | Função |
|---|---|
| `core/rss.js` | 240+ feeds RSS em 16 grupos + feeds diretos garantidos |
| `core/scraper.js` | Extrai texto (3 camadas: p → div → og:meta) |
| `core/ai_portal.js` | **🔒 PROMPT TRAVADO** — gera META_TITLE, TITULO, CORPO HTML, META_DESCRICAO |
| `core/image_finder.js` | Busca imagem relevante (timeout 10s) — BLOQUEIO_PATTERNS expandido (18/05/2026) |
| `core/image_processor.js` | Processa → WebP quality 82 → Supabase Storage — Vision API rejeita is_illustration (18/05/2026) |

### Frontend JS Crítico
| Arquivo | Função |
|---|---|
| `public/js/internal-page-v2.js` | Renderização artigos — `renderCorpo()` detecta HTML vs markdown |
| `public/js/home.js` | Homepage dinâmica — **1 fetch bulk** `/api/portal-posts?recentes=true` (Perf #1, 18/05/2026) |
| `public/js/noticias-v3.js` | Listagem de notícias |
| `public/js/ovc-cards.js` | Cards de artigos — CATS funnel reordering (Block 4) + **1 fetch bulk** (Perf #1, 18/05/2026) — **sem setInterval** |
| `public/js/newsletter-bar.js` | Injeta newsletter bar + patcha footer |
| `public/js/banners.js` | **NOVO (Block 5)** — injeta banner Lions Corretora em artigos e homepage |

### Admin
| Arquivo | Função |
|---|---|
| `public/admin/app.js` | Painel admin React — tabs: dashboard, pendentes, publicados, sem_foto, **galeria**, pipeline, fontes, contas, **colunistas**, logs, seo, config |
| `public/admin/colunista/index.html` | Portal do colunista — login + lista de posts + submissão |

### Data Files
| Arquivo | Função |
|---|---|
| `data/banners.json` | **NOVO (Block 5)** — 17 produtos Lions Corretora, lido por `api/manage.js` |

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
**CRÍTICO (Block 6):** Pipeline automático insere com `status:'pendente'`, `approved:false`, SEM `published_at`. published_at é preenchido ao aprovar via admin.

### Tabela `config`
| Chave | Descrição |
|---|---|
| `AUTOMATION` | `"on"` ou `"off"` — liga/desliga pipeline |
| `MAX_POSTS_DIA` | Limite diário (padrão: `"300"`) |
| `POSTS_01_06` … `POSTS_17_00` | Máx posts por faixa horária |
| `YOUTUBE_LIVE_URL` | URL embed YouTube para OVC TV |

### Tabela `image_bank` ⚠️ MIGRAÇÃO MANUAL NECESSÁRIA
```sql
CREATE TABLE IF NOT EXISTS image_bank (
  id uuid primary key default uuid_generate_v4(),
  url text unique,
  titulo text,
  post_id uuid,
  created_at timestamp default now()
);
```
Usada pela aba **Galeria** do admin. Salva automaticamente toda imagem de post aprovado.

### Tabela `colunistas` ⚠️ MIGRAÇÃO MANUAL NECESSÁRIA
```sql
CREATE TABLE IF NOT EXISTS colunistas (
  id uuid primary key default uuid_generate_v4(),
  nome text,
  email text unique,
  senha_hash text,
  ativo boolean default true,
  session_token text,
  last_login timestamp,
  created_at timestamp default now()
);
```
Usada pelo sistema de colunistas. Senha armazenada como SHA-256 + salt `ovc_salt_2026`.

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
Fluxo: getNewsByCategoria() + getNews() → scrape() → rewritePortal() → validar()
       → salva como PENDENTE (Block 6: aguarda aprovação manual)
       → admin > Postagens > filtro 'pendente' → Roberto aprova → publica
```

### Parâmetros
```js
body.force = true     // bypassa verificação de horário
body.count = N        // artigos a gerar (máx 8, padrão 1)
body.categoria        // forçar categoria
body.subcategoria     // forçar subcategoria
body.url              // geração manual via URL (antes em api/manual_post.js)
body.texto            // geração manual via texto bruto
?action=regenerar     // regenerar artigos com markdown das últimas 48h (1 por chamada, JSON response)
?action=regenerar&limit=N  // processar N artigos por chamada (padrão 1)
```

### Respostas `?action=regenerar`
```json
{"status":"ok","processados":1,"ok":1,"restantes":42}
{"status":"ok","processados":0,"ok":0,"restantes":0}  // todos processados
```

### Diagnóstico pipeline normal
```
{"status":"ok"}            → artigo gerado (vai para fila pendente)
{"status":"no_news"}       → RSS vazio
{"status":"no_valid_news"} → RSS retornou itens mas todos falharam
{"status":"fora_horario"}  → fora da janela 07:00-01:00 BRT
{"status":"error"}         → exceção
```

Se `no_news` não tiver campo `ts`: **código novo não deployou** → verificar limite de funções/maxDuration.

### GitHub Actions existentes
| Workflow | Gatilho | Função |
|---|---|---|
| `pipeline.yml` (ou similar) | Cron 2min | POST /api/run_portal — pipeline principal |
| `.github/workflows/corrigir_artigos.yml` | workflow_dispatch + push neste arquivo | Loop GET ?action=regenerar até `restantes:0` |
| `.github/workflows/regenerar_recentes.yml` | workflow_dispatch manual | Loop GET ?action=regenerar&pendente=true&limit=2 — regenera artigos dos últimos 5 dias com markdown |

---

## 7. RENDERIZAÇÃO DE ARTIGOS (CRÍTICO)

**Fluxo:** `api/article.js` (SSR) → `window.__OVC_ARTICLE__` JSON → `public/js/internal-page-v2.js` renderiza client-side via `renderCorpo()`

**`renderCorpo()` — comportamento atual (17/05/2026):**
```js
function renderCorpo(texto){
  if(!texto) return '';
  // Conteúdo HTML (prompt novo) — renderizar direto sem escapar
  if(/^\s*<[a-z]/i.test(texto.trim())){
    return '<div style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);">'+texto+'</div>';
  }
  // Legado: conteúdo markdown (artigos antigos não regenerados)
  // ... renderer markdown existente ...
}
```

**NUNCA reverter esta lógica.** O `esc()` não pode ser aplicado a conteúdo HTML — converte `<p>` em `&lt;p&gt;` tornando as tags visíveis como texto.

---

## 8. META_TITLE

`core/ai_portal.js` gera `META_TITLE` ≤55 chars. `api/run_portal.js` salva em `metrics.meta_title`. `api/article.js` usa no `<title>` → `metaTitleRaw + " | O Valor Capital"`. `og:title` e JSON-LD usam o TITULO completo.

---

## 9. PÁGINAS INSTITUCIONAIS

- `/quem-somos/` e `/politica-editorial/` → `api/institutional.js`
- Responsável: Roberto Cesar Terrasan
- Email display: `contato@ovalorcapital.com.br` → href: `betoterrasan@gmail.com`

---

## 10. FOOTER

- **Categorias e homepage:** `newsletter-bar.js` injeta + patcha
- **Landing pages:** footer inline em `api/landing.js` `buildFooter()` — editar direto lá

---

## 11. SEO — STATUS

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs | `api/article.js` + `vercel.json` | ✅ |
| SSR artigos | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| JSON-LD Organization | `api/article.js` | ✅ (Block 3) |
| META_TITLE ≤55 chars | `api/article.js` + `core/ai_portal.js` | ✅ |
| Meta description artigos | `api/article.js` | ✅ |
| SSR categorias (29) | `api/category.js` | ✅ |
| SSR landing pages | `api/landing.js` | ✅ |
| SSR institucionais | `api/institutional.js` | ✅ |
| WebP quality 82 | `core/image_processor.js` | ✅ |
| robots.txt | `public/robots.txt` | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| Canonical www | Todos handlers SSR | ✅ |
| Links internos "Leia também" | `api/article.js` `fetchRelatedArticles()` | ✅ (Block 3) |
| Google Indexing API | `api/run_portal.js` `pingGoogleIndexing()` | ✅ (Block 3, requer GOOGLE_INDEXING_SA_JSON) |
| Banner comercial Lions | `api/manage.js` + `public/js/banners.js` | ✅ (Block 5) |

### Ações pendentes (Roberto faz manualmente)
1. Search Console → submeter sitemap.xml
2. AdSense → verificar aprovação
3. Google Publisher Center → cadastrar portal
4. Quando ovalorcapital@gmail.com ativado → atualizar `EMAIL_REAL` em `api/institutional.js`
5. **Variável de ambiente `GOOGLE_INDEXING_SA_JSON`** → adicionar no Vercel Dashboard com JSON da service account (Block 3).
6. Executar `GET /api/manage?action=unpublish_no_image` para despublicar artigos sem imagem (quando autorizado).
7. Disparar workflow "Regenerar artigos recentes pendentes" no GitHub Actions.
8. Revisar e aprovar artigos regenerados no admin (filtro 'pendente').
9. **Executar SQL de migração no Supabase** para as tabelas `image_bank` e `colunistas` (ver seção 4).

---

## 12. BUGS CORRIGIDOS — RESUMO

Documentação completa em `BUGS_CORRIGIDOS.md`.

| # | Bug | Arquivo | Quando |
|---|-----|---------|--------|
| 1 | `</script>` em JSON → página branca | `api/article.js` | mai/2026 |
| 2 | `isHoje()` rejeita itens sem data | `core/rss.js` | mai/2026 |
| 3 | Feeds gerais misturados na geração forçada | `api/run_portal.js` | mai/2026 |
| 4 | Subcategoria "Geral" salva no banco | `api/run_portal.js` | mai/2026 |
| 5 | targetCount=1, pool=40, sem dedup | `api/run_portal.js` | mai/2026 |
| 6 | Sem faixas horárias | `api/run_portal.js` | mai/2026 |
| 7 | validar() exigia 'redação ovc' | `api/manage.js` | mai/2026 |
| 8 | forcarExecucao() enviava GET | `automacao.html` | mai/2026 |
| 9 | p.categoria inexistente | `automacao.html` | mai/2026 |
| 10 | getNews() fallback usava GN | `core/rss.js` | mai/2026 |
| 11 | Scraper só `<p>` | `core/scraper.js` | mai/2026 |
| 12 | no_news persistente | `core/rss.js` | mai/2026 |
| 13 | Pipeline salvava como pendente (corrigido em mai, revertido intencionalmente em Block 6) | `run_portal.js` | mai/2026 |
| 14 | Links ?id= abriam categoria vazia | `api/category.js` | mai/2026 |
| 15 | /vc/ mostrava conteúdo sem sentido | `api/landing.js` | mai/2026 |
| 16 | Footer landing sem copyright/links | `api/landing.js` | mai/2026 |
| 17 | Build Vercel falhando silenciosamente | `vercel.json` + `api/` | 14/05/2026 |
| 18 | Prompt gerava markdown em vez de HTML | `core/ai_portal.js` | 16/05/2026 |
| 19 | Agente criou 13º arquivo em api/ → build quebrado | `api/corrigir-markdown-hoje.js` deletado | 16/05/2026 |
| 20 | `renderCorpo()` escapava HTML → tags visíveis como texto | `public/js/internal-page-v2.js` | 17/05/2026 |
| 21 | INSERT pipeline usava `pendente`+`approved:false` (corrigido, revertido intencionalmente no Block 6) | `api/run_portal.js` | 17/05/2026 |
| 22 | `regenerarConteudo` tentava 15 artigos → timeout 10s | `api/run_portal.js` | 17/05/2026 |
| 23 | Markdown `**bold**`/`## h2` visível em títulos e corpo | `core/ai_portal.js`, `api/article.js`, `public/js/internal-page-v2.js` | 17/05/2026 |
| 24 | "Leia também" aparecendo como HTML escapado no corpo | `api/article.js` | 17/05/2026 |
| 25 | Foto de Jair usada em artigos de Flávio/Eduardo/Carlos Bolsonaro | `core/image_finder.js` | 17/05/2026 |
| 26 | Artigos salvos sem imagem quando scrape falha | `api/run_portal.js` | 17/05/2026 |
| 27 | Conteúdos praticamente idênticos publicados | `api/run_portal.js` | 18/05/2026 |
| 28 | Imagens aleatórias e inadequadas (ilustrações, desenhos, gráficos) | `core/image_finder.js`, `core/image_processor.js` | 18/05/2026 |
| 29 | **CRÍTICO** — PR merge destruiu 734 linhas de public/index.html → portal offline | `public/index.html` restaurado | 18/05/2026 |
| 30 | ColunistasAdmin chamava `/api/colunista` (deletado) em vez de `/api/manage` | `public/admin/app.js` | 19/05/2026 |

---

## 13. COMO RETOMAR EM NOVA SESSÃO

**OBRIGATÓRIO antes de qualquer coisa:**
1. Ler este arquivo completamente
2. Ler `BUGS_CORRIGIDOS.md`
3. **CONTAR os arquivos em `api/`** — se tiver mais de 10, parar e consolidar antes de qualquer coisa
4. **NUNCA adicionar maxDuration > 10 no vercel.json**
5. Verificar se tem artigos com markdown no banco (Bug #18/20) — se sim, rodar `?action=regenerar`
6. Checklist SEO em toda página nova
7. Verificar GitHub Actions rodando
8. **Ao terminar:** atualizar CLAUDE.md + BUGS_CORRIGIDOS.md e fazer push para main
9. **STAGING ATIVO:** pipeline salva como pendente. Lembrar Roberto de aprovar via admin > Postagens.
10. **TABELAS SUPABASE:** `image_bank` e `colunistas` precisam ser criadas manualmente — ver seção 4.

---

## 14. CONTATO

- **Nome:** Roberto Cesar Terrasan
- **Objetivo:** maior portal premium de notícias do Brasil
- **Perfil técnico:** não é programador — implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais. Não quer links nem status — quer feito e funcionando.
- **Comunicação:** português, direto ao ponto
- **NUNCA perguntar** coisas óbvias sobre infraestrutura que claramente está no ar
- **NUNCA mexer em nada enquanto conversa com o dono** — esperar OK explícito antes de cada ação

---

## 15. HISTÓRICO DE SESSÕES

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

### Sessão 16/05/2026 — INCIDENTE GRAVE (ver INCIDENTE_16_05_2026.md)
- Agente alterou `core/ai_portal.js` sem autorização → prompt passou a gerar markdown
- Admin derrubado (public/admin/index.html sobrescrito com placeholder)
- Centenas de artigos gerados com markdown bruto entre 07:00 e 22:07 BRT
- Agente criou 13º arquivo em api/ → build quebrado silenciosamente
- **Corrigido ao fim do dia:** prompt restaurado, 13º arquivo deletado, build voltou
- **Pendente ao fim do dia:** artigos com markdown no banco ainda quebrados

### Sessão 17/05/2026 — CORREÇÃO DO INCIDENTE
- **Bug #20 corrigido:** `renderCorpo()` em `internal-page-v2.js` agora detecta HTML e renderiza direto
- **Bug #21 corrigido:** INSERT em `run_portal.js` voltou para `publicado`+`approved:true`+`published_at:now`
- **Bug #22 corrigido:** `regenerarConteudo` processa 1 artigo por chamada com 8s de timeout interno
- **Workflow criado:** `.github/workflows/corrigir_artigos.yml`
- **Prompt novo aprovado e travado:** gera HTML, Google News+Discover, Reuters/Bloomberg style
- **Regras Zero-A a Zero-D** documentadas neste arquivo

### Sessão 17/05/2026 — MASTER_ARCHITECTURAL_BLUEPRINT v100.0 (Blocks 1–6 — TODOS COMPLETOS ✅)

**Branch:** `claude/work-session-LGQFx` → mergeada em `main` (PR #38, commit `bd0c0465`)

#### Block 1 — SYSTEM_KERNEL (`core/ai_portal.js`)
- Prompt reestruturado: instruções completas em `role:system`, texto-fonte isolado em `role:user` com tags XML `<source_text>` e `<source_url>`

#### Block 2 — GPT-4o Vision (`core/image_processor.js`)
- GPT-4o Vision API para análise semântica de imagem antes de processar
- 2s timeout, só executa se < 5s elapsed (budget-aware)
- Sharp.js: flip condicional, watermark SVG via composite

#### Block 3 — SEO Authority (`api/article.js` + `api/run_portal.js`)
- Organization JSON-LD como segundo `<script type="application/ld+json">`
- `fetchRelatedArticles()`: 3 artigos recentes mesma categoria, injeta "Leia também" em 2/3 do corpo
- `pingGoogleIndexing()`: JWT RSA-SHA256, OAuth2, fire-and-forget — requer `GOOGLE_INDEXING_SA_JSON` no Vercel

#### Block 4 — CATS Funnel (`public/js/ovc-cards.js`)
- CATS array reordenado para funil temático; CATS_DESTAQUE expandido para 6

#### Block 5 — Banner Commercial Matrix
- `data/banners.json`: 17 produtos Lions Corretora (CNPJ 38.461.144/0001-18)
- `api/manage.js`: endpoint `GET ?action=banners&cat=` com cache module-level
- `public/js/banners.js`: IIFE, rectangle em artigos, leaderboard na home, `rel="sponsored"`

#### Block 6 — Staging Protocol (`api/run_portal.js`) — COMPLETO
- Pipeline agora salva: `status:'pendente'`, `approved:false`, sem `published_at`
- Admin já tinha infra completa: badge sidebar, filtro 'pendente', botão 'Publicar no Portal'
- Posts manuais (handleManual em manage.js) CONTINUAM publicando direto
- `pingGoogleIndexing` mantido para uso futuro ao aprovar

#### Consolidação api/ 12 → 10 ✅ (Regra Zero-A restaurada)
- `api/refresh_token.js` **DELETADO** → lógica em `manage.js` via `GET ?action=refresh_token`
- `api/manual_post.js` **DELETADO** → lógica em `run_portal.js` via `POST body.url|body.texto`
- `vercel.json` cron atualizado: `/api/refresh_token` → `/api/manage?action=refresh_token`
- **api/ tem exatamente 10 arquivos — Regra Zero-A satisfeita ✅**

#### Documentação
- CLAUDE.md atualizado com estado final completo
- BUGS_CORRIGIDOS.md atualizado: Bug #13 anotado como invertido intencionalmente pelo Block 6, checklist corrigido

### Sessão 17/05/2026 — CRISE DE QUALIDADE DE CONTEÚDO (Bugs #23–28 + features)

**Problema:** 1100+ artigos publicados com markdown visível, fotos erradas, "Leia também" escapado, conteúdo curto e duplicatas excessivas.

**Decisão de Roberto:** despublicar apenas os últimos 5 dias e regenerar com o sistema corrigido. Artigos anteriores a 12/mai estão ok.

**7 correções implementadas (commits `200c5904`, `39619657`, `384d8f1a`):**

| Arquivo | O que mudou |
|---|---|
| `core/ai_portal.js` | `markdownToHtml()` — converte markdown→HTML no parse(). Strip `**` do titulo. Threshold 2500→3000 chars. |
| `api/article.js` | Strip `**` do titulo antes dos SEO tags. Guard HTML no inject "Leia também". |
| `core/image_finder.js` | ALIASES reordenados (específicos antes do genérico 'bolsonaro'). Dedup em extrairEntidades(). POOLS 2→5 imagens por categoria. |
| `api/run_portal.js` | validarConteudo 800→2500. extrairNomePrincipal() + dedup entidade (max 3/24h). findImage fallback quando processAndSaveImage retorna null. regenerarConteudo() suporta modo pendente. |
| `api/manage.js` | handleUnpublishRecent() + routing GET ?action=unpublish_recent&dias=N |
| `public/js/internal-page-v2.js` | stripMd() nos 4 renders de card + h1/title do artigo. |
| `.github/workflows/regenerar_recentes.yml` | NOVO — loop de regeneração de pendentes (max 80 ciclos, 15s entre calls) |

**Ação executada por Roberto:** `GET /api/manage?action=unpublish_recent&dias=5` → moveu artigos 12–17/mai de `publicado` para `pendente`. Retornou `{"ok":true}`.

**Feature adicional (commit `756905c`):**
- Admin → Imagens → nova aba **"📰 Imagens dos Artigos"** — mostra todas as imagens únicas do campo `imagem` da tabela `posts` (até 600, dedupado por URL). Cada card: foto, título do artigo, badge status, Copiar URL, botão Usar.

### Sessão 18/05/2026 — OTIMIZAÇÃO DE PERFORMANCE (homepage)

**Problema:** Portal muito lento, até travando. Homepage fazia **57 requests HTTP simultâneos** a cada carregamento.

**Solução — endpoint bulk `?recentes=true` (commit `7ea8f79c`):**
- `api/portal-posts.js`: novo branch `?recentes=true` — 1 query Supabase, retorna todos os posts recentes filtrados por CATS_VALIDAS_R, `Cache-Control: public, max-age=60, stale-while-revalidate=120`
- `public/js/home.js`: refatorado de ~25 fetches individuais para 1 fetch bulk + distribuição client-side por categoria em cache `{categoria: [posts]}`
- `public/js/ovc-cards.js`: refatorado de 28 fetches individuais para 1 fetch bulk + distribuição client-side; `setInterval(load, 120000)` removido

**Resultado:** 57 requests → ~4 requests por carregamento de homepage.

### Sessão 18/05/2026 (continuação) — QUALIDADE DE CONTEÚDO E IMAGENS

**Correções em `api/run_portal.js`:** Jaccard 0.40 → 0.55, `topicoDuplicado()`, recentTitles limit 300 → 500, dedup entidade removido.

**Correções em `core/image_finder.js` e `core/image_processor.js`:** BLOQUEIO_PATTERNS expandido, filtro título Wikimedia, Vision API `is_illustration`.

### Sessão 18/05/2026 (tarde) — INCIDENTE CRÍTICO: PORTAL OFFLINE (Bug #29)

- PR #44 merge destruiu 734 linhas de `public/index.html` → portal offline ~40 minutos
- **REGRA ZERO-E criada:** public/index.html ≥700 linhas em main, SEMPRE verificar antes de push
- Radar OVC news panels implementados em `public/js/live-pages.js` e `api/portal-posts.js`

### Sessão 19/05/2026 — 4 NOVAS FEATURES ADMIN (branch claude/implement-admin-feature-qTTvg)

**Features implementadas — apenas em arquivos admin, ZERO toque no portal público:**

#### 1. Filtros de imagem nas Postagens (`public/admin/app.js` — `Pendentes`)
- Função `imageStatus(p)`: classifica posts em `ok` (URL http + ≥40 chars), `sem` (vazio/nulo), `suspeita` (URL presente mas inválida)
- Botões de filtro rápido na aba Pendentes: **Todos / Com imagem ✓ (N) / Suspeita ⚠ (N) / Sem imagem ✗ (N)**
- Coluna IMG na tabela com ícone colorido (✓ verde / ⚠ amarelo / ✗ vermelho)
- Filtros combinam com a busca por texto

#### 2. Barra de busca sempre visível (`public/admin/app.js` — `Pendentes` + navbar)
- Navbar do admin com `position: sticky, top: 0, zIndex: 200`
- Controles da aba Pendentes (busca + filtros) com `position: sticky, top: 57, zIndex: 100`
- Busca filtra por título E categoria simultaneamente
- Visual: borda dourada + glow quando ativa

#### 3. Banco de imagens automático (`public/admin/app.js` — `Galeria`)
- Nova aba **🖼 GALERIA** no admin
- Toda imagem aprovada é salva automaticamente na tabela `image_bank` (upsert por URL)
- `aprovar()`, `aprovarLote()` e `editarAprovar()` chamam `salvarImagemGaleria()` antes de aprovar
- Botão "Sincronizar Posts Publicados" para popular o banco com posts já existentes
- Grid de cards com preview, título, remoção
- ⚠️ Tabela `image_bank` precisa ser criada manualmente no Supabase (SQL na seção 4)

#### 4. Sistema de colunistas
- **Portal do colunista:** `public/admin/colunista/index.html` — login email+senha, lista de posts próprios, submissão de novo post
- **Admin — aba ✍ COLUNISTAS:** `ColunistasAdmin` em `public/admin/app.js` — criar/listar/suspender/excluir colunistas
- **Backend:** lógica integrada em `api/manage.js` (sem criar novo arquivo — Regra Zero-A)
  - `GET ?action=list_colunistas` — lista todos
  - `GET ?action=list_posts_colunista&colunista_id=X&token=Y` — posts do colunista
  - `POST {action: "login_colunista"}` — autentica, retorna session_token
  - `POST {action: "create_colunista"}` — admin cria colunista
  - `POST {action: "toggle_colunista"}` — ativa/suspende
  - `POST {action: "delete_colunista"}` — exclui
  - `POST {action: "submit_colunista_post"}` — colunista submete post (salva como pendente)
- Senha: SHA-256 + salt `ovc_salt_2026`, session_token aleatório 32 bytes
- Posts de colunistas: `publish_method: "colunista"`, chegam na aba Pendentes para aprovação do admin
- ⚠️ Tabela `colunistas` precisa ser criada manualmente no Supabase (SQL na seção 4)

**Bug corrigido nesta sessão (Bug #30):**
- `ColunistasAdmin` chamava `/api/colunista` (arquivo criado e deletado por Regra Zero-A) → corrigido para `/api/manage`

**Commits na branch `claude/implement-admin-feature-qTTvg`:**
1. `3345227` — implementação inicial (app.js, colunista/index.html, api/colunista.js)
2. `b1da60d` — delete api/colunista.js (REGRA ZERO-A)
3. `650e94e` — integra colunistas em manage.js, corrige colunista/index.html
4. `d692a777` — fix: ColunistasAdmin usa /api/manage (Bug #30)
5. (este commit) — docs: CLAUDE.md atualizado

**⚠️ PENDENTE — Roberto deve fazer manualmente:**
1. Criar PR desta branch para main e revisar diff
2. Executar SQL de migração no Supabase (tabelas `image_bank` e `colunistas`)
