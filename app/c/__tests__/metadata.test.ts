import { describe, it, expect } from "vitest";
import { buildOgTitle } from "@/app/c/og-title";
import type { BagResult } from "@/lib/types";

const r: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

describe("buildOgTitle", () => {
  it("summarizes the bag", () => {
    expect(buildOgTitle(r)).toBe("$10,000 in NVDA (Mar 2020) → $234,100");
  });
});
