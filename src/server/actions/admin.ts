"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { Plan } from "@/lib/constants";
import { billingEnabled } from "@/lib/payments";
import { startLaunchFreeMonth } from "../billing";
import { adminSetWebsitePlan } from "../websites";
import type { SimpleResult } from "./sites";

/**
 * Platform-admin override of a site's plan - not a purchase. Independently
 * calls requireAdmin() (never relies on the /admin layout having already
 * run - a Server Action is its own POST endpoint), and never reads or
 * writes ownership (see adminSetWebsitePlan): authorization here is purely
 * "are you an admin", not "do you own this site".
 */
export async function setWebsitePlanAdminAction(id: string, plan: Plan): Promise<SimpleResult> {
  await requireAdmin();
  const ok = await adminSetWebsitePlan(id, plan);
  if (!ok) return { ok: false, error: "האתר לא נמצא" };
  revalidatePath(`/admin/sites/${id}`);
  revalidatePath("/admin/sites");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Billing launch for the sites from before payments: a free month each and an email to the owner (see
 * startLaunchFreeMonth). Only once billing is on - with no gateway the daily job is off, so a month
 * started now would lapse unnoticed and take the sites offline on the gateway's first run.
 */
export async function startBillingLaunchAction(): Promise<SimpleResult & { started?: number }> {
  await requireAdmin();
  if (!billingEnabled()) return { ok: false, error: "החיוב עדיין לא מחובר. קודם מגדירים את HYP ב-Vercel." };
  const { started } = await startLaunchFreeMonth();
  revalidatePath("/admin/purchases");
  return { ok: true, started };
}
