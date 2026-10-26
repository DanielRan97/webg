import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrub, scrubEvent, sentryOptions } from "@/lib/sentry-options";

describe("Sentry privacy", () => {
  it("blanks emails and phone numbers", () => {
    expect(scrub("send to dana.levi@gmail.com failed")).toBe("send to [email] failed");
    expect(scrub("SMS to 050-123-4567 / +972 54 123 4567 / 0541234567")).toBe("SMS to [phone] / [phone] / [phone]");
    expect(scrub("site cmvpb5jie0007mx7cteg886ff, step 10 of 12")).toBe("site cmvpb5jie0007mx7cteg886ff, step 10 of 12");
  });

  it("drops request bodies, headers, cookies, query strings and the user", () => {
    const event = {
      type: undefined,
      message: "lead from 0501234567",
      request: { url: "https://webg.co.il/s/x?email=a@b.co", data: { phone: "0501234567" }, cookies: { s: "1" }, headers: { a: "b" }, query_string: "email=a@b.co" },
      user: { email: "owner@x.com", ip_address: "1.2.3.4" },
      exception: { values: [{ type: "Error", value: "no user owner@x.com" }] },
      breadcrumbs: [{ message: "typed 050-1234567", data: { value: "secret" } }],
    } as ErrorEvent;
    const out = scrubEvent(event);
    expect(out.request).toEqual({ url: "https://webg.co.il/s/x" });
    expect(out.user).toBeUndefined();
    expect(out.message).toBe("lead from [phone]");
    expect(out.exception?.values?.[0].value).toBe("no user [email]");
    expect(out.breadcrumbs?.[0]).toEqual({ message: "typed [phone]" });
  });

  it("is off without a DSN, and collects no personal data", () => {
    expect(sentryOptions.enabled).toBe(false);
    expect(sentryOptions.dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });
  });
});
