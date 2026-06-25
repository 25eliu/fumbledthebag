import { takoSearch, fetchCardSeries } from "@/lib/tako";
import { bagKey, cacheGet, cacheSet } from "@/lib/cache";
import type { TakoCard, TakoPoint } from "@/lib/types";

type CachedSeries = { card: TakoCard; series: TakoPoint[]; fetchedAt: number };
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fetch (and cache) a ticker's price series from Tako.
 * Returns null when no card is found; returns an empty `series` when a card is
 * found but yields no usable price data. Throws only on a Tako transport error
 * (the caller decides how to surface that).
 *
 * The cache entry is keyed by ticker+year+month, so a shared benchmark ticker
 * (e.g. SPY) is fetched once per date and reused across every lookup.
 */
export async function loadSeries(
  ticker: string,
  year: number,
  month: number,
  opts: { queries?: string[] } = {}
): Promise<{ card: TakoCard; series: TakoPoint[] } | null> {
  const upper = ticker.toUpperCase();
  const key = bagKey(upper, year, month);

  const cached = await cacheGet<CachedSeries>(key);
  if (cached && Date.now() - cached.fetchedAt < DAY_MS) {
    console.log(`[loadSeries] cache HIT for ${key} — ${cached.series.length} points`);
    return { card: cached.card, series: cached.series };
  }

  // Default phrasing resolves a stock ticker; callers (e.g. the S&P 500 benchmark)
  // can override when the bare ticker is ambiguous to Tako (SPY → "SpyCloud, Inc.").
  const queries = opts.queries ?? [`${upper} stock price since ${year}`, `${upper} stock price`];
  console.log(`[loadSeries] cache MISS — calling Tako for ${upper}`);
  let card: TakoCard | null = null;
  for (const q of queries) {
    card = await takoSearch(q);
    if (card) break;
    console.log(`[loadSeries] no card for "${q}" — trying next phrasing`);
  }
  if (!card) return null;

  const series = await fetchCardSeries(card.webpage_url);
  console.log(`[loadSeries] series.length=${series.length} for ${upper}`);
  if (series.length > 0) {
    await cacheSet(key, { card, series, fetchedAt: Date.now() } satisfies CachedSeries);
  }
  return { card, series };
}
