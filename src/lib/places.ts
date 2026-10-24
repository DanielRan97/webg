import "server-only";

/**
 * Israeli cities and streets from the government open-data portal (data.gov.il, the Central Bureau of
 * Statistics lists). Fetched on the server only, cached for a day, and served to the editor through
 * /api/places - the browser never calls data.gov.il itself. Any failure returns null, and the form
 * then simply falls back to free text.
 */

const API = "https://data.gov.il/api/3/action/datastore_search";
const CITIES_RESOURCE = "5c78e9fa-c2e2-4771-93ff-7f400a12f7ba";
const STREETS_RESOURCE = "a7296d1a-f8c9-4b70-96c2-6ebb4352f8e3";
const DAY_SECONDS = 60 * 60 * 24;

export interface City {
  code: number;
  name: string;
}

type Row = Record<string, string | number | null>;

/** The dataset pads names with spaces and uses doubled spaces/odd dashes; tidy them for display. */
const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

async function query(resource: string, params: Record<string, string>): Promise<Row[] | null> {
  // Built by hand: the portal's firewall rejects some encodings of the JSON filter.
  const qs = Object.entries({ resource_id: resource, ...params })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  try {
    const res = await fetch(`${API}?${qs}`, { next: { revalidate: DAY_SECONDS }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; result?: { records?: Row[] } };
    return json.success && Array.isArray(json.result?.records) ? json.result.records : null;
  } catch {
    return null;
  }
}

const byHebrewName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "he");

/** Every city/town/village, sorted by name. Rows without a real name ("לא רשום") are dropped. */
export async function getCities(): Promise<City[] | null> {
  const rows = await query(CITIES_RESOURCE, { limit: "3000", fields: "סמל_ישוב,שם_ישוב" });
  if (!rows) return null;
  const seen = new Set<string>();
  const out: City[] = [];
  for (const r of rows) {
    const code = Number(r["סמל_ישוב"]);
    const name = clean(r["שם_ישוב"]);
    if (!code || !name || name === "לא רשום" || seen.has(name)) continue;
    seen.add(name);
    out.push({ code, name });
  }
  return out.sort(byHebrewName);
}

/** Street names in one city (by its CBS code), sorted. The dataset's own city-name rows are left out. */
export async function getStreets(cityCode: number): Promise<string[] | null> {
  const rows = await query(STREETS_RESOURCE, {
    limit: "5000",
    fields: "שם_רחוב,סמל_רחוב",
    filters: JSON.stringify({ "סמל_ישוב": cityCode }),
  });
  if (!rows) return null;
  // Code 9000+ marks the locality itself rather than a street.
  const names = rows.filter((r) => Number(r["סמל_רחוב"]) < 9000).map((r) => clean(r["שם_רחוב"])).filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "he"));
}
