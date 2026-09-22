"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { SUBSCRIPTION_STATUS, WEBSITE_STATUS } from "@/lib/constants";
import { siteSchema } from "@/lib/validation";
import type { SiteData } from "@/types/site";
import {
  SlugError,
  createWebsite,
  getOwnedWebsite,
  setSubscriptionStatus,
  setWebsiteStatus,
  updateWebsite,
} from "../websites";

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function validate(input: SiteData) {
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "יש שדה שלא מולא כמו שצריך" };
  return { data: parsed.data as SiteData };
}

export async function createSiteAction(input: SiteData): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(input);
  if (!v.data) return { ok: false, error: v.error! };
  const site = await createWebsite(user.id, v.data);
  revalidatePath("/dashboard");
  return { ok: true, id: site.id, slug: site.slug };
}

export async function updateSiteAction(id: string, input: SiteData): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(input);
  if (!v.data) return { ok: false, error: v.error! };
  try {
    const site = await updateWebsite(user.id, id, v.data);
    if (!site) return { ok: false, error: "האתר לא נמצא" };
    revalidatePath("/dashboard");
    revalidatePath(`/s/${site.slug}`);
    return { ok: true, id: site.id, slug: site.slug };
  } catch (e) {
    if (e instanceof SlugError) return { ok: false, error: e.message };
    throw e;
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
