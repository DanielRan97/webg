import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "מדיניות פרטיות" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-16">
      <Link href="/" className="text-sm font-semibold text-indigo-800 underline">← חזרה ל-WEBG</Link>
      <h1 className="text-3xl font-extrabold">מדיניות פרטיות</h1>
      <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
        זהו טיוטת מקום-שמור (placeholder) בלבד. הטקסט הסופי, המחייב מבחינה משפטית, טרם נכתב ולא עבר ייעוץ משפטי.
        אין להסתמך על עמוד זה כהצהרת פרטיות תקפה.
      </p>
      <p className="text-gray-700">
        WEBG שומרת מידע לצורך הפעלת השירות, ובכלל זה פרטי חשבון בעלי אתרים (אימייל), פרטי העסק שמוזנים לאתר,
        ופניות שמתקבלות מלקוחות דרך טפסי יצירת קשר וטפסי לידים באתרים המתפרסמים דרך WEBG.
      </p>
      <p className="text-gray-700">לשאלות בנושא פרטיות אפשר לפנות אלינו במייל: <a href="mailto:support@webg.co.il" className="font-semibold text-indigo-800 underline" dir="ltr">support@webg.co.il</a></p>
    </main>
  );
}
