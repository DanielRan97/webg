const BASIC_FEATURES = [
  "אתר מלא",
  "פרסום האתר",
  "תבניות רגילות",
  "טפסי לידים והודעות",
  "עדכונים למייל",
  "כתובת WEBG רגילה",
];

const PRO_FEATURES = [
  "כל מה שב-Basic",
  "כתובת יפה יותר",
  "מרכז פניות",
  "התראות על פניות חדשות",
  "תבניות Premium",
  "עוד תכונות Pro בדרך",
];

/** Compact BASIC/PRO feature comparison - no prices, no pitch, just what's included. Reused by the wizard's "מה כולל Pro?" modal and any other locked-feature explanation. */
export function PlanComparison() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-300 bg-white p-4">
        <p className="font-bold text-gray-900">Basic</p>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
          {BASIC_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-1.5"><span aria-hidden>✓</span>{f}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4">
        <p className="font-bold text-indigo-900">Pro</p>
        <ul className="mt-2 space-y-1.5 text-sm text-indigo-950">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-1.5"><span aria-hidden>✓</span>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
