/**
 * One-time backfill: the BASIC/PRO plan tier is a new concept introduced in
 * this migration. Every site that already existed had full access to
 * everything the app could do (there was no gating at all), so grandfathering
 * them all onto PRO means nobody loses a feature they already had - only new
 * sites created after this point start on BASIC (the column's own default).
 * Safe to re-run: only touches rows still at the default "BASIC".
 */
import { db } from "../src/lib/db";

async function main() {
  const { count } = await db.website.updateMany({
    where: { plan: "BASIC" },
    data: { plan: "PRO" },
  });
  console.log(`Backfilled plan=PRO for ${count} existing site(s).`);
  await db.$disconnect();
}
main();
