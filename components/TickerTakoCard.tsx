"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { popover } from "@/lib/motion";

type Props = { ticker: string; embedUrl: string; imageUrl: string };

export default function TickerTakoCard({ ticker, embedUrl, imageUrl }: Props) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // No Tako card (e.g. a Yahoo-fallback ticker like MU) → no live chart to show.
  // Render a plain, non-interactive chip instead of a broken image/iframe.
  if (!embedUrl) {
    return (
      <span className="inline-flex items-center rounded-full bg-accent/70 px-2.5 py-0.5 font-bold text-ink">
        {ticker}
      </span>
    );
  }

  const enter = () => { hoverTimer.current = setTimeout(() => setHovered(true), 120); };
  const leave = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHovered(false); };

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span className="relative inline-block" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-accent/70 px-2.5 py-0.5 font-bold text-ink hover:bg-accent"
      >
        {ticker} <span aria-hidden>▸</span>
      </button>

      <AnimatePresence>
        {hovered && !open && (
          <motion.span
            variants={popover}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute left-1/2 top-full z-20 mt-2 block w-72 -translate-x-1/2 overflow-hidden rounded-2xl bg-white p-2 shadow-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`${ticker} chart`} loading="lazy" className="h-40 w-full rounded-xl object-cover" />
            <span className="mt-1 block text-center text-xs text-ink/50">Click for the live chart</span>
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${ticker} live chart`}
              tabIndex={-1}
              variants={popover}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-xl2 bg-white shadow-soft"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-bold">{ticker}</span>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink/50 hover:text-ink">✕</button>
              </div>
              <iframe src={embedUrl} title={`${ticker} chart`} className="h-[420px] w-full border-0" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
