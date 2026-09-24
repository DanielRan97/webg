"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { markInteractionsSeenAction } from "@/server/actions/interactions";
import { INTERACTION_LABELS, type InteractionType } from "@/lib/constants";
import { telHref, whatsappHref } from "@/lib/links";
import type { InteractionRecord } from "@/server/interactions";
import { cx } from "./ui/ui";

type Filter = "ALL" | "UNREAD" | "LEAD" | "CONTACT_MESSAGE" | "BOOKING";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "הכל" },
  { value: "UNREAD", label: "חדשים" },
  { value: "LEAD", label: "לידים" },
  { value: "CONTACT_MESSAGE", label: "הודעות" },
  { value: "BOOKING", label: "קביעות תור" },
];

function typeLabel(type: string): string {
  return INTERACTION_LABELS[type as InteractionType] ?? type;
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cx("rounded-2xl border p-4", accent ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white")}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-gray-700">{label}</p>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50">
      {label}
    </a>
  );
}

function InteractionRow({
  item,
  unread,
  open,
  onToggle,
  rowRef,
}: {
  item: InteractionRecord;
  unread: boolean;
  open: boolean;
  onToggle: () => void;
  rowRef?: (el: HTMLDivElement | null) => void;
}) {
  const preview = item.message ? item.message.slice(0, 80) : [item.phone, item.email].filter(Boolean).join(" · ");
  return (
    <div
      ref={rowRef}
      className={cx("rounded-2xl border transition", unread ? "border-indigo-300 bg-indigo-50/60" : "border-gray-200 bg-white")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-14 w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-start"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">{typeLabel(item.type)}</span>
            {unread && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">חדש</span>}
            <span className={cx("truncate", unread ? "font-bold text-gray-950" : "font-semibold text-gray-900")}>{item.name || "ללא שם"}</span>
          </div>
          {preview && <p className="mt-1 truncate text-sm text-gray-600">{preview}</p>}
        </div>
        <span className="shrink-0 text-xs text-gray-500">{dateFormatter.format(item.createdAt)}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-200 px-4 py-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {item.phone && (
              <div>
                <dt className="text-gray-500">טלפון</dt>
                <dd dir="ltr" className="text-end font-medium text-gray-900 sm:text-start">{item.phone}</dd>
              </div>
            )}
            {item.email && (
              <div>
                <dt className="text-gray-500">אימייל</dt>
                <dd dir="ltr" className="break-all text-end font-medium text-gray-900 sm:text-start">{item.email}</dd>
              </div>
            )}
          </dl>
          {item.message && (
            <div>
              <p className="text-sm text-gray-500">הודעה</p>
              <p className="whitespace-pre-line break-words text-gray-900">{item.message}</p>
            </div>
          )}
          <p className="text-xs text-gray-500">התקבל: {dateFormatter.format(item.createdAt)}</p>
          <div className="flex flex-wrap gap-2">
            {item.phone && <ActionLink href={telHref(item.phone)} label="התקשר" />}
            {item.phone && <ActionLink href={whatsappHref(item.phone)} label="WhatsApp" />}
            {item.email && <ActionLink href={`mailto:${item.email}`} label="שליחת אימייל" />}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminInbox({
  siteId,
  interactions,
  initialInteractionId,
}: {
  siteId: string;
  interactions: InteractionRecord[];
  initialInteractionId?: string;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [openId, setOpenId] = useState<string | null>(initialInteractionId ?? null);
  // Snapshot of which rows were unseen when the page loaded - kept fixed for
  // the rest of this visit so the "חדש" badges don't vanish out from under
  // the owner the moment we mark them seen server-side.
  const [wasUnread] = useState(() => new Set(interactions.filter((i) => !i.seenAt).map((i) => i.id)));
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    markInteractionsSeenAction(siteId).catch(() => {});
  }, [siteId]);

  useEffect(() => {
    if (!scrolledRef.current && initialInteractionId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledRef.current = true;
    }
  }, [initialInteractionId]);

  const counts = useMemo(
    () => ({
      total: interactions.length,
      unread: interactions.filter((i) => wasUnread.has(i.id)).length,
      lead: interactions.filter((i) => i.type === "LEAD").length,
      contact: interactions.filter((i) => i.type === "CONTACT_MESSAGE").length,
      booking: interactions.filter((i) => i.type === "BOOKING").length,
    }),
    [interactions, wasUnread],
  );

  const filtered = interactions.filter((i) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return wasUnread.has(i.id);
    return i.type === filter;
  });

  if (interactions.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
        <p className="text-xl font-bold">עדיין לא התקבלו פניות</p>
        <p className="mt-1 text-gray-700">כאשר לקוחות ישאירו פרטים או ישלחו הודעה דרך האתר, הם יופיעו כאן.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="סה״כ פניות" value={counts.total} />
        <SummaryCard label="חדשות" value={counts.unread} accent={counts.unread > 0} />
        <SummaryCard label="לידים" value={counts.lead} />
        <SummaryCard label="הודעות" value={counts.contact} />
        {counts.booking > 0 && <SummaryCard label="קביעות תור" value={counts.booking} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cx(
              "min-h-10 rounded-full border px-4 text-sm font-semibold transition",
              filter === f.value ? "border-indigo-700 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600">אין פניות בסינון הזה.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <InteractionRow
              key={item.id}
              item={item}
              unread={wasUnread.has(item.id)}
              open={openId === item.id}
              onToggle={() => setOpenId((v) => (v === item.id ? null : item.id))}
              rowRef={item.id === initialInteractionId ? (el) => { highlightRef.current = el; } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
