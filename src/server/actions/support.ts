"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { requireAdmin, adminEmailList } from "@/lib/admin";
import { appUrl } from "@/lib/env";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendSupportReplyEmail, sendSupportTicketOpenedEmail } from "@/lib/email";
import { SUPPORT_CATEGORY, SUPPORT_TICKET_STATUS, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";
import {
  addUserMessage, adminAddMessage, adminMarkTicketSeen, adminSetTicketStatus,
  createTicket, getOwnedTicket, markTicketSeenByUser,
} from "../support";
import type { SimpleResult } from "./sites";

function isSupportCategory(v: string): v is SupportCategory {
  return v in SUPPORT_CATEGORY;
}

function isTicketStatus(v: string): v is SupportTicketStatus {
  return v in SUPPORT_TICKET_STATUS;
}

export interface CreateTicketResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createTicketAction(input: { category: string; subject: string; message: string; relatedWebsiteId: string | null }): Promise<CreateTicketResult> {
  const user = await requireUser();

  const ok = await rateLimit(`support-ticket:user:${user.id}`, RATE_LIMITS.supportTicketPerUser.limit, RATE_LIMITS.supportTicketPerUser.windowMs);
  if (!ok) return { ok: false, error: "יותר מדי פניות נפתחו. נסו שוב בעוד שעה." };

  const category = isSupportCategory(input.category) ? input.category : SUPPORT_CATEGORY.OTHER;
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) return { ok: false, error: "יש למלא נושא והודעה." };

  const id = await createTicket(user.id, { category, subject, message, relatedWebsiteId: input.relatedWebsiteId });
  revalidatePath("/support");

  // Best-effort only: a failed notification email must never fail ticket creation.
  const recipients = adminEmailList();
  if (recipients.length > 0) {
    const adminTicketUrl = `${appUrl()}/admin/support/${id}`;
    Promise.all(
      recipients.map((to) => sendSupportTicketOpenedEmail(to, { subject, category, userEmail: user.email, adminTicketUrl })),
    ).catch((e) => console.error("support ticket admin notification failed:", e instanceof Error ? e.message : e));
  }

  return { ok: true, id };
}

/** Not found and "found but belongs to someone else" look identical on purpose. */
async function withOwnedTicket(id: string, fn: (userId: string) => Promise<SimpleResult>): Promise<SimpleResult> {
  const user = await requireUser();
  const ticket = await getOwnedTicket(user.id, id);
  if (!ticket) return { ok: false, error: "הפנייה לא נמצאה" };
  const result = await fn(user.id);
  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  return result;
}

export async function replyToTicketAction(id: string, message: string): Promise<SimpleResult> {
  return withOwnedTicket(id, async (userId) => {
    const ok = await rateLimit(`support-reply:user:${userId}`, RATE_LIMITS.supportReplyPerUser.limit, RATE_LIMITS.supportReplyPerUser.windowMs);
    if (!ok) return { ok: false, error: "יותר מדי הודעות. נסו שוב בעוד קצת." };
    const trimmed = message.trim();
    if (!trimmed) return { ok: false, error: "יש לכתוב הודעה." };
    const done = await addUserMessage(userId, id, trimmed);
    return done ? { ok: true } : { ok: false, error: "הפנייה לא נמצאה" };
  });
}

export async function markTicketSeenAction(id: string): Promise<void> {
  const user = await requireUser();
  await markTicketSeenByUser(user.id, id);
  revalidatePath("/support");
}

// ---- Admin ----

/** Independently calls requireAdmin() - never relies on the /admin layout having already run, a Server Action is its own POST endpoint. */
export async function adminReplyToTicketAction(id: string, message: string): Promise<SimpleResult> {
  await requireAdmin();
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "יש לכתוב הודעה." };
  const result = await adminAddMessage(id, trimmed);
  if (!result.ok || !result.userId) return { ok: false, error: "הפנייה לא נמצאה" };

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/support");
  revalidatePath(`/support/${id}`);

  // Best-effort only: a failed notification email must never fail the reply itself.
  sendSupportReplyEmail(result.userEmail!, { subject: result.subject!, message: trimmed, ticketUrl: `${appUrl()}/support/${id}` })
    .catch((e) => console.error("support reply email failed:", e instanceof Error ? e.message : e));

  return { ok: true };
}

export async function adminSetTicketStatusAction(id: string, status: string): Promise<SimpleResult> {
  await requireAdmin();
  if (!isTicketStatus(status)) return { ok: false, error: "סטטוס לא תקין" };
  const ok = await adminSetTicketStatus(id, status);
  if (!ok) return { ok: false, error: "הפנייה לא נמצאה" };
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/support");
  revalidatePath(`/support/${id}`);
  return { ok: true };
}

export async function adminMarkTicketSeenAction(id: string): Promise<void> {
  await requireAdmin();
  await adminMarkTicketSeen(id);
  revalidatePath("/admin");
  revalidatePath("/admin/support");
}
