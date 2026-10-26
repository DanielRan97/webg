import { expect, test } from "@playwright/test";
import { TEST_IP, db, uniqueId } from "./db";
import { PASSWORD, goToStep, setSlug, signUp, startSite } from "./helpers";

test("pages behind login send a visitor to log in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("an owner can log out and log back in", async ({ page }) => {
  const email = await signUp(page);
  await page.getByRole("button", { name: "תפריט חשבון" }).click();
  await page.getByRole("menuitem", { name: "התנתקות" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("אימייל").fill(email);
  await page.getByLabel("סיסמה", { exact: true }).fill("wrong-password-1");
  await page.locator("button[type=submit]").click();
  await expect(page.getByText("האימייל או הסיסמה לא נכונים")).toBeVisible();

  await page.getByLabel("סיסמה", { exact: true }).fill(PASSWORD);
  await page.locator("button[type=submit]").click();
  await page.waitForURL("**/dashboard");
});

test("a site can't be published until its email is verified, and stays private to its owner", async ({ page, browser }) => {
  await signUp(page);
  const { id } = await startSite(page);
  await page.getByLabel("איך קוראים לעסק?").fill("עסק לא מאומת");
  // Not the account's address, so it would need a code - which this test never enters.
  await page.getByLabel("אימייל (לא חובה)").fill(`other-${uniqueId()}@example.com`);
  await expect(page.getByText("האימייל עדיין לא מאומת")).toBeVisible();
  await setSlug(page, `e2e-${uniqueId()}`);
  await goToStep(page, "יצירת קשר");
  await page.getByRole("button", { name: "צור את האתר" }).click();
  await page.waitForURL(`**/sites/${id}/created`);

  await page.getByRole("button", { name: "פרסום האתר" }).click();
  const dialog = page.getByRole("dialog", { name: "באיזו חבילה לפרסם את האתר?" });
  await dialog.getByRole("button", { name: "פרסום ב-Basic" }).click();
  await expect(dialog.getByText("כדי לפרסם, אמתו קודם את האימייל")).toBeVisible();
  expect((await db.website.findUniqueOrThrow({ where: { id } })).status).toBe("DRAFT");

  // Another account can't open it: it looks exactly like a page that doesn't exist. (The HTTP status
  // is 200 - the (app) loading screen starts streaming before the page decides - so check what shows.)
  const other = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": TEST_IP } });
  const otherPage = await other.newPage();
  await signUp(otherPage);
  for (const path of [`/sites/${id}/edit`, `/sites/${id}/created`, `/sites/${id}/preview`]) {
    await otherPage.goto(path);
    await expect(otherPage.getByText("404")).toBeVisible();
    await expect(otherPage.getByText("עסק לא מאומת")).toHaveCount(0);
  }
  await other.close();
});
