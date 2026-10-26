import { describe, expect, it } from "vitest";
import {
  canAccessInbox,
  canUseProUrl,
  canUseTemplateTier,
  emailsInquiries,
  inquiryCenterOn,
  inquiryDelivery,
  isPremiumTemplate,
  needsProToPublish,
} from "@/lib/plan";

const basic = { plan: "BASIC" };
const pro = { plan: "PRO" };

describe("plan gates", () => {
  it("Pro-only features", () => {
    expect(canAccessInbox(basic)).toBe(false);
    expect(canAccessInbox(pro)).toBe(true);
    expect(canUseProUrl(basic)).toBe(false);
    expect(canUseProUrl(pro)).toBe(true);
  });
  it("template tiers", () => {
    expect(canUseTemplateTier(basic, "standard")).toBe(true);
    expect(canUseTemplateTier(basic, "premium")).toBe(false);
    expect(canUseTemplateTier(pro, "premium")).toBe(true);
    expect(isPremiumTemplate("noble")).toBe(true);
    expect(isPremiumTemplate("modern")).toBe(false);
    expect(isPremiumTemplate("nope")).toBe(false);
  });
  it("a Basic site can't go live with a premium template", () => {
    expect(needsProToPublish({ plan: "BASIC", templateId: "luxe" })).toBe(true);
    expect(needsProToPublish({ plan: "BASIC", templateId: "modern" })).toBe(false);
    expect(needsProToPublish({ plan: "PRO", templateId: "luxe" })).toBe(false);
  });
});

describe("inquiry delivery", () => {
  it("Basic always emails and never shows the center, whatever is saved", () => {
    for (const saved of ["BOTH", "EMAIL", "CENTER", undefined]) {
      const site = { plan: "BASIC", inquiryDelivery: saved };
      expect(emailsInquiries(site)).toBe(true);
      expect(inquiryCenterOn(site)).toBe(false);
      expect(inquiryDelivery(site)).toBe("EMAIL");
    }
  });
  it("Pro follows the saved choice", () => {
    const of = (inquiryDelivery: string) => {
      const site = { ...pro, inquiryDelivery };
      return [emailsInquiries(site), inquiryCenterOn(site)];
    };
    expect(of("BOTH")).toEqual([true, true]);
    expect(of("EMAIL")).toEqual([true, false]);
    expect(of("CENTER")).toEqual([false, true]);
  });
  it("an unknown saved value falls back to BOTH", () => {
    expect(inquiryDelivery({ ...pro, inquiryDelivery: "garbage" })).toBe("BOTH");
    expect(inquiryDelivery(pro)).toBe("BOTH");
  });
});
