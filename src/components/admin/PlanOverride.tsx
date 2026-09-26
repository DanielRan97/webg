"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWebsitePlanAdminAction } from "@/server/actions/admin";
import { PLAN, type Plan } from "@/lib/constants";
import { Button, ConfirmDialog, Notice } from "../ui/ui";

export function PlanOverride({ siteId, plan }: { siteId: string; plan: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function confirm() {
    if (!pendingPlan) return;
    const target = pendingPlan;
    setNotice(null);
    start(async () => {
      const res = await setWebsitePlanAdminAction(siteId, target);
      setNotice(res.ok ? { kind: "success", text: `התוכנית עודכנה ל-${target}.` } : { kind: "error", text: res.error ?? "משהו השתבש." });
      setPendingPlan(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">תוכנית האתר</p>
      <div className="flex gap-2">
        {([PLAN.BASIC, PLAN.PRO] as const).map((p) => (
          <Button
            key={p}
            type="button"
            variant={plan === p ? "primary" : "secondary"}
            disabled={isPending || plan === p}
            onClick={() => setPendingPlan(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <p className="text-xs text-gray-600">שינוי ידני לצורכי בדיקה/ניהול - לא יוצר עסקה או מנוי.</p>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
      <ConfirmDialog
        open={pendingPlan !== null}
        title={`לשנות תוכנית ל-${pendingPlan}?`}
        text="שינוי זה מיועד לבדיקה/ניהול ידני ואינו יוצר עסקה או מנוי."
        confirmLabel="כן, שנה תוכנית"
        pending={isPending}
        onCancel={() => setPendingPlan(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
