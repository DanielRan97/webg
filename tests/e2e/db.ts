import { PrismaClient } from "@prisma/client";

/**
 * Direct database access for the E2E tests - only for what a test can't do through the UI (marking a
 * test account's email as verified, reading what a form saved) and for cleaning up. Refuses to run
 * against anything but the Neon `dev` branch, so a test can never touch production data.
 */
const DEV_HOST = "ep-long-bread-";

if (!process.env.DATABASE_URL) process.loadEnvFile(".env");
let host = "";
try {
  host = new URL(process.env.DATABASE_URL ?? "").hostname;
} catch {
  // Reported below.
}
if (!host.startsWith(DEV_HOST)) {
  throw new Error(`E2E tests run only against the Neon dev branch (${DEV_HOST}...). DATABASE_URL points elsewhere - stopping.`);
}

export const db = new PrismaClient();

/** Every test account uses this domain, so cleanup can find them. */
export const TEST_EMAIL_DOMAIN = "e2e.webg.test";

/**
 * The browser claims this address (a reserved documentation range, RFC 5737) in x-forwarded-for, so
 * the tests' rate-limit counters are their own - they never block manual testing on this machine,
 * and cleanup can clear them.
 */
export const TEST_IP = "203.0.113.77";

export const uniqueId = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
export const testEmail = (label: string) => `${label}-${uniqueId()}@${TEST_EMAIL_DOMAIN}`;

export async function markEmailVerified(email: string): Promise<void> {
  await db.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
}

/** Deletes the test accounts (their sites, sessions and inquiries go with them, by cascade) and the tests' rate-limit counters. */
export async function cleanUp(): Promise<void> {
  const users = await db.user.findMany({ where: { email: { endsWith: `@${TEST_EMAIL_DOMAIN}` } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  const sites = await db.website.findMany({ where: { userId: { in: ids } }, select: { id: true, slug: true } });
  const keys = [
    `:ip:${TEST_IP}`,
    `@${TEST_EMAIL_DOMAIN}`,
    ...ids.map((id) => `:user:${id}`),
    ...sites.flatMap((s) => [`contact-code:${s.id}:`, `:site:${s.slug}`]),
  ];
  await db.rateLimitHit.deleteMany({ where: { OR: keys.map((k) => ({ key: { contains: k } })) } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}
