import { NextResponse } from "next/server";
import { takoSearch } from "@/lib/tako";
import { cacheGet, cacheSet } from "@/lib/cache";

export const runtime = "nodejs";

type TickerCard = {
  found: boolean;
  symbol: string;
  title?: string;
  imageUrl?: string;
  embedUrl?: string;
};

const WEEK_SECONDS = 7 * 24 * 60 * 60;

// Lightweight company-overview lookup for the hover preview on the ticker blank.
// GET /api/ticker-card?ticker=NVDA → { found, symbol, title, imageUrl, embedUrl }
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ticker") ?? "";
  const symbol = raw.trim().toUpperCase();
  if (!symbol || symbol.length > 10) {
    return NextResponse.json({ found: false, symbol }, { status: 400 });
  }

  const key = `tickercard:${symbol}`;
  const cached = await cacheGet<TickerCard>(key);
  if (cached) return NextResponse.json(cached);

  let payload: TickerCard = { found: false, symbol };
  try {
    const card = await takoSearch(`${symbol} stock price since 2020`);
    if (card) {
      payload = {
        found: true,
        symbol,
        title: card.title,
        imageUrl: card.image_url,
        embedUrl: card.embed_url,
      };
    }
  } catch (err) {
    console.error(`[ticker-card] ✗ ${symbol}:`, err);
  }

  if (payload.found) await cacheSet(key, payload, WEEK_SECONDS);
  return NextResponse.json(payload);
}
