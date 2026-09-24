import type { CtaType, SocialPlatform } from "./constants";
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
  /** Which social platforms the "יצירת קשר" step offers. Defaults to the original 3 for every existing category. */
  socialPlatforms: SocialPlatform[];
}

const svc = (name: string, description = "", price = "", category = "") => ({ name, description, price, category });

const SERVICE_TRADE: SectionType[] = ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact", "inquiry", "prices", "gallery", "about", "highlights", "hours", "social"];
const APPOINTMENT: SectionType[] = ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact", "inquiry", "about", "social"];
const FOOD: SectionType[] = ["hero", "menu", "delivery", "gallery", "testimonials", "hours", "location", "contact", "inquiry", "about", "social"];
const PERSONAL_SERVICES: SectionType[] = ["hero", "about", "services", "areas", "prices", "testimonials", "faq", "contact", "inquiry", "gallery", "social", "highlights", "hours", "location", "booking"];
const PORTFOLIO: SectionType[] = ["hero", "about", "experience", "education", "skills", "projects", "certifications", "contact", "inquiry", "social"];

/** Every existing category (all 12 below) keeps exactly this set - unchanged from before this field existed. */
const CLASSIC_SOCIALS: SocialPlatform[] = ["instagram", "facebook", "tiktok"];
const PORTFOLIO_SOCIALS: SocialPlatform[] = ["instagram", "facebook", "tiktok", "linkedin", "github"];

/**
 * A category only decides which sections are suggested, in what order, and
 * which are switched on at first. Every section stays available to every
 * business; the owner can show or hide any of them.
 */
export const CATEGORIES: CategoryPreset[] = [
  {
    id: "barber", label: "ספר", emoji: "💈",
    sections: APPOINTMENT,
    defaultOn: ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact", "inquiry"],
    cta: "BOOKING", tagline: "תספורת מדויקת, אווירה טובה", color: "#1f2937",
    sampleServices: [svc("תספורת גברים", "תספורת וסידור", "70"), svc("תספורת + זקן", "", "100")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "beauty", label: "מכון יופי", emoji: "💅",
    sections: APPOINTMENT,
    defaultOn: ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact", "inquiry"],
    cta: "BOOKING", tagline: "כל מה שצריך כדי להרגיש יפה", color: "#be185d",
    sampleServices: [svc("מניקור ג'ל", "", "120"), svc("טיפול פנים", "", "250")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "restaurant", label: "מסעדה", emoji: "🍽️",
    sections: FOOD,
    defaultOn: ["hero", "menu", "delivery", "gallery", "testimonials", "hours", "location", "contact", "inquiry"],
    cta: "CALL", tagline: "אוכל טוב, אנשים טובים", color: "#b45309",
    sampleServices: [svc("סלט ירקות", "", "38", "ראשונות"), svc("סטייק אנטריקוט", "", "98", "עיקריות")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "cafe", label: "בית קפה", emoji: "☕",
    sections: FOOD,
    defaultOn: ["hero", "menu", "delivery", "gallery", "testimonials", "hours", "location", "contact", "inquiry"],
    cta: "CALL", tagline: "הקפה הכי טוב בשכונה", color: "#92400e",
    sampleServices: [svc("אספרסו", "", "10", "שתייה חמה"), svc("קרואסון חמאה", "", "16", "מאפים")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "electrician", label: "חשמלאי", emoji: "⚡",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact", "inquiry"],
    cta: "CALL", tagline: "שירות מהיר, עבודה נקייה ואחריות", color: "#d97706",
    sampleServices: [svc("תיקון תקלות חשמל"), svc("התקנת נקודות ותאורה")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "plumber", label: "אינסטלטור", emoji: "🔧",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact", "inquiry"],
    cta: "CALL", tagline: "פתרון מהיר לכל בעיית אינסטלציה", color: "#0369a1",
    sampleServices: [svc("פתיחת סתימות"), svc("תיקון נזילות")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "technician", label: "טכנאי", emoji: "🛠️",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "emergency", "testimonials", "faq", "contact", "inquiry"],
    cta: "CALL", tagline: "מגיעים אליכם ומתקנים במקום", color: "#0f766e",
    sampleServices: [svc("תיקון מכשירי חשמל"), svc("התקנה והתאמה")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "cleaner", label: "שירותי ניקיון", emoji: "🧼",
    sections: SERVICE_TRADE,
    defaultOn: ["hero", "services", "areas", "testimonials", "faq", "contact", "inquiry"],
    cta: "WHATSAPP", tagline: "בית נקי, בלי מאמץ", color: "#0891b2",
    sampleServices: [svc("ניקיון דירות"), svc("ניקיון משרדים")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "photographer", label: "צלם", emoji: "📷",
    sections: ["hero", "gallery", "services", "testimonials", "about", "contact", "inquiry", "prices", "faq", "highlights", "booking", "social"],
    defaultOn: ["hero", "gallery", "services", "testimonials", "about", "contact", "inquiry"],
    cta: "MESSAGE", tagline: "רגעים שנשארים לתמיד", color: "#111827",
    sampleServices: [svc("צילומי משפחה"), svc("צילומי אירועים")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "trainer", label: "מאמן כושר", emoji: "🏋️",
    sections: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "inquiry", "prices", "gallery", "highlights", "hours", "social"],
    defaultOn: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "inquiry"],
    cta: "BOOKING", tagline: "מתאמנים חכם, רואים תוצאות", color: "#dc2626",
    sampleServices: [svc("אימון אישי", "", "200"), svc("אימון זוגי", "", "300")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "consultant", label: "יועץ", emoji: "💼",
    sections: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "inquiry", "prices", "highlights", "hours", "social"],
    defaultOn: ["hero", "about", "services", "testimonials", "booking", "faq", "contact", "inquiry"],
    cta: "BOOKING", tagline: "ייעוץ מקצועי שמקדם את העסק שלך", color: "#0f766e",
    sampleServices: [svc("פגישת היכרות"), svc("ליווי חודשי")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "lawyer", label: "עורך דין", emoji: "⚖️",
    sections: ["hero", "about", "services", "faq", "location", "contact", "inquiry", "highlights", "booking", "hours", "testimonials"],
    defaultOn: ["hero", "about", "services", "faq", "location", "contact", "inquiry"],
    cta: "CALL", tagline: "ליווי משפטי מקצועי ואישי", color: "#1e3a8a",
    sampleServices: [svc("ייעוץ ראשוני"), svc("ליווי משפטי")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "other", label: "אחר", emoji: "🏪",
    sections: ["hero", "about", "services", "hours", "location", "contact", "inquiry", "gallery", "testimonials", "faq", "highlights", "social"],
    defaultOn: ["hero", "about", "services", "hours", "location", "contact", "inquiry"],
    cta: "WHATSAPP", tagline: "שירות אישי ומקצועי", color: "#2563eb",
    sampleServices: [],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "cosmetics", label: "קוסמטיקה", emoji: "💄",
    sections: APPOINTMENT,
    defaultOn: ["hero", "services", "prices", "gallery", "testimonials", "booking", "hours", "location", "contact", "inquiry"],
    cta: "BOOKING", tagline: "טיפוח וטיפולי יופי מקצועיים", color: "#a21caf",
    sampleServices: [svc("טיפול פנים", "", "250"), svc("הרמת ריסים", "", "150"), svc("מניקור ג'ל", "", "120")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "personal", label: "שירותים אישיים", emoji: "🧰",
    sections: PERSONAL_SERVICES,
    defaultOn: ["hero", "about", "services", "areas", "prices", "testimonials", "faq", "contact", "inquiry"],
    cta: "WHATSAPP", tagline: "שירות אישי, אמין וזמין", color: "#0891b2",
    sampleServices: [svc("שליחת חבילה"), svc("סידורים ועזרה בבית")],
    socialPlatforms: CLASSIC_SOCIALS,
  },
  {
    id: "portfolio", label: "פורטפוליו אישי", emoji: "🧑‍💻",
    sections: PORTFOLIO,
    defaultOn: PORTFOLIO,
    cta: "MESSAGE", tagline: "קורות חיים ותיק עבודות דיגיטלי", color: "#111827",
    sampleServices: [],
    socialPlatforms: PORTFOLIO_SOCIALS,
  },
];

export function getCategory(id: string): CategoryPreset {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
