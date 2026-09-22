import { SUBSCRIPTION_STATUS, WEBSITE_STATUS } from "./constants";

/**
 * The single rule that decides whether the public can see a site.
 * Payments are mocked for now; real billing only needs to update
 * Subscription.status through server/subscription.ts.
 */
export function isPubliclyVisible(site: { status: string; subscriptionStatus: string }): boolean {
  return (
    site.status === WEBSITE_STATUS.PUBLISHED &&
    (site.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE ||
      site.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL)
  );
}

export type DisplayState = "DRAFT" | "PUBLISHED" | "SUBSCRIPTION_INACTIVE";

/** Status shown on dashboard cards. */
export function displayState(site: { status: string; subscriptionStatus: string }): DisplayState {
  if (site.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE) return "SUBSCRIPTION_INACTIVE";
  return site.status === WEBSITE_STATUS.PUBLISHED ? "PUBLISHED" : "DRAFT";
}
