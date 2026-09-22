import { emptySiteData } from "../src/lib/site-defaults";
import type { SiteData } from "../src/types/site";

type Patch = Partial<SiteData>;

/** Turns on every section of a site so tests exercise all of them. */
export const allSectionsOn = (d: SiteData): SiteData => ({
  ...d,
  sections: d.sections.map((s) => ({ ...s, enabled: true })),
});

function make(category: string, patch: Patch): SiteData {
  return { ...emptySiteData(category), ...patch };
}

const t = (name: string, text: string, rating = 5) => ({ name, text, rating, imageUrl: "" });

/** Fully populated example sites, one per major business category. */
export const SAMPLE_SITES: Record<string, SiteData> = {
  barber: make("barber", {
    businessName: "Daniel Barber", slug: "daniel-barber",
    description: "מספרה שכונתית בלב תל אביב. תספורות מדויקות, אווירה טובה וקפה על חשבון הבית.",
    phone: "050-1234567", whatsapp: "050-1234567", email: "daniel@example.com", address: "דיזנגוף 100", city: "תל אביב",
    services: [
      { name: "תספורת גברים", description: "תספורת, שטיפה וסידור", price: "70", category: "תספורות" },
      { name: "תספורת + זקן", description: "", price: "100", category: "תספורות" },
      { name: "תספורת ילדים", description: "עד גיל 12", price: "50", category: "תספורות" },
      { name: "עיצוב זקן", description: "", price: "40", category: "טיפוח" },
    ],
    testimonials: [t("יובל", "המספרה הכי טובה שהייתי בה. מקצועי ומדויק."), t("איתי", "אווירה מעולה ותספורת בדיוק כמו שביקשתי.", 4), t("נועם", "מגיע כבר שנים, לא מחליף.", 0)],
    booking: { method: "WHATSAPP", url: "", buttonText: "קבעו תור בוואטסאפ" },
    highlights: [{ label: "שנות ניסיון", value: "9" }, { label: "לקוחות מרוצים", value: "1,200+" }],
    socials: { instagram: "@danielbarber", facebook: "", tiktok: "" },
  }),
  restaurant: make("restaurant", {
    businessName: "המסעדה של רוני", slug: "roni-restaurant",
    description: "מטבח ים תיכוני עם חומרי גלם טריים, מדי יום.",
    phone: "03-5551234", address: "רוטשילד 10", city: "תל אביב", primaryColor: "#b45309",
    services: [
      { name: "סלט ירקות קצוץ", description: "עגבנייה, מלפפון, בצל ירוק", price: "38", category: "ראשונות" },
      { name: "חומוס בית", description: "עם גרגירים וטחינה", price: "34", category: "ראשונות" },
      { name: "סטייק אנטריקוט", description: "300 גרם, עם צ'יפס", price: "98", category: "עיקריות" },
      { name: "דג ים ביום", description: "", price: "92", category: "עיקריות" },
      { name: "מלבי", description: "", price: "32", category: "קינוחים" },
    ],
    testimonials: [t("מיכל", "אוכל מדהים ושירות חם."), t("אורי", "הסטייק הטוב ביותר בעיר.", 5)],
  }),
  electrician: make("electrician", {
    businessName: "חשמל מהיר - אבי", slug: "avi-electric",
    description: "חשמלאי מוסמך עם ניסיון של 15 שנה. עבודה נקייה, מחירים הוגנים ואחריות.",
    phone: "052-7654321", whatsapp: "052-7654321", primaryColor: "#d97706",
    services: [
      { name: "תיקון תקלות חשמל", description: "אבחון ותיקון במקום", price: "", category: "" },
      { name: "התקנת נקודות ותאורה", description: "", price: "", category: "" },
      { name: "החלפת לוח חשמל", description: "", price: "", category: "" },
    ],
    areas: ["תל אביב", "רמת גן", "גבעתיים", "בני ברק", "חולון"],
    emergency: { available24x7: true, phone: "052-7654321", message: "קצר חשמלי או תקלה דחופה? התקשרו ונגיע בהקדם." },
    testimonials: [t("שרון", "הגיע תוך שעה ופתר את התקלה."), t("דוד", "עבודה מסודרת ונקייה.", 5)],
    faq: [
      { question: "האם אתם מגיעים גם בשבת?", answer: "כן, במקרי חירום ובתיאום מראש." },
      { question: "יש אחריות על העבודה?", answer: "כן, אחריות מלאה על כל עבודה." },
    ],
    highlights: [{ label: "שנות ניסיון", value: "15" }],
  }),
  photographer: make("photographer", {
    businessName: "נועה צילום", slug: "noa-photo",
    description: "צילומי משפחה, חתונות ואירועים בסגנון טבעי ורגוע.",
    phone: "054-1112233", email: "noa@example.com", primaryColor: "#111827",
    services: [
      { name: "צילומי משפחה", description: "כשעה וחצי בחוץ", price: "", category: "" },
      { name: "צילומי אירועים", description: "", price: "", category: "" },
    ],
    testimonials: [t("משפחת לוי", "תמונות מרגשות, ממליצים בחום.")],
    socials: { instagram: "@noaphoto", facebook: "", tiktok: "" },
  }),
  trainer: make("trainer", {
    businessName: "אימונים עם גל", slug: "gal-training",
    description: "מאמן כושר אישי. תוכניות מותאמות, ליווי צמוד ותוצאות.",
    phone: "053-9998877", whatsapp: "053-9998877", primaryColor: "#dc2626",
    services: [
      { name: "אימון אישי", description: "שעה, בסטודיו או בחוץ", price: "200", category: "" },
      { name: "אימון זוגי", description: "", price: "300", category: "" },
    ],
    booking: { method: "LINK", url: "calendly.com/gal-training", buttonText: "" },
    testimonials: [t("רותם", "ירדתי 8 קילו בשלושה חודשים."), t("עמית", "ליווי מקצועי ומוטיבציה.", 5)],
    faq: [{ question: "אני מתחיל, זה מתאים לי?", answer: "בהחלט, כל תוכנית מותאמת אליך." }],
    highlights: [{ label: "מתאמנים", value: "300+" }, { label: "דירוג", value: "4.9" }],
  }),
};
