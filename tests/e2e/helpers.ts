import { expect, type Page } from "@playwright/test";
import { markEmailVerified, testEmail } from "./db";

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

/** Sets the site's address - the wizard won't move past that step until the address is confirmed free. */
export async function setSlug(page: Page, slug: string) {
  await goToStep(page, "כתובת האתר");
  await page.getByLabel("הכתובת שלכם").fill(slug);
  await expect(page.getByText("הכתובת זמינה")).toBeVisible();
}
