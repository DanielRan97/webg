"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateSubscriptionAction,
  deactivateSubscriptionAction,
  deleteSiteAction,
  publishSiteAction,
  unpublishSiteAction,
  type SimpleResult,
} from "@/server/actions/sites";
import { SUBSCRIPTION_STATUS, WEBSITE_STATUS } from "@/lib/constants";
import { publicSiteUrlDisplay } from "@/lib/site-url";
import { Button, ConfirmDialog, Notice } from "./ui/ui";
import { DeleteSiteDialog } from "./DeleteSiteDialog";

// Inlined at build time by Next.js - not a secret, just a mode flag. Matches the same gate on SiteCard's dev-only controls.
const isDev = process.env.NODE_ENV !== "production";

type Pending = "publish" | "unpublish" | "activate" | "deactivate" | "delete" | null;

/** Publish / take offline / reactivate, with a short explanation, confirmation for risky actions, and clear feedback. */
export function SiteActions({
  id,
  slug,
  plan,
  businessName,
  status,
  subscriptionStatus,
}: {
  id: string;
  slug: string;
  plan: string;
  businessName: string;
  status: string;
  subscriptionStatus: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [running, setRunning] = useState<Pending>(null);
  const [confirm, setConfirm] = useState<"unpublish" | "deactivate" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const inactive = subscriptionStatus === SUBSCRIPTION_STATUS.INACTIVE;
  const published = status === WEBSITE_STATUS.PUBLISHED;

  function run(kind: Exclude<Pending, null>, action: (id: string) => Promise<SimpleResult>, success: string) {
    setNotice(null);
    setRunning(kind);
    start(async () => {
      try {
        const res = await action(id);
        setNotice(res.ok ? { kind: "success", text: success } : { kind: "error", text: res.error ?? "משהו השתבש. נסו שוב." });
      } catch {
        setNotice({ kind: "error", text: "לא הצלחנו להשלים את הפעולה. בדקו את החיבור לאינטרנט ונסו שוב." });
      }
      setRunning(null);
      setConfirm(null);
      router.refresh();
    });
  }

  const publishedText = `האתר פורסם! הלקוחות יכולים לראות אותו ב-${publicSiteUrlDisplay({ slug, plan })}`;

  function runDelete() {
    setNotice(null);
    setRunning("delete");
    start(async () => {
      try {
        const res: SimpleResult = await deleteSiteAction(id);
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

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {inactive ? (
          <>
            <Button className="w-full sm:w-auto" loading={running === "activate"} disabled={isPending} onClick={() => run("activate", activateSubscriptionAction, "האתר הופעל מחדש וחזר להיות זמין.")}>
              {running === "activate" ? "מפעיל..." : "הפעל מחדש"}
            </Button>
            <p className="text-sm text-gray-700">המנוי הסתיים. אחרי ההפעלה האתר חוזר להיות זמין, וכל המידע שלכם נשמר.</p>
          </>
        ) : published ? (
          <>
            <Button variant="secondary" className="w-full sm:w-auto" disabled={isPending} onClick={() => setConfirm("unpublish")}>
              הורדה מהאוויר
            </Button>
            <p className="text-sm text-gray-700">האתר אונליין. הורדה מהאוויר רק מסתירה אותו, שום דבר לא נמחק.</p>
          </>
        ) : (
          <>
            <Button className="w-full sm:w-auto" loading={running === "publish"} disabled={isPending} onClick={() => run("publish", publishSiteAction, publishedText)}>
              {running === "publish" ? "מפרסם..." : "פרסום האתר"}
            </Button>
            <p className="text-sm text-gray-700">רק אחרי הפרסום הלקוחות יוכלו לראות את האתר.</p>
          </>
        )}
      </div>

      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      {isDev && !inactive && (
        <button type="button" disabled={isPending} onClick={() => setConfirm("deactivate")} className="min-h-11 text-sm text-gray-700 underline hover:text-gray-900" title="הדמיה בלבד, עד שיחובר תשלום">
          הדמיה: סיום מנוי
        </button>
      )}

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

      <div className="mt-2 border-t-2 border-dashed border-red-200 pt-4">
        <Button type="button" variant="danger" className="w-full sm:w-auto" disabled={isPending} onClick={() => setDeleteOpen(true)}>
          🗑 מחיקת האתר
        </Button>
        <p className="mt-2 text-sm text-red-700">פעולה בלתי הפיכה: מוחקת את האתר, התמונות והמידע שלו לצמיתות.</p>
      </div>
      <DeleteSiteDialog
        open={deleteOpen}
        businessName={businessName}
        pending={running === "delete"}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={runDelete}
      />
    </div>
  );
}
