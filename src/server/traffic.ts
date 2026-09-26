import "server-only";
import { db } from "@/lib/db";

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = utcDay(new Date());
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/**
 * Records one real public visit to a website (see src/app/s/[slug]/page.tsx,
 * the only code path that ever calls this). One row per site per UTC day,
 * incremented in place - never one row per view. A tracking failure must
 * never break a visitor's page load, so this is fire-and-forget: callers
 * should not await it on the response-critical path.
 */
export async function recordPageView(websiteId: string): Promise<void> {
  try {
    const day = utcDay(new Date());
    await db.pageView.upsert({
      where: { websiteId_day: { websiteId, day } },
      create: { websiteId, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (e) {
    console.error("page view tracking failed (non-fatal):", e instanceof Error ? e.message : e);
  }
}

export interface TrafficTotals {
  today: number;
  last7Days: number;
  last30Days: number;
  allTime: number;
}

async function sumSince(since: Date | null): Promise<number> {
  const { _sum } = await db.pageView.aggregate({
    _sum: { count: true },
    where: since ? { day: { gte: since } } : undefined,
  });
  return _sum.count ?? 0;
}

/** Four cheap aggregates - not a per-site loop. */
export async function getTrafficTotals(): Promise<TrafficTotals> {
  const [today, last7Days, last30Days, allTime] = await Promise.all([
    sumSince(daysAgo(0)),
    sumSince(daysAgo(6)),
    sumSince(daysAgo(29)),
    sumSince(null),
  ]);
  return { today, last7Days, last30Days, allTime };
}

export interface TopSite {
  websiteId: string;
  visits: number;
}

/** Site ids with the most total visits, most first. Callers hydrate names/owners separately (two queries total, not one per site). */
export async function getTopSitesByVisits(limit: number): Promise<TopSite[]> {
  const rows = await db.pageView.groupBy({
    by: ["websiteId"],
    _sum: { count: true },
    orderBy: { _sum: { count: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ websiteId: r.websiteId, visits: r._sum.count ?? 0 }));
}

/** All-time visit totals for a specific set of site ids - one grouped query, used to hydrate a sites-list table's visit column. */
export async function getVisitCounts(websiteIds: string[]): Promise<Record<string, number>> {
  if (websiteIds.length === 0) return {};
  const rows = await db.pageView.groupBy({
    by: ["websiteId"],
    where: { websiteId: { in: websiteIds } },
    _sum: { count: true },
  });
  return Object.fromEntries(rows.map((r) => [r.websiteId, r._sum.count ?? 0]));
}

/** All-time visit total for one site (site detail page). */
export async function getSiteVisitCount(websiteId: string): Promise<number> {
  const { _sum } = await db.pageView.aggregate({ _sum: { count: true }, where: { websiteId } });
  return _sum.count ?? 0;
}
