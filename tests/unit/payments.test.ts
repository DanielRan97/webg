import { afterEach, describe, expect, it, vi } from "vitest";
import { createHypGateway, parseAnswer } from "@/lib/payments/hyp";
import { fakeGateway, fakeReturnQuery } from "@/lib/payments/fake";
import { formatAmount, parseAmount } from "@/lib/payments/types";

const cfg = { masof: "0010000001", key: "test-key", passP: "test-pass" };

/** Answers each HYP call in turn and records the URLs asked for. */
function hypAnswers(...bodies: string[]) {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      urls.push(url);
      return new Response(bodies.shift() ?? "", { status: 200 });
    }),
  );
  return urls;
}

afterEach(() => vi.unstubAllGlobals());

const checkout = { orderId: "pay_1", amountAgorot: 5000, description: "WEBG Basic - מספרה - מנוי חודשי", customerName: "מספרה", email: "o@x.co" };

describe("amounts", () => {
  it("formats and parses", () => {
    expect(formatAmount(5000)).toBe("50.00");
    expect(formatAmount(1550)).toBe("15.50");
    expect(parseAmount("50")).toBe(5000);
    expect(parseAmount("79.00")).toBe(7900);
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount(null)).toBeNull();
  });
  it("treats an HTML answer as an error", () => {
    expect(parseAnswer("<html>oops</html>").get("CCode")).toBe("html");
    expect(parseAnswer("CCode=0&Id=5").get("Id")).toBe("5");
  });
});

describe("HYP gateway", () => {
  const hyp = createHypGateway(cfg);

  it("signs a payment page with WEBG's amount, order and invoice details", async () => {
    const urls = hypAnswers("Amount=50.00&Masof=0010000001&Order=pay_1&action=pay&signature=abc");
    const url = await hyp.createCheckoutUrl(checkout);
    expect(url).toBe("https://pay.hyp.co.il/p/?Amount=50.00&Masof=0010000001&Order=pay_1&action=pay&signature=abc");
    const sent = new URL(urls[0]).searchParams;
    expect(Object.fromEntries(["action", "What", "Sign", "Amount", "Order", "SendHesh", "email", "UTF8", "PageLang"].map((k) => [k, sent.get(k)]))).toEqual({
      action: "APISign", What: "SIGN", Sign: "True", Amount: "50.00", Order: "pay_1", SendHesh: "True", email: "o@x.co", UTF8: "True", PageLang: "HEB",
    });
  });

  it("throws when HYP refuses to sign", async () => {
    hypAnswers("CCode=902");
    await expect(hyp.createCheckoutUrl(checkout)).rejects.toThrow("CCode 902");
  });

  it("verifies the return with every parameter, in the order received", async () => {
    const urls = hypAnswers("CCode=0");
    const raw = "Id=408941655&CCode=0&Amount=50.00&ACode=0505293&Order=pay_1&L4digit=4580&Sign=a84b";
    await expect(hyp.verifyReturn(raw)).resolves.toEqual({ ok: true, transId: "408941655", orderId: "pay_1", amountAgorot: 5000, last4: "4580" });
    expect(urls[0]).toContain("What=VERIFY");
    expect(urls[0].endsWith(`&${raw}`)).toBe(true);
  });

  it("rejects a return that HYP doesn't confirm, or that wasn't a success", async () => {
    hypAnswers("CCode=902");
    await expect(hyp.verifyReturn("Id=1&CCode=0&Amount=50&Order=pay_1&Sign=x")).resolves.toMatchObject({ ok: false });
    const urls = hypAnswers();
    await expect(hyp.verifyReturn("Id=1&CCode=33&Amount=50&Order=pay_1&Sign=x")).resolves.toMatchObject({ ok: false });
    expect(urls).toHaveLength(0);
  });

  it("gets the card token", async () => {
    hypAnswers("Id=401594866&CCode=0&Token=0505743578473060772&Tokef=3105&Fild1=");
    await expect(hyp.getToken("401594866")).resolves.toEqual({ token: "0505743578473060772", expiry: "3105" });
    hypAnswers("CCode=901");
    await expect(hyp.getToken("1")).resolves.toBeNull();
  });

  it("charges a token with its expiry and no Israeli ID", async () => {
    const urls = hypAnswers("Id=408671193&CCode=0&Amount=50.00&ACode=0502150&Hesh=EZ");
    await expect(hyp.chargeToken({ ...checkout, token: "0505743578473060772", expiry: "3105" })).resolves.toEqual({ ok: true, transId: "408671193" });
    const sent = new URL(urls[0]).searchParams;
    expect([sent.get("action"), sent.get("CC"), sent.get("Tmonth"), sent.get("Tyear"), sent.get("Token"), sent.get("UserId")]).toEqual(["soft", "0505743578473060772", "05", "31", "True", "000000000"]);
    hypAnswers("Id=414564871&CCode=997&Amount=50.00");
    await expect(hyp.chargeToken({ ...checkout, token: "1", expiry: "3105" })).resolves.toEqual({ ok: false, transId: "414564871", code: "997" });
  });
});

describe("fake gateway", () => {
  it("accepts its own signed return and rejects a tampered one", async () => {
    const q = fakeReturnQuery("pay_9", "79.00", "ok");
    await expect(fakeGateway.verifyReturn(q)).resolves.toMatchObject({ ok: true, orderId: "pay_9", amountAgorot: 7900 });
    await expect(fakeGateway.verifyReturn(q.replace("79.00", "1.00"))).resolves.toMatchObject({ ok: false });
  });
  it("declines later charges on a 'declinelater' card", async () => {
    const id = new URLSearchParams(fakeReturnQuery("pay_9", "50.00", "declinelater")).get("Id")!;
    const card = (await fakeGateway.getToken(id))!;
    await expect(fakeGateway.chargeToken({ ...checkout, ...card })).resolves.toMatchObject({ ok: false, code: "6" });
  });
});
