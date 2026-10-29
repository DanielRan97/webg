import { describe, expect, it } from "vitest";
import {
  bookingLinkProblem,
  dateOrderProblem,
  dateProblem,
  displayPhone,
  emailProblem,
  isIsraeliMobile,
  normalizeContact,
  phoneProblem,
  priceProblem,
  splitAddress,
} from "@/lib/field-format";

describe("phoneProblem", () => {
  it.each(["", "050-1234567", "+972 50 123 4567", "(03) 1234567", "0501234567"])("accepts %j", (v) => {
    expect(phoneProblem(v)).toBeUndefined();
  });
  it.each(["abc", "050-123456x", "1234", "05012345678901234"])("rejects %j", (v) => {
    expect(phoneProblem(v)).toBeDefined();
  });
});

describe("emailProblem", () => {
  it.each(["", "name@gmail.com", " Name@Example.co.il "])("accepts %j", (v) => {
    expect(emailProblem(v)).toBeUndefined();
  });
  it.each(["name", "name@", "name@gmail", "name@gmail.c", "a b@c.com"])("rejects %j", (v) => {
    expect(emailProblem(v)).toBeDefined();
  });
});

describe("priceProblem", () => {
  it.each(["", "70 ₪", "החל מ-250 ₪", "120-150", "₪45.90", "חינם", "לפי הצעת מחיר", "ללא עלות"])("accepts %j", (v) => {
    expect(priceProblem(v)).toBeUndefined();
  });
  it.each(["זול", "נדבר"])("rejects %j", (v) => {
    expect(priceProblem(v)).toBeDefined();
  });
});

describe("dateProblem", () => {
  const next = new Date().getFullYear() + 1;
  it.each(["", "2021", "03/2021", "מרץ 2021", "היום", "עד היום", "present", String(next)])("accepts %j", (v) => {
    expect(dateProblem(v)).toBeUndefined();
  });
  it("rejects text with no year", () => expect(dateProblem("מזמן")).toBeDefined());
  it("rejects years out of range", () => {
    expect(dateProblem("1949")).toBeDefined();
    expect(dateProblem(String(next + 1))).toBeDefined();
  });
  it("rejects a bad month", () => expect(dateProblem("13/2021")).toBeDefined());
  it("rejects a range unless allowed", () => {
    expect(dateProblem("2018 - 2021")).toBeDefined();
    expect(dateProblem("2018 - 2021", { allowRange: true })).toBeUndefined();
  });
  it("rejects a backwards range", () => expect(dateProblem("2021 - 2018", { allowRange: true })).toBeDefined());
  it("rejects more than two years", () => expect(dateProblem("2018 2019 2020", { allowRange: true })).toBeDefined());
});

describe("dateOrderProblem", () => {
  it("accepts start before end, or a missing side", () => {
    expect(dateOrderProblem("2018", "2021")).toBeUndefined();
    expect(dateOrderProblem("03/2018", "עד היום")).toBeUndefined();
    expect(dateOrderProblem("", "2021")).toBeUndefined();
  });
  it("rejects end before start", () => expect(dateOrderProblem("2021", "2018")).toBeDefined());
});

describe("bookingLinkProblem", () => {
  it.each([
    "",
    "calendly.com/my-salon",
    "https://www.calendly.com/x",
    "https://salon.simplybook.me",
    "https://calendar.google.com/calendar/appointments/schedules/abc",
    "https://calendar.google.com/calendar/u/0/appointments/abc",
    "calmark.co.il/salon",
  ])("accepts %j", (v) => {
    expect(bookingLinkProblem(v)).toBeUndefined();
  });
  it.each([
    "https://example.com",
    "https://calendar.google.com/calendar/r",
    "https://evilcalendly.com/x",
    "https://calendly.com.evil.io/x",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %j", (v) => {
    expect(bookingLinkProblem(v)).toBeDefined();
  });
});

describe("splitAddress", () => {
  it("splits the number off the street", () => {
    expect(splitAddress("הרצל 10")).toEqual({ street: "הרצל", number: "10" });
    expect(splitAddress("שדרות רוטשילד 12א")).toEqual({ street: "שדרות רוטשילד", number: "12א" });
    expect(splitAddress("הגפן 4/2")).toEqual({ street: "הגפן", number: "4/2" });
  });
  it("keeps a street without a number whole", () => {
    expect(splitAddress(" הרצל ")).toEqual({ street: "הרצל", number: "" });
    expect(splitAddress("רחוב 1 במאי")).toEqual({ street: "רחוב 1 במאי", number: "" });
  });
});

describe("normalizeContact / isIsraeliMobile", () => {
  it("lowercases and trims email", () => expect(normalizeContact("EMAIL", " Me@Gmail.COM ")).toBe("me@gmail.com"));
  it("normalizes phones to local digits", () => {
    expect(normalizeContact("PHONE", "050-123-4567")).toBe("0501234567");
    expect(normalizeContact("PHONE", "+972 50-123-4567")).toBe("0501234567");
  });
  it("recognizes Israeli mobiles only", () => {
    expect(isIsraeliMobile("0501234567")).toBe(true);
    expect(isIsraeliMobile("031234567")).toBe(false);
    expect(isIsraeliMobile("050123456")).toBe(false);
    expect(isIsraeliMobile("05012345678")).toBe(false);
  });
});

describe("displayPhone", () => {
  it("shows an Israeli number the local way, however it was typed", () => {
    expect(displayPhone("+972542571330")).toBe("054-257-1330");
    expect(displayPhone("0542571330")).toBe("054-257-1330");
    expect(displayPhone("+972 54-257-1330")).toBe("054-257-1330");
    expect(displayPhone("036123456")).toBe("03-612-3456");
    expect(displayPhone("+972-77-123-4567")).toBe("077-123-4567");
  });

  it("leaves anything else as typed", () => {
    expect(displayPhone("+1 415 555 0100")).toBe("+1 415 555 0100");
    expect(displayPhone("12345")).toBe("12345");
    expect(displayPhone("call me")).toBe("call me");
  });
});
