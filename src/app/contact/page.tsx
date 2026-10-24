import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { LegalPage, Section, linkClass } from "@/components/LegalPage";

export const metadata: Metadata = { title: "יצירת קשר" };

export default function ContactPage() {
  return (
    <LegalPage title="יצירת קשר">
      <p className="text-lg leading-relaxed text-ink-700">יש שאלה על השירות, על מנוי או על אתר קיים? אפשר לפנות אלינו בכל אחת מהדרכים הבאות.</p>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-200 p-5">
          <dt className="text-sm font-semibold text-ink-500">טלפון</dt>
          <dd className="mt-1 text-lg font-semibold"><a href={BUSINESS.phoneHref} dir="ltr" className="hover:text-brand-700">{BUSINESS.phone}</a></dd>
        </div>
        <div className="rounded-xl border border-ink-200 p-5">
          <dt className="text-sm font-semibold text-ink-500">אימייל</dt>
          <dd className="mt-1 text-lg font-semibold"><a href={`mailto:${BUSINESS.email}`} dir="ltr" className="hover:text-brand-700">{BUSINESS.email}</a></dd>
        </div>
        <div className="rounded-xl border border-ink-200 p-5 sm:col-span-2">
          <dt className="text-sm font-semibold text-ink-500">כתובת</dt>
          <dd className="mt-1 text-lg font-semibold">{BUSINESS.address}</dd>
        </div>
      </dl>

      <Section title="לבעלי אתרים רשומים">
        <p>
          הדרך המהירה לקבל מענה על אתר קיים היא פנייה דרך <Link href="/support" className={linkClass}>אזור התמיכה</Link> בחשבון.
          כך אנחנו רואים מיד באיזה אתר מדובר.
        </p>
      </Section>

      <Section title="פרטי העסק">
        <p>
          WEBG מופעל על ידי {BUSINESS.nameHe} (<span dir="ltr">{BUSINESS.name}</span>)
          {BUSINESS.number && <>, מס׳ עוסק <span dir="ltr">{BUSINESS.number}</span></>}, {BUSINESS.address}.
        </p>
      </Section>
    </LegalPage>
  );
}
