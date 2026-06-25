"use client";
import { motion } from "framer-motion";
import type { BagResult, PickedItem } from "@/lib/types";
import { formatMoney, formatMultiple, formatPercent, formatQty, monthName } from "@/lib/format";
import { useCountUp, cardReveal, rowStagger, rowItem } from "@/lib/motion";

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
  return <span>{formatMoney(animate ? counted : value)}</span>;
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
      className="mx-auto w-full max-w-[420px] rounded-xl2 bg-white p-7 shadow-soft"
    >
      <div className="flex items-center justify-between text-sm font-semibold text-ink/60">
        <span>fumbledthebag</span><span aria-hidden>🧢</span>
      </div>

      <p className="mt-4 text-lg leading-snug text-ink/80">
        If you put <b>{formatMoney(amount)}</b> into {tickerSlot ?? <b>{ticker}</b>} in <b>{monthName(sm)} {sy}</b>…
      </p>

      {isLoss ? (
        <div className="mt-5">
          <p className="text-base font-semibold text-ink/70">🫠 Good thing you didn't.</p>
          <p className={`mt-1 text-5xl font-bold ${accent}`}>
            <HeroNumber value={currentValue} animate={animate} />
          </p>
          <p className="mt-1 text-sm text-ink/60">left of your {formatMoney(amount)} ({formatPercent(returnPct)})</p>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink/50">it'd be worth</p>
          <p className={`mt-1 text-5xl font-bold ${accent}`}>
            <HeroNumber value={currentValue} animate={animate} />
          </p>
          <p className={`mt-1 text-2xl font-bold ${accent}`}>{formatMultiple(multiple)}</p>
        </div>
      )}

      <p className="mt-6 text-sm font-semibold text-ink/70">{isLoss ? "At least you dodged:" : "You could've bought:"}</p>
      <motion.ul
        variants={rowStagger}
        initial={animate ? "hidden" : false}
        animate="show"
        className="mt-2 space-y-2"
      >
        {items.map((item) => (
          <motion.li key={item.name} variants={rowItem} className="flex items-start gap-3 rounded-2xl bg-cream px-3 py-2">
            <span className="text-2xl" aria-hidden>{item.icon}</span>
            <span>
              <span className="font-semibold">{formatQty(item.qty)} {item.name}</span>
              <span className="block text-sm text-ink/55">{item.blurb}</span>
            </span>
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

      {snapped && (
        <p className="mt-3 text-xs text-ink/45">Closest data: {monthName(sm)} {sy} · via Tako</p>
      )}

      {shareSlot && <div className="mt-5">{shareSlot}</div>}
      <p className="mt-4 text-center text-xs text-ink/40">fumbledthebag · data via Tako</p>
    </motion.div>
  );
}
