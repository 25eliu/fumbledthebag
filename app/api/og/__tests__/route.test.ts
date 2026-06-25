import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:fs", () => ({ readFileSync: () => new Uint8Array([0]) }));

const result = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
});
afterEach(() => vi.restoreAllMocks());

describe("GET /api/og", () => {
  it("returns a PNG response", async () => {
    const { GET } = await import("@/app/api/og/[ticker]/[year]/[month]/[amount]/route");
    const res = await GET(new Request("http://test/api/og/NVDA/2020/3/10000"), {
      params: { ticker: "NVDA", year: "2020", month: "3", amount: "10000" },
    });
    expect(res.headers.get("content-type")).toContain("image/png");
  });
});
