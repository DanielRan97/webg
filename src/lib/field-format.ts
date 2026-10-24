/**
 * Format checks for free-text fields (phone, email, price, date), shared by the wizard's live
 * validation, the public contact/lead forms and the server-side zod schemas so the three never
 * disagree. Each returns a short Hebrew problem, or undefined when the value is fine. Empty is
 * always fine here - whether a field is required is decided by the caller.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function phoneProblem(v: string): string | undefined {
  const value = v.trim();
  if (!value) return undefined;
  if (/[^\d\s\-+()]/.test(value)) return "אפשר לכתוב רק מספרים. לדוגמה: 050-1234567";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 13) return "המספר נראה קצר או ארוך מדי. לדוגמה: 050-1234567";
  return undefined;
}

export function emailProblem(v: string): string | undefined {
  const value = v.trim();
  if (!value) return undefined;
  if (!EMAIL_RE.test(value)) return "כתובת האימייל לא נראית תקינה. לדוגמה: name@gmail.com";
  return undefined;
}

/** Prices that honestly have no number. */
const PRICE_WORDS = /חינם|ללא (?:עלות|תשלום)|הצעת מחיר|בתיאום|משתנה/;

/**
 * A price must contain a number, so "70 ₪", "החל מ-250 ₪", "120-150" and "₪45.90" pass, while a
 * price with no digits ("זול", "נדבר") is caught. Short wording around the number stays allowed
 * on purpose - owners write "החל מ-" or "לק״ג" - and so do the few honest no-number prices
 * ("חינם", "לפי הצעת מחיר").
 */
export function priceProblem(v: string): string | undefined {
  const value = v.trim();
  if (!value) return undefined;
  if (!/\d/.test(value) && !PRICE_WORDS.test(value)) return "נא לכתוב מחיר במספרים, לדוגמה: 70 ₪ או החל מ-250 ₪. אפשר גם ״חינם״ או ״לפי הצעת מחיר״.";
  return undefined;
}

const MIN_YEAR = 1950;
/** "Still here" instead of an end date. */
const NOW_WORDS = /^(?:עד\s*)?(?:היום|כיום|עכשיו|הווה)$|^present$/i;

/**
 * Dates on a CV-style entry: a year ("2021"), a month and year ("03/2021", "מרץ 2021"), or a range
 * ("2018 - 2021"). Every four-digit year must be between 1950 and next year, and a range must not
 * end before it starts.
 */
export function dateProblem(v: string, opts: { allowRange?: boolean } = {}): string | undefined {
  const value = v.trim();
  if (!value || NOW_WORDS.test(value)) return undefined;
  const years = [...value.matchAll(/\d+/g)].map((m) => m[0]).filter((n) => n.length === 4).map(Number);
  if (years.length === 0) return opts.allowRange ? "נא לכתוב שנה. לדוגמה: 2018 - 2021" : "נא לכתוב שנה. לדוגמה: 2021 או 03/2021";
  const maxYear = new Date().getFullYear() + 1;
  if (years.some((y) => y < MIN_YEAR || y > maxYear)) return `השנה צריכה להיות בין ${MIN_YEAR} ל-${maxYear}.`;
  if (!opts.allowRange && years.length > 1) return "נא לכתוב תאריך אחד. לדוגמה: 03/2021";
  if (years.length > 2) return "נא לכתוב טווח של שתי שנים. לדוגמה: 2018 - 2021";
  if (years.length === 2 && years[1] < years[0]) return "שנת הסיום צריכה להיות אחרי שנת ההתחלה.";
  const months = [...value.matchAll(/(?:^|\D)(\d{1,2})\s*[/.\-]\s*\d{4}/g)].map((m) => Number(m[1]));
  if (months.some((m) => m < 1 || m > 12)) return "החודש צריך להיות בין 1 ל-12. לדוגמה: 03/2021";
  return undefined;
}

/** Start/end pair kept as two fields (work experience): the end must not come before the start. */
export function dateOrderProblem(start: string, end: string): string | undefined {
  const year = (s: string) => Number([...s.matchAll(/\d{4}/g)].at(-1)?.[0] ?? NaN);
  const a = year(start);
  const b = year(end);
  if (Number.isFinite(a) && Number.isFinite(b) && b < a) return "תאריך הסיום צריך להיות אחרי תאריך ההתחלה.";
  return undefined;
}

/**
 * Online booking services a "קביעת תור" link may point to. The booking button is a promise to the
 * visitor ("book here"), so it may only lead to a real scheduling page, never to an arbitrary site.
 * A host matches itself and its subdomains (e.g. "salon.simplybook.me").
 */
export const BOOKING_HOSTS = [
  "calendly.com", "cal.com", "acuityscheduling.com", "as.me", "setmore.com", "simplybook.me", "simplybook.it",
  "booksy.com", "fresha.com", "square.site", "squareup.com", "youcanbook.me", "picktime.com", "appointy.com",
  "tidycal.com", "zcal.co", "savvycal.com", "vagaro.com", "gettimely.com", "setster.com", "calmark.co.il",
  "calendar.app.google", "outlook.office.com", "outlook.office365.com",
] as const;

/** The names shown to owners when a link is refused. */
export const BOOKING_SERVICE_EXAMPLES = "Calendly, Cal.com, Setmore, SimplyBook, Booksy, Fresha, Calmark או יומן תורים של Google";

export function bookingLinkProblem(v: string): string | undefined {
  const value = v.trim();
  if (!value) return undefined;
  let host: string;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    host = url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "הקישור לא נראה תקין. לדוגמה: calendly.com/השם-שלכם";
  }
  const google = host === "calendar.google.com" && /\/calendar\/(u\/\d+\/)?appointments\//.test(value);
  if (google || BOOKING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return undefined;
  return `אפשר לקשר רק לעמוד של שירות לקביעת תורים, כמו ${BOOKING_SERVICE_EXAMPLES}. משתמשים בשירות אחר? כתבו לנו ונוסיף אותו.`;
}

/** "הרצל 10" -> street "הרצל", number "10". A number may carry a letter or a slash ("12א", "4/2"). */
export function splitAddress(address: string): { street: string; number: string } {
  const m = address.trim().match(/^(.*\S)\s+(\d+[א-ת]?(?:\/\d+)?)$/);
  return m ? { street: m[1], number: m[2] } : { street: address.trim(), number: "" };
}
