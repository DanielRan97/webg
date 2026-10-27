// ui.tsx is a client module; this is a server component, so it joins classes itself.
const cx = (...c: (string | false)[]) => c.filter(Boolean).join(" ");

/**
 * Home page: the site as a way to collect customers - the "השאירו פרטים" form, every inquiry by email, and
 * Pro's inquiries center (shown as a static picture of the real one, AdminInbox). Only true claims: each
 * line maps to what the product does today. The names in the picture are made up.
 */
const SAMPLE = [
  { type: "ליד", name: "מיכל לוי", text: "השאירה שם וטלפון", time: "לפני 4 דק׳", unread: true },
  { type: "ליד", name: "אבי מזרחי", text: "השאיר שם וטלפון", time: "לפני שעה", unread: true },
  { type: "הודעה", name: "נועה כץ", text: "אתם עובדים גם באזור הקריות?", time: "אתמול", unread: false },
];

const FOR_LEADS = [
  "טופס קצר של שם וטלפון, בלי שום דבר שמעכב את הלקוח",
  "כל ליד מגיע אליכם למייל ברגע שהוא נשלח",
  "כתובת אתר משלכם, לשים במודעה, בביו ובוואטסאפ",
];

const PRO_CENTER = [
  "כל הלידים וההודעות במקום אחד, עם סימון של מה חדש",
  "מסננים לפי סוג, וחוזרים ללקוח בטלפון, ב-WhatsApp או במייל בלחיצה",
  "בוחרים איך לקבל פניות: במייל, במרכז הפניות או בשניהם",
];

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden className="mt-0.5 font-bold text-brand-600">✓</span>
      <span>{children}</span>
    </li>
  );
}

export function LeadsSection() {
  return (
    <section id="leads" className="scroll-mt-6 px-5 py-24">
      <div className="webg-reveal mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_minmax(0,28rem)]">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">אתר שמביא לכם לקוחות, לא רק מציג את העסק.</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">
            לקוחות משאירים פרטים או שולחים הודעה ישר מהאתר, וכל פנייה מגיעה אליכם.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold">רוצים בעיקר לאסוף לידים?</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                לא חייבים אתר גדול. משאירים כותרת, כמה מילים וטופס ״השאירו פרטים״, ומסתירים את כל השאר. מתאים לקמפיין
                בפייסבוק או באינסטגרם, לסוכני ביטוח, למתווכים, ליועצים ולכל מי שצריך שלקוחות ישאירו פרטים.
              </p>
              <ul className="mt-4 space-y-2 text-ink-700">{FOR_LEADS.map((t) => <Check key={t}>{t}</Check>)}</ul>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                מרכז הפניות
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">Pro</span>
              </h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                לוח אחד שבו מחכה כל פנייה שהגיעה מהאתר. גם אם מייל נפל לספאם, הליד לא הולך לאיבוד.
              </p>
              <ul className="mt-4 space-y-2 text-ink-700">{PRO_CENTER.map((t) => <Check key={t}>{t}</Check>)}</ul>
            </div>
          </div>
        </div>

        {/* A picture of the real inquiries center, not a working one. */}
        <figure aria-label="דוגמה למרכז הפניות ב-Pro" className="rounded-3xl border border-ink-200 bg-paper p-4 shadow-[0_24px_60px_-34px_rgb(21_70_209/0.55)] sm:p-5">
          <div aria-hidden>
            <div className="flex items-baseline justify-between">
              <p className="font-bold text-ink-950">מרכז הפניות</p>
              <p className="text-xs text-ink-500">מספרת הדוגמה</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "סה״כ פניות", value: 38 },
                { label: "חדשות", value: 2, accent: true },
                { label: "לידים", value: 24 },
              ].map((c) => (
                <div key={c.label} className={cx("rounded-xl border p-3", c.accent ? "border-brand-200 bg-brand-50" : "border-ink-200 bg-white")}>
                  <p className="text-xl font-extrabold text-ink-950">{c.value}</p>
                  <p className="text-xs text-ink-700">{c.label}</p>
                </div>
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {SAMPLE.map((s, i) => (
                <li key={s.name} className={cx("rounded-xl border px-3.5 py-3", s.unread ? "border-brand-200 bg-brand-50/60" : "border-ink-200 bg-white")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-700">{s.type}</span>
                        {s.unread && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">חדש</span>}
                        <span className={cx("text-sm", s.unread ? "font-bold text-ink-950" : "font-semibold text-ink-900")}>{s.name}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-ink-500">{s.text}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-ink-500">{s.time}</span>
                  </div>
                  {i === 0 && (
                    <div className="mt-3 flex gap-2">
                      {["התקשר", "WhatsApp"].map((a) => (
                        <span key={a} className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-sm">{a}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="mt-3 text-xs text-ink-500">כך נראה מרכז הפניות. השמות לדוגמה בלבד.</figcaption>
        </figure>
      </div>
    </section>
  );
}
