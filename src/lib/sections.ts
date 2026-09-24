/**
 * Section registry: every section a website can show, with the plain-Hebrew
 * text the owner sees. The rendering of each section lives once, in
 * src/templates/engine, and is shared by every template.
 */
export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "prices"
  | "menu"
  | "gallery"
  | "highlights"
  | "testimonials"
  | "areas"
  | "emergency"
  | "booking"
  | "faq"
  | "hours"
  | "location"
  | "contact"
  | "social"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications";

export const SECTION_META: Record<SectionType, { label: string; hint: string }> = {
  hero: { label: "פתיחה", hint: "החלק הראשון שהלקוחות רואים: שם העסק וכפתור גדול." },
  about: { label: "קצת עלינו", hint: "כמה משפטים עליכם, כדי שלקוחות יכירו אתכם." },
  services: { label: "שירותים", hint: "מה אתם מציעים, כרטיס לכל שירות." },
  prices: { label: "מחירון", hint: "רשימת מחירים קצרה וברורה." },
  menu: { label: "תפריט", hint: "המנות שלכם והמחירים." },
  gallery: { label: "גלריה", hint: "תמונות מהעסק, כדי שלקוחות יראו איך זה נראה." },
  highlights: { label: "למה לבחור בנו", hint: "מספרים בולטים, כמו שנות ניסיון או מספר לקוחות." },
  testimonials: { label: "המלצות", hint: "מה לקוחות מרוצים אומרים עליכם." },
  areas: { label: "אזורי שירות", hint: "באילו ערים ואזורים אתם מגיעים ללקוחות." },
  emergency: { label: "שירות חירום", hint: "מראה שאתם זמינים גם לתקלות דחופות." },
  booking: { label: "קביעת תור", hint: "כפתור גדול שמאפשר ללקוחות לקבוע תור." },
  faq: { label: "שאלות נפוצות", hint: "תשובות לשאלות שלקוחות שואלים הרבה." },
  hours: { label: "שעות פתיחה", hint: "כדי שלקוחות ידעו מתי אפשר להגיע." },
  location: { label: "איך מגיעים", hint: "הכתובת שלכם ומפה עם כפתור ניווט." },
  contact: { label: "יצירת קשר", hint: "כפתורים לחיוג, WhatsApp ואימייל." },
  social: { label: "רשתות חברתיות", hint: "קישורים לאינסטגרם, פייסבוק וטיקטוק." },
  experience: { label: "ניסיון תעסוקתי", hint: "תפקידים קודמים: איפה עבדתם, מה עשיתם ומתי." },
  education: { label: "השכלה", hint: "תארים, קורסים ולימודים שסיימתם." },
  skills: { label: "כישורים", hint: "רשימת יכולות וכלים שאתם שולטים בהם." },
  projects: { label: "פרויקטים", hint: "עבודות לדוגמה, עם תיאור ותמונה או קישור." },
  certifications: { label: "הסמכות וקורסים", hint: "תעודות, הסמכות והשלמות מקצועיות." },
};

export const ALL_SECTIONS = Object.keys(SECTION_META) as SectionType[];

export function isSectionType(value: string): value is SectionType {
  return value in SECTION_META;
}
