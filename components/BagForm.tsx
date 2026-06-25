"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { parseDate } from "@/lib/parse-date";
import { formatMoney } from "@/lib/format";
import { pressable } from "@/lib/motion";

const PRESETS = ["NVDA", "TSLA", "AAPL", "BTC", "GME", "AMZN", "MSTR", "PLTR"];

export type BagFormValues = { ticker: string; month: number; year: number; amount: number };
type BagFormProps = { initial?: Partial<BagFormValues>; onSubmit: (v: BagFormValues) => void; pending?: boolean };

// Slider 0..1000 → dollars on a friendly curve ($100..$100k).
const MIN = 100, MAX = 100_000;
function sliderToAmount(s: number): number {
  const f = s / 1000;
  const v = MIN * Math.pow(MAX / MIN, f);
  return Math.max(MIN, Math.round(v / 100) * 100);
}
function amountToSlider(a: number): number {
  const clamped = Math.min(MAX, Math.max(MIN, a));
  return Math.round((Math.log(clamped / MIN) / Math.log(MAX / MIN)) * 1000);
}

export default function BagForm({ initial, onSubmit, pending }: BagFormProps) {
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [dateText, setDateText] = useState(
    initial?.month && initial?.year ? `${initial.month}/${initial.year}` : ""
  );
  const [amount, setAmount] = useState(initial?.amount ?? 10000);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ticker.trim()) { setError("Pick a ticker."); return; }
    const parsed = parseDate(dateText);
    if ("error" in parsed) { setError(parsed.error); return; }
    onSubmit({ ticker: ticker.trim().toUpperCase(), month: parsed.month, year: parsed.year, amount });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[480px]">
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <motion.button
            key={p}
            type="button"
            {...pressable}
            onClick={() => setTicker(p)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${ticker === p ? "bg-ink text-cream" : "bg-white text-ink shadow-soft"}`}
          >
            {p}
          </motion.button>
        ))}
      </div>

      <div className="mt-4 space-y-4 rounded-xl2 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1">
          <label htmlFor="ticker" className="text-sm font-semibold text-ink/60">ticker</label>
          <input
            id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="NVDA" className="rounded-2xl bg-cream px-4 py-2 text-lg font-bold outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="when" className="text-sm font-semibold text-ink/60">when</label>
          <input
            id="when" value={dateText} onChange={(e) => setDateText(e.target.value)}
            placeholder="Mar 2020" className="rounded-2xl bg-cream px-4 py-2 text-lg outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <label htmlFor="amount" className="text-sm font-semibold text-ink/60">amount</label>
            <input
              aria-label="amount in dollars" inputMode="numeric" value={formatMoney(amount)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                if (Number.isFinite(n) && n > 0) setAmount(Math.min(MAX, Math.max(MIN, n)));
              }}
              className="w-32 bg-transparent text-right text-xl font-bold outline-none"
            />
          </div>
          <input
            id="amount" type="range" min={0} max={1000} value={amountToSlider(amount)}
            onChange={(e) => setAmount(sliderToAmount(Number(e.target.value)))}
            className="accent-ink"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-center text-sm font-semibold text-loss">{error}</p>}

      <motion.button
        type="submit" {...pressable} disabled={pending}
        className="mx-auto mt-4 block rounded-full bg-ink px-8 py-3 text-lg font-bold text-cream disabled:opacity-60"
      >
        {pending ? "checking…" : "CHECK MY BAG"}
      </motion.button>
    </form>
  );
}
