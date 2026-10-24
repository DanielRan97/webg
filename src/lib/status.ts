import { SUBSCRIPTION_STATUS } from "./constants";
import { displayState, isPubliclyVisible } from "./subscription";

/** Human-language explanations for every status a business owner can see. */
export const STATUS_INFO = {
  DRAFT: {
    label: "טיוטה",
    icon: "✎",
    cls: "bg-ink-50 text-ink-800 border-ink-200",
    meaning: "האתר שמור אצלכם, אבל הלקוחות עדיין לא רואים אותו.",
  },
  PUBLISHED: {
    label: "מפורסם",
    icon: "✓",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
    meaning: "האתר אונליין והלקוחות יכולים לראות אותו.",
  },
  SUBSCRIPTION_INACTIVE: {
    label: "האתר לא פעיל",
    icon: "⏸",
    cls: "bg-red-50 text-red-800 border-red-200",
    meaning: "המנוי הסתיים. האתר שמור ולא נמחק, אבל הלקוחות לא רואים אותו.",
  },
} as const;

export const SUBSCRIPTION_INFO = {
  TRIAL: { label: "תקופת ניסיון", meaning: "אפשר לפרסם ולנסות את האתר בלי תשלום." },
  ACTIVE: { label: "מנוי פעיל", meaning: "האתר יכול להיות אונליין." },
  INACTIVE: { label: "מנוי לא פעיל", meaning: "האתר לא מוצג ללקוחות עד שתפעילו מחדש." },
} as const;

export function subscriptionInfo(status: string) {
  return SUBSCRIPTION_INFO[status as keyof typeof SUBSCRIPTION_INFO] ?? SUBSCRIPTION_INFO[SUBSCRIPTION_STATUS.TRIAL];
}

/** The one thing the owner should do next, in a short sentence. */
export function nextStep(site: { status: string; subscriptionStatus: string }): string {
  const state = displayState(site);
  if (state === "SUBSCRIPTION_INACTIVE") return "לחצו על ״הפעל מחדש״ כדי להחזיר את האתר לאוויר.";
  if (state === "DRAFT") return "האתר עדיין טיוטה, ולקוחות לא רואים אותו. רוצים לבדוק? ״תצוגה מקדימה״ פותחת אותו, ואפשר לפרסם משם או מכאן, בכפתור ״פרסום האתר״.";
  return isPubliclyVisible(site) ? "אפשר לשלוח את הכתובת ללקוחות." : "לחצו על ״פרסום האתר״ כדי שהלקוחות יראו את האתר.";
}
