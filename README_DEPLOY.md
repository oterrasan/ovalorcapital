# O Valor Capital (OVC) — ultimaversao-ovc

## Estrutura (pronta para Vercel)
- `public/` — Home + páginas internas estáticas (categorias/subcategorias, TV, Radar, Ferramentas etc.)
- `api/` — Funções serverless
  - `api/articles/list` — lista com filtros (`category`, `subcategory`, `q`, `limit`)
  - `api/articles/render` — render HTML premium de artigo para `/artigos/:slug`
  - `api/ptax` e `api/impostometro` — já existentes
- `data/articles.json` — base (ainda vazia no zip)
- `vercel.json` — rewrite de `/artigos/:slug` -> `/api/articles/render?slug=:slug`
- `public/robots.txt` e `public/sitemap.xml` — SEO

## O que foi corrigido
1. Home deixou de ser SPA interna: cliques agora redirecionam para URLs reais (sem páginas “fantasma”).
2. Todas as categorias e subcategorias agora têm páginas internas reais (com URL estável) e layout premium.
3. TV OVC e Radar funcionam dentro do portal (sem abrir novas abas).
4. Sem links mortos: botões e menus apontam para páginas existentes.
5. SEO básico pronto: sitemap + robots; canonical/meta em páginas internas e em artigos.

## Deploy na Vercel (modo simples)
1. Suba este conteúdo na raiz do repositório (public/api/data/vercel.json).
2. Na Vercel:
   - Framework: **Other**
   - Build Command: **(vazio)**
   - Output Directory: **public**
3. Deploy.

## Observação sobre artigos
- A home e as seções já carregam lista via `/api/articles/list`.
- Para publicar artigos, basta popular `data/articles.json` no repositório (ou via pipeline).
