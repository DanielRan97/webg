import "server-only";
import { db } from "@/lib/db";
import type { InteractionType } from "@/lib/constants";
import { canAccessInbox } from "@/lib/plan";

export interface CreateInteractionInput {
  type: InteractionType;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records one customer-initiated interaction from a website's public pages.
 * Called from the contact/lead (and future booking) server actions, before
 * the notification email is sent - the interaction row is the source of
 * truth, and must exist even if the email later fails.
 */
export async function createInteraction(websiteId: string, input: CreateInteractionInput) {
  return db.customerInteraction.create({
    data: {
      websiteId,
      type: input.type,
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      message: input.message?.trim() || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
    select: { id: true },
  });
}

/**
 * Unread-interaction count per site, for every site a user owns - one
 * grouped query so the dashboard never runs one query per site card.
 */
export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const rows = await db.customerInteraction.groupBy({
    by: ["websiteId"],
    where: { seenAt: null, website: { userId } },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.websiteId, r._count._all]));
}

export interface InteractionRecord {
  id: string;
  type: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  seenAt: Date | null;
}

function parseMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Every interaction for a site the user owns, newest first. Returns null if
 * the site doesn't exist or isn't theirs - the same not-found-vs-not-yours
 * ambiguity used everywhere else in this app, so an id you don't own never
 * confirms it exists.
 */
export async function listInteractions(userId: string, websiteId: string): Promise<InteractionRecord[] | null> {
  const site = await db.website.findFirst({ where: { id: websiteId, userId }, select: { id: true } });
  if (!site) return null;
  const rows = await db.customerInteraction.findMany({ where: { websiteId }, orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    message: r.message ?? "",
    metadata: parseMetadata(r.metadata),
    createdAt: r.createdAt,
    seenAt: r.seenAt,
  }));
}

/**
 * Marks every currently-unseen interaction for a site as seen. Owner-scoped
 * server-side: a userId/websiteId pair that isn't a real ownership match
 * touches nothing and reports failure, so this can never be used to read or
 * mutate another account's data. Also re-checks the inbox plan gate here
 * (not just at the page level) so a Basic-plan owner can't call this action
 * directly to clear their own unread-lead badge without upgrading.
 */
export async function markInteractionsSeen(userId: string, websiteId: string): Promise<boolean> {
  const site = await db.website.findFirst({ where: { id: websiteId, userId }, select: { id: true, plan: true } });
  if (!site || !canAccessInbox(site)) return false;
  await db.customerInteraction.updateMany({ where: { websiteId, seenAt: null }, data: { seenAt: new Date() } });
  return true;
}
