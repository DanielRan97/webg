import { isPro } from "@/lib/plan";
import { MailCheckIcon } from "./icons";
import { InboxIcon } from "./ui/icons";

/**
 * Where a site's inquiries (the "שליחת הודעה" and "השאירו פרטים" forms) end up, in plain words, per
 * plan: Basic gets every one by email; Pro gets the email and keeps them all in the inquiries center.
 */
export function InquiryDelivery({ plan, email }: { plan: string; email?: string }) {
  const pro = isPro({ plan });
  const to = email ? (
    <span dir="ltr" className="font-semibold text-ink-900">{email}</span>
  ) : (
    "האימייל שאיתו נרשמתם ל-WEBG"
  );
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <p className="font-bold text-ink-950">לאן מגיעות הפניות מהאתר?</p>
      <p className="mt-1 text-sm text-ink-700">כשלקוח ממלא באתר טופס ״שליחת הודעה״ או ״השאירו פרטים״, הפנייה מגיעה אליכם כך:</p>
      <ul className="mt-3 space-y-2 text-sm text-ink-800">
        <li className="flex items-start gap-2.5">
          <MailCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>מייל על כל פנייה, אל {to}. {pro ? "" : "זה כלול ב-Basic, וזו הדרך שבה הפניות מגיעות אליכם."}</span>
        </li>
        <li className="flex items-start gap-2.5">
          <InboxIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            {pro
              ? "וגם במרכז הפניות: כל הפניות נשמרות במקום אחד, עם הפרטים של הלקוח, סימון של פניות חדשות ואפשרות לחזור לפניות ישנות."
              : "מרכז הפניות, שבו כל הפניות נשמרות במקום אחד, הוא חלק מ-Pro. הפניות שמגיעות עכשיו נשמרות, ואם תעברו ל-Pro תראו גם אותן."}
          </span>
        </li>
      </ul>
    </div>
  );
}
