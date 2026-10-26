import { SUBSCRIPTION_STATUS, WEBSITE_STATUS } from "./constants";

/**
 * The single rule that decides whether the public can see a site. A site whose renewal failed
 * (PAST_DUE) stays live through the grace period; billing (server/billing.ts) moves it to INACTIVE after.
 */
export function isPubliclyVisible(site: { status: string; subscriptionStatus: string }): boolean {
  return (
    site.status === WEBSITE_STATUS.PUBLISHED &&
    (site.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE ||
      site.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL ||
      site.subscriptionStatus === SUBSCRIPTION_STATUS.PAST_DUE)
  );
}

export type DisplayState = "DRAFT" | "PUBLISHED" | "SUBSCRIPTION_INACTIVE";

/** Status shown on dashboard cards. */
export function displayState(site: { status: string; subscriptionStatus: string }): DisplayState {
  if (site.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE) return "SUBSCRIPTION_INACTIVE";
  return site.status === WEBSITE_STATUS.PUBLISHED ? "PUBLISHED" : "DRAFT";
}
