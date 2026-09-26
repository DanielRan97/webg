import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";

const STEPS = [
  { n: 1, title: "ממלאים פרטים", text: "שם העסק, טלפון, שעות פתיחה ומה אתם מציעים." },
  { n: 2, title: "בוחרים עיצוב", text: "צבע, לוגו ותמונות. האתר מתעצב לבד." },
  { n: 3, title: "מפרסמים", text: "לוחצים על כפתור, והאתר אונליין עם כתובת משלו." },
];

const btnPrimary = "inline-flex h-14 items-center justify-center rounded-2xl bg-indigo-600 px-8 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700";
const btnSecondary = "inline-flex h-14 items-center justify-center rounded-2xl border-2 border-gray-300 bg-white px-8 text-lg font-bold transition hover:bg-gray-50";

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <div className="scroll-smooth">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <span className="text-3xl font-extrabold tracking-tight text-indigo-700">WEBG</span>
        <nav className="flex items-center gap-5 font-semibold">
          {user ? (
            <Link href="/dashboard" className="inline-flex min-h-11 items-center text-indigo-800">האתרים שלי</Link>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-11 items-center text-gray-800 hover:text-gray-900">התחברות</Link>
              <Link href="/signup" className="inline-flex min-h-11 items-center rounded-xl bg-gray-900 px-4 text-white">הרשמה</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="bg-gradient-to-b from-indigo-50 to-white px-5 pb-20 pt-12 text-center md:pt-20">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-lg font-bold text-indigo-700">WEBG</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">יוצרים אתר במילוי טופס.</h1>
            <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-gray-600">
              בלי עלות הקמה גבוהה, בלי אחסון בנפרד ובלי תחזוקה מסובכת. ממלאים כמה פרטים — ו־WEBG עושה את השאר.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href={user ? "/create" : "/signup"} className={btnPrimary}>צור אתר</Link>
              <a href="#how" className={btnSecondary}>ראה איך זה עובד</a>
            </div>
            <p className="mt-6 text-gray-500">ממלאים פרטים על העסק. מקבלים אתר.</p>
          </div>
        </section>

        <section id="how" className="scroll-mt-8 px-5 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-extrabold">שלושה צעדים פשוטים</h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl font-extrabold text-white">{s.n}</span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-gray-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-gray-50 px-5 py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-extrabold">לא יודעים מאיפה להתחיל עם אתר?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
              אם אתם רוצים אתר מקצועי אבל לא יודעים למי לפנות, כמה זה אמור לעלות, מה צריך להכין ואיך בכלל מתחילים —
              WEBG עושה את כל זה פשוט. לא צריך להבין באתרים, אחסון או דומיינים, לא צריך לרדוף אחרי מתכנתים ולא לשלם
              אלפי שקלים מראש. ממלאים כמה פרטים, בוחרים איך האתר ייראה — ו-WEBG עושה את השאר.
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5 font-semibold shadow-sm">
                  <span className="block text-3xl" aria-hidden>{c.emoji}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-20 text-center">
          <h2 className="text-3xl font-extrabold">מוכנים להתחיל?</h2>
          <p className="mt-3 text-lg text-gray-600">זה לוקח כמה דקות.</p>
          <Link href={user ? "/create" : "/signup"} className={`${btnPrimary} mt-8`}>צור אתר</Link>
        </section>
      </main>

      <footer className="border-t border-gray-200 px-5 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} WEBG</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/privacy" className="underline hover:text-gray-700">מדיניות פרטיות</Link>
          <Link href="/terms" className="underline hover:text-gray-700">תנאי שימוש</Link>
          <a href="mailto:support@webg.co.il" className="underline hover:text-gray-700">צור קשר</a>
        </p>
      </footer>
    </div>
  );
}
