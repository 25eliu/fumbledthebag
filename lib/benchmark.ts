import { loadSeries } from "@/lib/load-series";
import { computeBag } from "@/lib/bag-math";
import type { Benchmark } from "@/lib/types";

const BENCHMARK_TICKER = "SPY"; // cache label for the S&P 500 ETF (SPDR) series
const BENCHMARK_LABEL = "the S&P 500";
// "SPY" alone resolves to the wrong entity in Tako ("SpyCloud, Inc."), so query by name.
const benchmarkQueries = (year: number) => [`S&P 500 since ${year}`, "S&P 500"];

/**
 * What the same amount, invested on the same date, would be worth in the S&P 500.
 * Best-effort: returns null if the benchmark series is unavailable or the date
 * predates it — the caller must never let a null break the main result.
 */
export async function fetchBenchmark(
  year: number,
  month: number,
  amount: number
): Promise<Benchmark | null> {
  const loaded = await loadSeries(BENCHMARK_TICKER, year, month, { queries: benchmarkQueries(year) });
  if (!loaded || loaded.series.length === 0) return null;

  const math = computeBag(loaded.series, year, month, amount);
  if ("error" in math) return null;

  return {
    label: BENCHMARK_LABEL,
    currentValue: math.currentValue,
    gain: math.gain,
    multiple: math.multiple,
  };
}
