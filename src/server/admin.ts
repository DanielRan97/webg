import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PLAN, WEBSITE_STATUS } from "@/lib/constants";
import { getTrafficTotals, getTopSitesByVisits, getVisitCounts, getSiteVisitCount } from "./traffic";

/** A single grouped query, not one per website - see plan §8. */
async function planCounts(where: { userId?: string } = {}) {
  const rows = await db.website.groupBy({ by: ["plan"], where, _count: true });
  const basic = rows.find((r) => r.plan === PLAN.BASIC)?._count ?? 0;
  const pro = rows.find((r) => r.plan === PLAN.PRO)?._count ?? 0;
  return { basic, pro };
}

export interface OverviewStats {
  userCount: number;
  siteCount: number;
  publishedCount: number;
  draftCount: number;
  basicCount: number;
  proCount: number;
  totalVisits: number;
  interactionCount: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [userCount, statusRows, plans, traffic, interactionCount] = await Promise.all([
    db.user.count(),
    db.website.groupBy({ by: ["status"], _count: true }),
    planCounts(),
    getTrafficTotals(),
    db.customerInteraction.count(),
  ]);
  const publishedCount = statusRows.find((r) => r.status === WEBSITE_STATUS.PUBLISHED)?._count ?? 0;
  const draftCount = statusRows.find((r) => r.status === WEBSITE_STATUS.DRAFT)?._count ?? 0;
  return {
    userCount,
    siteCount: publishedCount + draftCount,
    publishedCount,
    draftCount,
    basicCount: plans.basic,
    proCount: plans.pro,
    totalVisits: traffic.allTime,
    interactionCount,
  };
}

export interface TopSiteRow {
  id: string;
  businessName: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  visits: number;
}

/** Top sites by all-time visits, hydrated with names/owners - two queries total (see traffic.ts). */
export async function getTopSitesOverview(limit: number): Promise<TopSiteRow[]> {
  const top = await getTopSitesByVisits(limit);
  if (top.length === 0) return [];
  const sites = await db.website.findMany({
    where: { id: { in: top.map((t) => t.websiteId) } },
    select: { id: true, businessName: true, slug: true, plan: true, user: { select: { email: true } } },
  });
  const byId = new Map(sites.map((s) => [s.id, s]));
  return top
    .map((t) => {
      const s = byId.get(t.websiteId);
      if (!s) return null;
      return { id: s.id, businessName: s.businessName, slug: s.slug, ownerEmail: s.user.email, plan: s.plan, visits: t.visits };
    })
    .filter((r): r is TopSiteRow => r !== null);
}

export interface AdminUserRow {
  id: string;
  email: string;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  siteCount: number;
  basicCount: number;
  proCount: number;
}

/** One batched query for all users + their sites' plans (Prisma resolves the nested select as a single extra query, not N+1). */
export async function getUsersOverview(): Promise<AdminUserRow[]> {
  const rows = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      createdAt: true,
      emailVerifiedAt: true,
      websites: { select: { plan: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
    emailVerifiedAt: u.emailVerifiedAt,
    siteCount: u.websites.length,
    basicCount: u.websites.filter((w) => w.plan === PLAN.BASIC).length,
    proCount: u.websites.filter((w) => w.plan === PLAN.PRO).length,
  }));
}

export type SiteFilter = "ALL" | "BASIC" | "PRO" | "PUBLISHED" | "DRAFT";

export interface AdminSiteRow {
  id: string;
  businessName: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  status: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  visits: number;
  interactionCount: number;
}

/** Filtered/searched sites list. Two grouped/joined queries total (site rows + visit counts), never one query per row. */
export async function getSitesOverview(filter: SiteFilter, search: string): Promise<AdminSiteRow[]> {
  const where: Prisma.WebsiteWhereInput = {};
  if (filter === "BASIC" || filter === "PRO") where.plan = filter;
  if (filter === "PUBLISHED" || filter === "DRAFT") where.status = filter;
  const q = search.trim();
  if (q) {
    where.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const rows = await db.website.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 500,
    select: {
      id: true,
      businessName: true,
      slug: true,
      plan: true,
      status: true,
      subscriptionStatus: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { email: true } },
      _count: { select: { interactions: true } },
    },
  });
  const visits = await getVisitCounts(rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    slug: r.slug,
    ownerEmail: r.user.email,
    plan: r.plan,
    status: r.status,
    subscriptionStatus: r.subscriptionStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    visits: visits[r.id] ?? 0,
    interactionCount: r._count.interactions,
  }));
}

export interface AdminSiteDetail {
  id: string;
  businessName: string;
  slug: string;
  ownerEmail: string;
  plan: string;
  status: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  visits: number;
  interactionCount: number;
  subscription: { status: string; currentPeriodEnd: Date | null; provider: string | null } | null;
}

/** Returns null if the site doesn't exist - same not-found convention used everywhere else. */
export async function getSiteAdminDetail(id: string): Promise<AdminSiteDetail | null> {
  const site = await db.website.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      slug: true,
      plan: true,
      status: true,
      subscriptionStatus: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { email: true } },
      subscription: { select: { status: true, currentPeriodEnd: true, provider: true } },
      _count: { select: { interactions: true } },
    },
  });
  if (!site) return null;
  const visits = await getSiteVisitCount(id);
  return {
    id: site.id,
    businessName: site.businessName,
    slug: site.slug,
    ownerEmail: site.user.email,
    plan: site.plan,
    status: site.status,
    subscriptionStatus: site.subscriptionStatus,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
    visits,
    interactionCount: site._count.interactions,
    subscription: site.subscription,
  };
}

export interface InteractionsOverview {
  total: number;
  today: number;
  leads: number;
  messages: number;
}

export async function getInteractionsOverview(): Promise<InteractionsOverview> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [total, today, leads, messages] = await Promise.all([
    db.customerInteraction.count(),
    db.customerInteraction.count({ where: { createdAt: { gte: startOfToday } } }),
    db.customerInteraction.count({ where: { type: "LEAD" } }),
    db.customerInteraction.count({ where: { type: "CONTACT_MESSAGE" } }),
  ]);
  return { total, today, leads, messages };
}

export interface ActivityItem {
  kind: "SIGNUP" | "SITE_CREATED" | "INTERACTION";
  at: Date;
  label: string;
}

/**
 * Recent activity, derived purely from existing createdAt columns - no new
 * event-log model. "אתר פורסם" is deliberately not included: Website has no
 * publishedAt, and updatedAt fires on any edit, not specifically on publish -
 * adding that would need a real (if small) schema change, out of scope here.
 */
export async function getRecentActivity(limit: number): Promise<ActivityItem[]> {
  const [users, sites, interactions] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: limit, select: { email: true, createdAt: true } }),
    db.website.findMany({ orderBy: { createdAt: "desc" }, take: limit, select: { businessName: true, createdAt: true } }),
    db.customerInteraction.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { type: true, createdAt: true, website: { select: { businessName: true } } },
    }),
  ]);
  const items: ActivityItem[] = [
    ...users.map((u) => ({ kind: "SIGNUP" as const, at: u.createdAt, label: `משתמש חדש נרשם: ${u.email}` })),
    ...sites.map((s) => ({ kind: "SITE_CREATED" as const, at: s.createdAt, label: `אתר חדש נוצר: ${s.businessName}` })),
    ...interactions.map((i) => ({
      kind: "INTERACTION" as const,
      at: i.createdAt,
      label: i.type === "LEAD" ? `ליד חדש התקבל באתר ${i.website.businessName}` : `הודעה חדשה התקבלה באתר ${i.website.businessName}`,
    })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export interface PurchasesOverview {
  connected: false;
}

/**
 * Honest placeholder: Subscription.provider/providerRef are reserved for
 * Phase 3 payments and are always null today - there is no real purchase or
 * revenue data anywhere in the database. This never derives a "purchase"
 * count from how many sites currently have plan=PRO (a manual admin
 * override is not a sale). Once a real payment provider is connected, this
 * is the only function that needs to start returning real numbers.
 */
export async function getPurchasesOverview(): Promise<PurchasesOverview> {
  return { connected: false };
}
