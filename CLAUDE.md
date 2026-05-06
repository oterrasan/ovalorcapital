# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://ovalorcapital.com.br
- **Stack:** Next.js/Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin inline via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch de desenvolvimento:** `claude/fix-conversation-history-xOtaY`
- **Deploy:** Vercel deploya automaticamente do branch `main`

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless — limite 9 funções no Hobby plan)
| Arquivo | Função |
|---|---|
| `api/manage.js` | Unifica: status, aprovação, geração manual, track_view, newsletter, vagas |
| `api/run_portal.js` | Pipeline automático RSS → scrape → IA → salva como pendente |
| `api/portal-posts.js` | Serve posts publicados para o frontend (inclui ?sort=popular) |
| `api/editor_ia.js` | Editor IA do admin (reescrever/gerar conteúdo manualmente) |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/refresh_token.js` | Renova token do Instagram |
| `api/live-data.js` | Cotações ao vivo |
| `api/cron-*.js` | Jobs agendados |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL, parse do resultado
- `core/rss.js` — busca notícias dos feeds RSS
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria
- `public/_materia/index.html` — página standalone de artigo
- `public/admin/index.html` — painel admin (React inline via Babel)
- `public/js/internal-page-v2.js` — JS principal de todas as páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage + mais lidas + OVC TV
- `public/js/home.js` — homepage hero/feature/lions + seções dinâmicas
- `public/js/search.js` — buscador premium com skeleton + debounce
- `public/js/newsletter-bar.js` — barra de newsletter injetada antes do footer
- `public/css/home.css` — CSS principal
- `public/css/site.css` — CSS das páginas internas

---

## 3. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos principais: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, subcategoria_slug, created_at, published_at, metrics (JSON com SEO + views), priority, retry_count, max_retries`

**Fluxo de status:** `pendente` → (admin aprova) → `publicado`
- Nada vai direto para `publicado` — toda matéria exige aprovação manual
- `publish_method: "portal"` = gerado pelo pipeline automático RSS
- `publish_method: "manual"` = gerado pelo editor IA do admin
- **`metrics.views`** = contador de visualizações (incrementado via `track_view` action)

### Tabela `config`
Chaves importantes:
- `AUTOMATION` = `"on"` ou `"off"` — liga/desliga o pipeline automático
- `MAX_POSTS_DIA` = `"300"` — limite diário de posts automáticos
- `IG_SERVICE_URL` = URL do bot Instagram no Render.com (ainda não configurado)
- `YOUTUBE_LIVE_URL` = URL embed YouTube para OVC TV ao vivo (configurar no admin → Configurações)

---

## 4. CATEGORIAS DO SISTEMA

### Todas as categorias válidas (29 slugs):
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades,
vc, colunistas, investigativo, seguranca, cultura, profissoes,
vagas, concursos, imoveis, esg, defesa, religiao
```

### Mapeamento categoria → URL do portal:
```
tributacao → /tributos/
colunistas → /vc/
todos os outros → /[slug]/
```

### Páginas HTML existentes em `public/`:
Todas as 29 categorias têm página — incluindo `internacional` e `variedades` (criadas nesta sessão).

---

## 5. O QUE FOI IMPLEMENTADO (histórico completo)

### Admin (public/admin/index.html)
- Filtros avançados no Postagens: busca por título, categoria, subcategoria, data, origem
- Ações em lote: aprovar selecionados, deletar selecionados
- KPI dashboard: cards clicáveis mostrando sem imagem, img suspeita, risco de erro, pendentes
- Smart filter chip bar: filtrar postagens por diagnóstico client-side
- Métricas toggle: expandir row com dados de saúde de cada post
- Configurações: campo `YOUTUBE_LIVE_URL` para OVC TV ao vivo
- Editor IA: default trocado de Gemini para OpenAI

### API manage.js
- `track_view` action: incrementa `metrics.views` no post
- `newsletter_subscribe` action com fallback para tabela config
- `submit_vaga` action para envio público de vagas
- GET response inclui `youtube_live_url` do config

### API portal-posts.js
- `?sort=popular`: busca 200 posts, ordena por `metrics.views` desc, retorna top N
- `?q=termo`: busca full-text em título + conteúdo com dedup
- CATS_VALIDAS com todas as 29 categorias

### internal-page-v2.js (todas as páginas internas)
**Modo artigo:**
- Barra de progresso de leitura (cor da categoria, sticky no topo)
- Estimativa de tempo de leitura ("⏱ 5 min de leitura")
- Rastreamento de views (`track_view` fire-and-forget ao carregar artigo)
- Rail: "Mais em [cat]" + "🔥 Mais Lidas" + "📺 OVC TV ao Vivo" (se configurado)
- Open Graph dinâmico para preview em redes sociais

**Modo categoria:**
- Barra de progresso de leitura
- Rail: "Últimas em [cat]" + "🔥 Mais Lidas" + "📺 OVC TV" (se configurado)
- Hero card (1º post) + grid 2 colunas (2º e 3º) + lista compacta (4+)

### ovc-cards.js (homepage)
- `carregarMaisLidas()`: bloco "🔥 Mais Lidas" com destaque #1 + lista numerada 2-7
- `carregarOvcTv()`: seção "📺 OVC TV ao Vivo" com iframe YouTube (se configurado)
- Seções injetadas em `#ovc-mais-lidas-home` e `#ovc-tv-home` no HTML

### Categorias e páginas
- 7 novas editorias (investigativo, segurança, cultura, profissões, vagas, internacional, variedades)
- +7 editorias (concursos, imóveis, ESG, defesa, religião, colunistas, busca)
- Páginas HTML criadas para todas as 29 categorias
- Menu "Profissões" com 26 subcategorias em 4 grupos (injetado via JS em todas as páginas)
- Menu "Mais" no supermenu da homepage

### Homepage (public/index.html)
- Seções `#ovc-mais-lidas-home` e `#ovc-tv-home` adicionadas antes do footer
- Chips-bar expandida com todas as novas categorias
- Rail esquerdo: Investigativo + Profissões + Trilhas OVC

### Buscador (public/busca/index.html + public/js/search.js)
- Busca em tempo real com debounce 400ms
- Skeleton loader durante busca
- Cards premium com imagem, badge de categoria, resumo, data
- Auto-busca a partir de `?q=` na URL

### Newsletter (public/js/newsletter-bar.js)
- Injetada antes do footer em todas as páginas
- Fallback: tenta `newsletter_subscribers` → salva em `config` como JSON

### Calculadoras (public/ferramentas/calculadoras/index.html)
- IRPF 2025, FGTS, Financiamento PRICE, Correção IPCA, Custo de Vida

---

## 6. PENDÊNCIAS ABERTAS

### Código (fazer no repo):
Nenhuma pendência de código conhecida — tudo implementado.

### Externo (Roberto faz no painel):
1. **Aprovar e mergear PRs para o `main`** — nada vai ao ar sem o merge
2. **Instagram Bot — deploy no Render.com**
   - Repo `ovc-instagram-bot` tem `render.yaml` pronto (5 cliques)
   - Depois: colocar URL em `IG_SERVICE_URL` via admin → Configurações
3. **Bucket `posts-images` no Supabase**
   - Supabase → Storage → New Bucket → nome: `posts-images` → marcar público
4. **OVC TV ao Vivo — configurar YouTube**
   - Admin → Configurações → "URL YouTube ao Vivo"
   - Formato: `https://www.youtube.com/embed/VIDEO_ID` ou `https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID`

### Próximos desenvolvimentos:
5. Sistema multi-usuário para colunistas (Supabase Auth)
6. Publicação em outras redes (Facebook, LinkedIn)
7. Redesign completo do admin (kanban editorial, calendário)

---

## 7. REGRAS DE NEGÓCIO IMPORTANTES

- **Nada publica sem aprovação manual do Roberto** — toda matéria vai para `pendente` primeiro
- **Manuais não contam no limite diário** — só `publish_method="portal"` conta
- **Só OpenAI ativo** — Gemini, Groq, Grok não estão configurados/pagos
- **9 funções no Vercel Hobby** — não criar novas funções sem deletar outras primeiro
- **Imagens:** bucket `posts-images` no Supabase Storage (ainda não criado pelo Roberto)
- **"Mais Lidas"**: baseado em `metrics.views` — cresce à medida que leitores abrem artigos

---

## 8. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo primeiro
2. Verificar estado do git: `git log --oneline -5`
3. Trabalhar na branch `claude/fix-conversation-history-xOtaY`
4. Fazer merge ao `main` quando pronto (Vercel deploya automaticamente)
5. Roberto testa em `ovalorcapital.com.br`

---

## 9. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil, com automação de conteúdo, Instagram, e monetização
- **Perfil técnico:** não é programador — precisa de explicações claras e implementações diretas
- **Estilo de trabalho:** direto, cobra resultados reais no ar, não quer explicações sem ação
