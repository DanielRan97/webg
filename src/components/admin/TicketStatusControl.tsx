"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSetTicketStatusAction } from "@/server/actions/support";
import { SUPPORT_TICKET_STATUS, SUPPORT_TICKET_STATUS_LABELS, type SupportTicketStatus } from "@/lib/constants";
import { Button, Notice } from "../ui/ui";

const STATUSES = [SUPPORT_TICKET_STATUS.OPEN, SUPPORT_TICKET_STATUS.IN_PROGRESS, SUPPORT_TICKET_STATUS.CLOSED] as const;

export function TicketStatusControl({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  function setStatus(target: SupportTicketStatus) {
    setNotice(null);
    start(async () => {
      const res = await adminSetTicketStatusAction(ticketId, target);
      setNotice(res.ok ? { kind: "success", text: `הסטטוס עודכן ל${SUPPORT_TICKET_STATUS_LABELS[target]}.` } : { kind: "error", text: res.error ?? "משהו השתבש." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-gray-900">סטטוס הפנייה</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button key={s} type="button" variant={status === s ? "primary" : "secondary"} disabled={isPending || status === s} onClick={() => setStatus(s)}>
            {SUPPORT_TICKET_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}
    </div>
  );
}
