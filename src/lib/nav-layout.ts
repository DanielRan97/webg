import type { TemplateId } from "./constants";

/**
 * Where each part of a website's top bar sits: one of three zones (in RTL, "start" is the right edge)
 * or hidden. Stored on the site as a short string (`navLayout`); an empty value means "use the
 * template's own default", so existing sites and owners who never touch it keep each template's look.
 * The call button ("call") only shows on phones, and only when the site has a phone number.
 */
export const NAV_PARTS = ["logo", "name", "menu", "call"] as const;
export type NavPart = (typeof NAV_PARTS)[number];

export const NAV_SLOTS = ["start", "center", "end"] as const;
export type NavSlot = (typeof NAV_SLOTS)[number] | "off";

export type NavLayout = Record<NavPart, NavSlot>;

export const NAV_PART_LABELS: Record<NavPart, string> = { logo: "לוגו", name: "שם העסק", menu: "תפריט", call: "כפתור התקשרו" };
export const NAV_SLOT_LABELS: Record<(typeof NAV_SLOTS)[number], string> = { start: "ימין", center: "מרכז", end: "שמאל" };

const STANDARD: NavLayout = { logo: "start", name: "start", menu: "end", call: "end" };

/** Each template's own header arrangement - what an untouched site shows. */
export const TEMPLATE_NAV_DEFAULTS: Record<TemplateId, NavLayout> = {
  modern: STANDARD,
  elegant: { logo: "start", name: "start", menu: "center", call: "end" },
  minimal: { logo: "off", name: "start", menu: "end", call: "end" },
  bold: STANDARD,
  dark: STANDARD,
  noble: STANDARD,
  luxe: STANDARD,
};

const SLOT_VALUES: readonly string[] = [...NAV_SLOTS, "off"];

/**
 * "logo:start,name:start,menu:end,call:end" - every part listed exactly once with a known slot. Layouts
 * saved before the call button could be placed have no "call" pair; they stay valid and keep it at the end.
 */
export function isValidNavLayout(raw: string): boolean {
  if (raw === "") return true;
  const pairs = raw.split(",");
  if (pairs.length !== NAV_PARTS.length && !(pairs.length === NAV_PARTS.length - 1 && !raw.includes("call:"))) return false;
  const seen = new Set<string>();
  for (const pair of pairs) {
    const [part, slot] = pair.split(":");
    if (!(NAV_PARTS as readonly string[]).includes(part) || !SLOT_VALUES.includes(slot) || seen.has(part)) return false;
    seen.add(part);
  }
  return true;
}

export function templateNavDefault(templateId: string): NavLayout {
  return TEMPLATE_NAV_DEFAULTS[templateId as TemplateId] ?? STANDARD;
}

/** The layout a site actually shows: its own saved choice, or its template's default. */
export function resolveNavLayout(raw: string | null | undefined, templateId: string): NavLayout {
  if (!raw || !isValidNavLayout(raw)) return templateNavDefault(templateId);
  const out = { ...STANDARD };
  for (const pair of raw.split(",")) {
    const [part, slot] = pair.split(":") as [NavPart, NavSlot];
    out[part] = slot;
  }
  return out;
}

export function serializeNavLayout(layout: NavLayout): string {
  return NAV_PARTS.map((p) => `${p}:${layout[p]}`).join(",");
}
