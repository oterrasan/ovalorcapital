
# OVC v3 — pacote único

## O que esta versão entrega
- Home mantida no visual existente
- topo e rodapé da Home em todo o portal
- páginas internas no novo padrão
- página de matéria com áudio por navegador
- tema com 3 variações: clássico, gold e grafite
- Admin completo como centro de controle
- estrutura pronta para Instagram, LinkedIn e YouTube
- Instagram tratado como prioridade
- estrutura pronta para Rádio OVC
- núcleo único para dados ao vivo, TV, Rádio OVC e impostômetro
- arquitetura respeitando teto de Functions da Vercel Hobby

## Senha padrão do Admin
- `ovc-admin`
- pode ser trocada por `ADMIN_TOKEN`
- publicação direta imediata pode ser reservada ao token master via `ADMIN_MASTER_TOKEN`

## Variáveis recomendadas
- `ADMIN_TOKEN`
- `ADMIN_MASTER_TOKEN`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

## Como a persistência funciona
- com as variáveis do GitHub, o Admin lê e grava os JSONs em `data/` no repositório
- sem essas variáveis, usa persistência local como fallback

## Functions criadas
1. `/api/auth/validate-token`
2. `/api/admin/dashboard`
3. `/api/admin/resource`
4. `/api/public/content`
5. `/api/newsletter/subscribe`
6. `/api/live/data`
7. `/api/integrations/connect`
8. `/api/integrations/publish`
