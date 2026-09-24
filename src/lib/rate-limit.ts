import "server-only";
import { db } from "./db";

/**
 * Simple sliding-window rate limiter backed by the database, so it works
 * correctly across serverless instances (an in-memory counter would not:
 * each invocation on Vercel can be a fresh process). Not a substitute for a
 * dedicated service under real attack traffic, but enough to blunt casual
 * abuse of auth endpoints (credential stuffing, mail-bombing a reset flow).
 *
 * Returns true if the action is allowed (and records this attempt), false
 * if the caller should be told to slow down.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await db.rateLimitHit.count({ where: { key, createdAt: { gte: since } } });
  if (count >= limit) return false;
  await db.rateLimitHit.create({ data: { key } });
  // Opportunistic cleanup so the table doesn't grow forever; no cron needed.
  if (Math.random() < 0.02) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    db.rateLimitHit.deleteMany({ where: { createdAt: { lt: dayAgo } } }).catch(() => {});
  }
  return true;
}

/** Common presets used across the auth endpoints. */
export const RATE_LIMITS = {
  loginPerIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  loginPerEmail: { limit: 8, windowMs: 15 * 60 * 1000 },
  signupPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  resetRequestPerIp: { limit: 10, windowMs: 15 * 60 * 1000 },
  resetRequestPerEmail: { limit: 4, windowMs: 15 * 60 * 1000 },
  resendVerifyPerUser: { limit: 3, windowMs: 15 * 60 * 1000 },
  contactFormPerIp: { limit: 5, windowMs: 10 * 60 * 1000 },
  contactFormPerSite: { limit: 20, windowMs: 60 * 60 * 1000 },
  leadFormPerIp: { limit: 5, windowMs: 10 * 60 * 1000 },
  leadFormPerSite: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;
