// /api/articles/list
// Retorna uma lista filtrável de artigos a partir de data/articles.json (raw no GitHub).
// NÃO cria novas APIs (mantém o endpoint), só amplia filtros e robustez.

import { readFileSync } from "fs";
import path from "path";

const RAW_URL =
  "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/data/articles.json";

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

function safeInt(v, def, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

async function loadArticles() {
  // 1) Preferência: GitHub raw (produção)
  try {
    const r = await fetch(RAW_URL, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    // ignora e faz fallback
  }

  // 2) Fallback: arquivo local (desenvolvimento / zip)
  try {
    const fp = path.join(process.cwd(), "data", "articles.json");
    const raw = readFileSync(fp, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
  } catch (e) {}

  return [];
}

export default async function handler(req, res) {
  const limit = safeInt(req.query.limit, 24, 1, 200);
  const category = normSlug(req.query.category || "");
  const subcategory = normSlug(req.query.subcategory || "");
  const q = String(req.query.q || "").trim().toLowerCase();

  const articles = await loadArticles();

  let items = articles.map((a) => {
    const cat = normSlug(a.category || "");
    const sub = normSlug(a.subcategory || "");
    const slug = a.slug || normSlug(a.title || "");
    return {
      ...a,
      slug,
      category: cat || a.category || "",
      subcategory: sub || a.subcategory || "",
      _search: (
        (a.title || "") +
        " " +
        (a.excerpt || "") +
        " " +
        (a.content || "")
      )
        .toLowerCase()
        .slice(0, 4000),
    };
  });

  if (category) items = items.filter((it) => normSlug(it.category) === category);
  if (subcategory)
    items = items.filter((it) => normSlug(it.subcategory) === subcategory);

  if (q) {
    items = items.filter((it) => it._search.includes(q));
  }

  // Ordena por data (se existir), mais recente primeiro
  items.sort((a, b) => {
    const da = Date.parse(a.date || "") || 0;
    const db = Date.parse(b.date || "") || 0;
    return db - da;
  });

  items = items.slice(0, limit).map(({ _search, ...rest }) => rest);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({ ok: true, total: items.length, items });
}
