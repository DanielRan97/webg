import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SUPPORT_TICKET_STATUS, SUPPORT_SENDER_TYPE, type SupportCategory, type SupportTicketStatus } from "@/lib/constants";

export interface SupportMessageRow {
  id: string;
  senderType: string;
  message: string;
  createdAt: Date;
}

export interface SupportTicketDetail {
  id: string;
  userId: string;
  userEmail: string;
  category: string;
  subject: string;
  status: string;
  relatedWebsiteId: string | null;
  relatedWebsiteName: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  messages: SupportMessageRow[];
}

export interface SupportTicketListRow {
  id: string;
  category: string;
  subject: string;
  status: string;
  updatedAt: Date;
  unread: boolean;
}

const messageOrder = { orderBy: { createdAt: "asc" as const } };

function isTicketUnread(latest: { senderType: string; createdAt: Date } | undefined, seenAt: Date | null, expectFrom: string): boolean {
  if (!latest || latest.senderType !== expectFrom) return false;
  return !seenAt || seenAt < latest.createdAt;
}

/** Returns the ticket only if it belongs to the user - not-found and not-yours look identical on purpose. */
export async function getOwnedTicket(userId: string, id: string): Promise<SupportTicketDetail | null> {
  const row = await db.supportTicket.findFirst({
    where: { id, userId },
    include: { messages: messageOrder, user: { select: { email: true } } },
  });
  if (!row) return null;
  const website = row.relatedWebsiteId
    ? await db.website.findFirst({ where: { id: row.relatedWebsiteId, userId }, select: { businessName: true } })
    : null;
  return toDetail(row, website?.businessName ?? null);
}

export async function listTicketsForUser(userId: string): Promise<SupportTicketListRow[]> {
  const rows = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: {
      id: true, category: true, subject: true, status: true, updatedAt: true, userSeenAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderType: true, createdAt: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    subject: r.subject,
    status: r.status,
    updatedAt: r.updatedAt,
    unread: isTicketUnread(r.messages[0], r.userSeenAt, SUPPORT_SENDER_TYPE.ADMIN),
  }));
}

export async function getUserUnreadCount(userId: string): Promise<number> {
  const rows = await db.supportTicket.findMany({
    where: { userId },
    select: { userSeenAt: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderType: true, createdAt: true } } },
  });
  return rows.filter((r) => isTicketUnread(r.messages[0], r.userSeenAt, SUPPORT_SENDER_TYPE.ADMIN)).length;
}

/** Only sites the user actually owns - for the optional "related site" picker. Never accepts a caller-supplied website id. */
export async function listOwnedWebsitesForPicker(userId: string): Promise<{ id: string; businessName: string }[]> {
  return db.website.findMany({ where: { userId }, select: { id: true, businessName: true }, orderBy: { createdAt: "desc" } });
}

export async function createTicket(
  userId: string,
  input: { category: SupportCategory; subject: string; message: string; relatedWebsiteId: string | null },
): Promise<string> {
  // A related site must belong to this user - never trust a caller-supplied id past this check.
  const relatedWebsiteId = input.relatedWebsiteId
    ? (await db.website.findFirst({ where: { id: input.relatedWebsiteId, userId }, select: { id: true } }))?.id ?? null
    : null;
  const ticket = await db.supportTicket.create({
    data: {
      userId,
      category: input.category,
      subject: input.subject.trim(),
      relatedWebsiteId,
      userSeenAt: new Date(),
      messages: { create: { senderType: SUPPORT_SENDER_TYPE.USER, message: input.message.trim() } },
    },
    select: { id: true },
  });
  return ticket.id;
}

/** Replying to a closed ticket reopens it - a closed ticket is never a dead end for the user. */
export async function addUserMessage(userId: string, ticketId: string, message: string): Promise<boolean> {
  const ticket = await db.supportTicket.findFirst({ where: { id: ticketId, userId }, select: { id: true, status: true } });
  if (!ticket) return false;
  const now = new Date();
  await db.$transaction([
    db.supportMessage.create({ data: { ticketId, senderType: SUPPORT_SENDER_TYPE.USER, message: message.trim() } }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: {
        userSeenAt: now,
        ...(ticket.status === SUPPORT_TICKET_STATUS.CLOSED ? { status: SUPPORT_TICKET_STATUS.OPEN, closedAt: null } : {}),
      },
    }),
  ]);
  return true;
}

export async function markTicketSeenByUser(userId: string, ticketId: string): Promise<void> {
  await db.supportTicket.updateMany({ where: { id: ticketId, userId }, data: { userSeenAt: new Date() } });
}

// ---- Admin ----

export interface AdminTicketListRow {
  id: string;
  subject: string;
  category: string;
  status: string;
  userEmail: string;
  updatedAt: Date;
  unread: boolean;
}

export async function adminListTickets(filter: { status?: SupportTicketStatus; category?: SupportCategory; q?: string }): Promise<AdminTicketListRow[]> {
  const where: Prisma.SupportTicketWhereInput = {};
  if (filter.status) where.status = filter.status;
  if (filter.category) where.category = filter.category;
  const q = filter.q?.trim();
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  const rows = await db.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: {
      id: true, subject: true, category: true, status: true, updatedAt: true, adminSeenAt: true,
      user: { select: { email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderType: true, createdAt: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    category: r.category,
    status: r.status,
    userEmail: r.user.email,
    updatedAt: r.updatedAt,
    unread: isTicketUnread(r.messages[0], r.adminSeenAt, SUPPORT_SENDER_TYPE.USER),
  }));
}

/** Non-closed tickets whose latest message is from the user and unseen by any admin - the platform-wide "needs attention" count. */
export async function getAdminUnreadCount(): Promise<number> {
  const rows = await db.supportTicket.findMany({
    where: { NOT: { status: SUPPORT_TICKET_STATUS.CLOSED } },
    select: { adminSeenAt: true, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderType: true, createdAt: true } } },
  });
  return rows.filter((r) => isTicketUnread(r.messages[0], r.adminSeenAt, SUPPORT_SENDER_TYPE.USER)).length;
}

/** Not scoped by userId - authorization is requireAdmin() at the calling action, not row ownership. */
export async function adminGetTicket(id: string): Promise<SupportTicketDetail | null> {
  const row = await db.supportTicket.findUnique({ where: { id }, include: { messages: messageOrder, user: { select: { email: true } } } });
  if (!row) return null;
  const website = row.relatedWebsiteId ? await db.website.findUnique({ where: { id: row.relatedWebsiteId }, select: { businessName: true } }) : null;
  return toDetail(row, website?.businessName ?? null);
}

export async function adminAddMessage(ticketId: string, message: string): Promise<{ ok: boolean; userId?: string; subject?: string; userEmail?: string }> {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { userId: true, subject: true, user: { select: { email: true } } } });
  if (!ticket) return { ok: false };
  const now = new Date();
  await db.$transaction([
    db.supportMessage.create({ data: { ticketId, senderType: SUPPORT_SENDER_TYPE.ADMIN, message: message.trim() } }),
    db.supportTicket.update({ where: { id: ticketId }, data: { adminSeenAt: now, status: SUPPORT_TICKET_STATUS.IN_PROGRESS } }),
  ]);
  return { ok: true, userId: ticket.userId, subject: ticket.subject, userEmail: ticket.user.email };
}

export async function adminSetTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<boolean> {
  const { count } = await db.supportTicket.updateMany({
    where: { id: ticketId },
    data: { status, closedAt: status === SUPPORT_TICKET_STATUS.CLOSED ? new Date() : null, adminSeenAt: new Date() },
  });
  return count > 0;
}

export async function adminMarkTicketSeen(ticketId: string): Promise<void> {
  await db.supportTicket.updateMany({ where: { id: ticketId }, data: { adminSeenAt: new Date() } });
}

function toDetail(
  row: { id: string; userId: string; category: string; subject: string; status: string; relatedWebsiteId: string | null; createdAt: Date; updatedAt: Date; closedAt: Date | null; messages: SupportMessageRow[]; user: { email: string } },
  relatedWebsiteName: string | null,
): SupportTicketDetail {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    category: row.category,
    subject: row.subject,
    status: row.status,
    relatedWebsiteId: row.relatedWebsiteId,
    relatedWebsiteName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    closedAt: row.closedAt,
    messages: row.messages,
  };
}
