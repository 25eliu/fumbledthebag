"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { xShareUrl } from "@/lib/url";
import { pressable } from "@/lib/motion";

type Props = { ticker: string; year: number; resultUrl: string; ogImageUrl: string };

export default function ShareRow({ ticker, year, resultUrl, ogImageUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <motion.a
        {...pressable} href={xShareUrl(ticker, year, resultUrl)} target="_blank" rel="noopener noreferrer"
        className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
      >
        Share to X
      </motion.a>
      <motion.button {...pressable} onClick={copy} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-soft">
        {copied ? "Copied!" : "Copy link"}
      </motion.button>
      <motion.a
        {...pressable} href={ogImageUrl} download={`fumbledthebag-${ticker}.png`}
        aria-label="Download image" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-soft"
      >
        ⬇ Download
      </motion.a>
    </div>
  );
}
