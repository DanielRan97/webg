"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { AUTOSAVE_DOMAINS, SUBSCRIPTION_STATUS, WEBSITE_STATUS, type AutosaveDomain, type Plan } from "@/lib/constants";
import { isValidSlug } from "@/lib/slug";
import { draftSiteSchema, siteSchema } from "@/lib/validation";
import type { SiteData } from "@/types/site";
import {
  SlugError,
  autosaveWebsiteDraft,
  createDraftWebsite,
  deleteWebsite,
  getOwnedWebsite,
  isSlugAvailable,
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
export async function updateSiteAction(id: string, input: SiteData): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(input);
  if (!v.data) return { ok: false, error: v.error! };
  try {
    const before = await getOwnedWebsite(user.id, id);
    if (!before) return { ok: false, error: "האתר לא נמצא" };
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
    if (e instanceof SlugError) return { ok: false, error: e.message };
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
  try {
    const site = await autosaveWebsiteDraft(user.id, id, parsed.data as SiteData, validDomains(domains), wizardStep);
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    return { ok: true };
  } catch (e) {
    if (e instanceof SlugError) return { ok: false, error: e.message };
    console.error("autosave failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "לא הצלחנו לשמור את השינויים. בדקו את החיבור ונסו שוב." };
  }
}

export interface SimpleResult {
  ok: boolean;
  error?: string;
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

export async function publishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    // A verified email is required to go from draft to published - it does not
    // retroactively affect sites that are already live (see prisma/backfill-verified.ts).
    if (!user.emailVerifiedAt) {
      return { ok: false, error: "יש לאמת את כתובת האימייל לפני פרסום האתר. שלחנו קישור אימות בהרשמה - אפשר לשלוח שוב מלוח הבקרה." };
    }
    const site = await getOwnedWebsite(user.id, id);
    if (site?.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE) {
      return { ok: false, error: "האתר לא פעיל. יש להפעיל אותו מחדש לפני הפרסום." };
    }
    await setWebsiteStatus(user.id, id, WEBSITE_STATUS.PUBLISHED);
    return { ok: true };
  });
}

export async function unpublishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    await setWebsiteStatus(user.id, id, WEBSITE_STATUS.DRAFT);
    return { ok: true };
  });
}

/** Mock: "הפעל מחדש". Real payments will call the same server function from a webhook. */
export async function activateSubscriptionAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (user) => {
    await setSubscriptionStatus(user.id, id, SUBSCRIPTION_STATUS.ACTIVE);
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
