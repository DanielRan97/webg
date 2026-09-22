import { SUBSCRIPTION_STATUS } from "./constants";
import { displayState, isPubliclyVisible } from "./subscription";

/** Human-language explanations for every status a business owner can see. */
export const STATUS_INFO = {
  DRAFT: {
    label: "טיוטה",
    icon: "✎",
    cls: "bg-gray-100 text-gray-900 border-gray-300",
    meaning: "האתר שמור אצלכם, אבל הלקוחות עדיין לא רואים אותו.",
  },
  PUBLISHED: {
    label: "מפורסם",
    icon: "✓",
    cls: "bg-green-100 text-green-900 border-green-300",
    meaning: "האתר אונליין והלקוחות יכולים לראות אותו.",
  },
  SUBSCRIPTION_INACTIVE: {
    label: "האתר לא פעיל",
    icon: "⏸",
    cls: "bg-red-100 text-red-900 border-red-300",
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
  if (state === "DRAFT") return "בדקו את האתר בתצוגה מקדימה, ואז לחצו על ״פרסום״.";
  return isPubliclyVisible(site) ? "אפשר לשלוח את הכתובת ללקוחות." : "לחצו על ״פרסום״ כדי שהלקוחות יראו את האתר.";
}
