import { describe, it, expect } from "vitest";
import { searchTickers, companyName } from "@/lib/ticker-search";

describe("searchTickers", () => {
  it("returns nothing for an empty query", () => {
    expect(searchTickers("")).toEqual([]);
    expect(searchTickers("   ")).toEqual([]);
  });

  it("ranks an exact symbol first", () => {
    const r = searchTickers("NVDA");
    expect(r[0].symbol).toBe("NVDA");
    expect(r[0].name).toMatch(/NVIDIA/i);
  });

  it("matches a symbol prefix", () => {
    const r = searchTickers("TS");
    expect(r.map((x) => x.symbol)).toContain("TSLA");
  });

  it("matches a company name word", () => {
    const r = searchTickers("apple");
    expect(r.map((x) => x.symbol)).toContain("AAPL");
  });

  it("matches a name substring like 'nvid'", () => {
    const r = searchTickers("nvid");
    expect(r.map((x) => x.symbol)).toContain("NVDA");
  });

  it("respects the limit", () => {
    expect(searchTickers("a", 3).length).toBeLessThanOrEqual(3);
  });

  it("de-duplicates by symbol", () => {
    const r = searchTickers("airbnb", 6);
    const symbols = r.map((x) => x.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });
});

describe("companyName", () => {
  it("resolves a known symbol case-insensitively", () => {
    expect(companyName("nvda")).toMatch(/NVIDIA/i);
  });
  it("returns null for an unknown symbol", () => {
    expect(companyName("ZZZZZ")).toBeNull();
  });
});
