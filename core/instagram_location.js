import { BRAZIL_MUNICIPALITIES } from "./brazil_locations.js";
import { WORLD_CITIES, WORLD_COUNTRIES } from "./world_locations.js";

const STATE_NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins"
};

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MUNICIPALITIES = BRAZIL_MUNICIPALITIES.map(([name, uf]) => ({
  name,
  uf,
  key: normalize(name)
})).filter((item) => item.key.length >= 4);

const STATE_ENTRIES = Object.entries(STATE_NAMES).map(([uf, name]) => ({
  uf,
  name,
  key: normalize(name)
}));

const WORLD_COUNTRY_MAP = new Map(WORLD_COUNTRIES.map(([key, alias, display, code]) => [key, { alias, display, code }]));
const WORLD_CITY_MAP = new Map(WORLD_CITIES.map(([key, alias, canonical, country, code, population]) => [key, { alias, canonical, country, code, population }]));
for (const [alias, canonicalKey] of [
  ["Londres", "london"], ["Nova York", "new york city"], ["Pequim", "beijing"],
  ["Moscou", "moscow"], ["Tóquio", "tokyo"], ["Munique", "munich"],
  ["Genebra", "geneva"], ["Bruxelas", "brussels"], ["Viena", "vienna"],
  ["Varsóvia", "warsaw"], ["Praga", "prague"], ["Atenas", "athens"],
  ["Jerusalém", "jerusalem"], ["Joanesburgo", "johannesburg"],
  ["Cidade do Cabo", "cape town"], ["Seul", "seoul"], ["Xangai", "shanghai"],
  ["Nova Délhi", "new delhi"], ["Daca", "dhaka"], ["Jacarta", "jakarta"],
  ["Cidade do México", "mexico city"], ["Bogotá", "bogota"],
  ["Montevidéu", "montevideo"], ["Assunção", "asuncion"]
]) {
  const target = WORLD_CITY_MAP.get(canonicalKey);
  if (target) WORLD_CITY_MAP.set(normalize(alias), { ...target, alias });
}
const WORLD_COUNTRY_KEYS = [...WORLD_COUNTRY_MAP.keys()].sort((a, b) => b.length - a.length);

function cityScore(text, item, isTitle) {
  const city = escapeRegExp(item.key);
  const uf = item.uf.toLowerCase();
  if (new RegExp(`\\b${city}\\s*(?:,|-|\\()\\s*${uf}\\b`).test(text)) return isTitle ? 130 : 120;
  if (new RegExp(`\\b(?:na cidade de|no municipio de|em|na|no)\\s+${city}\\b`).test(text)) return isTitle ? 100 : 80;
  if (new RegExp(`\\b${city}\\b`).test(text)) {
    const state = STATE_ENTRIES.find((entry) => entry.uf === item.uf);
    if (state && new RegExp(`\\b${escapeRegExp(state.key)}\\b|\\b${uf}\\b`).test(text)) return isTitle ? 90 : 70;
  }
  return 0;
}

function findWorldCountry(text, contextualOnly = false) {
  for (const key of WORLD_COUNTRY_KEYS) {
    const country = escapeRegExp(key);
    const pattern = contextualOnly
      ? new RegExp(`\\b(?:em|na|no|para|d[eo])\\s+(?:o\\s+|a\\s+)?${country}\\b`)
      : new RegExp(`\\b${country}\\b`);
    if (pattern.test(text)) return WORLD_COUNTRY_MAP.get(key);
  }
  return null;
}

function findContextualWorldCity(text, countryHint) {
  const pattern = /\b(?:na cidade de|no municipio de|em|na|no|para)\s+([a-z0-9 ]{4,80})/g;
  for (const match of text.matchAll(pattern)) {
    const words = match[1].trim().split(/\s+/).slice(0, 6);
    for (let size = words.length; size >= 1; size -= 1) {
      const city = WORLD_CITY_MAP.get(words.slice(0, size).join(" "));
      if (city && (!countryHint || city.code === countryHint.code)) return city;
    }
  }
  return null;
}

function findWorldCityWithCountry(text, countryHint) {
  if (!countryHint) return null;
  const words = text.split(/\s+/).filter(Boolean);
  for (let start = 0; start < words.length; start += 1) {
    for (let size = Math.min(5, words.length - start); size >= 1; size -= 1) {
      const city = WORLD_CITY_MAP.get(words.slice(start, start + size).join(" "));
      if (city?.code === countryHint.code) return city;
    }
  }
  return null;
}

export function detectPublicationLocation(title, body) {
  const titleText = normalize(title);
  const bodyText = normalize(String(body || "").slice(0, 1800));
  const candidates = [];

  for (const item of MUNICIPALITIES) {
    const score = Math.max(cityScore(titleText, item, true), cityScore(bodyText, item, false));
    if (score >= 70) candidates.push({ ...item, score });
  }

  candidates.sort((a, b) => b.score - a.score || b.key.length - a.key.length);
  if (candidates.length) {
    const best = candidates[0];
    const tied = candidates.some((item, index) => index > 0 && item.score === best.score && item.key !== best.key);
    if (!tied) return `${best.name}, ${best.uf}`;
  }

  const combined = `${titleText} ${bodyText}`;
  for (const state of STATE_ENTRIES) {
    const stateName = escapeRegExp(state.key);
    if (new RegExp(`\\b(?:no estado d[eo]|no|na|em)\\s+${stateName}\\b`).test(combined)) return state.name;
  }

  const country = findWorldCountry(titleText) || findWorldCountry(bodyText, true);
  const city = findContextualWorldCity(titleText, country)
    || findWorldCityWithCountry(titleText, country)
    || findContextualWorldCity(bodyText, country);
  if (city) return `${city.alias}, ${country?.display || city.country}`;
  if (country) return country.display;
  return null;
}
