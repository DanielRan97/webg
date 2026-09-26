import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "תנאי שימוש" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-16">
      <Link href="/" className="text-sm font-semibold text-indigo-800 underline">← חזרה ל-WEBG</Link>
      <h1 className="text-3xl font-extrabold">תנאי שימוש</h1>
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
        זהו טיוטת מקום-שמור (placeholder) בלבד. הטקסט הסופי, המחייב מבחינה משפטית, טרם נכתב ולא עבר ייעוץ משפטי.
        אין להסתמך על עמוד זה כתנאי שימוש תקפים.
      </p>
      <p className="text-gray-700">
        השימוש ב-WEBG ליצירה, עריכה ופרסום אתר עסקי כפוף לתנאים שיפורסמו כאן. עד לפרסום הנוסח הסופי,
        לכל שאלה לגבי תנאי השימוש אפשר לפנות אלינו במייל: <a href="mailto:support@webg.co.il" className="font-semibold text-indigo-800 underline" dir="ltr">support@webg.co.il</a>
      </p>
    </main>
  );
}
