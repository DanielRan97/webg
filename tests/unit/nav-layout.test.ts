import { describe, expect, it } from "vitest";
import { isValidNavLayout, resolveNavLayout, serializeNavLayout, templateNavDefault } from "@/lib/nav-layout";

describe("nav layout", () => {
  it("validates saved layouts", () => {
    expect(isValidNavLayout("")).toBe(true);
    expect(isValidNavLayout("logo:start,name:start,menu:end,call:end")).toBe(true);
    // Saved before the call button could be placed.
    expect(isValidNavLayout("logo:start,name:center,menu:end")).toBe(true);
    expect(isValidNavLayout("logo:start,logo:end,menu:end,call:end")).toBe(false);
    expect(isValidNavLayout("logo:top,name:start,menu:end,call:end")).toBe(false);
    expect(isValidNavLayout("logo:start,name:start,menu:end,call:end,extra:end")).toBe(false);
    expect(isValidNavLayout("logo:start,name:start,call:end")).toBe(false);
  });
  it("falls back to the template default", () => {
    expect(resolveNavLayout(null, "minimal")).toEqual(templateNavDefault("minimal"));
    expect(resolveNavLayout("broken", "elegant")).toEqual(templateNavDefault("elegant"));
    expect(templateNavDefault("unknown")).toEqual(templateNavDefault("modern"));
  });
  it("keeps the call button at the end for old layouts", () => {
    expect(resolveNavLayout("logo:off,name:center,menu:start", "modern")).toEqual({ logo: "off", name: "center", menu: "start", call: "end" });
  });
  it("round-trips", () => {
    const layout = { logo: "center", name: "off", menu: "start", call: "end" } as const;
    expect(resolveNavLayout(serializeNavLayout(layout), "modern")).toEqual(layout);
  });
});
