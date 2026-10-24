// Refreshes the bundled copy of Israel's official city and street lists (data.gov.il, CBS) that
// src/lib/places.ts falls back to when the live API can't be reached from the server.
// Run: npm run places:update   (then commit src/data/places-cities.json and src/data/places-streets.json)
import { writeFileSync, mkdirSync } from "node:fs";

const API = "https://data.gov.il/api/3/action/datastore_search";
const CITIES = "5c78e9fa-c2e2-4771-93ff-7f400a12f7ba";
const STREETS = "a7296d1a-f8c9-4b70-96c2-6ebb4352f8e3";
const PAGE = 10000;

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

async function page(resource, fields, offset) {
  // Built by hand: the portal's firewall rejects some encodings.
  const qs = [`resource_id=${resource}`, `limit=${PAGE}`, `offset=${offset}`, `fields=${encodeURIComponent(fields)}`].join("&");
  const res = await fetch(`${API}?${qs}`);
  if (!res.ok) throw new Error(`${resource} offset ${offset}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`${resource} offset ${offset}: not successful`);
  return { records: json.result.records, total: json.result.total };
}

async function all(resource, fields) {
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const { records, total } = await page(resource, fields, offset);
    out.push(...records);
    if (out.length >= total || records.length === 0) return out;
  }
}

const cityRows = await all(CITIES, "סמל_ישוב,שם_ישוב,סמל_נפה,שם_נפה,שם_מועצה");
// Compact rows: [code, name, sub-district code, sub-district name, regional council].
const cities = cityRows.map((r) => [Number(r["סמל_ישוב"]) || 0, clean(r["שם_ישוב"]), Number(r["סמל_נפה"]) || 0, clean(r["שם_נפה"]), clean(r["שם_מועצה"])]);

const streetRows = await all(STREETS, "סמל_ישוב,סמל_רחוב,שם_רחוב");
const streets = {};
for (const r of streetRows) {
  // Code 9000+ marks the locality itself rather than a street.
  if (Number(r["סמל_רחוב"]) >= 9000) continue;
  const name = clean(r["שם_רחוב"]);
  if (!name) continue;
  (streets[Number(r["סמל_ישוב"])] ??= new Set()).add(name);
}
const streetsOut = Object.fromEntries(Object.entries(streets).map(([code, set]) => [code, [...set].sort((a, b) => a.localeCompare(b, "he"))]));

mkdirSync("src/data", { recursive: true });
const updatedAt = new Date().toISOString().slice(0, 10);
writeFileSync("src/data/places-cities.json", JSON.stringify({ updatedAt, rows: cities }));
writeFileSync("src/data/places-streets.json", JSON.stringify({ updatedAt, streets: streetsOut }));
console.log(`cities: ${cities.length} rows, streets: ${Object.keys(streetsOut).length} localities / ${streetRows.length} rows (${updatedAt})`);
