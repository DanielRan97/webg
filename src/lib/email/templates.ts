/** Minimal, RTL-friendly Hebrew email templates. Kept plain (no heavy HTML/CSS, no external assets) so they render well in every client, including on a phone. */

/** Every value interpolated into an HTML email body must go through this - the sender of a contact-form message is an anonymous website visitor. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f9fafb;padding:16px;margin:0;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" style="max-width:480px;width:100%;margin:0 auto;background:#ffffff;border-radius:16px" dir="rtl">
<tr><td style="padding:28px 24px">
<p style="font-size:22px;font-weight:bold;color:#4338ca;margin:0 0 24px">WEBG</p>
<h1 style="font-size:20px;line-height:1.4;margin:0 0 12px;color:#111827">${title}</h1>
${bodyHtml}
<p style="font-size:12px;color:#9ca3af;margin-top:32px;line-height:1.6">אם לא ביקשתם את ההודעה הזו, אפשר להתעלם ממנה.</p>
</td></tr>
</table>
</body>
</html>`;
}

const btn = (href: string, label: string) =>
  `<table role="presentation" style="margin:24px 0"><tr><td style="border-radius:12px;background:#4338ca">
<a href="${href}" style="display:block;min-height:24px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;text-align:center">${label}</a>
</td></tr></table>`;

const fallbackLink = (href: string) =>
  `<p style="color:#9ca3af;font-size:13px;line-height:1.6">אם הכפתור לא עובד, אפשר להעתיק את הכתובת הזו לדפדפן:<br><span style="word-break:break-all">${href}</span></p>`;

export function passwordResetEmail(resetUrl: string) {
  const subject = "איפוס סיסמה ל-WEBG";
  const html = wrap(
    "איפוס סיסמה",
    `<p style="color:#374151;line-height:1.6;font-size:15px">קיבלנו בקשה לאיפוס הסיסמה שלכם. לחצו על הכפתור כדי לבחור סיסמה חדשה. הקישור בתוקף לשעה אחת.</p>${btn(resetUrl, "איפוס סיסמה")}${fallbackLink(resetUrl)}`,
  );
  const text = `איפוס סיסמה ל-WEBG\n\nלחצו על הקישור כדי לבחור סיסמה חדשה (בתוקף לשעה אחת):\n${resetUrl}\n\nאם לא ביקשתם את זה, אפשר להתעלם מההודעה.`;
  return { subject, html, text };
}

export function verifyEmailEmail(verifyUrl: string) {
  const subject = "אימות כתובת האימייל ב-WEBG";
  const html = wrap(
    "אימות כתובת האימייל",
    `<p style="color:#374151;line-height:1.6;font-size:15px">כמעט סיימנו. לחצו על הכפתור כדי לאמת את כתובת האימייל שלכם. אימות נדרש לפני שאפשר לפרסם אתר. הקישור בתוקף ל-24 שעות.</p>${btn(verifyUrl, "אימות האימייל")}${fallbackLink(verifyUrl)}`,
  );
  const text = `אימות כתובת האימייל ב-WEBG\n\nלחצו על הקישור כדי לאמת את האימייל (בתוקף ל-24 שעות):\n${verifyUrl}`;
  return { subject, html, text };
}

/** A visitor's message from a website's public "צור קשר" form, sent to the site's owner. Every field here comes from an anonymous browser - always escaped before it reaches the HTML body. */
export function contactFormEmail(input: {
  businessName: string;
  siteUrl: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  submittedAt: string;
}) {
  const { businessName, siteUrl, name, phone, email, message, submittedAt } = input;
  const subject = "פנייה חדשה מהאתר שלך ב-WEBG";
  const row = (label: string, value: string) =>
    value ? `<p style="margin:0 0 10px;color:#374151;font-size:15px"><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</p>` : "";
  const html = wrap(
    `פנייה חדשה מ-${escapeHtml(businessName)}`,
    `<p style="color:#374151;line-height:1.6;font-size:15px">מישהו מילא את טופס יצירת הקשר באתר שלכם:</p>
${row("שם", name)}
${row("טלפון", phone)}
${row("אימייל", email)}
<p style="margin:16px 0 4px;color:#374151;font-size:15px"><b>הודעה:</b></p>
<p style="white-space:pre-line;color:#111827;font-size:15px;line-height:1.6;background:#f9fafb;border-radius:12px;padding:14px">${escapeHtml(message)}</p>
<p style="margin-top:20px;color:#9ca3af;font-size:13px">התקבל: ${escapeHtml(submittedAt)}<br>האתר: <span dir="ltr">${escapeHtml(siteUrl)}</span></p>`,
  );
  const text = `פנייה חדשה מ-${businessName}\n\nשם: ${name}\nטלפון: ${phone || "-"}\nאימייל: ${email || "-"}\n\nהודעה:\n${message}\n\nהתקבל: ${submittedAt}\nהאתר: ${siteUrl}`;
  return { subject, html, text };
}
