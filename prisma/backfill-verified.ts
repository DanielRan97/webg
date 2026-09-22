/**
 * One-time backfill: email verification is a new requirement introduced in
 * this migration. Accounts that already existed are grandfathered in as
 * verified (their owners already had working access), so nobody who could
 * publish yesterday is suddenly blocked today. New signups start unverified.
 * Safe to re-run: only touches rows where emailVerifiedAt is still null.
 */
import { db } from "../src/lib/db";

async function main() {
  const { count } = await db.user.updateMany({
    where: { emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
  console.log(`Backfilled emailVerifiedAt for ${count} existing account(s).`);
  await db.$disconnect();
}
main();
