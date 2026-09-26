import type { Metadata } from "next";
import { getPurchasesOverview } from "@/server/admin";

export const metadata: Metadata = { title: "רכישות - WEBG Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPurchasesPage() {
  const purchases = await getPurchasesOverview();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">רכישות</h1>
      {!purchases.connected && (
        <div className="rounded-2xl border border-dashed border-gray-400 bg-white p-6 text-center">
          <p className="text-lg font-bold text-gray-900">תשלומים עדיין לא מחוברים</p>
          <p className="mt-2 text-gray-700">
            ברגע שיחובר ספק תשלומים, כאן יופיעו רכישות, הכנסה חודשית/שנתית וסטטוס מנויים - בנפרד מהתפלגות Basic/Pro הנוכחית, שנספרת מ״תוכנית האתר״ ולא מתשלומים בפועל.
          </p>
        </div>
      )}
    </div>
  );
}
