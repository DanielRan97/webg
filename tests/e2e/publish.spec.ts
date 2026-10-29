import { expect, test } from "@playwright/test";
import { db } from "./db";
import { buildReadySite, payOnFakePage } from "./helpers";

/**
 * The core path: an owner signs up, builds a site in the wizard, verifies its email, pays for Basic on the
 * payment page (the fake gateway in tests) and the site goes live - and a visitor sees it and sends a
 * message that reaches the owner.
 */
test("owner builds, pays for and publishes a site, and a visitor sends a message", async ({ page, browser }) => {
  const { id, slug } = await buildReadySite(page, "מספרת בדיקה");
  await expect(page.getByText(`webg.co.il/s/${slug}`).first()).toBeVisible();

  // Not public until published.
  const visitor = await browser.newPage();
  await visitor.goto(`/s/${slug}`);
  await expect(visitor.getByRole("heading", { name: "מספרת בדיקה" })).toHaveCount(0);

  await page.getByRole("button", { name: "פרסום האתר" }).click();
  const dialog = page.getByRole("dialog", { name: "באיזו חבילה לפרסם את האתר?" });
  await expect(dialog.getByRole("radio", { name: /^Basic/ })).toBeChecked();
  await expect(dialog.getByText("תעברו לדף התשלום המאובטח")).toBeVisible();
  await dialog.getByRole("button", { name: "פרסום ב-Basic" }).click();
  await payOnFakePage(page, id);

  const site = await db.website.findUniqueOrThrow({ where: { id }, include: { subscription: true, payments: true } });
  expect(site.status).toBe("PUBLISHED");
  expect(site.subscription).toMatchObject({ status: "ACTIVE", provider: "FAKE", cardLast4: "4242" });
  expect(site.payments).toMatchObject([{ status: "PAID", amountAgorot: 4900, purpose: "PUBLISH" }]);
  await expect(page.getByText("מנוי פעיל")).toBeVisible();

  // The public page, as a visitor.
  await visitor.goto(`/s/${slug}`);
  await expect(visitor.getByRole("heading", { name: "מספרת בדיקה", level: 1 })).toBeVisible();
  const noSideScroll = await visitor.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noSideScroll).toBe(true);

  // The barber page also has a "השאירו פרטים" form; this is the message form.
  const form = visitor.locator("form").filter({ has: visitor.getByLabel("איך אפשר לעזור?") });
  await form.getByLabel("שם מלא").fill("לקוח בדיקה");
  await form.getByLabel("טלפון").fill("050-1234567");
  await form.getByLabel("איך אפשר לעזור?").fill("רציתי לקבוע תספורת ליום שלישי");
  await expect(form.getByText("הפרטים נשלחים בחיבור מאובטח ישירות אל מספרת בדיקה")).toBeVisible();
  // A form sent faster than a person could fill it is treated as a bot (lib/form-guard) - wait like one.
  await visitor.waitForTimeout(1600);
  await form.screenshot({ path: test.info().outputPath("contact-form.png") });
  expect(await visitor.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await form.getByRole("button", { name: "שליחה" }).click();
  await expect(visitor.getByText("ההודעה נשלחה בהצלחה")).toBeVisible();
  await expect(visitor.getByText("מספרת בדיקה קיבלו את ההודעה ויחזרו אליכם.")).toBeVisible();

  const saved = await db.customerInteraction.findMany({ where: { websiteId: id } });
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ name: "לקוח בדיקה", phone: "050-1234567", message: "רציתי לקבוע תספורת ליום שלישי" });
  await visitor.close();
});
