"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  activateSubscriptionAction,
  deactivateSubscriptionAction,
  deleteSiteAction,
  publishSiteAction,
  unpublishSiteAction,
  type SimpleResult,
} from "@/server/actions/sites";
import { SUBSCRIPTION_STATUS } from "@/lib/constants";
import { displayState, isPubliclyVisible } from "@/lib/subscription";
import { nextStep, subscriptionInfo } from "@/lib/status";
import { getCategory } from "@/lib/categories";
import type { WebsiteRecord } from "@/server/websites";
import { Logo } from "@/templates/shared/Logo";
import { Button, ConfirmDialog, Notice } from "./ui/ui";
import { ExternalLinkIcon, InboxIcon, LightbulbIcon, MoreIcon } from "./ui/icons";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";
import { DeleteSiteDialog } from "./DeleteSiteDialog";

// Inlined at build time by Next.js - not a secret, just a mode flag.
const isDev = process.env.NODE_ENV !== "production";

const secondaryBtn = "inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50";

type Pending = "publish" | "unpublish" | "activate" | "deactivate" | "delete" | null;

/** One site's card on the dashboard: summary, primary actions, and quiet secondary info/settings. */
export function SiteCard({ site, unreadCount }: { site: WebsiteRecord; unreadCount: number }) {
  const d = site.data;
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [running, setRunning] = useState<Pending>(null);
  const [confirm, setConfirm] = useState<"unpublish" | "deactivate" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && !menuPanelRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    // The panel is fixed-positioned, so it can't track the trigger while
    // scrolling - close it instead of letting it drift out of place.
    function onScroll() {
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen]);

  // The card itself is `overflow-hidden` (for the rounded thumbnail), so an
  // absolutely-positioned menu would get clipped whenever it opens downward.
  // The panel is portaled to <body> and placed with fixed coordinates instead,
  // flipped up/down (and clamped horizontally) to fit the viewport - computed
  // before paint, so there is no visible jump.
  useLayoutEffect(() => {
    if (!menuOpen || !menuRef.current || !menuPanelRef.current) return;
    const triggerRect = menuRef.current.getBoundingClientRect();
    const panelHeight = menuPanelRef.current.offsetHeight;
    const panelWidth = menuPanelRef.current.offsetWidth;
    const gap = 8;
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openUp = spaceAbove >= panelHeight || spaceAbove >= spaceBelow;
    const left = Math.min(Math.max(triggerRect.left, 8), window.innerWidth - panelWidth - 8);
    setMenuPos({ left, top: openUp ? triggerRect.top - panelHeight - gap : triggerRect.bottom + gap });
  }, [menuOpen]);

  const inactive = site.subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE;
  const online = isPubliclyVisible(site);
  const state = displayState(site);
  const address = `webg.co.il/s/${site.slug}`;

  function run(kind: Exclude<Pending, null>, action: (id: string) => Promise<SimpleResult>, success: string) {
    setNotice(null);
    setRunning(kind);
    start(async () => {
      try {
        const res = await action(site.id);
        setNotice(res.ok ? { kind: "success", text: success } : { kind: "error", text: res.error ?? "משהו השתבש. נסו שוב." });
      } catch {
        setNotice({ kind: "error", text: "לא הצלחנו להשלים את הפעולה. בדקו את החיבור לאינטרנט ונסו שוב." });
      }
      setRunning(null);
      setConfirm(null);
      router.refresh();
    });
  }

  function runDelete() {
    setNotice(null);
    setRunning("delete");
    start(async () => {
      try {
        const res = await deleteSiteAction(site.id);
        if (res.ok) {
          router.push("/dashboard?deleted=1");
          return;
        }
        setNotice({ kind: "error", text: res.error ?? "משהו השתבש. נסו שוב." });
      } catch {
        setNotice({ kind: "error", text: "לא הצלחנו למחוק את האתר. בדקו את החיבור לאינטרנט ונסו שוב." });
      }
      setRunning(null);
      setDeleteOpen(false);
    });
  }

  const publishedText = `האתר פורסם! הלקוחות יכולים לראות אותו ב-${address}`;

  return (
    <article aria-labelledby={`t-${site.id}`} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      {/* Thumbnail */}
      <div
        className="relative flex aspect-[2/1] items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${d.primaryColor}, color-mix(in srgb, ${d.primaryColor} 60%, #000))` }}
      >
        {d.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.heroImageUrl} alt="" className={`absolute inset-0 h-full w-full object-cover ${online ? "" : "grayscale"}`} />
        )}
        <div className="relative rounded-2xl bg-white/90 p-2 shadow">
          <Logo logoUrl={d.logoUrl} name={d.businessName} color={d.primaryColor} size={48} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* A. Summary */}
        <div className="min-w-0">
          <h2 id={`t-${site.id}`} className="truncate text-lg font-bold">{d.businessName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-600">{getCategory(d.category).label}</p>
            <StatusBadge state={state} />
          </div>
        </div>

        {/* B. Main actions - the primary action is the one most likely useful right now; edit/preview/unpublish stay reachable as secondary actions in every state. */}
        <div className="space-y-2">
          {state === "SUBSCRIPTION_INACTIVE" ? (
            <Button className="w-full" loading={running === "activate"} disabled={isPending} onClick={() => run("activate", activateSubscriptionAction, "האתר הופעל מחדש וחזר להיות זמין.")}>
              {running === "activate" ? "מפעיל..." : "הפעל מחדש"}
            </Button>
          ) : state === "PUBLISHED" ? (
            <Link href={`/sites/${site.id}/edit`} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white transition hover:bg-indigo-700">
              עריכת האתר
            </Link>
          ) : (
            <Button className="w-full" loading={running === "publish"} disabled={isPending} onClick={() => run("publish", publishSiteAction, publishedText)}>
              {running === "publish" ? "מפרסם..." : "פרסום האתר"}
            </Button>
          )}
          <div className="flex gap-2">
            {state !== "PUBLISHED" && <Link href={`/sites/${site.id}/edit`} className={secondaryBtn}>עריכת האתר</Link>}
            <Link href={`/sites/${site.id}/preview`} target="_blank" className={secondaryBtn}>תצוגה מקדימה</Link>
            {state === "PUBLISHED" && (
              <button type="button" disabled={isPending} onClick={() => setConfirm("unpublish")} className={secondaryBtn}>
                הורדה מהאוויר
              </button>
            )}
          </div>
        </div>

        <Link
          href={`/sites/${site.id}/admin`}
          aria-label={unreadCount > 0 ? `מרכז פניות, ${unreadCount} פניות חדשות` : "מרכז פניות"}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          <InboxIcon />
          מרכז פניות
          {unreadCount > 0 && (
            <span aria-hidden className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

        {/* Compact contextual hint */}
        <p className="flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-950">
          <LightbulbIcon className="mt-0.5 shrink-0 text-indigo-500" />
          {nextStep(site)}
        </p>

        {/* C. Secondary info/actions */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">כתובת האתר</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-indigo-800" dir="ltr">{address}</span>
              <div className="flex shrink-0 items-center gap-1">
                {online && (
                  <Link href={`/s/${site.slug}`} target="_blank" aria-label="פתיחת האתר בכרטיסייה חדשה" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                    <ExternalLinkIcon />
                  </Link>
                )}
                <CopyButton text={address} label="העתקה" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">{subscriptionInfo(site.subscriptionStatus).label}</p>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="פעולות נוספות"
                disabled={isPending}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <MoreIcon />
              </button>
              {menuOpen && createPortal(
                <div
                  ref={menuPanelRef}
                  role="menu"
                  style={{ position: "fixed", top: menuPos?.top ?? 0, left: menuPos?.left ?? 0, visibility: menuPos ? "visible" : "hidden" }}
                  className="z-50 w-48 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg"
                >
                  {isDev && !inactive && (
                    <button
                      type="button"
                      role="menuitem"
                      title="הדמיה בלבד, עד שיחובר תשלום"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirm("deactivate");
                      }}
                      className="flex min-h-11 w-full items-center rounded-lg px-3 text-start text-sm text-gray-700 hover:bg-gray-100"
                    >
                      הדמיה: סיום מנוי
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-start text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    מחיקת האתר
                  </button>
                </div>,
                document.body,
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "unpublish"}
        title="להוריד את האתר מהאוויר?"
        text="הלקוחות לא יוכלו לראות את האתר עד שתפרסמו אותו שוב. שום מידע לא יימחק."
        confirmLabel="כן, הורד מהאוויר"
        danger
        pending={running === "unpublish"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run("unpublish", unpublishSiteAction, "האתר ירד מהאוויר. אפשר לפרסם אותו שוב בכל רגע.")}
      />
      <ConfirmDialog
        open={confirm === "deactivate"}
        title="להדמות סיום מנוי?"
        text="זו הדמיה בלבד: האתר יוסתר מהלקוחות, אבל שום מידע לא יימחק. אפשר להפעיל מחדש בכל רגע."
        confirmLabel="כן, הדמה סיום מנוי"
        danger
        pending={running === "deactivate"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => run("deactivate", deactivateSubscriptionAction, "המנוי סומן כלא פעיל. האתר לא מוצג ללקוחות, והמידע שמור.")}
      />
      <DeleteSiteDialog
        open={deleteOpen}
        businessName={d.businessName}
        pending={running === "delete"}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={runDelete}
      />
    </article>
  );
}
