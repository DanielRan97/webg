import { describe, expect, it } from "vitest";
import { addDays, addMonths, cardReminderDue, graceOver, priceAgorot, retryDue, upgradeDifferenceAgorot } from "@/lib/billing-rules";

const d = (iso: string) => new Date(iso);

describe("billing rules", () => {
  it("prices come from the plans", () => {
    expect(priceAgorot("BASIC")).toBe(5000);
    expect(priceAgorot("PRO")).toBe(7900);
    expect(priceAgorot("unknown")).toBe(5000);
  });

  it("adds calendar months, keeping the day where it exists", () => {
    expect(addMonths(d("2026-03-15T10:00:00Z")).toISOString()).toBe("2026-04-15T10:00:00.000Z");
    expect(addMonths(d("2026-01-31T10:00:00Z")).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addMonths(d("2028-01-31T10:00:00Z")).toISOString()).toBe("2028-02-29T10:00:00.000Z");
    expect(addMonths(d("2026-12-20T10:00:00Z")).toISOString()).toBe("2027-01-20T10:00:00.000Z");
    expect(addMonths(d("2026-05-10T10:00:00Z"), -1).toISOString()).toBe("2026-04-10T10:00:00.000Z");
  });

  it("charges the upgrade difference only for the days left", () => {
    const start = d("2026-04-01T00:00:00Z");
    const end = d("2026-05-01T00:00:00Z");
    // Half the month left: half of ₪29, rounded to whole shekels.
    expect(upgradeDifferenceAgorot("BASIC", "PRO", d("2026-04-16T00:00:00Z"), end, start)).toBe(1500);
    expect(upgradeDifferenceAgorot("BASIC", "PRO", start, end, start)).toBe(2900);
    expect(upgradeDifferenceAgorot("BASIC", "PRO", end, end, start)).toBe(0);
    expect(upgradeDifferenceAgorot("PRO", "BASIC", start, end, start)).toBe(0);
  });

  it("retries on days 3 and 7, then the grace is over", () => {
    const since = d("2026-04-01T06:00:00Z");
    expect(retryDue(1, since, addDays(since, 2))).toBe(false);
    expect(retryDue(1, since, addDays(since, 3))).toBe(true);
    expect(retryDue(2, since, addDays(since, 6))).toBe(false);
    expect(retryDue(2, since, addDays(since, 7))).toBe(true);
    expect(retryDue(3, since, addDays(since, 30))).toBe(false);
    expect([1, 2, 3].map(graceOver)).toEqual([false, false, true]);
  });

  it("reminds about a missing card 7 days and 1 day before, once each", () => {
    const end = d("2026-06-30T06:00:00Z");
    expect(cardReminderDue(end, addDays(end, -10), null)).toBeNull();
    expect(cardReminderDue(end, addDays(end, -6), null)).toBe(7);
    expect(cardReminderDue(end, addDays(end, -5), addDays(end, -6))).toBeNull();
    expect(cardReminderDue(end, addDays(end, -0.5), addDays(end, -6))).toBe(1);
    expect(cardReminderDue(end, addDays(end, -0.4), addDays(end, -0.5))).toBeNull();
    expect(cardReminderDue(end, addDays(end, 1), null)).toBeNull();
  });
});
