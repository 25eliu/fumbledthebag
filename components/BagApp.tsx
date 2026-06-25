"use client";
import { useMemo, useState } from "react";
import BagForm, { type BagFormValues } from "@/components/BagForm";
import BagCard from "@/components/BagCard";
import TickerTakoCard from "@/components/TickerTakoCard";
import ShareRow from "@/components/ShareRow";
import { pickItems } from "@/lib/pick-items";
import { canonicalPath, seedFor } from "@/lib/url";
import { monthName } from "@/lib/format";
import type { BagResult, BagError, PickedItem } from "@/lib/types";

type Props = { initial?: Partial<BagFormValues>; initialResult?: BagResult };

function comparisonAmount(r: BagResult): number {
  // Compare against the size of the swing either way — the gain made, or the loss dodged.
  return Math.abs(r.gain);
}

export default function BagApp({ initial, initialResult }: Props) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BagResult | null>(initialResult ?? null);
  const [error, setError] = useState<BagError | null>(null);
  const [rerolls, setRerolls] = useState(0);
  const [excluded, setExcluded] = useState<string[]>([]);

  const items: PickedItem[] = useMemo(() => {
    if (!result) return [];
    const seed = `${seedFor(result)}${rerolls ? `#${rerolls}` : ""}`;
    return pickItems(comparisonAmount(result), seed, excluded);
  }, [result, rerolls, excluded]);

  async function runCheck(values: BagFormValues) {
    setPending(true);
    setError(null);
    setResult(null);
    setRerolls(0);
    setExcluded([]);
    try {
      const res = await fetch("/api/bagcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as BagResult | BagError;
      if ("error" in data) { setError(data); return; }
      setResult(data);
      window.history.replaceState(null, "", canonicalPath(data));
    } catch {
      setError({ error: "NO_DATA", message: "Something went wrong — try again." });
    } finally {
      setPending(false);
    }
  }

  const [lastTicker, setLastTicker] = useState(initial?.ticker ?? "");
  const [lastAmount, setLastAmount] = useState(initial?.amount ?? 10000);

  function handleSubmit(values: BagFormValues) {
    setLastTicker(values.ticker);
    setLastAmount(values.amount);
    void runCheck(values);
  }

  function reroll() {
    setExcluded((prev) => [...prev, ...items.map((i) => i.name)]);
    setRerolls((n) => n + 1);
  }

  return (
    <main className="min-h-dvh px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">fumbledthebag 🧢</h1>
        <p className="mt-1 text-ink/60">"I should've bought ___"</p>
      </header>

      <BagForm initial={initial} onSubmit={handleSubmit} pending={pending} />

      {error && (
        <div className="mx-auto mt-6 w-full max-w-[420px] rounded-xl2 bg-white p-6 text-center shadow-soft">
          <p className="font-semibold text-ink/80">
            {error.error === "IPO_AFTER" ? "📅 " : "🤔 "}{error.message}
          </p>
          {error.error === "IPO_AFTER" && error.suggestedYear && error.suggestedMonth && (
            <button
              onClick={() => runCheck({ ticker: lastTicker, amount: lastAmount, month: error.suggestedMonth!, year: error.suggestedYear! })}
              className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Try {monthName(error.suggestedMonth).slice(0, 3)} {error.suggestedYear}
            </button>
          )}
          {error.error === "NO_DATA" && (
            <p className="mt-2 text-sm text-ink/55">Try a preset like NVDA, TSLA, or AAPL.</p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <BagCard
            result={result}
            items={items}
            onReroll={reroll}
            tickerSlot={<TickerTakoCard ticker={result.ticker} embedUrl={result.embedUrl} imageUrl={result.imageUrl} />}
            shareSlot={
              <ShareRow
                ticker={result.ticker}
                year={result.year}
                resultUrl={typeof window !== "undefined" ? window.location.origin + canonicalPath(result) : canonicalPath(result)}
                ogImageUrl={`/api/og/${result.ticker}/${result.year}/${result.month}/${result.amount}`}
              />
            }
          />
        </div>
      )}
    </main>
  );
}
