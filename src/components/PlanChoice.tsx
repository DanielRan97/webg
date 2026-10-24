"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/business";
import { PLAN, type Plan } from "@/lib/constants";
import { needsProToPublish } from "@/lib/plan";
import { basicUrlDisplay, proUrlDisplay } from "@/lib/site-url";
import { publishWithPlanAction, upgradeToProAction } from "@/server/actions/sites";
import { Button, Notice, cx } from "./ui/ui";

/*
 * Choosing a plan where it matters: the publish dialog (every "פרסום" button opens it) and the
 * "שדרוג ל-Pro" card a live Basic site shows around WEBG. Until payments are connected, Pro costs
 * nothing - the texts say so plainly, and that this is where payment will come in.
 */

const BASIC = PLANS.find((p) => p.id === "BASIC")!;
const PRO = PLANS.find((p) => p.id === "PRO")!;
/** What Pro adds on top of Basic (its own list minus the "everything in Basic" line). */
const PRO_EXTRAS = PRO.features.filter((f) => !f.startsWith("כל מה שב-"));

const FREE_FOR_NOW = "בינתיים אין חיוב: התשלומים עדיין לא מחוברים. לפני שיתחיל חיוב נעדכן אתכם.";
/** Addresses are isolated (<bdi>) so their Latin text doesn't reorder the Hebrew sentence around them. */
const addressNote = (slug: string) => (
  <>
    הכתובת הראשית של האתר תהיה <bdi dir="ltr" className="font-semibold">{proUrlDisplay(slug)}</bdi>. אם תחזרו ל-Basic, הכתובת תחזור להיות{" "}
    <bdi dir="ltr" className="font-semibold">{basicUrlDisplay(slug)}</bdi>, והכתובת הקודמת תעביר אליה אוטומטית.
  </>
);

function useModal(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return ref;
}

/**
 * The "פרסום" button everywhere: opens the plan choice, then publishes on the chosen plan. A site built
 * with a Pro design can't choose Basic - the option is shown, disabled, with the way out.
 */
export function PublishButton({
  siteId,
  slug,
  plan,
  templateId,
  label = "פרסום האתר",
  className,
  onPublished,
  trigger,
}: {
  siteId: string;
  slug: string;
  plan: string;
  templateId: string;
  label?: string;
  className?: string;
  onPublished?: (plan: Plan) => void;
  /** A custom control in place of the default button; it gets the function that opens the dialog. */
  trigger?: (open: () => void) => ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const basicBlocked = needsProToPublish({ plan: PLAN.BASIC, templateId });
  const [choice, setChoice] = useState<Plan>(basicBlocked || plan === PLAN.PRO ? PLAN.PRO : PLAN.BASIC);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const ref = useModal(open);
  const titleId = useId();

  function openDialog() {
    setError("");
    setChoice(basicBlocked || plan === PLAN.PRO ? PLAN.PRO : PLAN.BASIC);
    setOpen(true);
  }

  function publish() {
    setError("");
    start(async () => {
      try {
        const res = await publishWithPlanAction(siteId, choice);
        if (!res.ok) {
          setError(res.error ?? "לא הצלחנו לפרסם. נסו שוב.");
          return;
        }
        setOpen(false);
        onPublished?.(choice);
        router.refresh();
      } catch {
        setError("לא הצלחנו לפרסם. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  const options = [
    { id: PLAN.BASIC, info: BASIC, extras: BASIC.features, address: basicUrlDisplay(slug), disabled: basicBlocked },
    { id: PLAN.PRO, info: PRO, extras: PRO_EXTRAS, address: proUrlDisplay(slug), disabled: false },
  ] as const;

  return (
    <>
      {trigger ? trigger(openDialog) : <Button type="button" className={className} onClick={openDialog}>{label}</Button>}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          if (!pending) setOpen(false);
        }}
        className="m-auto w-[min(94vw,46rem)] rounded-2xl border border-ink-200 p-0 shadow-2xl backdrop:bg-ink-950/50"
      >
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <h2 id={titleId} className="text-xl font-bold text-ink-950">באיזו חבילה לפרסם את האתר?</h2>
          <p className="mt-1 text-sm text-ink-700">אפשר לשנות חבילה גם אחרי הפרסום. שום תוכן לא נמחק.</p>

          <div role="radiogroup" aria-labelledby={titleId} className="mt-5 grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const selected = choice === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={o.disabled || undefined}
                  onClick={() => !o.disabled && setChoice(o.id)}
                  className={cx(
                    "flex flex-col rounded-xl border p-4 text-start transition",
                    o.disabled
                      ? "cursor-not-allowed border-ink-200 bg-ink-50 opacity-75"
                      : selected
                        ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/25"
                        : "border-ink-200 bg-white hover:border-ink-400",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-lg font-bold text-ink-950">{o.info.name}</span>
                    <span className="text-sm text-ink-700"><span className="text-lg font-bold text-ink-950">₪{o.info.price}</span> לחודש</span>
                  </span>
                  <span className="mt-1 text-sm text-ink-700">{o.info.tagline}</span>
                  <span dir="ltr" className="mt-3 block truncate rounded-lg bg-white/80 px-2 py-1 text-end text-xs font-semibold text-brand-700">{o.address}</span>
                  <ul className="mt-3 space-y-1 text-sm text-ink-800">
                    {o.id === PLAN.PRO && <li className="font-semibold">כל מה שב-Basic, ובנוסף:</li>}
                    {o.extras.map((f) => (
                      <li key={f} className="flex gap-1.5"><span aria-hidden className="text-brand-600">✓</span>{f}</li>
                    ))}
                  </ul>
                  {o.disabled && (
                    <span className="mt-3 block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      האתר בנוי בעיצוב של Pro, ולכן אי אפשר לפרסם אותו ב-Basic. כדי לפרסם ב-Basic, בחרו קודם עיצוב רגיל.
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {basicBlocked && (
            <p className="mt-3 text-sm">
              <Link href={`/sites/${siteId}/edit?tab=branding`} className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
                לבחירת עיצוב רגיל
              </Link>
            </p>
          )}

          {choice === PLAN.PRO && (
            <div className="mt-4 space-y-1.5 rounded-xl bg-ink-50 p-3 text-sm text-ink-800">
              <p>{FREE_FOR_NOW}</p>
              <p>{addressNote(slug)}</p>
            </div>
          )}

          <div aria-live="polite" className="mt-3">{error && <Notice kind="error">{error}</Notice>}</div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>ביטול</Button>
            <Button type="button" loading={pending} onClick={publish}>
              {pending ? "מפרסם..." : `פרסום ב-${choice === PLAN.PRO ? "Pro" : "Basic"}`}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * For a live Basic site: what Pro adds and a one-step upgrade, with the same honest notes as the
 * publish dialog. `compact` is the slim version for tight places (site card, preview bar).
 */
export function UpgradeToPro({
  siteId,
  slug,
  compact = false,
  onUpgraded,
}: {
  siteId: string;
  slug: string;
  compact?: boolean;
  onUpgraded?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const ref = useModal(open);
  const titleId = useId();

  function upgrade() {
    setError("");
    start(async () => {
      try {
        const res = await upgradeToProAction(siteId);
        if (!res.ok) {
          setError(res.error ?? "לא הצלחנו לשדרג. נסו שוב.");
          return;
        }
        setOpen(false);
        onUpgraded?.();
        router.refresh();
      } catch {
        setError("לא הצלחנו לשדרג. בדקו את החיבור לאינטרנט ונסו שוב.");
      }
    });
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-linear-to-l from-brand-600 to-cyan-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">Pro</span>
          שדרוג ל-Pro: כתובת מקצועית ומרכז פניות
        </button>
      ) : (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="flex items-center gap-2 font-bold text-ink-950">
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">Pro</span>
            שדרוג ל-Pro
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink-800">
            {PRO_EXTRAS.map((f) => (
              <li key={f} className="flex gap-1.5"><span aria-hidden className="text-brand-600">✓</span>{f}</li>
            ))}
          </ul>
          <p dir="ltr" className="mt-2 text-end text-xs font-semibold text-brand-700">{proUrlDisplay(slug)}</p>
          <Button type="button" className="mt-3 w-full sm:w-auto" onClick={() => setOpen(true)}>שדרוג ל-Pro</Button>
        </div>
      )}
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          if (!pending) setOpen(false);
        }}
        className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-ink-200 p-6 shadow-2xl backdrop:bg-ink-950/50"
      >
        <h2 id={titleId} className="text-xl font-bold text-ink-950">שדרוג האתר ל-Pro</h2>
        <p className="mt-1 text-sm text-ink-700">₪{PRO.price} לחודש. מה תקבלו בנוסף למה שיש לכם היום:</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-800">
          {PRO_EXTRAS.map((f) => (
            <li key={f} className="flex gap-1.5"><span aria-hidden className="text-brand-600">✓</span>{f}</li>
          ))}
        </ul>
        <div className="mt-4 space-y-1.5 rounded-xl bg-ink-50 p-3 text-sm text-ink-800">
          <p>{FREE_FOR_NOW}</p>
          <p>{addressNote(slug)}</p>
        </div>
        <div aria-live="polite" className="mt-3">{error && <Notice kind="error">{error}</Notice>}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>לא עכשיו</Button>
          <Button type="button" loading={pending} onClick={upgrade}>{pending ? "משדרג..." : "שדרוג ל-Pro"}</Button>
        </div>
      </dialog>
    </>
  );
}
