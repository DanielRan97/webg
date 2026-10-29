import { describe, expect, it } from "vitest";
import { MIN_FILL_MS, looksLikeBot } from "@/lib/form-guard";

describe("looksLikeBot", () => {
  it("lets a person through: hidden field empty, filled at a human pace", () => {
    expect(looksLikeBot({ trap: "", elapsedMs: 8000 })).toBe(false);
    expect(looksLikeBot({ trap: "  ", elapsedMs: MIN_FILL_MS })).toBe(false);
  });

  it("catches the hidden field filled in", () => {
    expect(looksLikeBot({ trap: "https://spam.example", elapsedMs: 8000 })).toBe(true);
  });

  it("catches a form sent faster than a person could fill it", () => {
    expect(looksLikeBot({ trap: "", elapsedMs: 300 })).toBe(true);
  });

  it("catches a submission that skipped the form altogether", () => {
    expect(looksLikeBot(undefined)).toBe(true);
    expect(looksLikeBot({ trap: "" })).toBe(true);
    expect(looksLikeBot({ trap: "", elapsedMs: Number.NaN })).toBe(true);
  });
});
