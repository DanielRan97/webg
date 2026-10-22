import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business";
import { LegalPage, Section, linkClass } from "@/components/LegalPage";

export const metadata: Metadata = { title: "הצהרת נגישות" };

const UPDATED_AT = "אוקטובר 2026";

export default function AccessibilityPage() {
  return (
    <LegalPage title="הצהרת נגישות" updatedAt={UPDATED_AT}>
      <Section title="המחויבות שלנו">
        <p>
          אנחנו רוצים ש-WEBG יהיה נוח לשימוש לכל אדם, כולל אנשים עם מוגבלות. פעלנו להתאים את האתר לתקנות שוויון זכויות
          לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013, ולתקן הישראלי ת״י 5568, ברמה AA של הנחיות WCAG 2.0.
          ההתאמה נבדקה בבדיקה עצמית, ואנחנו ממשיכים לשפר אותה.
        </p>
      </Section>

      <Section title="מה עשינו">
        <ul className="list-inside list-disc space-y-1">
          <li>אפשר לנווט ולהפעיל את כל רכיבי האתר באמצעות המקלדת, עם סימון ברור של הרכיב שבפוקוס.</li>
          <li>מבנה הדפים מסומן בכותרות, ושפת האתר והכיוון (עברית, מימין לשמאל) מוגדרים לקוראי מסך.</li>
          <li>לכל שדה בטופס יש תווית, והודעות שגיאה מוצגות ליד השדה ומוקראות לקוראי מסך.</li>
          <li>ניגודיות הצבעים בין טקסט לרקע מותאמת לקריאות.</li>
          <li>האתר מותאם לטלפונים ולהגדלת תצוגה, בלי גלילה הצידה.</li>
          <li>כשבמכשיר מוגדרת הפחתת תנועה, האתר מכבד את ההגדרה.</li>
        </ul>
      </Section>

      <Section title="מגבלות ידועות">
        <ul className="list-inside list-disc space-y-1">
          <li>התצוגה המקדימה של האתר בזמן העריכה מוצגת בתוך מסגרת, ועשויה להיות פחות נוחה לשימוש עם קורא מסך.</li>
          <li>
            האתרים שבעלי עסקים בונים ב-WEBG מבוססים על תבניות שתוכננו עם התאמות נגישות, אך התוכן שבהם (למשל תיאור
            לתמונות) מוזן על ידי בעל האתר ובאחריותו.
          </li>
        </ul>
      </Section>

      <Section title="נתקלתם בבעיה?">
        <p>
          אם משהו באתר לא נגיש עבורכם, נשמח לשמוע ולתקן.
          {BUSINESS.accessibilityContact && <> רכז/ת הנגישות: {BUSINESS.accessibilityContact}.</>} אפשר לפנות בטלפון{" "}
          <a href={BUSINESS.phoneHref} dir="ltr" className={linkClass}>{BUSINESS.phone}</a> או באימייל{" "}
          <a href={`mailto:${BUSINESS.email}`} dir="ltr" className={linkClass}>{BUSINESS.email}</a>. כדאי לציין באיזה עמוד
          מדובר ומה לא עבד.
        </p>
      </Section>
    </LegalPage>
  );
}
