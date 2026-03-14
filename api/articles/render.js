// /api/articles/render
// Renderiza um artigo como HTML completo (para indexação e leitura).
// NÃO cria novas APIs (mantém o endpoint e URL), só melhora layout/SEO.

import { readFileSync } from "fs";
import path from "path";

const RAW_URL =
  "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/data/articles.json";

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normSlug(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickAccent(category) {
  const map = {
    vc: "#c6a15b",
    politica: "#b91c1c",
    economia: "#065f46",
    negocios: "#92400e",
    investimentos: "#1d4ed8",
    seguros: "#0e7490",
    mercados: "#334155",
    educacao: "#7c3aed",
    industria: "#6b7280",
    tecnologia: "#2563eb",
    esportes: "#166534",
    saude: "#0f766e",
    familia: "#9f1239",
    tributos: "#b45309",
    regulacao: "#1f2937",
    parcerias: "#0f172a",
  };
  return map[normSlug(category)] || "#c6a15b";
}

async function loadArticles() {
  try {
    const r = await fetch(RAW_URL, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}

  try {
    const fp = path.join(process.cwd(), "data", "articles.json");
    const raw = readFileSync(fp, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
  } catch (e) {}

  return [];
}

export default async function handler(req, res) {
  const slugParam = req.query.slug || "";
  const want = normSlug(slugParam);
  const articles = await loadArticles();

  const article = articles.find((a) => normSlug(a.slug || a.title) === want);

  if (!article) {
    res.status(404).send(
      `<!doctype html><meta charset="utf-8"><title>Artigo não encontrado</title><h1>Artigo não encontrado</h1>`
    );
    return;
  }

  const title = article.title || "O Valor Capital";
  const category = article.category || "";
  const subcategory = article.subcategory || "";
  const accent = pickAccent(category);
  const canonical = `https://www.ovalorcapital.com.br/artigos/${encodeURIComponent(
    article.slug || want
  )}`;

  const metaDesc =
    article.excerpt ||
    (article.content ? String(article.content).slice(0, 160) : "") ||
    "Artigo no O Valor Capital.";

  // Conteúdo em HTML simples (mantém \n como parágrafos)
  const paragraphs = String(article.content || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  // Links internos
  const catSlug = normSlug(category) || "vc";
  const subSlug = normSlug(subcategory);

  const crumbs = [
    { label: "Início", href: "/" },
    { label: category || "Editorial", href: `/${catSlug}/` },
  ];
  if (subcategory) crumbs.push({ label: subcategory, href: `/${catSlug}/${subSlug}/` });
  crumbs.push({ label: title, href: null });

  const breadcrumbHtml = crumbs
    .map((c, i) => {
      const part = c.href && i < crumbs.length - 1 ? `<a href="${c.href}">${escapeHtml(c.label)}</a>` : `<span>${escapeHtml(c.label)}</span>`;
      const sep = i < crumbs.length - 1 ? `<span style="opacity:.55;margin:0 8px">→</span>` : "";
      return part + sep;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)} | O Valor Capital</title>
  <meta name="description" content="${escapeHtml(metaDesc)}"/>
  <link rel="canonical" href="${canonical}"/>
  <meta property="og:title" content="${escapeHtml(title)} | O Valor Capital"/>
  <meta property="og:description" content="${escapeHtml(metaDesc)}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:url" content="${canonical}"/>
  <meta name="theme-color" content="${accent}"/>
  <link rel="stylesheet" href="/css/ovc-pages.css"/>
</head>
<body>
  <header class="header">
    <div class="ticker">
      <div class="container">
        <div class="track">
          <a href="/dados/cotacoes/"><span>Radar OVC</span><span style="opacity:.7">→</span></a>
          <a href="/tv/"><span>TV OVC</span><span style="opacity:.7">→</span></a>
          <a href="/ferramentas/impostometro/"><span>Impostômetro</span><span style="opacity:.7">→</span></a>
          <a href="/anuncie/"><span>Anuncie</span><span style="opacity:.7">→</span></a>
          <a href="/seja-parceiro/"><span>Parcerias</span><span style="opacity:.7">→</span></a>
          <a href="/dados/cotacoes/"><span>Radar OVC</span><span style="opacity:.7">→</span></a>
          <a href="/tv/"><span>TV OVC</span><span style="opacity:.7">→</span></a>
          <a href="/ferramentas/impostometro/"><span>Impostômetro</span><span style="opacity:.7">→</span></a>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="navbar">
        <a class="brand" href="/">
          <div style="width:46px;height:46px;border-radius:12px;display:grid;place-items:center;border:1px solid rgba(198,161,91,.45);background:rgba(15,23,42,.55);font-weight:900;letter-spacing:.08em">VC</div>
          <div>
            <div class="name">O VALOR CAPITAL</div>
            <div class="tag">LIBERDADE ECONÔMICA, FAMÍLIA &amp; PATRIMÔNIO</div>
          </div>
        </a>

        <div class="top-actions">
          <a class="btn" href="/${catSlug}/">Voltar à seção</a>
          <a class="btn primary" href="/newsletter/">Newsletter</a>
          <a class="btn" href="/tv/">TV OVC</a>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb">${breadcrumbHtml}</div>

    <section class="hero" style="background: linear-gradient(135deg, color-mix(in srgb, ${accent} 38%, transparent), rgba(198,161,91,.10));">
      <div class="hero-inner">
        <div>
          <h1 style="font-size:30px">${escapeHtml(title)}</h1>
          <p>${escapeHtml(article.excerpt || "")}</p>
        </div>
        <div class="pills">
          ${category ? `<a class="pill" href="/${catSlug}/">${escapeHtml(category)}</a>` : ""}
          ${subcategory ? `<a class="pill" href="/${catSlug}/${subSlug}/">${escapeHtml(subcategory)}</a>` : ""}
        </div>
      </div>
    </section>

    <section class="grid">
      <aside class="card pad">
        <div class="h2">Contexto</div>
        <div class="notice">
          <div><strong>Autor:</strong> ${escapeHtml(article.author || "Redação OVC")}</div>
          ${article.location ? `<div><strong>Local:</strong> ${escapeHtml(article.location)}</div>` : ""}
          ${article.date ? `<div><strong>Data:</strong> ${escapeHtml(article.date)}</div>` : ""}
        </div>
        <div style="height:12px"></div>
        <div class="h2">Atalhos</div>
        <div class="pills">
          <a class="pill" href="/dados/cotacoes/">Radar OVC</a>
          <a class="pill" href="/ferramentas/impostometro/">Impostômetro</a>
          <a class="pill" href="/tv/">TV OVC</a>
          <a class="pill" href="/anuncie/">Anuncie</a>
        </div>
      </aside>

      <article class="card pad" style="background:rgba(15,23,42,.22); border-color:rgba(148,163,184,.18)">
        <div class="h2">Artigo</div>
        <div style="font-size:16px;line-height:1.7;color:#e5e7eb">
          ${paragraphs || `<p>Conteúdo em desenvolvimento.</p>`}
        </div>
      </article>

      <aside class="card pad">
        <div class="h2">Radar OVC</div>
        <table class="table">
          <tr><td>USD/BRL (PTAX)</td><td data-ptax="USD">—</td></tr>
          <tr><td>EUR/BRL (PTAX)</td><td data-ptax="EUR">—</td></tr>
          <tr><td>Impostômetro</td><td data-impostometro>—</td></tr>
        </table>
        <div style="height:12px"></div>
        <div class="h2">TV OVC</div>
        <div class="tv-embed">
          <iframe src="https://www.youtube.com/embed/live_stream?channel=UCPGHeZIvWh8TxjtbwA6Yc8g" title="TV OVC" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        </div>
      </aside>
    </section>

    <footer class="footer">© ${new Date().getFullYear()} O Valor Capital.</footer>
  </main>

  <script src="/js/ovc-pages.js"></script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
