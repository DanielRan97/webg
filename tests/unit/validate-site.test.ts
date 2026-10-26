import { describe, expect, it } from "vitest";
import { emptySiteData } from "@/lib/site-defaults";
import { validateSite } from "@/lib/validate-site";
import type { SiteData } from "@/types/site";

function site(patch: Partial<SiteData> = {}): SiteData {
  return { ...emptySiteData("other"), businessName: "מספרת דני", ...patch };
}

/** Turns a section on (adding it if the category doesn't have it). */
function withSection(d: SiteData, type: SiteData["sections"][number]["type"]): SiteData {
  const has = d.sections.some((s) => s.type === type);
  return {
    ...d,
    sections: has ? d.sections.map((s) => (s.type === type ? { ...s, enabled: true } : s)) : [...d.sections, { type, enabled: true }],
  };
}

describe("validateSite", () => {
  it("a fresh site with a name has no problems", () => {
    expect(validateSite(site())).toEqual({});
  });

  it("requires a business name", () => {
    expect(validateSite(site({ businessName: " a " }))).toHaveProperty("name");
  });

  it("checks contact formats", () => {
    const e = validateSite(site({ email: "bad", phone: "abc", whatsapp: "12" }));
    expect(Object.keys(e)).toEqual(expect.arrayContaining(["email", "phone", "whatsapp"]));
  });

  it("checks opening hours", () => {
    const hours = site().hours.map((h) => (h.day === 0 ? { ...h, isOpen: true, openTime: "18:00", closeTime: "09:00" } : h));
    expect(validateSite(site({ hours }))).toHaveProperty("hours-0");
  });

  it("checks service rows and prices", () => {
    const e = validateSite(
      site({
        services: [
          { name: "", description: "", price: "50", category: "" },
          { name: "תספורת", description: "", price: "זול", category: "" },
        ],
      }),
    );
    expect(e).toHaveProperty("service-0");
    expect(e).toHaveProperty("service-price-1");
  });

  it("checks the booking link only when booking by link is on", () => {
    const d = site({ booking: { method: "LINK", url: "https://example.com", buttonText: "" } });
    expect(validateSite(d)).not.toHaveProperty("booking-url");
    expect(validateSite(withSection(d, "booking"))).toHaveProperty("booking-url");
    expect(validateSite(withSection({ ...d, booking: { ...d.booking, url: "calendly.com/x" } }, "booking"))).not.toHaveProperty("booking-url");
  });

  it("checks the slug only when asked", () => {
    const d = site({ slug: "a!" });
    expect(validateSite(d)).not.toHaveProperty("slug");
    expect(validateSite(d, { checkSlug: true })).toHaveProperty("slug");
  });
});
