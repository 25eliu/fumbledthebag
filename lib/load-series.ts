import { takoSearch, fetchCardSeries } from "@/lib/tako";
import { fetchYahooSeries } from "@/lib/yahoo";
import { bagKey, cacheGet, cacheSet } from "@/lib/cache";
import type { TakoCard, TakoPoint } from "@/lib/types";

type CachedSeries = { card: TakoCard | null; series: TakoPoint[]; fetchedAt: number };
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch (and cache) a ticker's price series.
 *
 * Primary source is Tako (a validated price-chart card → inline CSV). When Tako
 * has no usable chart for the ticker, we fall back to Yahoo Finance for the raw
 * price series — in that case `card` is null (no Tako embed/image to show).
 *
 * Returns null only when BOTH sources come up empty. Throws only on a Tako
 * transport error (the caller decides how to surface that).
 *
 * The cache entry is keyed by ticker+year+month, so a shared benchmark ticker
 * (e.g. SPY) is fetched once per date and reused across every lookup.
 */
export async function loadSeries(
  ticker: string,
  year: number,
  month: number,
  opts: { queries?: string[]; match?: string; yahooSymbol?: string } = {}
): Promise<{ card: TakoCard | null; series: TakoPoint[] } | null> {
  const upper = ticker.toUpperCase();
  const match = opts.match ?? upper;
  const key = bagKey(upper, year, month);

  const cached = await cacheGet<CachedSeries>(key);
  if (cached && Date.now() - cached.fetchedAt < DAY_MS) {
    console.log(`[loadSeries] cache HIT for ${key} — ${cached.series.length} points`);
    return { card: cached.card, series: cached.series };
  }

  // Default phrasing resolves a stock ticker; callers (e.g. the S&P 500 benchmark)
  // can override when the bare ticker is ambiguous to Tako (SPY → "SpyCloud, Inc.").
  // Multiple phrasings maximize the chance of surfacing a valid price chart.
  const queries = opts.queries ?? [
    `${upper} stock price since ${year}`,
    `${upper} stock price`,
    `${upper} stock`,
  ];
  console.log(`[loadSeries] cache MISS — calling Tako for ${upper}`);
  let card: TakoCard | null = null;
  for (const q of queries) {
    card = await takoSearch(q, match);
    if (card) break;
    console.log(`[loadSeries] no valid chart card for "${q}" — trying next phrasing`);
  }

  let series = card ? await fetchCardSeries(card.webpage_url) : [];
  console.log(`[loadSeries] Tako series.length=${series.length} for ${upper}`);

  // Fallback: Tako had no usable chart (or it yielded no rows) — try Yahoo Finance.
  if (series.length === 0) {
    console.log(`[loadSeries] falling back to Yahoo for ${upper}`);
    const yahoo = await fetchYahooSeries(opts.yahooSymbol ?? upper);
    if (yahoo.length > 0) {
      card = null; // no Tako card → the UI degrades to a plain ticker chip
      series = yahoo;
    }
  }

  if (series.length === 0) return card ? { card, series } : null;
  await cacheSet(key, { card, series, fetchedAt: Date.now() } satisfies CachedSeries);
  return { card, series };
}
