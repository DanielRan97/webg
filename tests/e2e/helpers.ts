import { expect, type Page } from "@playwright/test";
import { markEmailVerified, testEmail, uniqueId } from "./db";

export const PASSWORD = "Test-password-123";

/** Signs up a fresh test account through the form and lands on the dashboard. */
export async function signUp(page: Page, opts: { verified?: boolean } = {}): Promise<string> {
  const email = testEmail("owner");
  await page.goto("/signup");
  await page.getByLabel("אימייל").fill(email);
  await page.getByLabel("סיסמה", { exact: true }).fill(PASSWORD);
  await page.locator("button[type=submit]").click();
  await page.waitForURL("**/dashboard");
  // The confirmation link only goes to the server console here; mark the account as confirmed instead.
  if (opts.verified !== false) await markEmailVerified(email);
  return email;
}

/** Opens a new draft in the wizard. */
export async function startSite(page: Page) {
  await page.goto("/create");
  await page.waitForURL("**/sites/*/edit", { timeout: 60_000 });
  const steps = page.getByRole("navigation", { name: "שלבי הטופס" });
  await expect(steps).toBeVisible({ timeout: 60_000 });
  return { steps, id: page.url().split("/sites/")[1].split("/")[0] };
}

/** The wizard's step chips: on phones the list may need scrolling, so scroll the chip in first. */
export async function goToStep(page: Page, label: string) {
  const chip = page.getByRole("navigation", { name: "שלבי הטופס" }).getByRole("button", { name: label, exact: true });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await expect(page.getByText(new RegExp(`^שלב \\d+ מתוך \\d+: ${label}$`))).toBeVisible();
}

/**
 * A fresh account with a finished, unpublished site ready to publish: a name, the account's own (already
 * confirmed) email, a landline, a unique address and a message form. Lands on the "האתר שלך מוכן" page.
 */
export async function buildReadySite(page: Page, name: string): Promise<{ email: string; id: string; slug: string }> {
  const email = await signUp(page);
  const { id } = await startSite(page);
  const slug = `e2e-${uniqueId()}`;
  await page.getByLabel("איך קוראים לעסק?").fill(name);
  await page.getByRole("button", { name: "ספר", exact: true }).click();
  await page.getByLabel("טלפון", { exact: true }).fill("03-1234567");
  await page.getByLabel("אימייל (לא חובה)").fill(email);
  await page.getByRole("button", { name: "שליחת קוד אימות" }).click();
  await expect(page.getByText("האימייל מאומת")).toBeVisible();
  await setSlug(page, slug);
  await goToStep(page, "יצירת קשר");
  await page.getByRole("button", { name: "שלחו הודעה" }).click();
  await page.getByRole("button", { name: "צור את האתר" }).click();
  await page.waitForURL(`**/sites/${id}/created`);
  return { email, id, slug };
}

/** On the fake payment page (dev/test gateway): approve, and land back on the site's billing page. */
export async function payOnFakePage(page: Page, id: string, card: "ok" | "declinelater" = "ok") {
  await page.waitForURL("**/dev/fake-hyp?**");
  await page.getByRole("link", { name: card === "ok" ? "אישור תשלום" : "אישור, אבל החיובים הבאים בכרטיס ייכשלו" }).click();
  await page.waitForURL(`**/sites/${id}/billing?payment=ok`);
  await expect(page.getByText("התשלום התקבל")).toBeVisible();
}

/** Sets the site's address - the wizard won't move past that step until the address is confirmed free. */
export async function setSlug(page: Page, slug: string) {
  await goToStep(page, "כתובת האתר");
  await page.getByLabel("הכתובת שלכם").fill(slug);
  await expect(page.getByText("הכתובת זמינה")).toBeVisible();
}
