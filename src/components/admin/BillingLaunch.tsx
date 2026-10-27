"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startBillingLaunchAction } from "@/server/actions/admin";
import { Button, ConfirmDialog, Notice } from "../ui/ui";

/** The one-time "start billing for the existing sites" button on /admin/purchases. */
export function BillingLaunch({ count, enabled, endDate }: { count: number; enabled: boolean; endDate: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function confirm() {
    setNotice(null);
    start(async () => {
      try {
        const res = await startBillingLaunchAction();
        setNotice(res.ok ? { kind: "success", text: `נשלחו ${res.started ?? 0} מיילים, וחודש החינם התחיל.` } : { kind: "error", text: res.error ?? "משהו השתבש." });
      } catch {
        setNotice({ kind: "error", text: "הפעולה לא הושלמה. בדקו את החיבור ונסו שוב: אתרים שכבר קיבלו מייל לא יקבלו שני." });
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" disabled={!enabled || count === 0 || isPending} loading={isPending} onClick={() => setConfirming(true)}>
        התחלת חודש חינם ושליחת מיילים ({count})
      </Button>
      {!enabled && <p className="text-sm text-ink-700">הכפתור ייפתח אחרי שהחיוב יחובר (הגדרות HYP ב-Vercel).</p>}
      <div aria-live="polite">{notice && <Notice kind={notice.kind}>{notice.text}</Notice>}</div>
      <ConfirmDialog
        open={confirming}
        title={`להתחיל חיוב ל-${count} אתרים?`}
        text={`כל בעל אתר יקבל מייל, והאתר יישאר באוויר בחינם עד ${endDate}. מי שלא יוסיף אמצעי תשלום עד אז, האתר שלו יפסיק להיות מוצג. אי אפשר לבטל את שליחת המיילים.`}
        confirmLabel="כן, להתחיל ולשלוח"
        pending={isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={confirm}
      />
    </div>
  );
}
