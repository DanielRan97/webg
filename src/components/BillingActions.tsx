"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_STATUS } from "@/lib/constants";
import { activateSubscriptionAction, setCancelSubscriptionAction } from "@/server/actions/sites";
import { Button, ConfirmDialog, Notice } from "./ui/ui";

/** The billing page's buttons: pay / add or replace the card (payment page), cancel and take back a cancellation. */
export function BillingActions({
  siteId,
  status,
  hasCard,
  paidPeriod,
  cancelAtPeriodEnd,
  periodEnd,
}: {
  siteId: string;
  status: string;
  hasCard: boolean;
  paidPeriod: boolean;
  cancelAtPeriodEnd: boolean;
  periodEnd: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  function pay() {
    setError("");
    start(async () => {
      try {
        const res = await activateSubscriptionAction(siteId);
        if (res.redirectTo) window.location.assign(res.redirectTo);
        else if (!res.ok) setError(res.error ?? "משהו השתבש. נסו שוב.");
        else router.refresh();
      } catch {
        setError("לא הצלחנו לפתוח את דף התשלום. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  function setCancel(cancel: boolean) {
    setError("");
    start(async () => {
      try {
        const res = await setCancelSubscriptionAction(siteId, cancel);
        if (!res.ok) setError(res.error ?? "משהו השתבש. נסו שוב.");
        setConfirmCancel(false);
        router.refresh();
      } catch {
        setError("לא הצלחנו לעדכן. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  const needsPayment = status === SUBSCRIPTION_STATUS.PAST_DUE || status === SUBSCRIPTION_STATUS.INACTIVE || (status === SUBSCRIPTION_STATUS.TRIAL && !hasCard);
  const payLabel =
    status === SUBSCRIPTION_STATUS.PAST_DUE ? "עדכון אמצעי תשלום ותשלום" : status === SUBSCRIPTION_STATUS.INACTIVE ? "תשלום והחזרת האתר" : "הוספת אמצעי תשלום";

  return (
    <section className="space-y-3">
      {needsPayment && (
        <>
          <Button type="button" loading={pending} onClick={pay}>{payLabel}</Button>
          <p className="text-sm text-ink-700">
            תעברו לדף התשלום המאובטח של HYP. פרטי הכרטיס לא נשמרים אצלנו.
            {status === SUBSCRIPTION_STATUS.TRIAL && periodEnd && ` החודש ששולם מתחיל רק ב-${periodEnd}, אחרי תקופת החינם, כך שלא מפסידים אף יום.`}
          </p>
        </>
      )}
      {paidPeriod && !cancelAtPeriodEnd && (
        <Button type="button" variant="secondary" disabled={pending} onClick={() => setConfirmCancel(true)}>ביטול המנוי</Button>
      )}
      {paidPeriod && cancelAtPeriodEnd && (
        <Button type="button" loading={pending} onClick={() => setCancel(false)}>ביטול הביטול: המשך המנוי</Button>
      )}
      <div aria-live="polite">{error && <Notice kind="error">{error}</Notice>}</div>
      <ConfirmDialog
        open={confirmCancel}
        title="לבטל את המנוי?"
        text={`לא יהיו חיובים נוספים. האתר יישאר באוויר עד ${periodEnd}, ואז יפסיק להיות מוצג. כל התוכן נשמר, ואפשר לחדש בכל זמן.`}
        confirmLabel="כן, לבטל את המנוי"
        danger
        pending={pending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => setCancel(true)}
      />
    </section>
  );
}
