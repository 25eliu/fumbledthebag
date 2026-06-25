"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { searchTickers, companyName, type TickerSuggestion } from "@/lib/ticker-search";

type TickerCard = { found: boolean; symbol: string; title?: string; imageUrl?: string; embedUrl?: string };

type Props = {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

// An inline fill-in-the-blank that auto-sizes to its text, suggests companies as
// you type, and previews a live Tako overview chart for the highlighted ticker.
export default function TickerBlank({ value, onChange, placeholder = "a ticker", autoFocus }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [previewSym, setPreviewSym] = useState<string | null>(null);
  const [card, setCard] = useState<TickerCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  const cache = useRef<Map<string, TickerCard>>(new Map());
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<string | number>(`${Math.max(4, (value || placeholder).length)}ch`);

  const suggestions = open && value.trim() ? searchTickers(value) : [];

  // size the input to the actual rendered text width so the highlight hugs the
  // word at any length (the `size` attr under-measures the wide Fredoka font)
  useEffect(() => {
    if (sizerRef.current) setWidth(sizerRef.current.offsetWidth);
  }, [value, placeholder]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // fetch the overview card for the previewed symbol (debounced + cached)
  useEffect(() => {
    if (!previewSym) { setCard(null); setLoadingCard(false); return; }
    const sym = previewSym;
    const hit = cache.current.get(sym);
    if (hit) { setCard(hit); setLoadingCard(false); return; }
    setCard(null);
    setLoadingCard(true);
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => {
      fetch(`/api/ticker-card?ticker=${encodeURIComponent(sym)}`)
        .then((r) => r.json())
        .then((data: TickerCard) => {
          cache.current.set(sym, data);
          setPreviewSym((cur) => {
            if (cur === sym) { setCard(data); setLoadingCard(false); }
            return cur;
          });
        })
        .catch(() => setLoadingCard(false));
    }, 180);
    return () => { if (fetchTimer.current) clearTimeout(fetchTimer.current); };
  }, [previewSym]);

  useEffect(() => () => { if (fetchTimer.current) clearTimeout(fetchTimer.current); }, []);

  function pick(s: TickerSuggestion) {
    onChange(s.symbol);
    setOpen(false);
    setPreviewSym(null);
  }

  function moveHighlight(delta: number) {
    if (suggestions.length === 0) return;
    const next = Math.min(suggestions.length - 1, Math.max(0, highlight + delta));
    setHighlight(next);
    setPreviewSym(suggestions[next]?.symbol ?? null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); moveHighlight(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveHighlight(-1); }
    else if (e.key === "Enter" && suggestions[highlight]) { e.preventDefault(); pick(suggestions[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <span ref={wrapRef} className="relative inline-block align-baseline">
      {/* invisible mirror of the input text to measure exact width */}
      <span
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-pre px-1 font-semibold uppercase tracking-tight"
      >
        {value || placeholder}
      </span>
      <input
        value={value}
        autoFocus={autoFocus}
        style={{ width }}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => { if (value.trim() && !companyName(value)) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-label="ticker"
        className="border-b-[3px] border-accent bg-accent/20 px-1 text-center font-semibold uppercase tracking-tight text-ink caret-ink outline-none transition-colors placeholder:text-ink/25 focus:bg-accent/40"
      />

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-30 mt-3 flex w-[min(86vw,440px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white text-left text-base shadow-soft sm:flex-row"
          >
            <ul className="max-h-64 shrink-0 overflow-y-auto py-1 sm:w-1/2">
              {suggestions.map((s, i) => (
                <li key={s.symbol}>
                  <button
                    type="button"
                    onMouseEnter={() => { setHighlight(i); setPreviewSym(s.symbol); }}
                    onClick={() => pick(s)}
                    className={`flex w-full flex-col items-start px-4 py-2 text-left leading-tight transition-colors ${
                      i === highlight ? "bg-accent/25" : "hover:bg-cream"
                    }`}
                  >
                    <span className="font-bold text-ink">{s.symbol}</span>
                    <span className="text-xs text-ink/55">{s.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex min-h-[140px] flex-1 items-center justify-center border-t border-ink/10 bg-cream/60 p-3 sm:border-l sm:border-t-0">
              {loadingCard ? (
                <div className="h-28 w-full animate-pulse rounded-xl bg-ink/5" />
              ) : card?.found && card.imageUrl ? (
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.imageUrl} alt={`${card.symbol} overview`} loading="lazy" className="h-28 w-full rounded-xl object-cover" />
                  <p className="mt-1.5 truncate text-center text-xs font-medium text-ink/60">{card.title}</p>
                </div>
              ) : (
                <p className="px-2 text-center text-xs text-ink/40">
                  {previewSym ? "no preview" : "hover a result to peek the chart"}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
