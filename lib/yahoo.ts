import type { TakoPoint } from "@/lib/types";

// Yahoo Finance's public chart endpoint — no API key, returns monthly closes as
// JSON. Used as a best-effort fallback when Tako has no usable price chart for a
// ticker (e.g. "MU", which Tako only exposes as a non-chart "Stock Overview" card).
const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

// `range=max` makes Yahoo DECIMATE old monthly bars (it drops months for distant
// years), which breaks month-precise lookups. Explicit period bounds keep full
// monthly resolution from IPO. period1=0 = 1970; period2 = a fixed far-future date
// so we always include the latest bar without reading the wall clock.
const FULL_HISTORY = "period1=0&period2=4102444800&interval=1mo"; // period2 = 2100-01-01

type YahooChart = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }> | null;
    error?: { code?: string; description?: string } | null;
  };
};

/**
 * Map a display ticker to a Yahoo symbol. Class shares use a dash on Yahoo
 * (BRK.B → BRK-B); everything else is the bare uppercase ticker.
 */
export function toYahooSymbol(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\./g, "-");
}

/**
 * Fetch a monthly closing-price series for a ticker from Yahoo Finance.
 * Best-effort: returns [] on any failure (bad symbol, network, malformed body)
 * so the caller can fall through to its own NO_DATA handling — never throws.
 */
export async function fetchYahooSeries(ticker: string): Promise<TakoPoint[]> {
  const symbol = toYahooSymbol(ticker);
  if (!symbol || symbol.length > 12) return [];

  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?${FULL_HISTORY}`;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        // A browser UA avoids Yahoo's datacenter-IP throttling on some hosts.
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      });
      if (!res.ok) {
        console.warn(`[yahoo] ✗ ${host} HTTP ${res.status} for ${symbol}`);
        continue;
      }
      const json = (await res.json()) as YahooChart;
      const result = json.chart?.result?.[0];
      if (!result?.timestamp || !result.indicators?.quote?.[0]?.close) {
        console.warn(`[yahoo] ⚠ no series for ${symbol}: ${json.chart?.error?.description ?? "empty result"}`);
        return []; // a clean "not found" — no point trying the other host
      }

      const ts = result.timestamp;
      const close = result.indicators.quote[0].close;
      const points: TakoPoint[] = [];
      for (let i = 0; i < ts.length; i++) {
        const y = close[i];
        if (typeof y !== "number" || !Number.isFinite(y)) continue; // Yahoo nulls out gaps
        const x = new Date(ts[i] * 1000).toISOString().slice(0, 10); // YYYY-MM-DD
        points.push({ x, y });
      }
      console.log(`[yahoo] ← ${symbol}: ${points.length} monthly points`);
      return points;
    } catch (err) {
      console.warn(`[yahoo] ✗ ${host} threw for ${symbol}:`, err);
      // try the next host
    }
  }
  return [];
}
