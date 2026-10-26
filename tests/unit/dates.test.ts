import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "@/lib/dates";

describe("dates", () => {
  it("always shows Israel time, whatever the machine's zone", () => {
    // 22:30 UTC on 31 Dec is already 00:30 on 1 Jan in Israel (UTC+2 in winter).
    const d = new Date("2025-12-31T22:30:00Z");
    expect(formatDate(d)).toBe("1.1.2026");
    expect(formatDateTime(d)).toContain("0:30");
    expect(formatDateTime(d.toISOString())).toBe(formatDateTime(d));
  });
  it("follows daylight saving time", () => {
    expect(formatDateTime("2026-07-01T09:00:00Z")).toContain("12:00");
  });
});
