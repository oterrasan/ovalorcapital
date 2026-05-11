# BUGS CORRIGIDOS — O Valor Capital

> Histórico completo de todos os bugs críticos identificados e corrigidos.
> **Leia antes de qualquer sessão de trabalho.**
> Se você está a ponto de "simplificar" alguma dessas correções — pare. Cada uma delas corrige um bug real que derrubou o portal.

---

## BUG #1 — Artigos antigos abrindo página em branco
**Data:** Mai/2026 | **Arquivo:** `api/article.js` | **PRs:** #33

### Sintoma
Qualquer artigo publicado há mais de 2 dias retornava página completamente em branco. Artigos novos abriam normalmente.

### Causa raiz
O campo `conteudo` de artigos antigos continha HTML bruto com tags `</script>` literais (ex: snippets de código, embeds). Quando esse conteúdo era serializado com `JSON.stringify()` e embutido diretamente em um bloco `<script>` no HTML:

```html
<script>
  window.__ARTICLE_DATA__ = {"titulo":"...","conteudo":"...texto com </script> aqui..."};
</script>
```

O parser HTML do navegador (e do Googlebot) fechava o bloco `<script>` na primeira `</script>` encontrada DENTRO do JSON — quebrando o JavaScript e deixando a página em branco.

### Correção
Função `safeJsonForScript()` adicionada em `api/article.js`:

```js
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")  // </script> nunca vai fechar o bloco
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// Uso:
const dataScript = `<script>window.__ARTICLE_DATA__=${safeJsonForScript(articleData)}</script>`;
const ldScript = `<script type="application/ld+json">${safeJsonForScript(jsonLd)}</script>`;
```

### Regra permanente
**NUNCA** embutir `JSON.stringify()` diretamente em tag `<script>`. Sempre usar `safeJsonForScript()`. Aplica-se a qualquer campo que venha do banco de dados (titulo, conteudo, comentario_fixado, etc.).

---

## BUG #2 — Pipeline retornando `no_valid_news` em 100% das chamadas
**Data:** Mai/2026 | **Arquivo:** `core/rss.js` | **PRs:** #35

### Sintoma
Todas as chamadas automatizadas do GitHub Actions retornavam `{status: 'no_valid_news'}`. O portal gerou apenas 4 artigos em 48 horas com a automação ligada e funcionando tecnicamente.

### Causa raiz
A função `isHoje()` em `core/rss.js` tinha dois erros fatais:

**Erro 1 — Rejeitar itens sem data:**
```js
function isHoje(dateStr) {
  if (!dateStr) return false;  // ← BUG: Google News frequentemente omite pubDate
  // ...
}
```
O Google News é a maior fonte de feeds RSS do portal. Ele frequentemente omite o campo `pubDate`/`isoDate`. Com esse código, 100% dos itens do Google News eram descartados.

**Erro 2 — Rejeitar artigos de ontem:**
A função só aceitava artigos publicados no dia atual (fuso Brasília). Um artigo publicado às 23:59 do dia anterior era rejeitado às 00:01 do dia seguinte — mesmo que tivesse sido publicado há apenas 2 minutos.

### Correção
Função `isRecente()` substituiu `isHoje()` permanentemente:

```js
// core/rss.js
function isRecente(dateStr) {
  if (!dateStr) return true;  // aceita item sem data (Google News)
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;  // data inválida → aceita
    return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;  // últimas 48h
  } catch (_) { return true; }
}
```

### Regra permanente
**NUNCA** reverter para `isHoje()`. `isRecente()` é a função correta e definitiva. Se alguém sugerir filtrar apenas artigos "de hoje", recuse — isso quebra o pipeline inteiro.

---

## BUG #3 — Categorias erradas na geração forçada
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`, `core/rss.js` | **PRs:** #35

### Sintoma
Quando o admin forçava geração para uma categoria específica (ex: "Seguros"), o sistema gerava artigos completamente fora do tema (ex: "O Diabo Veste Prada 2") e os salvava com a categoria forçada (`seguros`). O banco ficou cheio de artigos de entretenimento classificados como finanças.

### Causa raiz
**Causa 1 — Mix de feeds:** Quando `catForcada` era definida, o pipeline buscava feeds da categoria alvo (`getNewsByCategoria('seguros')`) MAS também mesclava com feeds gerais (`getNews()`). Artigos de entretenimento dos feeds gerais entravam no pool e eram forçados para a categoria errada.

**Causa 2 — Sem validação de família:** Não havia checagem de se o conteúdo gerado pela IA era compatível com a categoria forçada. A IA podia classificar o artigo como "cultura" mas o sistema forçava "seguros" sem questionar.

### Correção

**1. Feeds exclusivos quando catForcada definida (`api/run_portal.js`):**
```js
if (catForcada && CATS_VALIDAS.has(catForcada)) {
  news = await getNewsByCategoria(catForcada);  // APENAS feeds da categoria
}
```

**2. Mapa de famílias temáticas `FAMILIA_CAT` (`core/rss.js`):**
```js
export const FAMILIA_CAT = {
  // FINANCAS
  seguros:'financas', investimentos:'financas', economia:'financas',
  mercados:'financas', tributacao:'financas', regulacao:'financas',
  negocios:'financas', imoveis:'financas', parcerias:'financas', esg:'financas',
  // PODER
  politica:'poder', seguranca:'poder', defesa:'poder',
  investigativo:'poder', internacional:'poder',
  // ENTRETENIMENTO
  esportes:'entretenimento', cultura:'entretenimento',
  variedades:'entretenimento', religiao:'entretenimento',
  // CONHECIMENTO
  tecnologia:'conhecimento', educacao:'conhecimento', saude:'conhecimento',
  familia:'conhecimento', profissoes:'conhecimento', industria:'conhecimento',
  // TRABALHO
  vagas:'trabalho', concursos:'trabalho',
};
```

**3. Validação antes de forçar categoria (`api/run_portal.js`):**
```js
const familiaForcada  = FAMILIA_CAT[catForcada];
const familiaConteudo = FAMILIA_CAT[content.categoria];
if (familiaForcada && familiaConteudo && familiaForcada !== familiaConteudo) {
  continue;  // artigo de entretenimento NUNCA vai para categoria financeira
}
content.categoria = catForcada;
```

### Regra permanente
Sempre que adicionar nova categoria ao sistema, adicionar ao `FAMILIA_CAT` com a família correta. As famílias válidas são: `financas`, `poder`, `entretenimento`, `conhecimento`, `trabalho`.

---

## BUG #4 — Subcategoria "Geral" sendo salva no banco
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #35

### Sintoma
Articles eram salvos com `subcategoria: "Geral"` no banco, quebrando a navegação por subcategoria no portal.

### Causa raiz
O dropdown de subcategoria no admin tinha uma opção padrão com texto "Geral" (ou "Qualquer subcategoria"). Quando o admin gerava artigos sem especificar uma subcategoria, o valor literal "Geral" era enviado no body da requisição. O pipeline aceitava esse valor sem questionar e salvava diretamente no banco.

### Correção
```js
// api/run_portal.js
// Trata 'Geral'/'Qualquer' como ausência de subcategoria forçada
const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw)
  ? ''
  : subcatRaw;
```

### Regra permanente
O banco NUNCA deve ter `subcategoria = 'Geral'`. Se o frontend enviar "Geral", tratar como string vazia e deixar a IA ou o `SUBCAT_DEFAULT` definir a subcategoria correta para a categoria.

---

## BUG #5 — Volume de artigos muito baixo (4 artigos em 48h)
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #34

### Sintoma
Com a automação ligada e GitHub Actions rodando, o portal gerou apenas 4 artigos em 48 horas.

### Causa raiz
Combinação de 4 fatores:

1. **BUG #2** (isHoje) descartava 100% dos itens RSS antes de qualquer processamento
2. `targetCount` padrão era `'1'` — cada chamada manual tentava gerar apenas 1 artigo
3. `news.slice(0, 40)` limitava o pool a apenas 40 itens RSS
4. Sem deduplicação de títulos similares → artigos duplicados sobre o mesmo fato consumiam tentativas sem gerar novos artigos

### Correção
```js
// api/run_portal.js

// 1. targetCount padrão aumentado (GitHub Actions sempre passa count=8 explicitamente)
const targetCount = Math.min(parseInt(meta.count || body.count || '5', 10), 8);

// 2. Pool ampliado: 40 → 80 itens
for (const item of news.slice(0, 80)) { ... }

// 3. Deduplicação Jaccard ≥40% em palavras com mais de 4 chars
function tituloSimilar(a, b) {
  const palavras = t => new Set(
    t.toLowerCase().split(/\W+/).filter(w => w.length > 4)
  );
  const pa = palavras(a), pb = palavras(b);
  const intersec = [...pa].filter(w => pb.has(w)).length;
  const uniao = new Set([...pa, ...pb]).size;
  return uniao > 0 && intersec / uniao >= 0.4;
}

// Carrega títulos das últimas 24h para dedup cross-batch
let recentTitles = [];
const { data: rt } = await supabase.from('posts')
  .select('titulo')
  .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
  .limit(300);
recentTitles = (rt || []).map(p => p.titulo || '');
```

### Regra permanente
O GitHub Actions sempre envia `{"count":8}` no body — o `targetCount` padrão só afeta cliques manuais no admin. Nunca deixar o padrão abaixo de 5.

---

## BUG #6 — Sem controle de distribuição horária de posts
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #36

### Sintoma
O pipeline consumia todo o limite diário de forma uniforme, sem respeitar os horários de maior audiência. Posts podiam ser esgotados durante a madrugada quando a audiência é mínima.

### Implementação
Sistema de faixas horárias baseado no horário de Brasília (UTC-3):

```js
// api/run_portal.js
const FAIXAS_HORARIO = [
  { chave: 'POSTS_01_06', hInicio: 1,  hFim: 6,  padrao: 20  },
  { chave: 'POSTS_06_10', hInicio: 6,  hFim: 10, padrao: 40  },
  { chave: 'POSTS_10_12', hInicio: 10, hFim: 12, padrao: 40  },
  { chave: 'POSTS_12_17', hInicio: 12, hFim: 17, padrao: 80  },
  { chave: 'POSTS_17_00', hInicio: 17, hFim: 25, padrao: 120 },
];
```

| Faixa | Posts | Justificativa |
|-------|-------|---------------|
| 01h–06h | 20 | Madrugada — audiência mínima |
| 06h–10h | 40 | Manhã cedo — início do dia |
| 10h–12h | 40 | Manhã — audiência crescendo |
| 12h–17h | 80 | Tarde — pico de leitura |
| 17h–00h | 120 | Noite — maior audiência |

**Configuração:** Supabase → tabela `config` → chaves `POSTS_01_06`, `POSTS_06_10`, `POSTS_10_12`, `POSTS_12_17`, `POSTS_17_00`.
**Sem configuração no banco:** valores padrão acima são usados automaticamente.
**Execuções manuais** (`force=true` ou `batch=true`): ignoram os limites de faixa.

---

## CONFLITO DE MERGE — Branch `claude/review-project-docs-1mLkx`
**Data:** Mai/2026

### O que aconteceu
O branch `claude/review-project-docs-1mLkx` tinha divergido do `main` com versões antigas de 11 arquivos. O PR #32 não podia ser mergeado por conflitos em todos os arquivos.

### Resolução
- PR #32 foi fechado
- Branch limpo `fix/article-script-injection` foi criado diretamente do HEAD do main
- Correção do `api/article.js` foi aplicada nesse branch limpo
- PR #33 foi criado e mergeado sem conflitos

### Lição
Sempre criar branches de feature a partir do HEAD atual do `main`. Branches que ficam muito tempo sem sync com main acumulam conflitos.

---

## CHECKLIST — Antes de qualquer mudança no pipeline

```
□ isRecente() ainda existe em core/rss.js? (não deve ter voltado para isHoje())
□ safeJsonForScript() é usado em todo JSON embutido em <script> no article.js?
□ FAMILIA_CAT está sendo importado e usado na validação de catForcada?
□ Subcategoria 'Geral' está sendo filtrada antes de salvar no banco?
□ FAIXAS_HORARIO ainda está definido e sendo verificado antes de gerar artigos?
□ O GitHub Actions ainda envia count=8 no body?
□ MAX_POSTS_DIA=300 ainda está sendo verificado?
```
