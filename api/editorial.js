import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";

const origin = "https://www.ovalorcapital.com.br";
const sections = new Set(["politica", "economia", "negocios", "financas", "industria", "tecnologia",
  "esportes", "familia", "giro", "internacional", "brasil-on"]);
const financeTopics = new Set(["Renda Fixa", "Bolsa e Ações", "Seguros e Proteção", "Previdência",
  "Fundos e FIIs", "Planejamento Patrimonial", "Criptomoedas"]);

const recentFeeds = new Map();

async function fetchLatest(category, limit) {
  const url = new URL("/api/portal-posts", origin);
  url.search = new URLSearchParams({ recentes: "true", categoria: category, limit });
  const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
  if (!response.ok) throw new Error("Feed indisponível");
  const { posts } = await response.json();
  return posts.filter(post => post.categoria === category && post.titulo?.trim() &&
    /^\/[a-z0-9-]+\/[a-z0-9-]+-[a-f0-9]{8}\/$/.test(post.url));
}

async function latest(category, limit) {
  const key = category + "/" + limit;
  const previous = recentFeeds.get(key);
  if (previous && Date.now() - previous.time < 120000) return previous.posts;
  try {
    const posts = await fetchLatest(category, limit);
    if (posts.length) recentFeeds.set(key, { posts, time: Date.now() });
    return posts;
  } catch {
    return previous && Date.now() - previous.time < 3600000 ? previous.posts : [];
  }
}

function fillCard($, id, post) {
  if (!post) return;
  $("#card-" + id + "-titulo").text(post.titulo.replaceAll("**", ""));
  $("#card-" + id + "-resumo").text(post.resumo || post.comentario_fixado || "");
  $("#card-" + id + "-link").attr("href", post.url);
}

export default async function editorial(req, res) {
  const section = req.query.section || "";
  if (section && !sections.has(section)) return res.status(404).end();
  if (section && (req.query.id || req.query.s)) {
    const { default: category } = await import("./category.js");
    req.query = { ...req.query, cat: section, section: req.query.s || "" };
    return category(req, res);
  }
  const template = await readFile(join(process.cwd(), "public", section, "index.html"), "utf8");
  const $ = load(template);
  const canonical = origin + (section ? "/" + section + "/" : "/");
  $('link[rel="canonical"]').remove();
  $("<link>").attr({ rel: "canonical", href: canonical }).appendTo("head");
  let complete = false;
  if (section) {
    const label = $("title").text().split("|")[0].trim();
    const desc = $('meta[name="description"]').attr("content") || "";
    $(".ovc-hero h1, .ovc-hero .ovc-badge, .ovc-weather .temp").text(label);
    $(".ovc-hero > p").text(desc);
    $("<script>").attr("type", "application/ld+json").text(JSON.stringify({
      "@context": "https://schema.org", "@type": "CollectionPage", name: label, url: canonical
    }).replaceAll("<", "\\u003c")).appendTo("head");
    const posts = await latest(section, 8);
    for (const post of posts) {
      const anchor = $("<a>").attr("href", post.url).text(post.titulo);
      $("<div>").append(anchor).appendTo("[data-main-list]");
    }
    complete = posts.length > 0;
  } else {
    const [politics, business, finance] = await Promise.all([
      latest("politica", 8), latest("negocios", 8), latest("financas", 50)
    ]);
    fillCard($, "hero", politics[0]);
    fillCard($, "feature", business[0]);
    const featuredFinance = finance.find(post => financeTopics.has(post.subcategoria));
    if (featuredFinance) fillCard($, "lions", featuredFinance);
    else $("#card-lions-titulo").text("Finanças e investimentos");
    complete = Boolean(politics.length && business.length);
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", complete ? "public, s-maxage=120, stale-while-revalidate=600, stale-if-error=3600" : "no-store");
  // A temporary feed outage keeps the interactive portal available and asks crawlers to retry.
  if (!complete) res.setHeader("Retry-After", "60");
  return res.status(complete ? 200 : 503).send($.html());
}
