import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { WebgMark } from "@/components/WebgMark";
import { KeyIcon, LockIcon, MailCheckIcon, TrashIcon } from "@/components/icons";

const STEPS = [
  { title: "ממלאים פרטים", text: "שם העסק, טלפון, שעות פתיחה ומה אתם מציעים. כמה דקות, בלי מונחים טכניים." },
  { title: "בוחרים עיצוב", text: "צבע, לוגו, תמונות ותבנית. רואים את האתר משתנה תוך כדי." },
  { title: "מפרסמים", text: "לחיצה אחת, והאתר באוויר עם כתובת משלו וחיבור מאובטח." },
];

/** Only claims that are true of the product today - each one maps to real behaviour in the codebase. */
const SECURITY = [
  { Icon: LockIcon, title: "חיבור מוצפן לכל אתר", text: "כל אתר נפתח ב-HTTPS, עם המנעול בשורת הכתובת. הלקוחות שלכם גולשים בבטחה." },
  { Icon: KeyIcon, title: "סיסמאות מוצפנות", text: "הסיסמה נשמרת כגיבוב חד-כיווני. אף אחד לא יכול לקרוא אותה, גם לא אנחנו." },
  { Icon: MailCheckIcon, title: "אימות בעלות", text: "אתר מתפרסם רק אחרי שאימתתם את כתובת האימייל שלכם." },
  { Icon: TrashIcon, title: "השליטה אצלכם", text: "אפשר להשבית את האתר או למחוק אותו לצמיתות, בכל רגע ובלי לבקש מאף אחד." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? "/create" : "/signup";

  return (
    <div className="bg-white text-ink-900">
      <div className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <header className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <WebgMark tone="dark" />
          <nav className="flex items-center gap-2 text-sm font-semibold">
            {user ? (
              <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-4 text-white transition hover:bg-white/10">האתרים שלי</Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-ink-300 transition hover:text-white">התחברות</Link>
                <Link href="/signup" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-ink-950 transition hover:bg-ink-100">הרשמה</Link>
              </>
            )}
          </nav>
        </header>
        <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-10 md:pt-16">
          <HeroDemo ctaHref={ctaHref} />
        </section>
      </div>

      <main>
        <section id="how" className="scroll-mt-6 px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">שלושה צעדים, ויש לכם אתר.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              לא צריך לדעת מה זה אחסון, דומיין או קוד. WEBG עושה את החלק הטכני.
            </p>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-ink-200 bg-white p-6">
                  <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-ink-100 bg-paper px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">בנוי לעסקים שצריכים לסמוך על האתר שלהם.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">אבטחה מובנית בכל אתר, בלי הגדרות ובלי תוספות.</p>
            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {SECURITY.map(({ Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-200 bg-white text-brand-600 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 leading-relaxed text-ink-600">{text}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">מותאם לסוג העסק שלכם.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
              בוחרים סוג עסק, ו-WEBG מציע את החלקים שמתאימים לו: תפריט למסעדה, קביעת תור לספר, שירות חירום לחשמלאי.
            </p>
            <ul className="mt-10 flex flex-wrap gap-2.5">
              {CATEGORIES.map((c) => (
                <li key={c.id} className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700">{c.label}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 rounded-3xl bg-ink-950 px-8 py-14 text-white md:px-14">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">האתר שלכם במרחק כמה דקות.</h2>
              <p className="mt-3 text-lg text-ink-300">מתחילים עכשיו, ואפשר לשנות כל פרט גם אחר כך.</p>
            </div>
            <Link href={ctaHref} className="inline-flex min-h-14 items-center rounded-xl bg-brand-500 px-8 text-lg font-semibold text-white transition hover:bg-brand-400">
              יצירת האתר שלי
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-600">
          <span className="inline-flex items-center gap-3">
            <WebgMark size="sm" />
            <span>© {new Date().getFullYear()}</span>
          </span>
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/privacy" className="hover:text-ink-900">מדיניות פרטיות</Link>
            <Link href="/terms" className="hover:text-ink-900">תנאי שימוש</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-ink-900">
              צור קשר: <span dir="ltr">{SUPPORT_EMAIL}</span>
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
