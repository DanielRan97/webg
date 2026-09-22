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

export const RESERVED_SLUGS = new Set(["admin", "api", "app", "login", "signup", "dashboard", "create", "preview"]);

export function isValidSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
