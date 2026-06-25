import { NextResponse } from "next/server";
import { z } from "zod";
import { computeBag } from "@/lib/bag-math";
import { loadSeries } from "@/lib/load-series";
import { fetchBenchmark } from "@/lib/benchmark";
import { monthName } from "@/lib/format";
import type { BagResult } from "@/lib/types";

const Body = z.object({
  ticker: z.string().trim().min(1).max(10),
  year: z.number().int().min(1900).max(2026),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive().max(100_000_000),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid input." }, { status: 400 });
  }
  const { ticker, year, month, amount } = parsed.data;
  const upper = ticker.toUpperCase();
  console.log(`[bagcheck] ▶ ${upper} ${monthName(month)} ${year} $${amount}`);

  let loaded;
  try {
    loaded = await loadSeries(upper, year, month);
  } catch (err) {
    console.error(`[bagcheck] ✗ Tako request failed:`, err);
    return NextResponse.json({
      error: "NO_DATA",
      message: "Couldn't reach the market-data service. Check the TAKO_API_KEY and try again.",
    });
  }

  if (!loaded || loaded.series.length === 0) {
    console.warn(`[bagcheck] ✗ NO_DATA — no usable series for ${upper}`);
    return NextResponse.json({ error: "NO_DATA", message: "Couldn't find price data for that ticker." });
  }

  const { card, series } = loaded;
  const math = computeBag(series, year, month, amount);
  if ("error" in math) {
    console.warn(`[bagcheck] ✗ computeBag ${math.error}: ${math.message}`);
    return NextResponse.json(math);
  }
  console.log(`[bagcheck] ✓ ${upper}: $${amount} → $${Math.round(math.currentValue)} (${math.multiple.toFixed(1)}×, start ${math.startDateActual})`);

  // Best-effort S&P 500 comparison — never let it block the main result.
  let benchmark = null;
  if (upper !== "SPY") {
    try {
      benchmark = await fetchBenchmark(year, month, amount);
    } catch (err) {
      console.error(`[bagcheck] benchmark failed (non-fatal):`, err);
    }
  }

  const result: BagResult = {
    ticker: upper,
    year,
    month,
    amount,
    ...math,
    embedUrl: card.embed_url,
    imageUrl: card.image_url,
    confidence: card.confidence,
    ...(benchmark ? { benchmark } : {}),
  };
  return NextResponse.json(result);
}
