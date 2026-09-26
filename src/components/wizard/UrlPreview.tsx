import { SLUG_BASE } from "@/lib/slug-format";
import { LockIcon } from "../ui/icons";

/**
 * A Pro site's address is the subdomain - a single primary "כתובת האתר שלך"
 * block, not a side-by-side comparison anymore (that comparison is only
 * useful pre-upgrade). The legacy /s/ address still works (see src/proxy.ts
 * and src/app/s/[slug]/page.tsx) but is de-emphasized, not shown as an equal
 * second option.
 */
function ProUrl({ slug }: { slug: string }) {
  const shown = slug || "…";
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4">
        <p className="text-xs font-semibold text-indigo-800">כתובת האתר שלך</p>
        <p className="mt-1 break-all text-lg font-bold text-indigo-900" dir="ltr">{shown}.webg.co.il</p>
      </div>
      <p className="text-xs text-gray-500">
        הכתובת הקודמת <span dir="ltr">{SLUG_BASE}{shown}</span> ממשיכה לעבוד לקישורים ישנים.
      </p>
    </div>
  );
}

/** Shows how the chosen slug will look on both plans, side by side - so a Basic owner can see exactly what upgrading would give them. */
export function UrlPreview({ slug, pro }: { slug: string; pro: boolean }) {
  const shown = slug || "…";
  if (pro) return <ProUrl slug={slug} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-500">Basic</p>
        <p className="mt-1 break-all font-bold text-gray-900" dir="ltr">{SLUG_BASE}{shown}</p>
      </div>
      <div className="rounded-2xl border border-gray-300 bg-white p-4">
        <p className="text-xs font-semibold text-gray-500">Pro</p>
        <p className="mt-1 break-all font-bold text-gray-400" dir="ltr">{shown}.webg.co.il</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-700">
          <LockIcon /> זמין ב-WEBG Pro
        </p>
        <p className="mt-1 text-xs text-gray-600">כתובת אתר מקצועית וקלה לזכירה - כתובת קצרה בסגנון yourbusiness.webg.co.il, בלי ״s/״ באמצע.</p>
      </div>
    </div>
  );
}
