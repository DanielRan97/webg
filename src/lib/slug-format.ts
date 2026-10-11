const HEB: Record<string, string> = {
  א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch", ט: "t", י: "y",
  כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s", ע: "a", פ: "p",
  ף: "f", צ: "tz", ץ: "tz", ק: "k", ר: "r", ש: "sh", ת: "t",
};

/** Hebrew or English business name to a URL slug, e.g. "Daniel Barber" -> "daniel-barber". */
export function slugify(input: string): string {
  const latin = [...input.toLowerCase()].map((ch) => HEB[ch] ?? ch).join("");
  return latin
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// The second line are names that exist (or may exist) as real DNS records under webg.co.il - e.g. send.webg.co.il is
// Resend's bounce domain - so the *.webg.co.il wildcard never reaches them and a Pro site with that slug would not load.
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "login", "signup", "dashboard", "create", "preview",
  "send", "www", "mail", "hello", "support",
]);

/** The Basic-plan public URL prefix, e.g. "webg.co.il/s/daniel-barber". */
export const SLUG_BASE = "webg.co.il/s/";

export function isValidSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
