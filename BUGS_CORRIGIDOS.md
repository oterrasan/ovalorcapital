# BUGS CORRIGIDOS — O Valor Capital

> Histórico completo de todos os bugs críticos identificados e corrigidos.
> **Leia antes de qualquer sessão de trabalho.**
> Se você está a ponto de "simplificar" alguma dessas correções — pare. Cada uma delas corrige um bug real que derrubou o portal.

---

## BUG #1 — Artigos antigos abrindo página em branco
**Data:** Mai/2026 | **Arquivo:** `api/article.js`

### Sintoma
Qualquer artigo publicado há mais de 2 dias retornava página completamente em branco.

### Causa raiz
`conteudo` de artigos antigos tinha `</script>` literais. Embutido em `JSON.stringify()` dentro de `<script>` → parser do browser fechava o bloco → JS quebrava.

### Correção
```js
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
```

### Regra permanente
**NUNCA** embutir `JSON.stringify()` diretamente em tag `<script>`. Sempre usar `safeJsonForScript()`.

---

## BUG #2 — Pipeline retornando `no_valid_news` em 100% das chamadas
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Causa raiz
`isHoje()` rejeitava itens sem data (Google News omite pubDate) e artigos de ontem.

### Correção
```js
function isRecente(dateStr) {
  if (!dateStr) return true;
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;
    return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;
  } catch (_) { return true; }
}
```

### Regra permanente
**NUNCA** reverter para `isHoje()`. `isRecente()` é a função correta e definitiva.

---

## BUG #3 — Categorias erradas na geração forçada
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`, `core/rss.js`

### Causa raiz
Quando `catForcada` era definida, pipeline mesclava feeds da categoria alvo com feeds gerais. Sem validação de família temática.

### Correção
1. Feeds exclusivos quando `catForcada`
2. Mapa `FAMILIA_CAT` exportado de `core/rss.js`
3. Validação: se família do conteúdo gerado ≠ família da categoria forçada → descarta

### Regra permanente
Ao adicionar nova categoria, adicionar ao `FAMILIA_CAT` com a família correta.

---

## BUG #4 — Subcategoria "Geral" sendo salva no banco
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Correção
```js
const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw)
  ? '' : subcatRaw;
```

### Regra permanente
O banco NUNCA deve ter `subcategoria = 'Geral'`.

---

## BUG #5 — Volume de artigos muito baixo (4 artigos em 48h)
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Causa raiz
`targetCount` padrão = 1, pool de 40 itens, sem dedup de títulos, combinado com BUG #2.

### Correção
```js
const targetCount = Math.min(parseInt(meta.count || body.count || '5', 10), 8);
for (const item of news.slice(0, 80)) { ... }  // pool 40 → 80
// Dedup Jaccard ≥40% em palavras >4 chars
```

### Regra permanente
GitHub Actions sempre envia `{"count":8}`. Padrão nunca abaixo de 5.

---

## BUG #6 — Sem controle de distribuição horária de posts
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Causa raiz
Cron esgotava o limite diário (300 posts) nas primeiras horas da madrugada.

### Correção — Faixas horárias (Brasília UTC-3)
```js
const FAIXAS_HORARIO = [
  { chave: 'POSTS_01_06', hInicio: 1,  hFim: 6,  padrao: 20  },
  { chave: 'POSTS_06_10', hInicio: 6,  hFim: 10, padrao: 40  },
  { chave: 'POSTS_10_12', hInicio: 10, hFim: 12, padrao: 40  },
  { chave: 'POSTS_12_17', hInicio: 12, hFim: 17, padrao: 80  },
  { chave: 'POSTS_17_00', hInicio: 17, hFim: 25, padrao: 120 },
];
```
`force=true` ou `batch=true` ignoram todas as faixas.

### Regra permanente
Nunca remover o bloco de faixas horárias sem criar mecanismo equivalente.

---

## BUG #7 — Geração manual sempre falhava silenciosamente (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `api/manage.js`

### Causa raiz
`validar()` tinha `if (!c.includes("redação ovc")) return false;` — a IA nunca escreve isso. 100% das gerações eram rejeitadas silenciosamente.

### Correção
Linha removida. Validação verifica apenas título, comprimento mínimo e palavras proibidas.

### Regra permanente
**NUNCA** exigir strings fixas da IA no corpo do artigo.

### ⚠️ REGRESSÃO REGISTRADA — 14/mai/2026
A linha `if (!c.includes("redação ovc")) return false;` voltou ao código em alguma sessão e ficou por ~1 semana matando 100% das gerações manuais do admin. Corrigida novamente em 14/mai/2026. **NUNCA mais colocar essa linha de volta.**

---

## BUG #8 — Botão "Forçar Execução" enviava GET sem body
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Causa raiz
`fetch('/api/run_portal')` sem método POST → body ignorado → `force=false`.

### Correção
```js
fetch('/api/run_portal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ force: true, count: 3 }) })
```

### Regra permanente
Todo fetch para `/api/run_portal` que pretende forçar execução DEVE ser POST com `{force:true}`.

---

## BUG #9 — Tabela de posts no admin usava coluna inexistente
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Causa raiz
Usava `p.categoria`. A coluna `categoria` não existe em `posts`. A categoria fica em `user_tags`.

### Correção
```js
.select('id,titulo,user_tags,publish_method,created_at,status')
function getCat(post) {
  try { return JSON.parse(post.user_tags || '[]')[0] || '—'; } catch(_) { return '—'; }
}
```

### Regra permanente
**NUNCA usar `p.categoria`** — a coluna não existe. Sempre usar `user_tags` com parse JSON.

---

## BUG #10 — getNews() sem fallback real quando rss_sources falha
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Causa raiz
Se `rss_sources` retornava 0 itens (rate-limit), função retornava array vazio sem tentar feeds hardcoded.

### Correção
`buscarFeedsDiretos()` com fallback duplo.

### Regra permanente
`getNews()` NUNCA deve retornar array vazio se os feeds hardcoded existem.

---

## BUG #11 — Scraper retornava texto vazio para maioria dos sites
**Data:** Mai/2026 | **Arquivo:** `core/scraper.js`

### Causa raiz
Scraper usava apenas `$('p')` → falha em layouts div-based, JS-rendered e paywalls.

### Correção — 3 camadas
1. Seletores semânticos (`article p`, `[class*="content"] p`, etc.)
2. Fallback para divs quando `<p>` insuficiente
3. `og:description` + `og:title` como último recurso

### Regra permanente
**Nunca simplificar para apenas `$('p')`** — quebra 70%+ dos sites brasileiros.

---

## BUG #12 — `no_news` persistente apesar do fallback (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `core/rss.js` | **Commit:** `65928cb`

### Causa raiz
Fallback do BUG #10 usava `selecionarFeedsBalanceados()` que podia sortear 100% Google News → mesmo rate-limit.

### Solução definitiva
`getNews()` SEMPRE mistura feeds customizados com `FEEDS_DIRETOS_GARANTIDOS` na primeira tentativa:
```js
const feedsParaUsar = [...feedsCustom, ...feedsGarantidos];
```

### Regra permanente
**`getNews()` deve SEMPRE misturar `FEEDS_DIRETOS_GARANTIDOS` na 1a tentativa.** Nunca depender só de `rss_sources`.

---

## BUG #13 — Pipeline salvava como `pendente` — portal sem artigos por ~3 dias (CRÍTICO)
**Data:** 14/Mai/2026 | **Arquivos:** `api/run_portal.js`, `api/manage.js`

### Causa raiz
Ambos salvavam `status: 'pendente'`, `approved: false`. `portal-posts.js` filtra só por `status = 'publicado'`. Resultado: artigos invisíveis indefinidamente.

### Correção
```js
const now = new Date().toISOString();
{ status: 'publicado', approved: true, published_at: now }
```

### Regra permanente
**Todo INSERT em `posts` pelo pipeline ou admin DEVE usar `status:'publicado'`, `approved:true`, `published_at:now`.** Nunca salvar como `pendente` sem fluxo de aprovação implementado.

---

## BUG #14 — Links antigos `?id=` abriam página de categoria vazia
**Data:** 14/Mai/2026 | **Arquivo:** `api/category.js`

### Causa raiz
URL `/esportes/?id=dc226eae` chegava em `category.js`, que ignorava o `?id=` e servia o template. O JS do frontend fazia fetch por ID, recebia 404 (artigos em pendente), silenciava o erro → página branca.

### Correção
```js
export default async function handler(req, res) {
  const artId = (req.query.id || "").trim();
  if (artId) {
    return res.redirect(302, "/og?id=" + encodeURIComponent(artId));
  }
  // ...resto do handler
}
```

### Regra permanente
`api/category.js` deve SEMPRE redirecionar `?id=` para `/og?id=` antes de qualquer lógica de categoria.

---

## BUG #15 — /vc/ mostrava conteúdo sem sentido ou vazio
**Data:** 14/Mai/2026 | **Arquivo:** `api/landing.js`

### Sintoma
A página `/vc/` mostrava artigos completamente fora de contexto, ou ficava vazia.

### Causa raiz
O objeto `vc` em `SECTIONS` de `api/landing.js` tinha `cats: ["vc", "colunistas"]`. A query buscava artigos com `user_tags` contendo `"vc"` ou `"colunistas"`. O pipeline automático **nunca** gera artigos com essas tags — elas são reservadas para conteúdo de colunistas humanos. O banco tinha artigos antigos com essas tags de operações anteriores, resultando em conteúdo aleatório e sem sentido na seção "Opinião & Análise".

Além disso, a função `renderEditorial()` aplicava o badge "Opinião" em cima de qualquer artigo retornado, mesmo que fossem notícias genéricas.

### Correção
```js
// ANTES (errado):
vc: { cats: ["vc", "colunistas"], ... }

// DEPOIS (correto):
vc: {
  title: "Variedades & Editorial",
  desc: "Investigação jornalística, cultura, variedades e análises.",
  cats: ["investigativo", "variedades", "cultura"],
  ...
}
```
A função `renderEditorial()` foi removida. A seção `/vc/` agora usa `renderLanding()` padrão com categorias que o pipeline efetivamente popula.

### Regra permanente
- **`vc` e `colunistas` NÃO são categorias do pipeline automático.** O pipeline nunca gera artigos com essas tags.
- A landing page `/vc/` deve usar cats que o pipeline efetivamente usa (`investigativo`, `variedades`, `cultura`).
- Se Roberto quiser criar uma seção de colunistas humanos no futuro, ela requer fluxo próprio de publicação manual — não o pipeline automático.

---

## BUG #16 — Footer de landing pages sem copyright 2026 e links institucionais
**Data:** 14/Mai/2026 | **Arquivo:** `api/landing.js`

### Sintoma
As landing pages (`/vc/`, `/trabalho/`, `/financas/`, `/moradia/`, `/seguranca/`, `/bem-estar/`) tinham footer antigo sem: copyright 2026, link "Quem Somos", link "Política Editorial", badge HTTPS, disclaimer editorial.

### Causa raiz
O `newsletter-bar.js` — que patcha o footer via JavaScript — funciona APENAS em páginas com `<footer class="footer">` e `.footer-bottom` no HTML estático. As landing pages são geradas 100% por `api/landing.js` e têm footer inline sem essas classes CSS. O newsletter-bar.js não é carregado nessas páginas.

### Correção
Atualização direta de `buildFooter()` em `api/landing.js`:
```js
function buildFooter(){
  return `<footer style="background:#0f172a;...">
    © 2026 O Valor Capital — Redação OVC. Todos os direitos reservados. 🔒 HTTPS
    <a href="/quem-somos/">Quem Somos</a>
    <a href="/politica-editorial/">Política Editorial</a>
    ...
    Responsável editorial: Roberto Cesar Terrasan.
  </footer>`;
}
```

### Regra permanente
- **Qualquer mudança no footer das landing pages DEVE ser feita diretamente em `buildFooter()` em `api/landing.js`.**
- O `newsletter-bar.js` NÃO funciona em landing pages — não tentar usá-lo para esse fim.
- Footer de páginas de categoria/homepage: atualizar via `newsletter-bar.js` OU nos templates estáticos `public/[cat]/index.html` (requer edição manual de cada arquivo).

---

## BUG #17 — Regressão do Bug #7 — geração manual parada por ~1 semana (CRÍTICO)
**Data:** 14/Mai/2026 | **Arquivo:** `api/manage.js`

### Sintoma
Admin não gerava nenhuma matéria manual há aproximadamente 1 semana. Nenhum erro visível — falha silenciosa.

### Causa raiz
A linha `if (!c.includes("redação ovc")) return false;` voltou para dentro da função `validar()` em `api/manage.js` em alguma sessão anterior. A IA **nunca** escreve essa string no corpo do artigo, logo 100% das validações falhavam silenciosamente.

### Correção
Linha removida novamente. Função `validar()` correta:
```js
function validar(content) {
  if (!content?.titulo || !content?.corpo) return false;
  const t = content.titulo.toLowerCase().trim();
  const c = content.corpo.toLowerCase();
  const proibidos = ["prezado","caro usuário","olá,","atenção:","dear","editor(a)"];
  if (proibidos.some(p => t.startsWith(p) || c.slice(0,100).includes(p))) return false;
  if (content.corpo.length < 500) return false;
  return true;  // NUNCA adicionar checagem de string fixa da IA aqui
}
```

### Regra permanente
**ABSOLUTAMENTE NUNCA** adicionar `c.includes("qualquer string fixa")` dentro de `validar()`. A IA não produz strings deterministas. Isso mata 100% das gerações sem erro visível.

---

## CHECKLIST — Antes de qualquer mudança no pipeline

```
□ isRecente() ainda existe em core/rss.js? (não deve ter voltado para isHoje())
□ safeJsonForScript() é usado em todo JSON embutido em <script>?
□ FAMILIA_CAT está sendo importado e usado na validação de catForcada?
□ Subcategoria 'Geral' está sendo filtrada antes de salvar no banco?
□ FAIXAS_HORARIO definido e verificado antes de gerar artigos?
□ O GitHub Actions ainda envia count=8 no body?
□ MAX_POSTS_DIA=300 ainda está sendo verificado?
□ validar() em manage.js NÃO exige strings fixas da IA no corpo?
□ validar() em manage.js NÃO tem c.includes("redação ovc")? (Bug #7 ja regrediu 2x)
□ forçarExecucao() em automacao.html envia POST com {force:true, count:3}?
□ automacao.html usa user_tags (não categoria) no select e na tabela?
□ getNews() mistura feedsCustom + feedsGarantidos na 1a tentativa?
□ getNews() tem fallback total com FEEDS_DIRETOS_GARANTIDOS se allItems=[]?
□ scraper.js tem 3 camadas de extração (p → div → og:meta)?
□ Todo INSERT em posts usa status:'publicado', approved:true, published_at:now?
□ category.js redireciona ?id= para /og?id= antes de qualquer lógica?
□ api/landing.js vc section usa cats: ["investigativo","variedades","cultura"]?
□ api/landing.js buildFooter() tem copyright 2026 + links institucionais?
□ newsletter-bar.js NÃO é usado para patchear footer de landing pages?
```
