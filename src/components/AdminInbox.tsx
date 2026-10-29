"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { markInteractionsSeenAction, setInteractionStatusAction } from "@/server/actions/interactions";
import {
  INTERACTION_LABELS,
  INTERACTION_STATUS,
  INTERACTION_STATUS_LABELS,
  type InteractionStatus,
  type InteractionType,
} from "@/lib/constants";
import { telHref, whatsappHref } from "@/lib/links";
import type { InteractionRecord } from "@/server/interactions";
import { Notice, cx } from "./ui/ui";
import { ChevronDownIcon } from "./ui/icons";
import { formatDateTime } from "@/lib/dates";
import { displayPhone } from "@/lib/field-format";

type Filter = "ALL" | "UNREAD" | "LEAD" | "CONTACT_MESSAGE" | "BOOKING";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "הכל" },
  { value: "UNREAD", label: "חדשים" },
  { value: "LEAD", label: "לידים" },
  { value: "CONTACT_MESSAGE", label: "הודעות" },
  { value: "BOOKING", label: "קביעות תור" },
];

// Pill colors per follow-up status: waiting stands out, done steps back.
const STATUS_STYLE: Record<InteractionStatus, string> = {
  OPEN: "border-amber-300 bg-amber-50 text-amber-900",
  IN_PROGRESS: "border-brand-300 bg-brand-50 text-brand-800",
  CLOSED: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

function typeLabel(type: string): string {
  return INTERACTION_LABELS[type as InteractionType] ?? type;
}


function SummaryCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cx("rounded-2xl border p-4", accent ? "border-brand-200 bg-brand-50" : "border-ink-200 bg-white")}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-ink-700">{label}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "min-h-10 rounded-full border px-4 text-sm font-semibold transition",
        active ? "border-brand-600 bg-brand-50 text-ink-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-800 hover:border-ink-500",
      )}
    >
      {children}
    </button>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink-200 shadow-sm bg-white px-4 text-sm font-semibold text-ink-800 transition hover:bg-ink-50">
      {label}
    </a>
  );
}

/** A native select dressed as a pill, so the status changes straight from the list, on a phone too. */
function StatusSelect({ value, onChange, name }: { value: InteractionStatus; onChange: (s: InteractionStatus) => void; name: string }) {
  return (
    <span className="relative inline-flex shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InteractionStatus)}
        aria-label={`סטטוס הפנייה של ${name}`}
        className={cx(
          "min-h-9 cursor-pointer appearance-none rounded-full border py-1 pe-3 ps-7 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
          STATUS_STYLE[value],
        )}
      >
        {INTERACTION_STATUS.map((s) => (
          <option key={s} value={s}>{INTERACTION_STATUS_LABELS[s]}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-70" />
    </span>
  );
}

function InteractionRow({
  item,
  unread,
  open,
  onToggle,
  status,
  onStatus,
  rowRef,
}: {
  item: InteractionRecord;
  unread: boolean;
  open: boolean;
  onToggle: () => void;
  status: InteractionStatus;
  onStatus: (s: InteractionStatus) => void;
  rowRef?: (el: HTMLDivElement | null) => void;
}) {
  const preview = item.message ? item.message.slice(0, 80) : [item.phone && displayPhone(item.phone), item.email].filter(Boolean).join(" · ");
  return (
    <div
      ref={rowRef}
      className={cx(
        "rounded-2xl border transition",
        unread ? "border-brand-200 bg-brand-50/60" : status === "CLOSED" ? "border-ink-100 bg-ink-50/60" : "border-ink-200 bg-white",
      )}
    >
      <div className="flex items-start gap-2 pe-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-14 min-w-0 flex-1 items-start justify-between gap-3 rounded-xl py-3 ps-4 text-start"
        >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-xs font-semibold text-ink-700">{typeLabel(item.type)}</span>
            {unread && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">חדש</span>}
            <span className={cx("truncate", unread ? "font-bold text-ink-950" : status === "CLOSED" ? "font-semibold text-ink-600" : "font-semibold text-ink-900")}>
              {item.name || "ללא שם"}
            </span>
          </div>
          {preview && <p className="mt-1 truncate text-sm text-ink-500">{preview}</p>}
        </div>
        <span className="shrink-0 text-xs text-ink-500">{formatDateTime(item.createdAt)}</span>
        </button>
        <span className="pt-3">
          <StatusSelect value={status} onChange={onStatus} name={item.name || "ללא שם"} />
        </span>
      </div>

      {open && (
        <div className="space-y-3 border-t border-ink-100 px-4 py-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {item.phone && (
              <div>
                <dt className="text-ink-500">טלפון</dt>
                <dd dir="ltr" className="text-end font-medium text-ink-900 sm:text-start">{displayPhone(item.phone)}</dd>
              </div>
            )}
            {item.email && (
              <div>
                <dt className="text-ink-500">אימייל</dt>
                <dd dir="ltr" className="break-all text-end font-medium text-ink-900 sm:text-start">{item.email}</dd>
              </div>
            )}
          </dl>
          {item.message && (
            <div>
              <p className="text-sm text-ink-500">הודעה</p>
              <p className="whitespace-pre-line break-words text-ink-900">{item.message}</p>
            </div>
          )}
          <p className="text-xs text-ink-500">התקבל: {formatDateTime(item.createdAt)}</p>
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
  const [statusFilter, setStatusFilter] = useState<InteractionStatus | "ALL">("ALL");
  // Changed optimistically on the spot; a failed save puts the old status back.
  const [statuses, setStatuses] = useState<Record<string, InteractionStatus>>(() =>
    Object.fromEntries(interactions.map((i) => [i.id, i.status])),
  );
  const [statusError, setStatusError] = useState("");
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

  function changeStatus(id: string, next: InteractionStatus) {
    const prev = statuses[id];
    if (prev === next) return;
    setStatusError("");
    setStatuses((m) => ({ ...m, [id]: next }));
    setInteractionStatusAction(siteId, id, next)
      .then((res) => {
        if (!res.ok) throw new Error("not saved");
      })
      .catch(() => {
        setStatuses((m) => ({ ...m, [id]: prev }));
        setStatusError("לא הצלחנו לעדכן את הסטטוס. בדקו את החיבור לאינטרנט ונסו שוב.");
      });
  }

  const statusCounts = useMemo(() => {
    const c: Record<InteractionStatus, number> = { OPEN: 0, IN_PROGRESS: 0, CLOSED: 0 };
    for (const i of interactions) c[statuses[i.id] ?? "OPEN"]++;
    return c;
  }, [interactions, statuses]);

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
    if (statusFilter !== "ALL" && statuses[i.id] !== statusFilter) return false;
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return wasUnread.has(i.id);
    return i.type === filter;
  });

  if (interactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center">
        <p className="text-xl font-bold">עדיין לא התקבלו פניות</p>
        <p className="mt-1 text-ink-700">כאשר לקוחות ישאירו פרטים או ישלחו הודעה דרך האתר, הם יופיעו כאן.</p>
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

      <div className="space-y-3">
        <div role="group" aria-label="סוג הפנייה" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <FilterChip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        <div role="group" aria-label="סטטוס הטיפול" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-700">סטטוס:</span>
          <FilterChip active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
            הכל
          </FilterChip>
          {INTERACTION_STATUS.map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {INTERACTION_STATUS_LABELS[s]} <span className="font-normal text-ink-500">({statusCounts[s]})</span>
            </FilterChip>
          ))}
        </div>
      </div>

      <div aria-live="polite">{statusError && <Notice kind="error">{statusError}</Notice>}</div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-ink-100 bg-white p-6 text-center text-ink-500">אין פניות בסינון הזה.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <InteractionRow
              key={item.id}
              item={item}
              unread={wasUnread.has(item.id)}
              open={openId === item.id}
              onToggle={() => setOpenId((v) => (v === item.id ? null : item.id))}
              status={statuses[item.id] ?? "OPEN"}
              onStatus={(next) => changeStatus(item.id, next)}
              rowRef={item.id === initialInteractionId ? (el) => { highlightRef.current = el; } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
