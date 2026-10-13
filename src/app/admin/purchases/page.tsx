import type { Metadata } from "next";
import { getPurchasesOverview } from "@/server/admin";

export const metadata: Metadata = { title: "רכישות - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPurchasesPage() {
  const purchases = await getPurchasesOverview();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">רכישות</h1>
      {!purchases.connected && (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white p-6 text-center">
          <p className="text-lg font-bold text-ink-900">תשלומים עדיין לא מחוברים</p>
          <p className="mt-2 text-ink-700">
            ברגע שיחובר ספק תשלומים, כאן יופיעו רכישות, הכנסה חודשית/שנתית וסטטוס מנויים - בנפרד מהתפלגות Basic/Pro הנוכחית, שנספרת מ״תוכנית האתר״ ולא מתשלומים בפועל.
          </p>
        </div>
      )}
    </div>
  );
}
