import { SUPPORT_EMAIL } from "./constants";

/**
 * The legal business behind WEBG, shown wherever the law or a payment acquirer expects it
 * (footer, contact page, terms, privacy, accessibility statement). `number` stays empty until the
 * owner supplies it; every place that prints it skips the line while it is empty.
 */
export const BUSINESS = {
  name: "Dystems",
  nameHe: "דיסטמס",
  /** Exempt dealer: prices are final and no VAT is charged; every charge gets a receipt, not a tax invoice. Not shown on the public pages by the owner's choice, so never write "כולל מע״מ" anywhere. */
  type: "עוסק פטור",
  number: "318188505",
  address: "קדיש לוז 8, קריית מוצקין",
  phone: "054-2571330",
  phoneHref: "tel:+972542571330",
  email: SUPPORT_EMAIL,
  /** Name of the accessibility coordinator shown in the accessibility statement; skipped while empty. */
  accessibilityContact: "",
} as const;

/** The two monthly plans, in whole shekels. The single source for every price shown anywhere. */
export const PLANS = [
  {
    id: "BASIC",
    name: "Basic",
    price: 49,
    tagline: "כל מה שצריך כדי להיות באוויר.",
    features: ["אתר מלא ומותאם לנייד", "פרסום האתר עם חיבור מאובטח", "תבניות עיצוב רגילות", "טפסי לידים והודעות", "פניות נשלחות אליכם למייל", "כתובת WEBG רגילה"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    tagline: "לעסק שרוצה להיראות ולעבוד מקצועי יותר.",
    features: ["כל מה שב-Basic", "כתובת אתר מקצועית וקלה לזכירה", "מרכז פניות: כל הלידים וההודעות במקום אחד", "התראות על פניות חדשות", "עיצובי Premium"],
  },
] as const;

export const PRICE_NOTE = "המחירים לחודש וסופיים, ללא תוספות. המנוי מתחדש מדי חודש, ואפשר לבטל בכל עת.";
