import { describe, it, expect } from "vitest";
import { toYearMonth, computeBag } from "@/lib/bag-math";
import type { TakoPoint } from "@/lib/types";

describe("toYearMonth", () => {
  it("handles YYYY-MM", () => expect(toYearMonth("2020-01")).toBe("2020-01"));
  it("handles YYYY-MM-DD", () => expect(toYearMonth("2020-01-31")).toBe("2020-01"));
  it("handles 'Jan 2020'", () => expect(toYearMonth("Jan 2020")).toBe("2020-01"));
  it("handles 'January 2020'", () => expect(toYearMonth("January 2020")).toBe("2020-01"));
  it("handles year only", () => expect(toYearMonth("2020")).toBe("2020-01"));
  it("returns null on garbage", () => expect(toYearMonth("???")).toBeNull());
});

const series: TakoPoint[] = [
  { x: "2020-01", y: 5 },
  { x: "2020-02", y: 6 },
  { x: "2020-03", y: 8 },
  { x: "2024-01", y: 100 },
];

describe("computeBag", () => {
  it("computes a gain from the exact month", () => {
    const r = computeBag(series, 2020, 1, 1000);
    expect("error" in r).toBe(false);
    if ("error" in r) return;
    expect(r.startPrice).toBe(5);
    expect(r.startDateActual).toBe("2020-01");
    expect(r.currentPrice).toBe(100);
    expect(r.currentValue).toBe(20000);
    expect(r.multiple).toBe(20);
    expect(r.gain).toBe(19000);
    expect(r.snapped).toBe(false);
    expect(r.isLoss).toBe(false);
  });

  it("snaps forward to the nearest available month", () => {
    const r = computeBag(series, 2020, 2, 1000);
    if ("error" in r) throw new Error("unexpected error");
    expect(r.startDateActual).toBe("2020-02");
    expect(r.snapped).toBe(false);
  });

  it("flags IPO_AFTER when the request predates the data by >2 months", () => {
    const r = computeBag(series, 2010, 1, 1000);
    expect("error" in r).toBe(true);
    if (!("error" in r)) return;
    expect(r.error).toBe("IPO_AFTER");
    expect(r.suggestedYear).toBe(2020);
    expect(r.suggestedMonth).toBe(1);
  });

  it("returns NO_DATA on empty series", () => {
    const r = computeBag([], 2020, 1, 1000);
    expect("error" in r && r.error).toBe("NO_DATA");
  });

  it("sorts an out-of-order series before snapping", () => {
    const unsorted: TakoPoint[] = [
      { x: "2024-01", y: 100 },
      { x: "2020-01", y: 5 },
      { x: "2020-03", y: 8 },
    ];
    const r = computeBag(unsorted, 2020, 1, 1000);
    if ("error" in r) throw new Error("unexpected error");
    expect(r.startDateActual).toBe("2020-01");
    expect(r.currentPrice).toBe(100);
  });

  it("detects a loss", () => {
    const losing: TakoPoint[] = [{ x: "2021-01", y: 100 }, { x: "2024-01", y: 31 }];
    const r = computeBag(losing, 2021, 1, 10000);
    if ("error" in r) throw new Error("unexpected error");
    expect(r.isLoss).toBe(true);
    expect(r.currentValue).toBe(3100);
    expect(r.gain).toBe(-6900);
  });
});
