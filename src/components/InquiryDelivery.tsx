import { inquiryDelivery, isPro } from "@/lib/plan";
import { MailCheckIcon } from "./icons";
import { InboxIcon } from "./ui/icons";

/**
 * Where a site's inquiries (the "שליחת הודעה" and "השאירו פרטים" forms) end up, in plain words, per
 * plan and setting: Basic gets every one by email; Pro gets email, the inquiries center, or both.
 */
export function InquiryDelivery({ plan, email, delivery }: { plan: string; email?: string; delivery?: string }) {
  const pro = isPro({ plan });
  const mode = inquiryDelivery({ plan, inquiryDelivery: delivery });
  const to = email ? (
    <span dir="ltr" className="font-semibold text-ink-900">{email}</span>
  ) : (
    "האימייל שאיתו נרשמתם ל-WEBG"
  );
  const viaEmail = !pro || mode !== "CENTER";
  const viaCenter = pro && mode !== "EMAIL";
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="font-bold text-ink-950">לאן מגיעות הפניות מהאתר?</p>
      <p className="mt-1 text-sm text-ink-700">כשלקוח ממלא באתר טופס ״שליחת הודעה״ או ״השאירו פרטים״, הפנייה מגיעה אליכם כך:</p>
      <ul className="mt-3 space-y-2 text-sm text-ink-800">
        <li className="flex items-start gap-2.5">
          <MailCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            {viaEmail ? <>מייל על כל פנייה, אל {to}. </> : "לא נשלח מייל על פניות חדשות (כך בחרתם בהגדרות). "}
            {pro ? "" : "זה כלול ב-Basic, וזו הדרך שבה הפניות מגיעות אליכם."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <InboxIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            {!pro
              ? "מרכז הפניות, שבו כל הפניות נשמרות במקום אחד, הוא חלק מ-Pro. הפניות שמגיעות עכשיו נשמרות, ואם תעברו ל-Pro תראו גם אותן."
              : viaCenter
                ? "וגם במרכז הפניות: כל הפניות נשמרות במקום אחד, עם הפרטים של הלקוח, סימון של פניות חדשות ואפשרות לחזור לפניות ישנות."
                : "מרכז הפניות כבוי. הפניות עדיין נשמרות, ואם תדליקו אותו תראו את כולן."}
          </span>
        </li>
      </ul>
    </div>
  );
}
