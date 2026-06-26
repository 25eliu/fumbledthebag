import type { TakoCard, TakoPoint } from "@/lib/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive matcher for a search term. A bare ticker-like token
 * (e.g. "NVDA") must appear as its own word, so "SPY" is NOT matched inside
 * "SpyCloud". A descriptive phrase (e.g. "S&P 500") is matched as a substring.
 */
function termMatcher(term: string): (text: string) => boolean {
  const escaped = escapeRegExp(term);
  const isBareToken = /^[A-Za-z0-9]+$/.test(term);
  const re = isBareToken ? new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i") : new RegExp(escaped, "i");
  return (text: string) => re.test(text);
}

/**
 * Pick the right price card from a search result. The search endpoint can return
 * the wrong entity as the top card (e.g. "SPY" → "SpyCloud, Inc. Funding"), so we
 * never blindly take cards[0]. A usable card must be a real chart (`card_type ===
 * "chart"`) AND actually refer to `match` (the ticker, or a name the caller supplies).
 */
function pickPriceCard(cards: TakoCard[], match: string): TakoCard | null {
  const matches = termMatcher(match);
  const charts = cards.filter((c) => c.card_type === "chart");
  return charts.find((c) => matches(c.title ?? "") || matches(c.semantic_description ?? "")) ?? null;
}

export async function takoSearch(text: string, match: string): Promise<TakoCard | null> {
  const key = process.env.TAKO_API_KEY;
  console.log(`[tako] → query: ${JSON.stringify(text)} | API key present: ${!!key}${key ? ` (len ${key.length})` : " — MISSING!"}`);

  const res = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key! },
    body: JSON.stringify({
      inputs: { text },
      source_indexes: ["tako"],
      search_effort: "fast",
      count: 8,
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[tako] ✗ HTTP ${res.status} ${res.statusText} — ${body.slice(0, 500)}`);
    throw new Error(`Tako ${res.status}: ${body}`);
  }

  const json = await res.json();
  const cards: TakoCard[] = json?.outputs?.knowledge_cards ?? [];
  const card = pickPriceCard(cards, match);
  console.log(
    `[tako] ← cards: ${cards.length} [${cards.map((c) => `${c.title}:${c.card_type ?? "?"}`).join(", ")}] | picked: ${card ? `"${card.title}"` : "none"}`,
  );
  if (cards.length > 0 && !card) {
    console.warn(`[tako] ⚠ ${cards.length} card(s) returned but none is a chart matching "${match}" — treating as no data`);
  }
  // The live API returns `relevance` (e.g. "High") rather than `confidence`; surface
  // it under `confidence` so the existing UI badge renders.
  if (card && card.confidence === undefined) {
    const relevance = (card as TakoCard & { relevance?: string }).relevance;
    if (relevance) card.confidence = relevance;
  }
  return card;
}

export async function fetchCardSeries(webpageUrl: string): Promise<TakoPoint[]> {
  const key = process.env.TAKO_API_KEY;
  console.log(`[tako] → fetchCardSeries: POST /api/v1/contents (inline) for ${webpageUrl}`);

  // `mode: "inline"` returns the CSV directly in the response body (contents[0].data),
  // so there is no second hop to a presigned S3 URL. Capped at 1000 rows server-side.
  const contentsRes = await fetch("https://trytako.com/api/v1/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key! },
    body: JSON.stringify({ url: webpageUrl, mode: "inline" }),
  });

  if (!contentsRes.ok) {
    const body = await contentsRes.text();
    console.error(`[tako] ✗ /contents HTTP ${contentsRes.status} — ${body.slice(0, 500)}`);
    return [];
  }

  const contentsJson = await contentsRes.json();
  const item = contentsJson?.contents?.[0];
  const csvText: string | undefined = item?.data;

  if (!csvText) {
    console.warn(`[tako] ⚠ /contents returned no contents[0].data — keys: ${Object.keys(item ?? {}).join(", ")}`);
    return [];
  }
  if (item?.truncated) {
    console.warn(`[tako] ⚠ series truncated at ${item?.total_rows ?? "?"} rows — current price may be stale`);
  }

  return parseSeriesCsv(csvText);
}

/**
 * Parse a Tako time-series CSV into points. The value is read from the **last
 * column by header position** (so a future multi-column card can't silently feed
 * the wrong series). Timestamps in the first column contain no comma, so the
 * column index from the header maps cleanly onto each row.
 */
function parseSeriesCsv(csvText: string): TakoPoint[] {
  const lines = csvText.split("\n");
  const header = (lines[0] ?? "").split(",");
  const valueCol = header.length - 1; // last column is the metric
  const points: TakoPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length <= valueCol) continue;
    const x = cols[0].trim();
    const y = parseFloat(cols[valueCol].trim());
    if (x && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }

  console.log(`[tako] ← parsed ${points.length} rows from inline CSV`);
  return points;
}
