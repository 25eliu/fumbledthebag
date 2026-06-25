"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SentenceForm, { type BagFormValues } from "@/components/SentenceForm";
import BagCard from "@/components/BagCard";
import TickerTakoCard from "@/components/TickerTakoCard";
import ShareRow from "@/components/ShareRow";
import { pickItems } from "@/lib/pick-items";
import { canonicalPath, seedFor } from "@/lib/url";
import { monthName, formatMoney } from "@/lib/format";
import { summaryBar } from "@/lib/motion";
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
  const [editing, setEditing] = useState(false);
  const [rerolls, setRerolls] = useState(0);
  const [excluded, setExcluded] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const items: PickedItem[] = useMemo(() => {
    if (!result) return [];
    const seed = `${seedFor(result)}${rerolls ? `#${rerolls}` : ""}`;
    return pickItems(comparisonAmount(result), seed, excluded);
  }, [result, rerolls, excluded]);

  // bring the card into focus once it reveals (skip under reduced motion)
  useEffect(() => {
    if (result && !editing && !reduce) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [result, editing, reduce]);

  async function runCheck(values: BagFormValues) {
    setPending(true);
    setError(null);
    setResult(null);
    setEditing(false);
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

  const showCard = result && !editing;
  const formInitial: Partial<BagFormValues> | undefined =
    editing && result ? { ticker: result.ticker, month: result.month, year: result.year, amount: result.amount } : initial;

  return (
    <main className={`flex min-h-dvh flex-col px-4 ${showCard || error ? "py-10" : "justify-center py-10"}`}>
      <AnimatePresence mode="wait">
        {!showCard ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
          >
            <SentenceForm initial={formInitial} onSubmit={handleSubmit} pending={pending} />

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
                  <p className="mt-2 text-sm text-ink/55">Try a well-known ticker like NVDA, TSLA, or AAPL.</p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.button
              variants={summaryBar}
              initial="hidden"
              animate="show"
              onClick={() => setEditing(true)}
              className="mx-auto mb-6 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink/70 shadow-soft hover:text-ink"
            >
              <span>{result.ticker} · {monthName(result.month).slice(0, 3)} {result.year} · {formatMoney(result.amount)}</span>
              <span className="text-ink/40">· edit</span>
            </motion.button>

            <div ref={cardRef}>
              <BagCard
                result={result}
                items={items}
                onReroll={reroll}
                tickerSlot={<TickerTakoCard ticker={result.ticker} embedUrl={result.embedUrl} imageUrl={result.imageUrl} />}
                shareSlot={
                  <ShareRow
                    ticker={result.ticker}
                    resultUrl={typeof window !== "undefined" ? window.location.origin + canonicalPath(result) : canonicalPath(result)}
                    ogImageUrl={`/api/og/${result.ticker}/${result.year}/${result.month}/${result.amount}`}
                  />
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
