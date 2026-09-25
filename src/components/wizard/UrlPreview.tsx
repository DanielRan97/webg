import { SLUG_BASE } from "@/lib/slug-format";
import { LockIcon } from "../ui/icons";

/** Shows how the chosen slug will look on both plans, side by side - so a Basic owner can see exactly what upgrading would give them. */
export function UrlPreview({ slug, pro }: { slug: string; pro: boolean }) {
  const shown = slug || "…";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-300 bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-500">Basic</p>
        <p className="mt-1 break-all font-bold text-gray-900" dir="ltr">{SLUG_BASE}{shown}</p>
      </div>
      <div className={pro ? "rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4" : "rounded-2xl border border-gray-300 bg-white p-4"}>
        <p className={pro ? "text-xs font-semibold text-indigo-800" : "text-xs font-semibold text-gray-500"}>Pro</p>
        <p className={pro ? "mt-1 break-all font-bold text-indigo-900" : "mt-1 break-all font-bold text-gray-400"} dir="ltr">{shown}.webg.co.il</p>
        {!pro && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-indigo-700">
            <LockIcon /> זמין ב-WEBG Pro
          </p>
        )}
      </div>
    </div>
  );
}
