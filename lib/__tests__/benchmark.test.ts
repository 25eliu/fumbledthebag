import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/load-series", () => ({ loadSeries: vi.fn() }));

import { fetchBenchmark } from "@/lib/benchmark";
import { loadSeries } from "@/lib/load-series";

const series = [
  { x: "2020-01-02 00:00:00+00:00", y: 10 },
  { x: "2024-01-02 00:00:00+00:00", y: 40 },
];

beforeEach(() => vi.clearAllMocks());

describe("fetchBenchmark", () => {
  it("returns a shaped benchmark on good data", async () => {
    (loadSeries as any).mockResolvedValue({ card: {}, series });
    const b = await fetchBenchmark(2020, 1, 1000);
    expect(b).toEqual({ label: "the S&P 500", currentValue: 4000, gain: 3000, multiple: 4 });
  });

  it("queries Tako by S&P 500 name, not the ambiguous SPY ticker", async () => {
    (loadSeries as any).mockResolvedValue({ card: {}, series });
    await fetchBenchmark(2020, 1, 1000);
    const [, , , opts] = (loadSeries as any).mock.calls[0];
    expect(opts.queries[0]).toMatch(/S&P 500/);
    expect(opts.queries.join(" ")).not.toMatch(/stock price/);
  });

  it("returns null when loadSeries returns null", async () => {
    (loadSeries as any).mockResolvedValue(null);
    expect(await fetchBenchmark(2020, 1, 1000)).toBeNull();
  });

  it("returns null when the series is empty", async () => {
    (loadSeries as any).mockResolvedValue({ card: {}, series: [] });
    expect(await fetchBenchmark(2020, 1, 1000)).toBeNull();
  });

  it("returns null when computeBag errors (date predates the benchmark)", async () => {
    (loadSeries as any).mockResolvedValue({ card: {}, series: [{ x: "2024-01-02 00:00:00+00:00", y: 40 }] });
    expect(await fetchBenchmark(2000, 1, 1000)).toBeNull();
  });
});
