import { describe, it, expect } from "vitest";
import { pickItems } from "@/lib/pick-items";
import { ITEMS } from "@/data/items";

const minPrice = Math.min(...ITEMS.map((i) => i.price));

describe("pickItems", () => {
  it("is deterministic for the same seed", () => {
    expect(pickItems(50000, "NVDA|2020|1|10000")).toEqual(pickItems(50000, "NVDA|2020|1|10000"));
  });

  it("returns 3 items for a healthy amount", () => {
    expect(pickItems(500000, "seed")).toHaveLength(3);
  });

  it("computes qty = floor(amount / price)", () => {
    const r = pickItems(50000, "seed");
    for (const item of r) expect(item.qty).toBe(Math.floor(50000 / item.price));
  });

  it("never includes an item the amount can't afford", () => {
    const budget = minPrice + 1; // only the very cheapest items qualify
    const r = pickItems(budget, "seed");
    for (const item of r) expect(item.price).toBeLessThanOrEqual(budget);
    for (const item of r) expect(item.qty).toBeGreaterThanOrEqual(1);
  });

  it("honors the exclude list (by name)", () => {
    const first = pickItems(500000, "seed");
    const excluded = first.map((i) => i.name);
    const second = pickItems(500000, "seed", excluded);
    for (const item of second) expect(excluded).not.toContain(item.name);
  });

  it("mixes scales when the budget allows", () => {
    const scales = new Set(pickItems(100000000, "varied-seed").map((i) => i.scale));
    expect(scales.size).toBeGreaterThanOrEqual(2);
  });

  it("returns nothing when nothing is affordable", () => {
    expect(pickItems(minPrice - 1, "seed")).toHaveLength(0);
  });

  it("every catalog item has an absolute https url", () => {
    for (const item of ITEMS) expect(item.url).toMatch(/^https:\/\/.+/);
  });

  it("catalog covers all four tiers", () => {
    const scales = new Set(ITEMS.map((i) => i.scale));
    expect(scales).toEqual(new Set(["everyday", "aspirational", "flex", "absurd"]));
  });
});
