"use server";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { sendLeadFormEmail } from "@/lib/email";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { isPubliclyVisible } from "@/lib/subscription";
import { leadFormSchema } from "@/lib/validation";
import { createInteraction } from "../interactions";
import { getWebsiteBySlug } from "../websites";

export interface LeadFormResult {
  ok: boolean;
  error?: string;
}

/** Never more specific than this for a failure: never confirms whether a site/owner exists, and never repeats an internal (Resend, DB) error message. */
const GENERIC_ERROR = "לא הצלחנו לשלוח את הפרטים כרגע. נסו שוב מאוחר יותר.";
const RATE_LIMIT_ERROR = "יותר מדי בקשות בזמן קצר. נסו שוב בעוד כמה דקות.";

/**
 * Public "השאירו פרטים" callback-request submission from a live website -
 * deliberately separate from the fuller "צור קשר" inquiry form (no message,
 * name + phone only, email optional). Called by anonymous visitors - the
 * recipient is always resolved server-side from the website's owner and is
 * never accepted from the client.
 */
export async function submitLeadFormAction(input: {
  slug: string;
  name: string;
  phone: string;
  email: string;
}): Promise<LeadFormResult> {
  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR };
  const { slug, name, phone, email } = parsed.data;

  const ip = await clientIp();
  const [okIp, okSite] = await Promise.all([
    rateLimit(`lead-form:ip:${ip}`, RATE_LIMITS.leadFormPerIp.limit, RATE_LIMITS.leadFormPerIp.windowMs),
    rateLimit(`lead-form:site:${slug}`, RATE_LIMITS.leadFormPerSite.limit, RATE_LIMITS.leadFormPerSite.windowMs),
  ]);
  if (!okIp || !okSite) return { ok: false, error: RATE_LIMIT_ERROR };

  // Everything below can fail for reasons that must never reach the visitor as anything
  // more specific than GENERIC_ERROR: an unknown/non-public site, a missing owner, or a
  // database hiccup while resolving/saving. One catch-all guarantees that regardless of
  // which step fails, the response - and what a visitor could infer about the
  // site/owner's account - looks identical. The email send is deliberately outside this
  // catch: once the interaction is saved, the admin inbox is the source of truth, so a
  // Resend failure must not turn an already-captured interaction into a visitor-facing error.
  try {
    const site = await getWebsiteBySlug(slug);
    if (!site || !isPubliclyVisible(site)) return { ok: false, error: GENERIC_ERROR };

    const owner = await db.user.findUnique({ where: { id: site.userId }, select: { email: true } });
    if (!owner) return { ok: false, error: GENERIC_ERROR };

    const interaction = await createInteraction(site.id, { type: "LEAD", name, phone, email });

    try {
      await sendLeadFormEmail(owner.email, {
        businessName: site.data.businessName,
        siteUrl: `${appUrl()}/s/${site.slug}`,
        adminUrl: `${appUrl()}/sites/${site.id}/admin?interaction=${interaction.id}`,
        name,
        phone,
        email,
        submittedAt: new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" }),
      });
    } catch (emailError) {
      console.error("lead form email failed (interaction already saved):", emailError instanceof Error ? emailError.message : emailError);
    }
    return { ok: true };
  } catch (e) {
    console.error("lead form submission failed (non-fatal to the visitor):", e instanceof Error ? e.message : e);
    return { ok: false, error: GENERIC_ERROR };
  }
}
