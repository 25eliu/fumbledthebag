"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { parseDate } from "@/lib/parse-date";
import { companyName } from "@/lib/ticker-search";
import { formatMoney } from "@/lib/format";
import { pressable } from "@/lib/motion";
import TickerBlank from "@/components/TickerBlank";

export type BagFormValues = { ticker: string; month: number; year: number; amount: number };
type Props = { initial?: Partial<BagFormValues>; onSubmit: (v: BagFormValues) => void; pending?: boolean };

// amount slider: 0..1000 → $100..$100k on a log curve
const MIN = 100, MAX = 100_000;
const toAmount = (s: number) => Math.max(MIN, Math.round((MIN * Math.pow(MAX / MIN, s / 1000)) / 100) * 100);
const toSlider = (a: number) => Math.round((Math.log(Math.min(MAX, Math.max(MIN, a)) / MIN) / Math.log(MAX / MIN)) * 1000);

// inline date blank (mirrors the ticker blank's styling); width tracks the text
// so the highlight hugs the date at any length ("Mar 2020", "September 2020", …)
function DateBlank({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const placeholder = "Mar 2020";
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<string | number>(`${Math.max(8, value.length)}ch`);
  useEffect(() => {
    if (sizerRef.current) setWidth(sizerRef.current.offsetWidth);
  }, [value]);
  return (
    <span className="relative inline-block align-baseline">
      <span
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre px-1 font-semibold tracking-tight"
      >
        {value || placeholder}
      </span>
      <input
        value={value}
        style={{ width }}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="when"
        spellCheck={false}
        autoComplete="off"
        className="border-b-[3px] border-accent bg-accent/20 px-1 text-center font-semibold tracking-tight text-ink caret-ink outline-none transition-colors placeholder:text-ink/25 focus:bg-accent/40"
      />
    </span>
  );
}

export default function SentenceForm({ initial, onSubmit, pending }: Props) {
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [dateText, setDateText] = useState(initial?.month && initial?.year ? `${initial.month}/${initial.year}` : "");
  const [amount, setAmount] = useState(initial?.amount ?? 10000);
  const [error, setError] = useState<string | null>(null);

  const company = companyName(ticker);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ticker.trim()) { setError("name a ticker first."); return; }
    const parsed = parseDate(dateText);
    if ("error" in parsed) { setError(parsed.error); return; }
    onSubmit({ ticker: ticker.trim().toUpperCase(), month: parsed.month, year: parsed.year, amount });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center text-[clamp(2rem,6.5vw,4rem)] font-semibold leading-[1.3] tracking-tight text-ink"
      >
        i should&rsquo;ve bought{" "}
        <TickerBlank value={ticker} onChange={setTicker} placeholder="NVDA" />{" "}
        <span className="text-ink/45">in</span>{" "}
        <DateBlank value={dateText} onChange={setDateText} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-3 h-6 text-center text-base font-medium text-ink/45"
      >
        {company ? `— ${company}` : ""}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-8 max-w-md"
      >
        <p className="text-center text-2xl font-semibold tracking-tight text-ink">
          with <span className="rounded-lg bg-gain/10 px-2 py-0.5 text-gain">{formatMoney(amount)}</span> on the line
        </p>
        <input
          type="range" min={0} max={1000} value={toSlider(amount)}
          onChange={(e) => setAmount(toAmount(Number(e.target.value)))}
          aria-label="amount on the line"
          className="mt-4 w-full accent-gain"
        />
        <div className="flex justify-between text-xs font-medium text-ink/35">
          <span>$100</span><span>$100k</span>
        </div>
      </motion.div>

      {error && <p className="mt-4 text-center text-sm font-semibold text-loss">{error}</p>}

      <motion.button
        type="submit" {...pressable} disabled={pending}
        className="mx-auto mt-8 block rounded-full bg-ink px-9 py-3.5 text-lg font-semibold lowercase tracking-tight text-cream disabled:opacity-60"
      >
        {pending ? "counting the damage…" : "see the damage →"}
      </motion.button>
    </form>
  );
}
