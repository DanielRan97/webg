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

/** Where a Pro site's inquiries go; see Website.inquiryDelivery. */
export const INQUIRY_DELIVERY = ["BOTH", "EMAIL", "CENTER"] as const;
export type InquiryDelivery = (typeof INQUIRY_DELIVERY)[number];

export const INQUIRY_DELIVERY_INFO: Record<InquiryDelivery, { label: string; meaning: string; risk?: string }> = {
  BOTH: {
    label: "גם במייל וגם במרכז הפניות (מומלץ)",
    meaning: "כל פנייה מגיעה אליכם במייל, וגם נשמרת כאן עם סימון של פניות חדשות.",
  },
  EMAIL: {
    label: "רק במייל (מרכז הפניות כבוי)",
    meaning: "כל פנייה מגיעה במייל. מרכז הפניות לא יוצג, ולא תראו כאן סימון של פניות חדשות.",
    risk: "אם מייל יגיע לתיקיית הספאם או יימחק בטעות, לא תהיה לכם תזכורת כאן, ואפשר לפספס לקוח. הפניות עדיין נשמרות, ואם תדליקו את המרכז שוב תראו את כולן.",
  },
  CENTER: {
    label: "רק במרכז הפניות (בלי מיילים)",
    meaning: "פניות נשמרות כאן בלבד, ולא יישלח מייל על פנייה חדשה.",
    risk: "כדי לא לפספס לקוחות, צריך להיכנס למרכז הפניות באופן קבוע. לקוח שלא יקבל תשובה מהר עלול לפנות למתחרה.",
  },
};

const deliveryOf = (site: { inquiryDelivery?: string }): InquiryDelivery =>
  (INQUIRY_DELIVERY as readonly string[]).includes(site.inquiryDelivery ?? "") ? (site.inquiryDelivery as InquiryDelivery) : "BOTH";

/** Whether a new inquiry is emailed to the owner. Basic: always. */
export function emailsInquiries(site: { plan: string; inquiryDelivery?: string }): boolean {
  return !isPro(site) || deliveryOf(site) !== "CENTER";
}

/** Whether the inquiries center is shown (Pro, and not switched off). */
export function inquiryCenterOn(site: { plan: string; inquiryDelivery?: string }): boolean {
  return isPro(site) && deliveryOf(site) !== "EMAIL";
}

export function inquiryDelivery(site: { plan: string; inquiryDelivery?: string }): InquiryDelivery {
  return isPro(site) ? deliveryOf(site) : "EMAIL";
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
