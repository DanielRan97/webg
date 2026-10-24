"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INQUIRY_DELIVERY, INQUIRY_DELIVERY_INFO, type InquiryDelivery } from "@/lib/plan";
import { setInquiryDeliveryAction } from "@/server/actions/sites";
import { Button, Notice, cx } from "./ui/ui";

/**
 * Pro: where new inquiries go. Each choice says plainly what it means, and the riskier ones what could
 * be missed, before the owner saves it. Nothing is ever deleted by changing this.
 */
export function InquirySettings({ siteId, value }: { siteId: string; value: InquiryDelivery }) {
  const router = useRouter();
  const [choice, setChoice] = useState<InquiryDelivery>(value);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const changed = choice !== value;

  function save() {
    setError("");
    setSaved(false);
    start(async () => {
      try {
        const res = await setInquiryDeliveryAction(siteId, choice);
        if (res.ok) {
          setSaved(true);
          router.refresh();
        } else setError(res.error ?? "לא הצלחנו לשמור. נסו שוב.");
      } catch {
        setError("לא הצלחנו לשמור. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  return (
    <section aria-labelledby="inq-settings" className="rounded-xl border border-ink-200 bg-white p-4">
      <h2 id="inq-settings" className="font-bold text-ink-950">איך תרצו לקבל פניות?</h2>
      <p className="mt-1 text-sm text-ink-700">אפשר לשנות בכל רגע. שום פנייה לא נמחקת כשמשנים את ההגדרה.</p>
      <div role="radiogroup" aria-labelledby="inq-settings" className="mt-3 space-y-2">
        {INQUIRY_DELIVERY.map((opt) => {
          const info = INQUIRY_DELIVERY_INFO[opt];
          const selected = choice === opt;
          return (
            <label
              key={opt}
              className={cx(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/20" : "border-ink-200 hover:border-ink-400",
              )}
            >
              <input
                type="radio"
                name={`inq-${siteId}`}
                value={opt}
                checked={selected}
                onChange={() => {
                  setChoice(opt);
                  setSaved(false);
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
              />
              <span className="min-w-0">
                <span className="block font-semibold text-ink-900">{info.label}</span>
                <span className="block text-sm text-ink-700">{info.meaning}</span>
                {info.risk && selected && (
                  <span className="mt-2 flex gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span aria-hidden>⚠</span>
                    {info.risk}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} loading={pending} disabled={!changed}>
          {pending ? "שומר..." : "שמירת ההגדרה"}
        </Button>
        <div aria-live="polite" className="min-w-0 flex-1">
          {saved && <Notice kind="success">ההגדרה נשמרה.</Notice>}
          {error && <Notice kind="error">{error}</Notice>}
        </div>
      </div>
    </section>
  );
}
