import "server-only";

/**
 * Israeli cities, areas and streets from the government open-data portal (data.gov.il, the Central
 * Bureau of Statistics lists). Read on the server only and served to the editor through /api/places -
 * the browser never calls data.gov.il itself. The live API is tried first (cached for a day); if it
 * can't be reached from the server (it is slow or blocks some hosting networks), the copy of the same
 * lists bundled in src/data is used instead, so the pickers always have the official list.
 * Refresh that copy with `npm run places:update`.
 */

import { WHOLE_COUNTRY } from "./constants";

const API = "https://data.gov.il/api/3/action/datastore_search";
const CITIES_RESOURCE = "5c78e9fa-c2e2-4771-93ff-7f400a12f7ba";
const STREETS_RESOURCE = "a7296d1a-f8c9-4b70-96c2-6ebb4352f8e3";
const DAY_SECONDS = 60 * 60 * 24;
/** Short on purpose: when the portal is unreachable, the bundled copy answers instead of the owner waiting. */
const LIVE_TIMEOUT_MS = 4_000;

export interface City {
  code: number;
  name: string;
}

export interface Places {
  cities: City[];
  /** "כל הארץ", then districts, sub-districts and regional councils - all derived from the same official list. */
  regions: string[];
}

/** CBS districts: the first digit of a sub-district (נפה) code. */
const DISTRICTS: Record<number, string> = {
  1: "מחוז ירושלים",
  2: "מחוז הצפון",
  3: "מחוז חיפה",
  4: "מחוז המרכז",
  5: "מחוז תל אביב",
  6: "מחוז הדרום",
  7: "יהודה ושומרון",
};

type Row = Record<string, string | number | null>;
/** One locality, compact: [code, name, sub-district code, sub-district name, regional council] - the bundled copy's shape. */
type CityRow = [number, string, number, string, string];

/** The dataset pads names with spaces and uses doubled spaces/odd dashes; tidy them for display. */
const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

async function query(resource: string, params: Record<string, string>): Promise<Row[] | null> {
  // Built by hand: the portal's firewall rejects some encodings of the JSON filter.
  const qs = Object.entries({ resource_id: resource, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  try {
    const res = await fetch(`${API}?${qs}`, { next: { revalidate: DAY_SECONDS }, signal: AbortSignal.timeout(LIVE_TIMEOUT_MS) });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; result?: { records?: Row[] } };
    return json.success && Array.isArray(json.result?.records) ? json.result.records : null;
  } catch {
    return null;
  }
}

const byHebrewName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "he");
const sorted = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b, "he"));

/**
 * Every city/town/village (sorted, without "לא רשום" rows), plus the areas a business can say it covers:
 * the whole country, districts, sub-districts and regional councils. Sub-districts beyond the Green Line
 * are covered by "יהודה ושומרון" rather than listed one by one.
 */
function derivePlaces(rows: CityRow[]): Places {
  const seen = new Set<string>();
  const cities: City[] = [];
  const districts = new Set<string>();
  const subDistricts = new Set<string>();
  const councils = new Set<string>();
  for (const [code, rawName, nafaCode, rawNafa, rawCouncil] of rows) {
    const name = clean(rawName);
    if (code && name && name !== "לא רשום" && !seen.has(name)) {
      seen.add(name);
      cities.push({ code, name });
    }
    const district = DISTRICTS[Math.floor(nafaCode / 10)];
    if (district) districts.add(district);
    const nafa = clean(rawNafa);
    if (nafa && nafaCode && nafaCode < 70) subDistricts.add(`נפת ${nafa}`);
    const council = clean(rawCouncil);
    if (council) councils.add(`מועצה אזורית ${council}`);
  }
  const districtOrder = Object.values(DISTRICTS).filter((d) => districts.has(d));
  return {
    cities: cities.sort(byHebrewName),
    regions: [WHOLE_COUNTRY, ...districtOrder, ...sorted(subDistricts), ...sorted(councils)],
  };
}

async function liveCityRows(): Promise<CityRow[] | null> {
  const rows = await query(CITIES_RESOURCE, { limit: "3000", fields: "סמל_ישוב,שם_ישוב,סמל_נפה,שם_נפה,שם_מועצה" });
  if (!rows?.length) return null;
  return rows.map((r) => [Number(r["סמל_ישוב"]) || 0, clean(r["שם_ישוב"]), Number(r["סמל_נפה"]) || 0, clean(r["שם_נפה"]), clean(r["שם_מועצה"])]);
}

async function bundledCityRows(): Promise<CityRow[]> {
  const { default: data } = await import("@/data/places-cities.json");
  return data.rows as CityRow[];
}

export async function getPlaces(): Promise<Places> {
  return derivePlaces((await liveCityRows()) ?? (await bundledCityRows()));
}

/** Street names in one city (by its CBS code), sorted. The dataset's own locality rows (code 9000+) are left out. */
export async function getStreets(cityCode: number): Promise<string[]> {
  const rows = await query(STREETS_RESOURCE, {
    limit: "5000",
    fields: "שם_רחוב,סמל_רחוב",
    filters: JSON.stringify({ "סמל_ישוב": cityCode }),
  });
  if (rows) {
    const names = rows.filter((r) => Number(r["סמל_רחוב"]) < 9000).map((r) => clean(r["שם_רחוב"])).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, "he"));
  }
  const { default: data } = await import("@/data/places-streets.json");
  return (data.streets as Record<string, string[]>)[String(cityCode)] ?? [];
}

/** Area names (service or delivery) that aren't on the official list - cities, regions or "כל הארץ". */
export async function areasNotInList(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const { cities, regions } = await getPlaces();
  const known = new Set([...regions, ...cities.map((c) => c.name)]);
  return names.filter((n) => !known.has(n.trim()));
}
