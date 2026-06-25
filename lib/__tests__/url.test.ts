import { describe, it, expect } from "vitest";
import { canonicalPath, seedFor } from "@/lib/url";

describe("url helpers", () => {
  it("builds a canonical path with an uppercase ticker", () => {
    expect(canonicalPath({ ticker: "nvda", year: 2020, month: 3, amount: 10000 })).toBe("/c/NVDA/2020/3/10000");
  });
  it("builds a stable seed", () => {
    expect(seedFor({ ticker: "NVDA", year: 2020, month: 3, amount: 10000 })).toBe("NVDA|2020|3|10000");
  });
});
