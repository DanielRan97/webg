import { expect, test } from "@playwright/test";
import { db } from "./db";
import { buildReadySite, payOnFakePage, signUp } from "./helpers";

/**
 * The billing launch for sites from before payments: the admin button gives each a free month and emails
 * the owner; paying during it keeps the free days; a free month that ends with no card takes the site offline.
 * The button acts on every waiting site in the dev database, so others found there are put back afterwards.
 */
const DAY = 24 * 60 * 60 * 1000;
const ADMIN = "admin@e2e.webg.test";

test("free month for existing sites, then a card or offline", async ({ page, browser, request }) => {
  test.setTimeout(300_000);
  const { id, slug } = await buildReadySite(page, "מספרה ותיקה");
  // Published the way sites were before billing: showing, no card, no period.
  await db.website.update({ where: { id }, data: { status: "PUBLISHED", subscriptionStatus: "TRIAL" } });
  await db.subscription.update({ where: { websiteId: id }, data: { status: "TRIAL", currentPeriodEnd: null } });
  const sub = () => db.subscription.findUniqueOrThrow({ where: { websiteId: id } });

  const others = await db.subscription.findMany({
    where: { websiteId: { not: id }, cardToken: null, currentPeriodEnd: null, website: { status: "PUBLISHED" } },
    select: { websiteId: true, status: true, website: { select: { subscriptionStatus: true } } },
  });
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  try {
    await db.user.deleteMany({ where: { email: ADMIN } });
    await signUp(admin, { email: ADMIN });
    await admin.goto("/admin/purchases");
    await expect(admin.getByRole("cell", { name: "מספרה ותיקה" })).toBeVisible();
    await admin.getByRole("button", { name: /התחלת חודש חינם ושליחת מיילים/ }).click();
    await admin.getByRole("button", { name: "כן, להתחיל ולשלוח" }).click();
    await expect(admin.getByText(/נשלחו \d+ מיילים/)).toBeVisible();

    const started = await sub();
    expect(started.status).toBe("TRIAL");
    const freeEnd = started.currentPeriodEnd!;
    expect(freeEnd.getTime()).toBeGreaterThan(Date.now() + 27 * DAY);

    // Pressing again does nothing: the site is no longer waiting.
    await admin.reload();
    await expect(admin.getByRole("cell", { name: "מספרה ותיקה" })).toHaveCount(0);

    // The owner adds a card during the free month: the paid month starts when the free one ends.
    await page.goto(`/sites/${id}/billing`);
    await expect(page.getByText(/תקופת החינם מסתיימת/)).toBeVisible();
    await page.getByRole("button", { name: "הוספת אמצעי תשלום" }).click();
    await payOnFakePage(page, id, "ok");
    const paid = await sub();
    expect(paid.status).toBe("ACTIVE");
    expect(paid.currentPeriodEnd!.getTime()).toBeGreaterThan(freeEnd.getTime() + 27 * DAY);

    // Had there been no card, the end of the free month takes the site offline (nothing deleted).
    await db.subscription.update({ where: { websiteId: id }, data: { status: "TRIAL", cardToken: null, currentPeriodEnd: new Date(Date.now() - 60_000) } });
    await db.website.update({ where: { id }, data: { subscriptionStatus: "TRIAL" } });
    const res = await request.get("/api/cron/billing", { headers: { authorization: "Bearer e2e-cron-secret" } });
    expect(res.status()).toBe(200);
    expect((await sub()).status).toBe("INACTIVE");
    await page.goto(`/s/${slug}`);
    await expect(page.getByRole("heading", { name: "האתר לא זמין כרגע" })).toBeVisible();
  } finally {
    // Other waiting sites in the dev database go back to how they were.
    for (const o of others) {
      await db.subscription.update({ where: { websiteId: o.websiteId }, data: { status: o.status, currentPeriodEnd: null, remindedAt: null } });
      await db.website.update({ where: { id: o.websiteId }, data: { subscriptionStatus: o.website.subscriptionStatus } });
    }
    await adminContext.close();
  }
});
