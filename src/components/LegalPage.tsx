import Link from "next/link";
import { SiteFooter } from "./SiteFooter";

/** Shared frame for the public legal and info pages: back link, title, last-updated date, body, footer. */
export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white">
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-16">
        <div className="space-y-4">
          <Link href="/" className="text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← חזרה ל-WEBG</Link>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {updatedAt && <p className="text-sm text-ink-500">עודכן לאחרונה: {updatedAt}</p>}
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <div className="space-y-2 leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

export const linkClass = "font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800";
