import type { CtaType } from "./constants";
import type { SectionType } from "./sections";

export interface CategoryPreset {
  id: string;
  label: string;
  emoji: string;
  /** Sections suggested for this category, in default display order. Every other section stays available under "more". */
  sections: SectionType[];
  /** Subset of `sections` switched on when a new site is created. */
  defaultOn: SectionType[];
  cta: CtaType;
  tagline: string;
  color: string;
  sampleServices: { name: string; description: string; price: string; category: string }[];
}

const svc = (name: string, description = "", price = "", category = "") => ({ name, description, price, category });

const SERVICE_TRADE: SectionType[] = ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact", "prices", "gallery", "about", "highlights", "hours", "social"];
const APPOINTMENT: SectionType[] = ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact", "about", "social"];
const FOOD: SectionType[] = ["hero", "menu", "gallery", "testimonials", "hours", "location", "contact", "about", "social"];

/**
 * A category only decides which sections are suggested, in what order, and
 * which are switched on at first. Every section stays available to every
 * business; the owner can show or hide any of them.
 */
export const CATEGORIES: CategoryPreset[] = [
  {
    id: "barber", label: "ספר", emoji: "💈",
    sections: APPOINTMENT,
    defaultOn: ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact"],
    cta: "BOOKING", tagline: "תספורת מדויקת, אווירה טובה", color: "#1f2937",
    sampleServices: [svc("תספורת גברים", "תספורת וסידור", "70"), svc("תספורת + זקן", "", "100")],
  },
  {
    id: "beauty", label: "מכון יופי", emoji: "💅",
    sections: APPOINTMENT,
    defaultOn: ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact"],
    cta: "BOOKING", tagline: "כל מה שצריך כדי להרגיש יפה", color: "#be185d",
    sampleServices: [svc("מניקור ג'ל", "", "120"), svc("טיפול פנים", "", "250")],
  },
  {
    id: "restaurant", label: "מסעדה", emoji: "🍽️",
    sections: FOOD,
    defaultOn: ["hero", "menu", "gallery", "testimonials", "hours", "location", "contact"],
    cta: "CALL", tagline: "אוכל טוב, אנשים טובים", color: "#b45309",
    sampleServices: [svc("סלט ירקות", "", "38", "ראשונות"), svc("סטייק אנטריקוט", "", "98", "עיקריות")],
  },
  {
    id: "cafe", label: "בית קפה", emoji: "☕",
    sections: FOOD,
    defaultOn: ["hero", "menu", "gallery", "testimonials", "hours", "location", "contact"],
    cta: "CALL", tagline: "הקפה הכי טוב בשכונה", color: "#92400e",
    sampleServices: [svc("אספרסו", "", "10", "שתייה חמה"), svc("קרואסון חמאה", "", "16", "מאפים")],
  },
  {
    id: "electrician", label: "חשמלאי", emoji: "⚡",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact"],
    cta: "CALL", tagline: "שירות מהיר, עבודה נקייה ואחריות", color: "#d97706",
    sampleServices: [svc("תיקון תקלות חשמל"), svc("התקנת נקודות ותאורה")],
  },
  {
    id: "plumber", label: "אינסטלטור", emoji: "🔧",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact"],
    cta: "CALL", tagline: "פתרון מהיר לכל בעיית אינסטלציה", color: "#0369a1",
    sampleServices: [svc("פתיחת סתימות"), svc("תיקון נזילות")],
  },
  {
    id: "technician", label: "טכנאי", emoji: "🛠️",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact"],
    cta: "CALL", tagline: "מגיעים אליכם ומתקנים במקום", color: "#0f766e",
    sampleServices: [svc("תיקון מכשירי חשמל"), svc("התקנה והתאמה")],
  },
  {
    id: "cleaner", label: "שירותי ניקיון", emoji: "🧼",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "testimonials", "faq", "contact"],
    cta: "WHATSAPP", tagline: "בית נקי, בלי מאמץ", color: "#0891b2",
    sampleServices: [svc("ניקיון דירות"), svc("ניקיון משרדים")],
  },
  {
    id: "photographer", label: "צלם", emoji: "📷",
    sections: ["hero", "gallery", "services", "testimonials", "about", "contact", "prices", "faq", "highlights", "booking", "social"],
    defaultOn: ["hero", "gallery", "services", "testimonials", "about", "contact"],
    cta: "MESSAGE", tagline: "רגעים שנשארים לתמיד", color: "#111827",
    sampleServices: [svc("צילומי משפחה"), svc("צילומי אירועים")],
  },
  {
    id: "trainer", label: "מאמן כושר", emoji: "🏋️",
    sections: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "prices", "gallery", "highlights", "hours", "social"],
    defaultOn: ["hero", "about", "services", "testimonials", "booking", "faq", "contact"],
    cta: "BOOKING", tagline: "מתאמנים חכם, רואים תוצאות", color: "#dc2626",
    sampleServices: [svc("אימון אישי", "", "200"), svc("אימון זוגי", "", "300")],
  },
  {
    id: "consultant", label: "יועץ", emoji: "💼",
    sections: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "prices", "highlights", "hours", "social"],
    defaultOn: ["hero", "about", "services", "testimonials", "booking", "faq", "contact"],
    cta: "BOOKING", tagline: "ייעוץ מקצועי שמקדם את העסק שלך", color: "#0f766e",
    sampleServices: [svc("פגישת היכרות"), svc("ליווי חודשי")],
  },
  {
    id: "lawyer", label: "עורך דין", emoji: "⚖️",
    sections: ["hero", "about", "services", "faq", "location", "contact", "highlights", "booking", "hours", "testimonials"],
    defaultOn: ["hero", "about", "services", "faq", "location", "contact"],
    cta: "CALL", tagline: "ליווי משפטי מקצועי ואישי", color: "#1e3a8a",
    sampleServices: [svc("ייעוץ ראשוני"), svc("ליווי משפטי")],
  },
  {
    id: "other", label: "אחר", emoji: "🏪",
    sections: ["hero", "about", "services", "hours", "location", "contact", "gallery", "testimonials", "faq", "highlights", "social"],
    defaultOn: ["hero", "about", "services", "hours", "location", "contact"],
    cta: "WHATSAPP", tagline: "שירות אישי ומקצועי", color: "#2563eb",
    sampleServices: [],
  },
];

export function getCategory(id: string): CategoryPreset {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
