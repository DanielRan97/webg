"use server";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { sendContactFormEmail } from "@/lib/email";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isPubliclyVisible } from "@/lib/subscription";
import { contactFormSchema } from "@/lib/validation";
import { getWebsiteBySlug } from "../websites";

export interface ContactFormResult {
  ok: boolean;
  error?: string;
}

/** Never more specific than this for a failure: never confirms whether a site/owner exists, and never repeats an internal (Resend, DB) error message. */
const GENERIC_ERROR = "לא הצלחנו לשלוח את ההודעה כרגע. נסו שוב מאוחר יותר.";
const RATE_LIMIT_ERROR = "יותר מדי הודעות בזמן קצר. נסו שוב בעוד כמה דקות.";

/**
 * Public "צור קשר" form submission from a live website. Called by anonymous
 * visitors - the recipient is always resolved server-side from the website's
 * owner and is never accepted from the client.
 */
export async function submitContactFormAction(input: {
  slug: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}): Promise<ContactFormResult> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  const { slug, name, phone, email, message } = parsed.data;

  const ip = await clientIp();
  const [okIp, okSite] = await Promise.all([
    rateLimit(`contact-form:ip:${ip}`, RATE_LIMITS.contactFormPerIp.limit, RATE_LIMITS.contactFormPerIp.windowMs),
    rateLimit(`contact-form:site:${slug}`, RATE_LIMITS.contactFormPerSite.limit, RATE_LIMITS.contactFormPerSite.windowMs),
  ]);
  if (!okIp || !okSite) return { ok: false, error: RATE_LIMIT_ERROR };

  // Everything below can fail for reasons that must never reach the visitor as anything
  // more specific than GENERIC_ERROR: an unknown/non-public site, a missing owner, a
  // database hiccup, or the email provider rejecting the send. One catch-all guarantees
  // that regardless of which step fails, the response - and what a visitor could infer
  // about the site/owner's account - looks identical.
  try {
    const site = await getWebsiteBySlug(slug);
    if (!site || !isPubliclyVisible(site)) return { ok: false, error: GENERIC_ERROR };

    const owner = await db.user.findUnique({ where: { id: site.userId }, select: { email: true } });
    if (!owner) return { ok: false, error: GENERIC_ERROR };

    await sendContactFormEmail(owner.email, {
      businessName: site.data.businessName,
      siteUrl: `${appUrl()}/s/${site.slug}`,
      name,
      phone,
      email,
      message,
      submittedAt: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }),
    });
    return { ok: true };
  } catch (e) {
    console.error("contact form submission failed (non-fatal to the visitor):", e instanceof Error ? e.message : e);
    return { ok: false, error: GENERIC_ERROR };
  }
}
