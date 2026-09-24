import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { generateToken, hashToken } from "./tokens";

const COOKIE = "webg_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Expired Session rows and used/expired VerificationToken rows can never be
 * used again, but nothing deletes them - left alone the tables grow forever.
 * Mirrors the same opportunistic pattern RateLimitHit already uses (see
 * rate-limit.ts): a small random chance per call, fire-and-forget, no cron
 * job needed. Hooked into createSession() since logins/signups are frequent
 * enough to keep both tables trimmed without a dedicated schedule.
 */
function maybeCleanupExpired() {
  if (Math.random() >= 0.02) return;
  const now = new Date();
  db.session.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => {});
  db.verificationToken
    .deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } })
    .catch(() => {});
}

/**
 * Sessions are stored in the database (opaque random token in the cookie,
 * only its hash kept server-side). Unlike a self-contained JWT, this means
 * logout and "sign out everywhere after a password change" actually revoke
 * access immediately, rather than merely deleting a cookie the old token
 * could still be replayed with until it expired.
 */
export async function createSession(userId: string) {
  const token = generateToken();
  await db.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000) },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  maybeCleanupExpired();
}

/** Deletes the current session server-side (real revocation) and clears the cookie. */
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  jar.delete(COOKIE);
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
}

/** Signs the user out of every device - used after a password reset. */
export async function invalidateAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** Current user or null. Cached per request so multiple checks cost one query. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true, emailVerifiedAt: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
