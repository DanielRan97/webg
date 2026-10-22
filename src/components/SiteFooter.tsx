import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { WebgMark } from "./WebgMark";

const LINKS = [
  { href: "/#pricing", label: "מחירים" },
  { href: "/contact", label: "יצירת קשר" },
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/accessibility", label: "הצהרת נגישות" },
] as const;

/** Public-page footer: the legal business behind WEBG and its contact details, as payment acquirers and consumer law expect to find them. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm text-ink-600 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <WebgMark size="sm" />
          <p className="max-w-md leading-relaxed">
            WEBG מופעל על ידי {BUSINESS.nameHe} (<span dir="ltr">{BUSINESS.name}</span>), {BUSINESS.type}
            {BUSINESS.number && <> מס׳ <span dir="ltr">{BUSINESS.number}</span></>}.
          </p>
          <address className="space-y-1 not-italic">
            <p>{BUSINESS.address}</p>
            <p>
              <a href={BUSINESS.phoneHref} dir="ltr" className="hover:text-ink-900">{BUSINESS.phone}</a>
              <span aria-hidden className="mx-2 text-ink-300">|</span>
              <a href={`mailto:${BUSINESS.email}`} dir="ltr" className="hover:text-ink-900">{BUSINESS.email}</a>
            </p>
          </address>
        </div>
        <nav aria-label="קישורים" className="flex flex-col gap-2 md:items-end">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-900">{l.label}</Link>
          ))}
          <p className="mt-2 text-ink-500">© {new Date().getFullYear()} {BUSINESS.name}</p>
        </nav>
      </div>
    </footer>
  );
}
