import { expect, test } from "@playwright/test";
import { db, uniqueId } from "./db";
import { goToStep, setSlug, signUp, startSite } from "./helpers";

/**
 * The core path: an owner signs up, builds a site in the wizard, verifies its email, publishes on
 * Basic - and a visitor sees the site and sends a message that reaches the owner.
 */
test("owner builds and publishes a site, and a visitor sends a message", async ({ page, browser }) => {
  const email = await signUp(page);
  const { id } = await startSite(page);
  const slug = `e2e-${uniqueId()}`;

  await page.getByLabel("איך קוראים לעסק?").fill("מספרת בדיקה");
  await page.getByRole("button", { name: "ספר", exact: true }).click();
  // A landline needs no SMS code.
  await page.getByLabel("טלפון", { exact: true }).fill("03-1234567");
  await expect(page.getByText("מספר קווי לא מקבל SMS")).toBeVisible();
  // The same address as the (confirmed) account is verified at once, with no code.
  await page.getByLabel("אימייל (לא חובה)").fill(email);
  await page.getByRole("button", { name: "שליחת קוד אימות" }).click();
  await expect(page.getByText("האימייל מאומת")).toBeVisible();

  await setSlug(page, slug);
  await goToStep(page, "יצירת קשר");
  await page.getByRole("button", { name: "שלחו הודעה" }).click();
  await page.getByRole("button", { name: "צור את האתר" }).click();
  await page.waitForURL(`**/sites/${id}/created`);
  await expect(page.getByText(`webg.co.il/s/${slug}`).first()).toBeVisible();

  // Not public until published.
  const visitor = await browser.newPage();
  await visitor.goto(`/s/${slug}`);
  await expect(visitor.getByRole("heading", { name: "מספרת בדיקה" })).toHaveCount(0);

  await page.getByRole("button", { name: "פרסום האתר" }).click();
  const dialog = page.getByRole("dialog", { name: "באיזו חבילה לפרסם את האתר?" });
  await expect(dialog.getByRole("radio", { name: /^Basic/ })).toBeChecked();
  await dialog.getByRole("button", { name: "פרסום ב-Basic" }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await db.website.findUniqueOrThrow({ where: { id } })).status).toBe("PUBLISHED");

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
  await form.getByRole("button", { name: "שליחה" }).click();
  await expect(visitor.getByText("ההודעה נשלחה בהצלחה")).toBeVisible();

  const saved = await db.customerInteraction.findMany({ where: { websiteId: id } });
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ name: "לקוח בדיקה", phone: "050-1234567", message: "רציתי לקבוע תספורת ליום שלישי" });
  await visitor.close();
});
