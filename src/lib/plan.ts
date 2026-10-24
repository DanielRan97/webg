import { PLAN, TEMPLATE_TIERS, type TemplateId } from "./constants";

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

export function isPremiumTemplate(templateId: string): boolean {
  return TEMPLATE_TIERS[templateId as TemplateId] === "premium";
}

/**
 * A Basic site may pick a Pro (premium) template, build with it and preview it - owners need to see
 * what Pro looks like before deciding. What it can't do is go live with one: publishing, and saving a
 * premium template onto an already-published Basic site, are refused until the site is on Pro or
 * back on a standard template. This is the single rule every one of those places checks.
 */
export function needsProToPublish(site: { plan: string; templateId: string }): boolean {
  return !isPro(site) && isPremiumTemplate(site.templateId);
}

export const PRO_TEMPLATE_PUBLISH_ERROR =
  "האתר בנוי בעיצוב Pro, ולכן כדי לפרסם אותו בעיצוב הזה צריך מסלול WEBG Pro. אפשר גם לבחור עיצוב רגיל בשלב ״עיצוב״ ולפרסם מיד.";

export const PRO_TEMPLATE_LIVE_ERROR =
  "האתר שלכם באוויר במסלול Basic, ולכן אי אפשר לשמור בו עיצוב Pro. אפשר לבחור עיצוב רגיל, או לעבור למסלול Pro.";
