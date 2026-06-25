import { NextResponse } from "next/server";
import { z } from "zod";
import { takoSearch } from "@/lib/tako";
import { computeBag } from "@/lib/bag-math";
import { bagKey, cacheGet, cacheSet } from "@/lib/cache";
import { monthName } from "@/lib/format";
import type { TakoCard, BagResult } from "@/lib/types";

const Body = z.object({
  ticker: z.string().trim().min(1).max(10),
  year: z.number().int().min(2015).max(2025),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive().max(100_000_000),
});

type CachedBag = { card: TakoCard; fetchedAt: number };
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid input." }, { status: 400 });
  }
  const { ticker, year, month, amount } = parsed.data;
  const upper = ticker.toUpperCase();

  let card: TakoCard | null = null;
  const cached = await cacheGet<CachedBag>(bagKey(upper, year, month));
  if (cached && Date.now() - cached.fetchedAt < DAY_MS) {
    card = cached.card;
  } else {
    card = await takoSearch(`${upper} monthly stock price from ${monthName(month)} ${year} to present`);
    if (!card?.visualization_data?.data?.length) {
      card = await takoSearch(`${upper} stock price history`);
    }
    if (card?.visualization_data?.data?.length) {
      await cacheSet(bagKey(upper, year, month), { card, fetchedAt: Date.now() } satisfies CachedBag);
    }
  }

  if (!card?.visualization_data?.data?.length) {
    return NextResponse.json({ error: "NO_DATA", message: "Couldn't find price data for that ticker." });
  }

  const math = computeBag(card.visualization_data.data, year, month, amount);
  if ("error" in math) return NextResponse.json(math);

  const result: BagResult = {
    ticker: upper,
    year,
    month,
    amount,
    ...math,
    embedUrl: card.embed_url,
    imageUrl: card.image_url,
    confidence: card.confidence,
  };
  return NextResponse.json(result);
}
