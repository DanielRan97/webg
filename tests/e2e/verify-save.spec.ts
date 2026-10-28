import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { db, uniqueId } from "./db";
import { buildReadySite } from "./helpers";

/** Editing a finished site: once a new email is verified, the edit is saved on its own - no extra click. */
test("a verified contact detail saves the edit by itself", async ({ page }) => {
  const { id } = await buildReadySite(page, "מספרת אימות");
  const email = `new-${uniqueId()}@example.com`;
  await page.goto(`/sites/${id}/edit`);
  await page.getByLabel("אימייל (לא חובה)").fill(email);
  await page.getByRole("button", { name: "שליחת קוד אימות" }).click();
  await expect(page.getByLabel("הקוד שקיבלתם")).toBeVisible();
  // The code only goes out by email; put a known one in its place (same hash as src/lib/tokens.ts).
  await db.contactVerification.updateMany({
    where: { websiteId: id, kind: "EMAIL", value: email },
    data: { codeHash: createHash("sha256").update("123456").digest("hex") },
  });
  await page.getByLabel("הקוד שקיבלתם").fill("123456");
  await page.getByRole("button", { name: "אימות", exact: true }).click();
  await expect(page.getByText("האימייל מאומת")).toBeVisible();
  await expect.poll(async () => (await db.businessProfile.findUniqueOrThrow({ where: { websiteId: id } })).email).toBe(email);
  await expect(page.getByText(/^השינויים נשמרו/)).toBeVisible();
});
