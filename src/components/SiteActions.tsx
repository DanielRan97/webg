"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  activateSubscriptionAction,
  deactivateSubscriptionAction,
  publishSiteAction,
  unpublishSiteAction,
  type SimpleResult,
} from "@/server/actions/sites";
import { SUBSCRIPTION_STATUS, WEBSITE_STATUS } from "@/lib/constants";
import { Button, ConfirmDialog, Notice } from "./ui/ui";

type Pending = "publish" | "unpublish" | "activate" | "deactivate" | null;

/** Publish / take offline / reactivate, with a short explanation, confirmation for risky actions, and clear feedback. */
export function SiteActions({
  id,
  slug,
  status,
  subscriptionStatus,
}: {
  id: string;
  slug: string;
  status: string;
  subscriptionStatus: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [running, setRunning] = useState<Pending>(null);
  const [confirm, setConfirm] = useState<"unpublish" | "deactivate" | null>(null);
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

  const publishedText = `האתר פורסם! הלקוחות יכולים לראות אותו ב-webg.co.il/s/${slug}`;

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

      {!inactive && (
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
    </div>
  );
}
