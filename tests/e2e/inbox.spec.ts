import { expect, test } from "@playwright/test";
import { db } from "./db";
import { buildReadySite } from "./helpers";

/**
 * Pro's inquiries center: the delivery settings sit folded above the inquiries, and the owner moves each
 * inquiry between ממתינה למענה / בטיפול / טופלה straight from the list - saved, and filterable.
 */
test("inquiries center: folded settings, and a follow-up status per inquiry", async ({ page }) => {
  const { id } = await buildReadySite(page, "מספרת פניות");
  await db.website.update({ where: { id }, data: { plan: "PRO" } });
  const lead = await db.customerInteraction.create({ data: { websiteId: id, type: "LEAD", name: "מיכל לוי", phone: "050-0000001" } });
  await db.customerInteraction.create({ data: { websiteId: id, type: "CONTACT_MESSAGE", name: "נועה כץ", phone: "050-0000002", message: "אתם עובדים גם בשישי?" } });

  await page.goto(`/sites/${id}/admin`);
  const settings = page.getByText("הגדרות קבלת פניות");
  await expect(settings).toBeVisible();
  await expect(page.getByText("פניות חדשות מגיעות אליכם במייל ובמרכז הפניות")).toBeVisible();
  await expect(page.getByRole("heading", { name: "איך תרצו לקבל פניות?" })).toBeHidden();
  await settings.click();
  await expect(page.getByRole("heading", { name: "איך תרצו לקבל פניות?" })).toBeVisible();
  await settings.click();

  const status = page.getByLabel("סטטוס הפנייה של מיכל לוי");
  await expect(status).toHaveValue("OPEN");
  await status.selectOption("IN_PROGRESS");
  await expect.poll(async () => (await db.customerInteraction.findUniqueOrThrow({ where: { id: lead.id } })).status).toBe("IN_PROGRESS");

  await page.getByRole("button", { name: /^בטיפול/ }).click();
  await expect(page.getByText("מיכל לוי")).toBeVisible();
  await expect(page.getByText("נועה כץ")).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("סטטוס הפנייה של מיכל לוי")).toHaveValue("IN_PROGRESS");
  const noSideScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noSideScroll).toBe(true);
  await page.screenshot({ path: test.info().outputPath("inbox.png"), fullPage: true });
});
