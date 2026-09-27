"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminMarkTicketSeenAction, adminReplyToTicketAction, markTicketSeenAction, replyToTicketAction } from "@/server/actions/support";
import { SUPPORT_CATEGORY_LABELS, SUPPORT_TICKET_STATUS, SUPPORT_TICKET_STATUS_LABELS, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";
import type { SupportTicketDetail } from "@/server/support";
import { Button, Notice, TextArea, cx } from "./ui/ui";

const dateFormatter = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

const statusClass: Record<SupportTicketStatus, string> = {
  OPEN: "border-indigo-300 bg-indigo-50 text-indigo-900",
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-900",
  CLOSED: "border-gray-300 bg-gray-100 text-gray-700",
};

export function SupportThread({
  role,
  ticket,
  justCreated,
}: {
  role: "USER" | "ADMIN";
  ticket: SupportTicketDetail;
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (role === "USER") markTicketSeenAction(ticket.id).catch(() => {});
    else adminMarkTicketSeenAction(ticket.id).catch(() => {});
    // Only on mount for this ticket id - marking seen again on every re-render would be wasteful, and the ticket id never changes without a full remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  function submitReply() {
    if (!reply.trim()) return;
    setError("");
    start(async () => {
      const action = role === "USER" ? replyToTicketAction : adminReplyToTicketAction;
      const res = await action(ticket.id, reply);
      if (!res.ok) {
        setError(res.error ?? "משהו השתבש. נסו שוב.");
        return;
      }
      setReply("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {justCreated && <Notice kind="success">הפנייה נשלחה בהצלחה. נחזור אליכם בהקדם.</Notice>}

      <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold">{ticket.subject}</h1>
          <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", statusClass[ticket.status as SupportTicketStatus])}>
            {SUPPORT_TICKET_STATUS_LABELS[ticket.status as SupportTicketStatus] ?? ticket.status}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {SUPPORT_CATEGORY_LABELS[ticket.category as SupportCategory] ?? ticket.category}
          {ticket.relatedWebsiteName && <> · אתר: {ticket.relatedWebsiteName}</>}
          {role === "ADMIN" && (
            <>
              {" "}· ממשתמש: <span dir="ltr">{ticket.userEmail}</span>
            </>
          )}
        </p>
      </div>

      <ul className="space-y-3">
        {ticket.messages.map((m) => {
          const fromUser = m.senderType === "USER";
          const label = role === "ADMIN" ? (fromUser ? "המשתמש" : "אני (אדמין)") : fromUser ? "אתם" : "צוות WEBG";
          return (
            <li
              key={m.id}
              className={cx(
                "max-w-[85%] rounded-2xl border p-3",
                fromUser ? "me-auto border-gray-200 bg-white" : "ms-auto border-indigo-200 bg-indigo-50",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-700">{label}</span>
                <span className="text-xs text-gray-500">{dateFormatter.format(m.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-gray-900">{m.message}</p>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
        {role === "USER" && ticket.status === SUPPORT_TICKET_STATUS.CLOSED && (
          <p className="text-sm text-gray-600">הפנייה הזו סגורה. שליחת הודעה תפתח אותה מחדש.</p>
        )}
        <TextArea label="הוספת תגובה" value={reply} onChange={setReply} rows={3} placeholder="כתבו כאן..." />
        {error && <Notice kind="error">{error}</Notice>}
        <Button onClick={submitReply} loading={isPending} disabled={!reply.trim()}>שליחה</Button>
      </div>
    </div>
  );
}
