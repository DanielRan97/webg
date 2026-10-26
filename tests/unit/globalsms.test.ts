import { afterEach, describe, expect, it, vi } from "vitest";
import { createGlobalSmsAdapter, globalSmsBalance, SmsSendError } from "@/lib/sms/globalsms-adapter";

/** Makes the next fetch calls answer with this body. */
function answer(body: string, status = 200) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("Global SMS send", () => {
  const sms = createGlobalSmsAdapter("test-key", "webg");

  it("posts to the host without IP protection, with the key in the body", async () => {
    const fetchMock = answer('{"success":true,"result":1,"errDesc":""}');
    await sms.send("0501234567", "קוד: 123456");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sapi.itnewsletter.co.il/api/restApiSms/sendSmsToRecipients");
    expect(url).not.toContain("test-key");
    expect(JSON.parse(String(init?.body))).toEqual({ ApiKey: "test-key", txtOriginator: "webg", destinations: "0501234567", txtSMSmessage: "קוד: 123456" });
  });

  it("accepts the plain-text success answer", async () => {
    answer("1");
    await expect(sms.send("0501234567", "x")).resolves.toBeUndefined();
  });

  it.each([
    ['{"success":false,"result":0,"errDesc":"e 1"}', "e 1"],
    ["invalid login", "invalid login"],
    ["Not enough credit", "Not enough credit"],
    ["", "empty response"],
  ])("throws the provider's reason for %j", async (body, reason) => {
    answer(body);
    await expect(sms.send("0501234567", "x")).rejects.toMatchObject({ reason });
  });

  it("throws on an HTTP error", async () => {
    answer("forbidden", 403);
    await expect(sms.send("0501234567", "x")).rejects.toBeInstanceOf(SmsSendError);
  });
});

describe("Global SMS balance", () => {
  it("reads JSON and plain-text answers", async () => {
    answer('{"success":true,"result":"523","errDesc":""}');
    expect(await globalSmsBalance("k")).toBe(523);
    answer("87");
    expect(await globalSmsBalance("k")).toBe(87);
  });
  it("returns null on any failure", async () => {
    answer("invalid login");
    expect(await globalSmsBalance("k")).toBeNull();
    answer("x", 500);
    expect(await globalSmsBalance("k")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect(await globalSmsBalance("k")).toBeNull();
  });
});
