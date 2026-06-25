# 🫠 fumbledthebag

> *"I should've bought ___."*

Punch in a stock, a date, and how much you *would've* put in — and find out exactly how badly you fumbled the bag. Then see what that money could've bought instead: from Chipotle burritos to a **billion GPT-4 tokens** to a private island. Every item links out so you can go buy your regret.

**→ [fumbledthebag.vercel.app](https://fumbledthebag.vercel.app)**

## How it works

You pick `NVDA · Jan 2020 · $1,000`. We fetch the split-adjusted price history, compute what those shares are worth today (`shares = $ / start price`, `value = shares × today's price`), and roll a few absurd things you could've bought with the gains. Share the receipt. Cry a little.

## Stack

- **[Tako](https://trytako.com)** — the market-data brain: natural-language `knowledge_search` resolves the ticker, `/contents` serves the (already split-adjusted) price series, and its chart **embed + image** power the result card and share images.
- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion** for the sentence-as-interface UI
- **@vercel/og** for dynamic share images
- **Upstash Redis** for a 24h price-series cache (no-op fallback if unset)
- **Vitest** + Testing Library — CI runs typecheck, tests, and build on every push
- Deployed on **Vercel**

## Run it

```bash
npm install
cp .env.example .env   # add your TAKO_API_KEY
npm run dev            # http://localhost:3000
npm test               # vitest
```

Only `TAKO_API_KEY` is required. The Upstash Redis vars are optional.

## The one file to edit

Want to add more things to fumble on? `data/items.ts` is the whole catalog — `{ icon, name, price, scale, url, blurb }`, sorted into `everyday → aspirational → flex → absurd`.

---

Open source. PRs welcome. Not financial advice (obviously).
