import { NextResponse } from "next/server";
import { z } from "zod";
import { takoSearch, fetchCardSeries } from "@/lib/tako";
import { computeBag } from "@/lib/bag-math";
import { bagKey, cacheGet, cacheSet } from "@/lib/cache";
import { monthName } from "@/lib/format";
import type { TakoCard, TakoPoint, BagResult } from "@/lib/types";

const Body = z.object({
  ticker: z.string().trim().min(1).max(10),
  year: z.number().int().min(2015).max(2025),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive().max(100_000_000),
});

type CachedBag = { card: TakoCard; series: TakoPoint[]; fetchedAt: number };
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid input." }, { status: 400 });
  }
  const { ticker, year, month, amount } = parsed.data;
  const upper = ticker.toUpperCase();
  console.log(`[bagcheck] ▶ ${upper} ${monthName(month)} ${year} $${amount}`);

  let card: TakoCard | null = null;
  let series: TakoPoint[] = [];

  const cached = await cacheGet<CachedBag>(bagKey(upper, year, month));
  if (cached && Date.now() - cached.fetchedAt < DAY_MS) {
    card = cached.card;
    series = cached.series;
    console.log(`[bagcheck] cache HIT for ${bagKey(upper, year, month)} — ${series.length} cached points`);
  } else {
    console.log(`[bagcheck] cache MISS — calling Tako`);
    try {
      card = await takoSearch(`${upper} stock price since ${year}`);
      if (!card) {
        console.log(`[bagcheck] first query returned no card — retrying with looser phrasing`);
        card = await takoSearch(`${upper} stock price`);
      }
      if (card) {
        series = await fetchCardSeries(card.webpage_url);
        console.log(`[bagcheck] series.length=${series.length} for ${upper}`);
      }
    } catch (err) {
      console.error(`[bagcheck] ✗ Tako request failed:`, err);
      return NextResponse.json({
        error: "NO_DATA",
        message: "Couldn't reach the market-data service. Check the TAKO_API_KEY and try again.",
      });
    }
    if (card && series.length > 0) {
      await cacheSet(bagKey(upper, year, month), { card, series, fetchedAt: Date.now() } satisfies CachedBag);
    }
  }

  if (!card || series.length === 0) {
    console.warn(`[bagcheck] ✗ NO_DATA — no usable series for ${upper} (card ${card ? "returned but empty series" : "was null"})`);
    return NextResponse.json({ error: "NO_DATA", message: "Couldn't find price data for that ticker." });
  }

  const math = computeBag(series, year, month, amount);
  if ("error" in math) {
    console.warn(`[bagcheck] ✗ computeBag ${math.error}: ${math.message}`);
    return NextResponse.json(math);
  }
  console.log(`[bagcheck] ✓ ${upper}: $${amount} → $${Math.round(math.currentValue)} (${math.multiple.toFixed(1)}×, start ${math.startDateActual})`);

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
