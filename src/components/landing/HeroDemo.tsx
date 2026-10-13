"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { emptySiteData } from "@/lib/site-defaults";
import { SLUG_BASE, slugify } from "@/lib/slug-format";
import type { TemplateId } from "@/lib/constants";
import { PreviewPane } from "../wizard/PreviewPane";
import { ShieldIcon } from "../icons";
import { cx } from "../ui/ui";

/** Each business type shows off a different standard template, so the demo also shows the range. */
const TYPES: { id: string; label: string; template: TemplateId }[] = [
  { id: "barber", label: "ספר", template: "dark" },
  { id: "cafe", label: "בית קפה", template: "elegant" },
  { id: "electrician", label: "חשמלאי", template: "bold" },
  { id: "lawyer", label: "עורך דין", template: "minimal" },
];

/** The home page hero, on a dark background: type a business name and watch the real WEBG renderer build the site. */
export function HeroDemo({ ctaHref }: { ctaHref: string }) {
  const inputId = useId();
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState(TYPES[0].id);
  const type = TYPES.find((t) => t.id === typeId) ?? TYPES[0];

  const data = useMemo(
    () => ({ ...emptySiteData(type.id), businessName: name.trim(), templateId: type.template }),
    [name, type],
  );
  const address = SLUG_BASE + (slugify(name) || "your-business");

  return (
    <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_340px] lg:gap-20">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-200">
          <ShieldIcon className="h-4 w-4" />
          כל אתר עולה עם חיבור HTTPS מאובטח
        </p>
        <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          כותבים את שם{" "}העסק.
          <br />
          <span className="text-ink-300">האתר נבנה מולכם.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-300">
          ממלאים כמה פרטים, בוחרים עיצוב ומקבלים אתר מקצועי עם כתובת משלו. בלי מתכנת ובלי ידע טכני.
        </p>

        <div className="mt-10 max-w-md space-y-6">
          <div className="space-y-2">
            <label htmlFor={inputId} className="block text-sm font-semibold text-ink-200">איך קוראים לעסק?</label>
            <input
              id={inputId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: מספרת דני"
              maxLength={40}
              autoComplete="off"
              className="min-h-14 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-lg text-white outline-none transition placeholder:text-ink-500 hover:border-white/25 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/25 focus-visible:outline-none"
            />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-200">סוג העסק</legend>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === typeId}
                  onClick={() => setTypeId(t.id)}
                  className={cx(
                    "min-h-11 rounded-lg border px-4 text-sm font-semibold transition",
                    t.id === typeId ? "border-brand-400 bg-brand-500/15 text-white" : "border-white/10 text-ink-300 hover:border-white/25 hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <Link href={ctaHref} className="inline-flex min-h-14 items-center rounded-xl bg-brand-500 px-8 text-lg font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-400">
              יצירת האתר שלי
            </Link>
            <a href="#how" className="inline-flex min-h-11 items-center font-semibold text-ink-300 transition hover:text-white">איך זה עובד</a>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[340px]">
        <div aria-hidden className="absolute inset-x-0 top-1/4 -z-0 mx-auto h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative rounded-[2rem] ring-1 ring-white/15">
          <PreviewPane data={data} address={address} frameClassName="h-[460px] md:h-[560px]" />
        </div>
        <p className="relative mt-4 text-center text-sm text-ink-400">תצוגה אמיתית של WEBG, באותה תבנית שתקבלו.</p>
      </div>
    </div>
  );
}
