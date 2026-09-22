/** Minimal, RTL-friendly Hebrew email templates. Kept plain (no heavy HTML/CSS) so they render well in every client. */

function wrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:24px;margin:0">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px" dir="rtl">
<tr><td>
<p style="font-size:22px;font-weight:bold;color:#4338ca;margin:0 0 24px">WEBG</p>
<h1 style="font-size:20px;margin:0 0 12px;color:#111827">${title}</h1>
${bodyHtml}
<p style="font-size:12px;color:#9ca3af;margin-top:32px">אם לא ביקשתם את ההודעה הזו, אפשר להתעלם ממנה.</p>
</td></tr>
</table>
</body></html>`;
}

const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:12px">${label}</a></p>`;

export function passwordResetEmail(resetUrl: string) {
  const subject = "איפוס סיסמה ל-WEBG";
  const html = wrap(
    "איפוס סיסמה",
    `<p style="color:#374151;line-height:1.6">קיבלנו בקשה לאיפוס הסיסמה שלכם. לחצו על הכפתור כדי לבחור סיסמה חדשה. הקישור בתוקף לשעה אחת.</p>${btn(resetUrl, "איפוס סיסמה")}<p style="color:#9ca3af;font-size:13px">אם הכפתור לא עובד, אפשר להעתיק את הכתובת הזו לדפדפן:<br>${resetUrl}</p>`,
  );
  const text = `איפוס סיסמה ל-WEBG\n\nלחצו על הקישור כדי לבחור סיסמה חדשה (בתוקף לשעה אחת):\n${resetUrl}\n\nאם לא ביקשתם את זה, אפשר להתעלם מההודעה.`;
  return { subject, html, text };
}

export function verifyEmailEmail(verifyUrl: string) {
  const subject = "אימות כתובת האימייל ב-WEBG";
  const html = wrap(
    "אימות כתובת האימייל",
    `<p style="color:#374151;line-height:1.6">כמעט סיימנו. לחצו על הכפתור כדי לאמת את כתובת האימייל שלכם. אימות נדרש לפני שאפשר לפרסם אתר. הקישור בתוקף ל-24 שעות.</p>${btn(verifyUrl, "אימות האימייל")}<p style="color:#9ca3af;font-size:13px">אם הכפתור לא עובד, אפשר להעתיק את הכתובת הזו לדפדפן:<br>${verifyUrl}</p>`,
  );
  const text = `אימות כתובת האימייל ב-WEBG\n\nלחצו על הקישור כדי לאמת את האימייל (בתוקף ל-24 שעות):\n${verifyUrl}`;
  return { subject, html, text };
}
