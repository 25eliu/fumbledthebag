import { describe, it, expect } from "vitest";
import { canonicalPath, seedFor, xShareUrl } from "@/lib/url";

describe("url helpers", () => {
  it("builds a canonical path with an uppercase ticker", () => {
    expect(canonicalPath({ ticker: "nvda", year: 2020, month: 3, amount: 10000 })).toBe("/c/NVDA/2020/3/10000");
  });
  it("builds a stable seed", () => {
    expect(seedFor({ ticker: "NVDA", year: 2020, month: 3, amount: 10000 })).toBe("NVDA|2020|3|10000");
  });
  it("builds an X intent url with hook + result url", () => {
    const u = xShareUrl("NVDA", 2020, "https://x.test/c/NVDA/2020/3/10000");
    expect(u).toContain("https://twitter.com/intent/tweet?");
    expect(decodeURIComponent(u)).toContain("$NVDA");
    expect(decodeURIComponent(u)).toContain("https://x.test/c/NVDA/2020/3/10000");
  });
});
