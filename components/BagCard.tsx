"use client";
import { motion } from "framer-motion";
import type { BagResult, PickedItem } from "@/lib/types";
import { formatMoney, formatMultiple, formatPercent, formatQty, monthName } from "@/lib/format";
import { useCountUp, cardReveal, sectionStagger, sectionItem, rowStagger, rowItem } from "@/lib/motion";

type BagCardProps = {
  result: BagResult;
  items: PickedItem[];
  onReroll?: () => void;
  tickerSlot?: React.ReactNode;
  shareSlot?: React.ReactNode;
  animate?: boolean;
};

function HeroNumber({ value, animate }: { value: number; animate: boolean }) {
  const counted = useCountUp(value, 900);
  return <span className="tabular-nums">{formatMoney(animate ? counted : value)}</span>;
}

function benchmarkLine(result: BagResult): string | null {
  const b = result.benchmark;
  if (!b) return null;
  return result.multiple >= b.multiple
    ? `You even beat ${b.label} — it'd be ${formatMoney(b.currentValue)}.`
    : `Even ${b.label} would've made it ${formatMoney(b.currentValue)}.`;
}

export default function BagCard({ result, items, onReroll, tickerSlot, shareSlot, animate = true }: BagCardProps) {
  const { ticker, year, month, amount, currentValue, multiple, returnPct, snapped, startDateActual, isLoss } = result;
  const accent = isLoss ? "text-loss" : "text-gain";
  const [sy, sm] = startDateActual.split("-").map(Number);

  return (
    <motion.div
      variants={cardReveal}
      initial={animate ? "hidden" : false}
      animate="show"
      className="mx-auto w-full max-w-[760px] rounded-xl2 bg-white p-7 shadow-soft sm:p-8"
    >
      <p className="text-lg leading-snug text-ink/80">
        If you put <b>{formatMoney(amount)}</b> into {tickerSlot ?? <b>{ticker}</b>} in <b>{monthName(sm)} {sy}</b>…
      </p>

      <motion.div
        variants={sectionStagger}
        initial={animate ? "hidden" : false}
        animate="show"
        className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8"
      >
        {/* Left cell — the punch */}
        <motion.div variants={sectionItem} className="text-left">
          {isLoss ? (
            <>
              <p className="text-base font-semibold text-ink/70">🫠 Good thing you didn{"'"}t.</p>
              <p className={`mt-1 text-5xl font-bold sm:text-6xl ${accent}`}>
                <HeroNumber value={currentValue} animate={animate} />
              </p>
              <p className="mt-1 text-sm text-ink/60">left of your {formatMoney(amount)} ({formatPercent(returnPct)})</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">it{"'"}d be worth</p>
              <p className={`mt-1 text-5xl font-bold sm:text-6xl ${accent}`}>
                <HeroNumber value={currentValue} animate={animate} />
              </p>
              <p className={`mt-1 text-3xl font-bold ${accent}`}>{formatMultiple(multiple)}</p>
            </>
          )}
          {benchmarkLine(result) && (
            <p className="mt-3 text-sm text-ink/60">{benchmarkLine(result)}</p>
          )}
        </motion.div>

        {/* Right cell — the flex */}
        <motion.div variants={sectionItem}>
          <p className="text-sm font-semibold text-ink/70">
            {isLoss ? "At least you dodged any one of these:" : "You could've bought any one of these:"}
          </p>
          <motion.ul
            variants={rowStagger}
            initial={animate ? "hidden" : false}
            animate="show"
            className="mt-2 space-y-2"
          >
            {items.map((item) => (
              <motion.li key={item.name} variants={rowItem}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-2xl bg-cream px-3 py-2 transition hover:bg-cream/70 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/40"
                >
                  <span className="text-2xl" aria-hidden>{item.icon}</span>
                  <span className="flex-1">
                    <span className="font-semibold">{formatQty(item.qty)} {item.name}</span>
                    <span className="block text-sm text-ink/55">{item.blurb}</span>
                  </span>
                  <span className="self-center text-ink/30 transition group-hover:text-ink/60" aria-hidden>↗</span>
                </a>
              </motion.li>
            ))}
          </motion.ul>
          {onReroll && (
            <div className="mt-2 text-right">
              <button onClick={onReroll} className="text-sm font-semibold text-ink/50 hover:text-ink/80" aria-label="Reroll the items">
                ↻ reroll
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Full-width footer */}
      <div className="mt-7 border-t border-ink/10 pt-5">
        {shareSlot}
        <div className="mt-3 flex flex-col items-center gap-1 text-center">
          {snapped && (
            <p className="text-xs text-ink/45">Closest data: {monthName(sm)} {sy} · via Tako</p>
          )}
          <p className="text-xs text-ink/40">fumbledthebag · data via Tako</p>
        </div>
      </div>
    </motion.div>
  );
}
