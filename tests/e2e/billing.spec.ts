import { expect, test, type APIRequestContext } from "@playwright/test";
import { db } from "./db";
import { buildReadySite, payOnFakePage } from "./helpers";

/**
 * Monthly billing end to end, with the fake gateway: a card that is declined at renewal, the 7-day grace
 * (site still live, retries on days 3 and 7), the site going offline, paying again with a new card, an
 * upgrade charged to the card on file, and a cancellation. Time is moved by editing the subscription's
 * dates; the daily job is called the way Vercel Cron calls it.
 */
const DAY = 24 * 60 * 60 * 1000;

async function runDailyJob(request: APIRequestContext) {
  const res = await request.get("/api/cron/billing", { headers: { authorization: "Bearer e2e-cron-secret" } });
  expect(res.status()).toBe(200);
  return res.json();
}

test("renewal, grace, suspension, paying again, upgrade and cancellation", async ({ page, request, browser }) => {
  test.setTimeout(300_000);
  const { id, slug } = await buildReadySite(page, "מספרת חיובים");
  const sub = () => db.subscription.findUniqueOrThrow({ where: { websiteId: id } });
  const visitor = await browser.newPage();
  const isLive = async () => {
    await visitor.goto(`/s/${slug}`);
    return (await visitor.getByRole("heading", { name: "האתר לא זמין כרגע" }).count()) === 0;
  };

  // The daily job refuses anyone without the secret.
  expect((await request.get("/api/cron/billing")).status()).toBe(401);

  // Publish on Basic with a card whose later charges will be declined.
  await page.getByRole("button", { name: "פרסום האתר" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "פרסום ב-Basic" }).click();
  await payOnFakePage(page, id, "declinelater");
  expect((await sub()).status).toBe("ACTIVE");

  // The month ends: the renewal is declined - payment problem, but the site stays live.
  await db.subscription.update({ where: { websiteId: id }, data: { currentPeriodEnd: new Date(Date.now() - 60_000) } });
  await runDailyJob(request);
  expect(await sub()).toMatchObject({ status: "PAST_DUE", failedAttempts: 1 });
  expect(await isLive()).toBe(true);
  await page.goto(`/sites/${id}/billing`);
  await expect(page.getByText("בעיה בתשלום")).toBeVisible();

  // Not retried before day 3; retried (and declined again) on day 3.
  await runDailyJob(request);
  expect((await sub()).failedAttempts).toBe(1);
  await db.subscription.update({ where: { websiteId: id }, data: { pastDueSince: new Date(Date.now() - 3 * DAY) } });
  await runDailyJob(request);
  expect(await sub()).toMatchObject({ status: "PAST_DUE", failedAttempts: 2 });

  // Day 7: the last retry fails - the site goes offline, nothing is deleted.
  await db.subscription.update({ where: { websiteId: id }, data: { pastDueSince: new Date(Date.now() - 7 * DAY) } });
  await runDailyJob(request);
  expect((await sub()).status).toBe("INACTIVE");
  expect(await isLive()).toBe(false);

  // Paying with a new card brings it straight back, for a new month.
  await page.goto(`/sites/${id}/billing`);
  await page.getByRole("button", { name: "תשלום והחזרת האתר" }).click();
  await payOnFakePage(page, id, "ok");
  const back = await sub();
  expect(back).toMatchObject({ status: "ACTIVE", failedAttempts: 0, pastDueSince: null, cardLast4: "4242" });
  expect(back.currentPeriodEnd!.getTime()).toBeGreaterThan(Date.now() + 27 * DAY);
  expect(await isLive()).toBe(true);

  // Upgrade to Pro: the difference is charged to the saved card - no payment page.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /שדרוג ל-Pro/ }).first().click();
  await page.getByRole("dialog", { name: "שדרוג האתר ל-Pro" }).getByRole("button", { name: "שדרוג ל-Pro" }).click();
  await expect.poll(async () => (await db.website.findUniqueOrThrow({ where: { id } })).plan).toBe("PRO");
  const upgrade = await db.payment.findFirstOrThrow({ where: { websiteId: id, purpose: "UPGRADE" } });
  expect(upgrade).toMatchObject({ status: "PAID", kind: "RENEWAL" });
  expect(upgrade.amountAgorot).toBeGreaterThan(2500);

  // Cancel: stays live until the paid period ends, then stops; no charge is made.
  await page.goto(`/sites/${id}/billing`);
  await page.getByRole("button", { name: "ביטול המנוי" }).click();
  await page.getByRole("button", { name: "כן, לבטל את המנוי" }).click();
  await expect(page.getByText("המנוי בוטל")).toBeVisible();
  expect(await isLive()).toBe(true);
  const paidBefore = await db.payment.count({ where: { websiteId: id, status: "PAID" } });
  await db.subscription.update({ where: { websiteId: id }, data: { currentPeriodEnd: new Date(Date.now() - 60_000) } });
  await runDailyJob(request);
  expect((await sub()).status).toBe("INACTIVE");
  expect(await db.payment.count({ where: { websiteId: id, status: "PAID" } })).toBe(paidBefore);
  expect(await isLive()).toBe(false);
  await visitor.close();
});
