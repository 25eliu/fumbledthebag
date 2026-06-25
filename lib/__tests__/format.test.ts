import { describe, it, expect } from "vitest";
import { formatMoney, formatMultiple, formatPercent, formatQty, monthName } from "@/lib/format";

describe("formatMoney", () => {
  it("rounds to whole dollars with commas", () => {
    expect(formatMoney(12431.04)).toBe("$12,431");
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(234100)).toBe("$234,100");
  });
});

describe("formatMultiple", () => {
  it("uses one decimal and an x", () => {
    expect(formatMultiple(23.44)).toBe("23.4×");
    expect(formatMultiple(1240)).toBe("1,240.0×");
  });
});

describe("formatPercent", () => {
  it("rounds to whole percent with a sign", () => {
    expect(formatPercent(2241.3)).toBe("+2,241%");
    expect(formatPercent(-68.9)).toBe("-69%");
  });
});

describe("formatQty", () => {
  it("groups thousands", () => { expect(formatQty(1240)).toBe("1,240"); });
});

describe("monthName", () => {
  it("maps 1..12 to names", () => {
    expect(monthName(3)).toBe("March");
    expect(monthName(1)).toBe("January");
  });
});
