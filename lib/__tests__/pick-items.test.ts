import { describe, it, expect } from "vitest";
import { pickItems } from "@/lib/pick-items";

describe("pickItems", () => {
  it("is deterministic for the same seed", () => {
    const a = pickItems(50000, "NVDA|2020|1|10000");
    const b = pickItems(50000, "NVDA|2020|1|10000");
    expect(a).toEqual(b);
  });

  it("returns 3 items for a healthy amount", () => {
    const r = pickItems(500000, "seed");
    expect(r).toHaveLength(3);
  });

  it("computes qty = floor(amount / price)", () => {
    const r = pickItems(50000, "seed");
    for (const item of r) expect(item.qty).toBe(Math.floor(50000 / item.price));
  });

  it("never includes an item the amount can't afford", () => {
    const r = pickItems(50, "seed"); // only sub-$50 items qualify
    for (const item of r) expect(item.price).toBeLessThanOrEqual(50);
    for (const item of r) expect(item.qty).toBeGreaterThanOrEqual(1);
  });

  it("honors the exclude list (by name)", () => {
    const first = pickItems(500000, "seed");
    const excluded = first.map((i) => i.name);
    const second = pickItems(500000, "seed", excluded);
    for (const item of second) expect(excluded).not.toContain(item.name);
  });

  it("mixes scales when the budget allows", () => {
    const r = pickItems(1000000, "varied-seed");
    const scales = new Set(r.map((i) => i.scale));
    expect(scales.size).toBeGreaterThanOrEqual(2);
  });

  it("returns fewer than 3 when too little is affordable", () => {
    const r = pickItems(6, "seed"); // only the $6 latte qualifies
    expect(r.length).toBeLessThanOrEqual(1);
  });
});
