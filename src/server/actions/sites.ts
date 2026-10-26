"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { AUTOSAVE_DOMAINS, PLAN, SUBSCRIPTION_STATUS, WEBSITE_STATUS, type AutosaveDomain, type Plan } from "@/lib/constants";
import { isValidSlug } from "@/lib/slug";
import { areasNotInList, getPlaces, getStreets } from "@/lib/places";
import { normalizeContact, splitAddress } from "@/lib/field-format";
import { unverifiedContacts } from "../contact-verification";
import { draftSiteSchema, siteSchema } from "@/lib/validation";
import { INQUIRY_DELIVERY, PRO_TEMPLATE_PUBLISH_ERROR, isPro, needsProToPublish } from "@/lib/plan";
import type { SiteData } from "@/types/site";
import { getGateway, hasPaidPeriod, setCancelAtPeriodEnd, startCheckout, upgradeWithCardOnFile } from "../billing";
import {
  ProRequiredError,
  SlugError,
  autosaveWebsiteDraft,
  createDraftWebsite,
  deleteWebsite,
  getOwnedWebsite,
  isSlugAvailable,
  setInquiryDelivery,
  setPlan,
  setSubscriptionStatus,
  setWebsiteStatus,
  updateWebsite,
} from "../websites";

const AUTOSAVE_DOMAIN_SET: ReadonlySet<string> = new Set(AUTOSAVE_DOMAINS);

/** Never trusts the client's domain list as-is - anything not in the fixed, known set (see AUTOSAVE_DOMAINS) is silently dropped rather than acted on. This is a whitelist for *which write helpers run*, not an authorization or data-validation mechanism; `input` is still fully schema-checked below regardless of what domains are requested. */
function validDomains(domains: unknown): AutosaveDomain[] {
  if (!Array.isArray(domains)) return [];
  return domains.filter((d): d is AutosaveDomain => typeof d === "string" && AUTOSAVE_DOMAIN_SET.has(d));
}

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function validate(input: SiteData) {
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "יש שדה שלא מולא כמו שצריך" };
  return { data: parsed.data as SiteData };
}

/** Starts a brand-new site: an empty draft, persisted immediately so refreshing/closing the tab never loses it. */
export async function createDraftSiteAction(): Promise<ActionResult> {
  const user = await requireUser();
  const site = await createDraftWebsite(user.id);
  revalidatePath("/dashboard");
  return { ok: true, id: site.id, slug: site.slug };
}

/**
 * A deliberate, fully-validated save: the normal "שמירת שינויים" in free-edit
 * mode, and also what the wizard's final step calls to finish. Either way,
 * `wizardStep` is cleared - once an owner has gone through one complete,
 * validated save, the site is no longer treated as "still onboarding".
 */
/**
 * Service and delivery areas may only be names from the official list (the pickers allow nothing else).
 * Names a site already had before this rule are left alone, so older sites can still be saved.
 */
async function strayAreaError(d: SiteData, before: SiteData): Promise<string | null> {
  const on = (t: string) => d.sections.some((s) => s.type === t && s.enabled);
  const split = (v: string) => v.split(/\s*,\s*/).filter(Boolean);
  const kept = new Set([...before.areas, ...split(before.delivery.areas)]);
  const names = [...(on("areas") ? d.areas : []), ...(on("delivery") && d.delivery.available ? split(d.delivery.areas) : [])].filter((n) => !kept.has(n));
  const stray = await areasNotInList(names);
  return stray.length ? `״${stray[0]}״ לא נמצא ברשימת הערים והאזורים. בחרו אזור מהרשימה.` : null;
}

/** "א", "א ו-ב", "א, ב ו-ג". */
function listHe(items: string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ו${items.at(-1)}`;
}

/**
 * A live site keeps showing contact details the owner proved are theirs: changing the email, phone or
 * WhatsApp of a published site needs the new value verified first (drafts are checked when published).
 */
async function contactChangeError(siteId: string, d: SiteData, before: { status: string; data: SiteData }): Promise<string | null> {
  if (before.status !== WEBSITE_STATUS.PUBLISHED) return null;
  const changed = {
    email: normalizeContact("EMAIL", d.email) !== normalizeContact("EMAIL", before.data.email) ? d.email : "",
    phone: normalizeContact("PHONE", d.phone) !== normalizeContact("PHONE", before.data.phone) ? d.phone : "",
    whatsapp: normalizeContact("PHONE", d.whatsapp) !== normalizeContact("PHONE", before.data.whatsapp) ? d.whatsapp : "",
  };
  const missing = await unverifiedContacts(siteId, changed);
  return missing.length ? `האתר באוויר, ולכן לפני השמירה צריך לאמת את ${listHe(missing)} ${missing.length > 1 ? "החדשים" : "החדש"}. לחצו על ״שליחת קוד אימות״ ליד השדה.` : null;
}

/**
 * The business address may only be a city from the official list and a street of that city (plus a
 * house number). Checked only when the address changed, so an older site's saved address doesn't block it.
 */
async function addressError(d: SiteData, before: SiteData): Promise<string | null> {
  const city = d.city.trim();
  const address = d.address.trim();
  if (city === before.city.trim() && address === before.address.trim()) return null;
  if (!city) return address ? "כדי לשמור רחוב, בחרו קודם עיר מהרשימה." : null;
  const { cities } = await getPlaces();
  const match = cities.find((c) => c.name === city);
  if (!match) return `״${city}״ לא נמצאת ברשימת הערים. בחרו עיר מהרשימה.`;
  if (!address) return null;
  const { street } = splitAddress(address);
  const streets = await getStreets(match.code);
  if (!streets.includes(street)) return `״${street}״ לא נמצא ברשימת הרחובות של ${city}. בחרו רחוב מהרשימה.`;
  return null;
}

export async function updateSiteAction(id: string, input: SiteData): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(input);
  if (!v.data) return { ok: false, error: v.error! };
  try {
    const before = await getOwnedWebsite(user.id, id);
    if (!before) return { ok: false, error: "האתר לא נמצא" };
    const placeProblem =
      (await contactChangeError(id, v.data, before)) ?? (await addressError(v.data, before.data)) ?? (await strayAreaError(v.data, before.data));
    if (placeProblem) return { ok: false, error: placeProblem };
    // The address step is now a real, reachable step in both the first-time
    // wizard and free-edit mode (see AddressStep) - by the time this save
    // runs, `v.data.slug` already holds whatever the owner deliberately
    // chose/confirmed there, so it is authoritative either way.
    const site = await updateWebsite(user.id, id, v.data, { wizardStep: null });
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    revalidatePath("/dashboard");
    revalidatePath(`/s/${site.slug}`);
    return { ok: true, id: site.id, slug: site.slug };
  } catch (e) {
    if (e instanceof SlugError || e instanceof ProRequiredError) return { ok: false, error: e.message };
    throw e;
  }
}

export interface AutosaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Background save while the owner is still typing/toggling in the wizard -
 * called on a debounce, not on every keystroke. Deliberately lenient
 * (`draftSiteSchema`, not `siteSchema`): a draft mid-edit does not have to
 * look "finished" to be worth persisting. `domains` names which parts of the
 * draft actually changed since the last save (see AUTOSAVE_DOMAINS) so only
 * those Website/BusinessProfile columns and child tables get touched -
 * typing a business name never rewrites services, testimonials, sections,
 * etc. Never touches revalidatePath - this fires far too often for that to
 * be worthwhile, and nothing public depends on a still-draft site's content.
 */
export async function autosaveSiteAction(
  id: string,
  input: SiteData,
  domains: unknown,
  wizardStep?: string | null,
): Promise<AutosaveResult> {
  const user = await requireUser();
  const parsed = draftSiteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב." };
  const wanted = validDomains(domains);
  try {
    let site;
    try {
      site = await autosaveWebsiteDraft(user.id, id, parsed.data as SiteData, wanted, wizardStep);
    } catch (e) {
      // A taken address (often just the one suggested from the business name) must not hold back the rest
      // of the draft: save everything else, and let the address step - which checks availability live and
      // blocks finishing on a taken address - deal with it.
      if (!(e instanceof SlugError) || !wanted.includes("address")) throw e;
      site = await autosaveWebsiteDraft(user.id, id, parsed.data as SiteData, wanted.filter((d) => d !== "address"), wizardStep);
    }
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    return { ok: true };
  } catch (e) {
    if (e instanceof SlugError || e instanceof ProRequiredError) return { ok: false, error: e.message };
    console.error("autosave failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב." };
  }
}

export interface SimpleResult {
  ok: boolean;
  error?: string;
  /** Payment needed first: send the owner here (the gateway's payment page). */
  redirectTo?: string;
}

type OwnedUser = { id: string; email: string; emailVerifiedAt: Date | null };

async function withOwnedSite(id: string, fn: (user: OwnedUser, slug: string) => Promise<SimpleResult>) {
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, id);
  // Not found and "found but belongs to someone else" look identical on purpose:
  // an ID for a site you don't own must never confirm that the ID exists at all.
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  const result = await fn(user, site.slug);
  revalidatePath("/dashboard");
  revalidatePath(`/s/${site.slug}`);
  return result;
}

type OwnedSite = NonNullable<Awaited<ReturnType<typeof getOwnedWebsite>>>;
const forBilling = (site: OwnedSite, userId: string) => ({ id: site.id, businessName: site.data.businessName, plan: site.plan, userId });

const VERIFY_ACCOUNT_FIRST = "יש לאמת את כתובת האימייל לפני פרסום האתר. שלחנו קישור אימות בהרשמה - אפשר לשלוח שוב מלוח הבקרה.";
const CHECKOUT_FAILED = "לא הצלחנו לפתוח את דף התשלום. נסו שוב בעוד כמה דקות.";

/** What stops this site from going live on `plan`, as a message for the owner - or null. */
async function publishProblem(user: OwnedUser, site: OwnedSite, plan: string): Promise<string | null> {
  // A verified email is required to go from draft to published - it does not
  // retroactively affect sites that are already live (see prisma/backfill-verified.ts).
  if (!user.emailVerifiedAt) return VERIFY_ACCOUNT_FIRST;
  if (needsProToPublish({ plan, templateId: site.data.templateId })) return PRO_TEMPLATE_PUBLISH_ERROR;
  // Every email/phone shown on the site must be the owner's, proven with a code (see contact-verification.ts).
  const missing = await unverifiedContacts(site.id, site.data);
  if (missing.length) return `כדי לפרסם, אמתו קודם את ${listHe(missing)} של העסק. עושים את זה בשלב ״פרטי העסק״, עם קוד שנשלח אליכם.`;
  return null;
}

export async function publishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    const site = await getOwnedWebsite(user.id, id);
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    if (site.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE) {
      return { ok: false, error: "האתר לא פעיל. יש להפעיל אותו מחדש לפני הפרסום." };
    }
    const problem = await publishProblem(user, site, site.plan);
    if (problem) return { ok: false, error: problem };
    await setWebsiteStatus(user.id, id, WEBSITE_STATUS.PUBLISHED);
    return { ok: true };
  });
}

/**
 * The publish dialog: puts the site on the plan the owner chose and publishes it. Basic can't be chosen for
 * a site built with a Pro design. With billing on (server/billing.ts), a site without a paid period goes to
 * the payment page first (`redirectTo`) and is published when the payment is verified; without billing,
 * publishing and Pro cost nothing.
 */
export async function publishWithPlanAction(id: string, plan: Plan): Promise<SimpleResult> {
  if (plan !== PLAN.BASIC && plan !== PLAN.PRO) return { ok: false, error: "בחירה לא תקינה." };
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, id);
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  const problem = await publishProblem(user, site, plan);
  if (problem) return { ok: false, error: problem };

  const gateway = getGateway();
  if (!gateway) {
    if (site.plan !== plan) await setPlan(user.id, id, plan);
    return publishSiteAction(id);
  }
  if (await hasPaidPeriod(id)) {
    if (plan === PLAN.PRO && site.plan !== PLAN.PRO) {
      const upgraded = await upgradeWithCardOnFile(forBilling(site, user.id), user.email, gateway);
      if (upgraded && !upgraded.ok) return { ok: false, error: upgraded.error ?? CHECKOUT_FAILED };
    } else if (site.plan !== plan) {
      // Back to Basic: the cheaper price applies from the next renewal; the paid month isn't refunded.
      await setPlan(user.id, id, plan);
    }
    return publishSiteAction(id);
  }
  try {
    return { ok: true, redirectTo: await startCheckout(forBilling(site, user.id), user.email, "PUBLISH", plan, gateway) };
  } catch (e) {
    console.error("checkout failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: CHECKOUT_FAILED };
  }
}

/** "שדרוג ל-Pro" on a live Basic site: free without billing; with it, the difference on the card on file, or the payment page. */
export async function upgradeToProAction(id: string): Promise<SimpleResult> {
  const gateway = getGateway();
  return withOwnedSite(id, async (user) => {
    const site = await getOwnedWebsite(user.id, id);
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    if (gateway) {
      const upgraded = await upgradeWithCardOnFile(forBilling(site, user.id), user.email, gateway);
      if (!upgraded) {
        try {
          return { ok: true, redirectTo: await startCheckout(forBilling(site, user.id), user.email, "UPGRADE", PLAN.PRO, gateway) };
        } catch (e) {
          console.error("checkout failed:", e instanceof Error ? e.message : e);
          return { ok: false, error: CHECKOUT_FAILED };
        }
      }
      if (!upgraded.ok) return { ok: false, error: upgraded.error ?? CHECKOUT_FAILED };
    } else if (!(await setPlan(user.id, id, PLAN.PRO))) {
      return { ok: false, error: "האתר לא נמצא" };
    }
    revalidatePath(`/sites/${id}/edit`);
    return { ok: true };
  });
}

export async function unpublishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    await setWebsiteStatus(user.id, id, WEBSITE_STATUS.DRAFT);
    return { ok: true };
  });
}

/**
 * "הפעל מחדש" / "עדכון אמצעי תשלום": with billing, the payment page for a month on the site's plan (with
 * the new card); the payment brings the site back. Without billing (mock), flips the status directly.
 */
export async function activateSubscriptionAction(id: string): Promise<SimpleResult> {
  const gateway = getGateway();
  return withOwnedSite(id, async (user) => {
    if (gateway) {
      const site = await getOwnedWebsite(user.id, id);
      if (!site) return { ok: false, error: "האתר לא נמצא" };
      try {
        return { ok: true, redirectTo: await startCheckout(forBilling(site, user.id), user.email, "CARD", site.plan as Plan, gateway) };
      } catch (e) {
        console.error("checkout failed:", e instanceof Error ? e.message : e);
        return { ok: false, error: CHECKOUT_FAILED };
      }
    }
    await setSubscriptionStatus(user.id, id, SUBSCRIPTION_STATUS.ACTIVE);
    return { ok: true };
  });
}

/** The owner cancels (or takes back the cancellation): no further charges; the site stays live until the paid period ends. */
export async function setCancelSubscriptionAction(id: string, cancel: boolean): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    const site = await getOwnedWebsite(user.id, id);
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    if (!(await hasPaidPeriod(id))) return { ok: false, error: "אין מנוי פעיל לביטול." };
    await setCancelAtPeriodEnd(id, cancel);
    revalidatePath(`/sites/${id}/billing`);
    return { ok: true };
  });
}

/** Mock: simulates a lapsed subscription. Data is kept; the public page goes offline. */
export async function deactivateSubscriptionAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    await setSubscriptionStatus(user.id, id, SUBSCRIPTION_STATUS.INACTIVE);
    return { ok: true };
  });
}

/** Permanently deletes the site: the row, all child data (cascade) and its exclusively-owned images. Irreversible. */
export async function deleteSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    const slug = await deleteWebsite(user.id, id);
    return slug ? { ok: true } : { ok: false, error: "האתר לא נמצא" };
  });
}

/** Mock: flips Website.plan directly. Real payments will call the same server function from a webhook. Dev-only UI trigger, see SiteCard. */
export async function setPlanAction(id: string, plan: Plan): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    const ok = await setPlan(user.id, id, plan);
    return ok ? { ok: true } : { ok: false, error: "האתר לא נמצא" };
  });
}

export interface SlugAvailabilityResult {
  available: boolean;
  normalized: string;
  error?: string;
}

/**
 * Live client-side feedback while typing in the address step - not the
 * source of truth. The actual write (autosaveSiteAction / updateSiteAction)
 * re-validates and re-checks uniqueness itself right before persisting, so a
 * stale "available" result here can never let a taken slug through.
 */
export async function checkSlugAvailabilityAction(id: string, slugInput: string): Promise<SlugAvailabilityResult> {
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, id);
  if (!site) return { available: false, normalized: "", error: "האתר לא נמצא" };
  const normalized = slugInput.trim().toLowerCase();
  if (!isValidSlug(normalized)) {
    return { available: false, normalized, error: "אפשר להשתמש באותיות באנגלית, מספרים ומקפים, לפחות 3 תווים." };
  }
  if (normalized === site.slug) return { available: true, normalized };
  const available = await isSlugAvailable(normalized, id);
  return available ? { available: true, normalized } : { available: false, normalized, error: "הכתובת הזו כבר תפוסה" };
}

/** Pro: choose where new inquiries go (email, the inquiries center, or both). */
export async function setInquiryDeliveryAction(id: string, value: string): Promise<SimpleResult> {
  if (!(INQUIRY_DELIVERY as readonly string[]).includes(value)) return { ok: false, error: "בחירה לא תקינה." };
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, id);
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  if (!isPro(site)) return { ok: false, error: "ההגדרה הזו זמינה ב-WEBG Pro. ב-Basic כל פנייה נשלחת אליכם במייל." };
  await setInquiryDelivery(user.id, id, value);
  revalidatePath(`/sites/${id}/admin`);
  revalidatePath("/dashboard");
  return { ok: true };
}
