import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { emptySiteData } from "../src/lib/site-defaults";
import { createWebsite, setSubscriptionStatus, setWebsiteStatus } from "../src/server/websites";
import { SAMPLE_SITES } from "./sample-data";

/**
 * Creates (or resets) the demo account with one published sample site per
 * business category, plus one draft. NOTE: it deletes and recreates
 * demo@webg.co.il, so do not use that account for real work.
 */
async function main() {
  const email = "demo@webg.co.il";
  await db.user.deleteMany({ where: { email } });
  const user = await db.user.create({ data: { email, passwordHash: await bcrypt.hash("demo1234", 10) } });

  for (const site of Object.values(SAMPLE_SITES)) {
    const created = await createWebsite(user.id, site);
    await setWebsiteStatus(user.id, created.id, "PUBLISHED");
    await setSubscriptionStatus(user.id, created.id, "ACTIVE");
    console.log(`  published: /s/${created.slug}`);
  }

  const draft = await createWebsite(user.id, {
    ...emptySiteData("cafe"),
    businessName: "קפה הפינה", slug: "cafe-hapina",
    description: "קפה מיוחד, מאפים טריים ופינת ישיבה שקטה.",
    phone: "03-5551234", address: "רוטשילד 10", city: "תל אביב",
    services: [
      { name: "אספרסו", description: "", price: "10", category: "שתייה חמה" },
      { name: "קרואסון חמאה", description: "אפוי במקום", price: "16", category: "מאפים" },
    ],
  });
  console.log(`Seeded ${email} / demo1234\n  draft:     ${draft.slug}`);
}

main().finally(() => db.$disconnect());
