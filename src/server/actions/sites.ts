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

async function withOwnedSite(id: string, fn: (userId: string, slug: string) => Promise<SimpleResult>) {
  const user = await requireUser();
  const site = await getOwnedWebsite(user.id, id);
  if (!site) return { ok: false, error: "האתר לא נמצא" };
  const result = await fn(user.id, site.slug);
  revalidatePath("/dashboard");
  revalidatePath(`/s/${site.slug}`);
  return result;
}

export async function publishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (userId) => {
    const site = await getOwnedWebsite(userId, id);
    if (site?.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE) {
      return { ok: false, error: "האתר לא פעיל. יש להפעיל אותו מחדש לפני הפרסום." };
    }
    await setWebsiteStatus(userId, id, WEBSITE_STATUS.PUBLISHED);
    return { ok: true };
  });
}

export async function unpublishSiteAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (userId) => {
    await setWebsiteStatus(userId, id, WEBSITE_STATUS.DRAFT);
    return { ok: true };
  });
}

/** Mock: "הפעל מחדש". Real payments will call the same server function from a webhook. */
export async function activateSubscriptionAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (userId) => {
    await setSubscriptionStatus(userId, id, SUBSCRIPTION_STATUS.ACTIVE);
    return { ok: true };
  });
}

/** Mock: simulates a lapsed subscription. Data is kept; the public page goes offline. */
export async function deactivateSubscriptionAction(id: string): Promise<SimpleResult> {
  return withOwnedSite(id, async (userId) => {
    await setSubscriptionStatus(userId, id, SUBSCRIPTION_STATUS.INACTIVE);
    return { ok: true };
  });
}
