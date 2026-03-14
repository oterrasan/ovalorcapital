# Portal O Valor Capital - Sistema Completo

## ✅ 12 APIs Serverless

1. articles/create - Criar artigo com upload de imagem
2. articles/list - Listar artigos por status/categoria
3. articles/get - Buscar artigo específico
4. articles/approve - Aprovar artigo
5. articles/render - Renderizar artigo no site
6. articles/generate - Gerar artigo com IA
7. instagram/post - Postar no Instagram
8. instagram/schedule - Verificar fila Instagram
9. auth/validate-token - Validar token admin
10. ptax - Cotações de moedas
11. impostometro - Widget de impostos
12. cron/publish - Publicação automática

## 🎨 Funcionalidades

### Admin Completo
- Editor visual (TinyMCE)
- Upload de imagem com redimensionamento automático
- 13 categorias + subcategorias
- Sistema de aprovação
- Geração com IA
- Integração Instagram

### Imagens Automáticas
Upload de 1 imagem gera 4 versões:
- destaque.jpg (1200x675)
- card-lg.jpg (800x450)
- card-sm.jpg (400x225)
- insta.jpg (1080x1080)

### Instagram
- Máximo 10 posts/dia
- Fila automática
- Credenciais: ovalorcapital / 2025acabando!

## 🔐 Variáveis de Ambiente

Obrigatórias:
- ADMIN_TOKEN
- GITHUB_TOKEN
- ANTHROPIC_API_KEY

Opcionais:
- INSTAGRAM_USERNAME (padrão: ovalorcapital)
- INSTAGRAM_PASSWORD (padrão: 2025acabando!)

## 🚀 Deploy

Já configurado para deploy automático na Vercel.
