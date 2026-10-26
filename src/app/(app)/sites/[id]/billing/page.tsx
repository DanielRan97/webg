import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { priceAgorot } from "@/lib/billing-rules";
import { PLAN, SUBSCRIPTION_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { billingEnabled, formatAmount } from "@/lib/payments";
import { subscriptionInfo } from "@/lib/status";
import { getOwnedWebsite } from "@/server/websites";
import { BillingActions } from "@/components/BillingActions";
import { Notice } from "@/components/ui/ui";

export const metadata: Metadata = { title: "תשלום ומנוי" };
export const dynamic = "force-dynamic";

const shekels = (agorot: number) => `₪${formatAmount(agorot).replace(/\.00$/, "")}`;

export default async function BillingPage({ params, searchParams }: PageProps<"/sites/[id]/billing">) {
  const user = await requireUser();
  const { id } = await params;
  const site = await getOwnedWebsite(user.id, id);
  if (!site) notFound();
  const { payment } = await searchParams;

  const [sub, payments] = await Promise.all([
    db.subscription.findUnique({ where: { websiteId: id } }),
    db.payment.findMany({ where: { websiteId: id, status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const on = billingEnabled();
  const status = sub?.status ?? SUBSCRIPTION_STATUS.TRIAL;
  const info = subscriptionInfo(status);
  const planName = site.plan === PLAN.PRO ? "Pro" : "Basic";
  const paidPeriod = status === SUBSCRIPTION_STATUS.ACTIVE && sub?.currentPeriodEnd;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">← האתרים שלי</Link>
        <h1 className="text-3xl font-bold tracking-tight">תשלום ומנוי</h1>
        <p className="text-ink-700">{site.data.businessName}</p>
      </div>

      {payment === "ok" && <Notice kind="success">התשלום התקבל, תודה! חשבונית נשלחה אליכם במייל.</Notice>}
      {payment === "failed" && <Notice kind="error">לא הצלחנו לאשר את התשלום. אם חויבתם, כתבו לנו ונבדוק מיד.</Notice>}

      <section className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">מסלול {planName}</h2>
          <span className="text-ink-800"><b>{shekels(priceAgorot(site.plan))}</b> לחודש</span>
        </div>
        <p><span className="font-semibold">{info.label}.</span> <span className="text-ink-700">{info.meaning}</span></p>
        {!on && <p className="text-sm text-ink-700">התשלומים עדיין לא מחוברים, ולכן אין חיוב. לפני שיתחיל חיוב נעדכן אתכם.</p>}
        {on && paidPeriod && sub?.currentPeriodEnd && (
          <p className="text-ink-800">
            {sub.cancelAtPeriodEnd
              ? `המנוי בוטל. האתר יישאר באוויר עד ${formatDate(sub.currentPeriodEnd)}, ואז יפסיק להיות מוצג.`
              : `החיוב הבא: ${formatDate(sub.currentPeriodEnd)}.`}
          </p>
        )}
        {on && status === SUBSCRIPTION_STATUS.TRIAL && sub?.currentPeriodEnd && !sub.cardToken && (
          <p className="text-ink-800">תקופת החינם מסתיימת ב-{formatDate(sub.currentPeriodEnd)}. כדי שהאתר יישאר באוויר, הוסיפו אמצעי תשלום.</p>
        )}
        {sub?.cardLast4 && <p className="text-sm text-ink-700">כרטיס שמור: מסתיים ב-<bdi dir="ltr">{sub.cardLast4}</bdi></p>}
      </section>

      {on && (
        <BillingActions
          siteId={id}
          status={status}
          hasCard={Boolean(sub?.cardToken)}
          paidPeriod={Boolean(paidPeriod)}
          cancelAtPeriodEnd={Boolean(sub?.cancelAtPeriodEnd)}
          periodEnd={sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : ""}
        />
      )}

      {payments.length > 0 && (
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">תשלומים אחרונים</h2>
          <ul className="divide-y divide-ink-100">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{formatDate(p.createdAt)}</span>
                <span className="text-ink-700">{p.plan === PLAN.PRO ? "Pro" : "Basic"}</span>
                <span className="font-semibold">{shekels(p.amountAgorot)}</span>
                <span className={p.status === "PAID" ? "text-emerald-700" : "text-red-700"}>{p.status === "PAID" ? "שולם" : "לא אושר"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-600">על כל תשלום שעבר נשלחת חשבונית מס-קבלה למייל שלכם.</p>
        </section>
      )}
    </main>
  );
}
