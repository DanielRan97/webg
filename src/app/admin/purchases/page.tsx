import type { Metadata } from "next";
import { addMonths, priceAgorot } from "@/lib/billing-rules";
import { PLAN } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { billingEnabled } from "@/lib/payments";
import { getPurchasesOverview } from "@/server/admin";
import { listLaunchCandidates } from "@/server/billing";
import { BillingLaunch } from "@/components/admin/BillingLaunch";

export const metadata: Metadata = { title: "רכישות - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPurchasesPage() {
  const [purchases, candidates] = await Promise.all([getPurchasesOverview(), listLaunchCandidates()]);
  const enabled = billingEnabled();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">רכישות</h1>
      {!purchases.connected && (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white p-6 text-center">
          <p className="text-lg font-bold text-ink-900">תשלומים עדיין לא מחוברים</p>
          <p className="mt-2 text-ink-700">
            ברגע שיחובר ספק תשלומים, כאן יופיעו רכישות, הכנסה חודשית/שנתית וסטטוס מנויים - בנפרד מהתפלגות Basic/Pro הנוכחית, שנספרת מ״תוכנית האתר״ ולא מתשלומים בפועל.
          </p>
        </div>
      )}

      <section aria-labelledby="launch" className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="space-y-2">
          <h2 id="launch" className="text-xl font-bold">אתרים שפורסמו לפני החיוב</h2>
          <p className="max-w-3xl text-ink-700">
            האתרים האלה באוויר בלי אמצעי תשלום, והחיוב היומי לא נוגע בהם. הכפתור נותן לכל אחד חודש חינם מהיום ושולח לבעלים מייל עם המחיר ועם קישור להוספת אמצעי תשלום.
            שבוע ויום לפני הסוף יוצאות תזכורות, ומי שלא הוסיף אמצעי תשלום, האתר שלו מפסיק להיות מוצג (שום תוכן לא נמחק). אתר שכבר קיבל מייל לא יקבל שני.
          </p>
        </div>

        {candidates.length === 0 ? (
          <p className="font-semibold text-ink-900">אין אתרים שמחכים. כל האתרים שבאוויר כבר בתקופת חינם או במנוי.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">עסק</th>
                  <th className="px-4 py-3 text-start font-semibold">בעלים</th>
                  <th className="px-4 py-3 text-start font-semibold">מסלול</th>
                  <th className="px-4 py-3 text-start font-semibold">מחיר אחרי החודש החינם</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {candidates.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">{s.businessName || s.slug}</td>
                    <td className="px-4 py-3" dir="ltr">{s.user.email}</td>
                    <td className="px-4 py-3">{s.plan === PLAN.PRO ? "Pro" : "Basic"}</td>
                    <td className="px-4 py-3">₪{priceAgorot(s.plan) / 100}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <BillingLaunch count={candidates.length} enabled={enabled} endDate={formatDate(addMonths(new Date()))} />
      </section>
    </div>
  );
}
