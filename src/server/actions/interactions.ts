"use server";

import { requireUser } from "@/lib/session";
import { markInteractionsSeen } from "../interactions";

export interface MarkSeenResult {
  ok: boolean;
}

/**
 * Marks every currently-unseen interaction for a site as seen. Called from
 * the admin inbox page's client component on mount (not from the server
 * page render itself) so that a hovered/prefetched link never marks
 * anything seen before the owner actually opens the page.
 */
export async function markInteractionsSeenAction(siteId: string): Promise<MarkSeenResult> {
  const user = await requireUser();
  const ok = await markInteractionsSeen(user.id, siteId);
  return { ok };
}
