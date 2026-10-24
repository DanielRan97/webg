import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";
import { PLANS, PRICE_NOTE } from "@/lib/business";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { WebgMark } from "@/components/WebgMark";
import { Blueprint } from "@/components/landing/Blueprint";
import { SiteFooter } from "@/components/SiteFooter";
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
        <Blueprint />
        <header className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <WebgMark tone="dark" />
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a href="#pricing" className="hidden min-h-11 items-center px-3 text-ink-300 transition hover:text-white sm:inline-flex">מחירים</a>
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
                <li key={s.title} className="rounded-2xl border border-ink-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgb(21_70_209/0.45)]">
                  <span aria-hidden className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-brand-600 to-cyan-400 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgb(21_70_209/0.7)]">{i + 1}</span>
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
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-100 bg-linear-to-br from-white to-brand-50 text-brand-600 shadow-sm">
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

        <section id="pricing" className="scroll-mt-6 px-5 pb-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">מחיר אחד לחודש, בלי הפתעות.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">בלי דמי הקמה ובלי התחייבות. משלמים על כל אתר בנפרד.</p>
            <ul className="mt-12 grid gap-5 md:grid-cols-2">
              {PLANS.map((p) => (
                <li key={p.id} className={`flex flex-col rounded-2xl border bg-white p-7 ${p.id === "PRO" ? "border-brand-600 shadow-[0_24px_60px_-30px_rgb(21_70_209/0.6)] ring-1 ring-brand-600" : "border-ink-200"}`}>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <p className="mt-1 text-ink-600">{p.tagline}</p>
                  <p className="mt-6"><span className="text-5xl font-bold tracking-tight">₪{p.price}</span> <span className="text-ink-500">לחודש</span></p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-ink-700">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2"><span aria-hidden className="font-bold text-brand-600">✓</span>{f}</li>
                    ))}
                  </ul>
                  <Link href={ctaHref} className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold transition ${p.id === "PRO" ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-ink-200 text-ink-900 hover:bg-ink-50"}`}>
                    בחירת {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-500">{PRICE_NOTE} פרטים מלאים ב<Link href="/terms" className="underline underline-offset-2 hover:text-ink-900">תנאי השימוש</Link>.</p>
          </div>
        </section>

        <section className="px-5 pb-24">
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 overflow-hidden rounded-3xl bg-ink-950 px-8 py-14 text-white md:px-14">
            <div aria-hidden className="webg-drift pointer-events-none absolute -top-24 start-1/3 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" />
            <div aria-hidden className="webg-drift pointer-events-none absolute -bottom-28 end-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" style={{ animationDelay: "-7s" }} />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">האתר שלכם במרחק כמה דקות.</h2>
              <p className="mt-3 text-lg text-ink-300">מתחילים עכשיו, ואפשר לשנות כל פרט גם אחר כך.</p>
            </div>
            <Link href={ctaHref} className="relative inline-flex min-h-14 items-center rounded-xl bg-brand-500 px-8 text-lg font-semibold text-white transition hover:bg-brand-400 hover:shadow-[0_10px_30px_-8px_rgb(90_130_245/0.7)] active:scale-[0.98]">
              יצירת האתר שלי
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
