import { TICKERS, type TickerEntry } from "@/data/tickers";

export type TickerSuggestion = TickerEntry;

// Generic legal/filler words nobody searches by — excluded from name matching
// so "T" doesn't surface "The Boeing Company" via "the".
const STOP = new Set(["the", "inc", "corp", "corporation", "company", "co", "group", "holdings", "incorporated", "ltd", "plc"]);

// Rank: exact symbol > symbol prefix > word-prefix in the company name.
// Deliberately no loose substring match — "TS" should not surface "Robinhood
// Markets" via "marke[ts]". De-duplicates by symbol and caps the result count.
export function searchTickers(query: string, limit = 6): TickerSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: Array<{ t: TickerEntry; score: number }> = [];
  for (const t of TICKERS) {
    const sym = t.symbol.toLowerCase();
    const name = t.name.toLowerCase();
    let score = -1;
    if (sym === q) score = 0;
    else if (sym.startsWith(q)) score = 1;
    else if (name.split(/[^a-z0-9]+/).some((w) => !STOP.has(w) && w.startsWith(q))) score = 2;
    if (score >= 0) scored.push({ t, score });
  }

  scored.sort((a, b) => a.score - b.score || a.t.symbol.length - b.t.symbol.length || a.t.symbol.localeCompare(b.t.symbol));

  const seen = new Set<string>();
  const out: TickerSuggestion[] = [];
  for (const { t } of scored) {
    if (seen.has(t.symbol)) continue;
    seen.add(t.symbol);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

export function companyName(symbol: string): string | null {
  const up = symbol.trim().toUpperCase();
  return TICKERS.find((t) => t.symbol === up)?.name ?? null;
}
