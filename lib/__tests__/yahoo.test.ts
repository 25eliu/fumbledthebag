import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchYahooSeries, toYahooSymbol } from "@/lib/yahoo";

afterEach(() => vi.restoreAllMocks());

describe("toYahooSymbol", () => {
  it("uppercases and maps class shares to a dash", () => {
    expect(toYahooSymbol("mu")).toBe("MU");
    expect(toYahooSymbol("brk.b")).toBe("BRK-B");
  });
});

function chartResponse(timestamps: number[], closes: (number | null)[]) {
  return {
    ok: true,
    json: async () => ({
      chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }], error: null },
    }),
  };
}

describe("fetchYahooSeries", () => {
  it("parses monthly closes into TakoPoints (YYYY-MM-DD)", async () => {
    // 2020-01-01 and 2020-02-01 UTC
    const fetchMock = vi.fn().mockResolvedValueOnce(chartResponse([1577836800, 1580515200], [53.78, 56.88]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchYahooSeries("MU");
    expect(result).toEqual([
      { x: "2020-01-01", y: 53.78 },
      { x: "2020-02-01", y: 56.88 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain("/v8/finance/chart/MU");
  });

  it("skips null closes (Yahoo gaps)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(chartResponse([1577836800, 1580515200, 1583020800], [10, null, 20])));
    const result = await fetchYahooSeries("AAPL");
    expect(result).toEqual([
      { x: "2020-01-01", y: 10 },
      { x: "2020-03-01", y: 20 },
    ]);
  });

  it("returns [] for an unknown symbol (clean Yahoo error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chart: { result: null, error: { code: "Not Found", description: "No data found" } } }),
    }));
    expect(await fetchYahooSeries("ZZZZNOTREAL")).toEqual([]);
  });

  it("fails over to the second host on a non-OK response", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce(chartResponse([1577836800], [42]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchYahooSeries("MU");
    expect(result).toEqual([{ x: "2020-01-01", y: 42 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("query1");
    expect(fetchMock.mock.calls[1][0]).toContain("query2");
  });

  it("returns [] when both hosts throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await fetchYahooSeries("MU")).toEqual([]);
  });
});
