import { PLAN } from "./constants";

/**
 * Feature-tier gates. Independent of billing state (see subscription.ts) -
 * a TRIAL or ACTIVE site can be either plan; payments are still mocked.
 */
export function isPro(site: { plan: string }): boolean {
  return site.plan === PLAN.PRO;
}

export function canAccessInbox(site: { plan: string }): boolean {
  return isPro(site);
}

export function canUseProUrl(site: { plan: string }): boolean {
  return isPro(site);
}

export function canUseTemplateTier(site: { plan: string }, tier: "standard" | "premium"): boolean {
  return tier === "standard" || isPro(site);
}
