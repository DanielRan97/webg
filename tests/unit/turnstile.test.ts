import { afterEach, describe, expect, it, vi } from "vitest";
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile";

function answer(body: unknown, status = 200) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function keysOn() {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Turnstile", () => {
  it("is off without both keys, and then lets everything through without calling Cloudflare", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    const fetchMock = answer({ success: false });
    expect(turnstileEnabled()).toBe(false);
    expect(await verifyTurnstile(undefined, "1.2.3.4")).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a submission with no token", async () => {
    keysOn();
    const fetchMock = answer({ success: true });
    expect(await verifyTurnstile(undefined, "1.2.3.4")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks Cloudflare with the secret, the token and the visitor's IP", async () => {
    keysOn();
    const fetchMock = answer({ success: true });
    expect(await verifyTurnstile("tok", "1.2.3.4")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = new URLSearchParams(String(init?.body));
    expect(Object.fromEntries(body)).toEqual({ secret: "secret-key", response: "tok", remoteip: "1.2.3.4" });
  });

  it("refuses a token Cloudflare rejects", async () => {
    keysOn();
    answer({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await verifyTurnstile("bad", "1.2.3.4")).toBe(false);
  });

  it("lets the submission through when Cloudflare can't be reached", async () => {
    keysOn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    expect(await verifyTurnstile("tok", "1.2.3.4")).toBe(true);
    answer({}, 503);
    expect(await verifyTurnstile("tok", "1.2.3.4")).toBe(true);
  });
});
