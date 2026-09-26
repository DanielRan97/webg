"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type { Plan } from "@/lib/constants";
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
