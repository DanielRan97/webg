import { PLANS, PRICE_NOTE } from "@/lib/business";
import { cx } from "./ui/ui";

/** Compact BASIC/PRO comparison: price and what's included. Reused by the wizard's "מה כולל Pro?" modal and any other locked-feature explanation. */
export function PlanComparison() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLANS.map((p) => (
        <div key={p.id} className={cx("rounded-xl border bg-white p-4", p.id === "PRO" ? "border-brand-600 ring-1 ring-brand-600" : "border-ink-200")}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-bold text-ink-900">{p.name}</p>
            <p className="text-ink-900"><span className="text-xl font-bold">₪{p.price}</span> <span className="text-sm text-ink-500">לחודש</span></p>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-1.5"><span aria-hidden className="text-brand-600">✓</span>{f}</li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-ink-500 sm:col-span-2">{PRICE_NOTE}</p>

      <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-700 sm:col-span-2">
        <p className="font-semibold">לדוגמה, כתובת האתר:</p>
        <p className="mt-1" dir="ltr">Basic: webg.co.il/s/danielbarber</p>
        <p dir="ltr">Pro: danielbarber.webg.co.il</p>
      </div>
      <div className="rounded-lg bg-ink-50 p-3 text-xs text-ink-700 sm:col-span-2">
        <p className="font-semibold">איך פניות מתקבלות:</p>
        <p className="mt-1">Basic: פניות נשלחות אליכם במייל</p>
        <p>Pro: פניות נשלחות למייל וגם נשמרות במרכז הפניות ב-WEBG</p>
      </div>
    </div>
  );
}
