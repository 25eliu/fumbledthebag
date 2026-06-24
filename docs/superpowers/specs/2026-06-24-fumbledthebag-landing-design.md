# fumbledthebag — One-Page Toy: Design Spec

**Date:** 2026-06-24
**Status:** Approved for implementation planning
**Scope:** The landing page as a fully working, shippable single-page toy (real Tako data, a local curated comparison list, inline result card, industry-standard share). Source product spec: "Bag Check — One-Shot Build Prompt" (kept as the canonical reference for the Tako contract and math; its LLM roast engine is intentionally replaced by a local list — see §7).

---

## 1. Product in one sentence

**fumbledthebag** lets you answer "I should've bought ___" and instantly see what that money would be worth now — wrapped in a light, playful, shareable card showing 3 funny things you could've bought with the gains. The regret is the joke; the cheerful wrapper makes it funnier.

**Core loop:** land → pick ticker + month + year + amount → hit *Check my bag* → card slides in → laugh at the 3 "you could've bought" items → reroll → share.

**Success = the share.** Every result has a clean, server-rendered URL that unfurls a crisp card image in X, iMessage, and Discord. If sharing isn't frictionless, the build failed.

---

## 2. Decisions locked in this spec

These are settled. Do not relitigate during planning or implementation.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Wordmark / brand** | `fumbledthebag` (lead brand). 🧢 mark. | Meme-native, matches the domain/repo, leans into the regret hook. |
| **First-load experience** | Instant playable form. No hero, no scroll. Form is the landing, above the fold. | "Immediately going into it they can do it." Zero friction. |
| **Result reveal** | Inline, same page. Card slides in below the form; form stays so users can tweak and re-check. URL updates in place to the canonical result URL. | Toy-like, fastest, no reload. |
| **Aesthetic** | Light, playful, lighter colors, rounded edges, clear, not-serious. | Departure from the source spec's dark mode — chosen deliberately. The cheerful wrapper makes the regret funnier and fits the name. |
| **Typography** | One typeface everywhere. Single font family across wordmark, form, card, and OG image — vary only weight/size, never the family. | Cohesive, clean, intentional look. The same font must be bundled into the `@vercel/og` renderer so the share image matches. |
| **Amount input** | A **slider** is the primary control, with the live dollar value displayed (and editable). | User-requested. Dragging the bag size is tactile and playful. |
| **Date input** | A **typed date field** (parsed to month + year). | User-requested. Type "Mar 2020" / "3/2020" rather than picking from dropdowns. |
| **Card look** | Light & playful everywhere, including the OG share image. One look across screen and share. | Cohesive identity; the funny content carries the levity, not dark chrome. |
| **Scope** | Landing page, fully working end-to-end (real Tako + local comparison list + inline card + share). | Shippable single-page experience. |
| **Sharing** | Industry-standard card-component sharing via server-rendered OG image unfurl. | The artifact IS the share. |
| **Caching** | Lean Redis caching included at launch (Tako series only). | Cheap insurance against torching Tako credits on a viral spike. |
| **Comparison engine** | **No LLM.** A hand-curated list of items (icon + name + price + blurb + scale) in one editable file, plus a **seeded randomizer** that mixes a few items by scale. | User owns the comparisons by editing one file; no Anthropic dependency, no LLM bill, instant + reproducible. |

### Fixed tech (from source spec, unchanged)

- **Next.js 14 (App Router) + TypeScript + Tailwind.** Server Route Handlers mandatory — API keys never touch the client.
- **Vercel** hosting + `@vercel/og` (Satori) for dynamic share images.
- **Upstash Redis** (or Vercel KV) for caching.
- **Tako** is the only market-data source. The funny comparisons come from a **local curated list** (no LLM, no Anthropic API).
- Icons = **emoji** for MVP (render in OG/Satori; bundle Noto Color Emoji or Twemoji SVGs).
- Env vars (server only): `TAKO_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

---

## 3. The "one page, two URLs" architecture (the key reconciliation)

The app is **one page component**, served at two URLs:

- **`/`** — the empty/default state. What everyone lands on: wordmark + form, nothing below.
- **`/c/[ticker]/[year]/[month]/[amount]`** — the *same* page component, pre-filled from the URL params, **server-rendered with per-result OG meta tags**.

**Why two URLs instead of a pure client-side URL update:** sharing is the entire point. For a shared link to unfurl with the card image on X/iMessage/Discord, the shared URL must be a real server-rendered route carrying per-result OG tags. A client-side `history.pushState` alone leaves social scrapers seeing the empty homepage with no image. So:

- On `/`, hitting **Check my bag** fetches data, slides the card in **inline (no reload)**, and rewrites the URL to `/c/...` via the History API.
- The Share / Copy-link buttons hand out the `/c/...` URL — which unfurls correctly because it is a genuine server-rendered route.
- A visitor opening a `/c/...` link directly gets the same page with the form pre-filled and the result already shown, plus correct OG metadata.

It feels like one seamless toy; sharing is industry-standard underneath. There is no second "page" in the user's mental model — the page just fills in.

### Data flow

```
Client (one page: form + inline card)
   │  Default route: /         (empty state)
   │  Shareable:     /c/[ticker]/[year]/[month]/[amount]  (server-rendered, OG meta)
   ▼
/api/bagcheck (server)
   ├─ cache key bag:{ticker}:{year}:{month}  ──hit──► cached series + matched price
   ├─ takoSearch("<ticker> monthly stock price from <Mon Year> to present")
   ├─ normalize x labels → snap startPoint (§6) + currentPoint
   ├─ compute shares / currentValue / multiple / returnPct
   └─ return { startPrice, startDateActual, currentPrice, multiple, currentValue,
               gain, returnPct, snapped, embed_url, image_url, confidence }
   ▼
pickItems(gain, seed, exclude[])  — pure function, runs client-side AND in the OG renderer
   └─ seeded randomizer over the local curated list → 3 items mixed by scale, qty = gain / price
   ▼
Card renders inline: header • big count-up number • multiple • 3 icon+thing rows •
                     ticker chip (→ Tako embed modal) • share row
   ▼
/api/og/[ticker]/[year]/[month]/[amount] → @vercel/og renders the SAME card as PNG
```

Money math stays on the **server**. The client only renders.

---

## 4. Routes & modules

| Path | Type | Responsibility |
|------|------|----------------|
| `/` | Page (client islands) | Empty-state landing: wordmark, form, preset chips. Submitting reveals card inline + rewrites URL. |
| `/c/[ticker]/[year]/[month]/[amount]` | Page (server component) | Same UI, pre-filled + result shown; exports `generateMetadata` for per-result OG/Twitter tags. |
| `/api/bagcheck` | Route Handler | Tako fetch + month-snap + return math (§6). Cached. |
| `/api/og/[ticker]/[year]/[month]/[amount]` | Route Handler | `@vercel/og` renders the card as a PNG (calls `pickItems` with the canonical seed so the image matches the page). |

There is **no roast/comparison API route** — item selection is a pure local function with no secret, so it runs client-side and inside the OG renderer.

Keep files small and focused (per coding-style rules). Suggested modules:

- `lib/tako.ts` — Tako client (exact contract from source spec §3).
- `lib/bag-math.ts` — `toYearMonth`, `pickStart`, `computeBag` (the bulletproof part; pure functions, unit-tested).
- `data/items.ts` — **the one file you edit.** A flat list of comparison items: `{ icon, name, price, scale, blurb }` where `scale ∈ "everyday" | "aspirational" | "flex"`. Add/edit freely; no code changes needed.
- `lib/pick-items.ts` — `pickItems(amount, seed, exclude[])`: seeded randomizer that selects 3 items (preferring one per scale when possible), computes `qty = floor(amount / price)` (drops items with `qty < 1`), and returns `{ icon, name, price, scale, blurb, qty }[]`. Pure + deterministic for a given seed.
- `lib/cache.ts` — Redis get/set wrappers + `bag:` key builder.
- `lib/format.ts` — money/multiple/percent formatters.
- `lib/parse-date.ts` — parse the typed date field (`"Mar 2020"`, `"March 2020"`, `"3/2020"`, `"2020-03"`, etc.) → `{ month, year }` or a clear parse error; clamp year to range, ignore any day.
- `components/BagForm.tsx` — the form (ticker input + preset chips, month/year dropdowns, amount input + quick chips, submit).
- `components/BagCard.tsx` — the single card component reused by the live page AND the OG renderer.
- `components/TickerEmbedModal.tsx` — modal wrapping Tako's `embed_url` iframe.
- `components/ShareRow.tsx` — Share to X / Copy link / Download.

---

## 5. The page UI (light, playful, rounded, clear)

### Layout

```
            fumbledthebag 🧢                       ← wordmark, rounded, friendly
        "I should've bought ___"                   ← playful subhead

   [NVDA] [TSLA] [AAPL] [BTC] [GME] [AMZN] [MSTR] [PLTR]   ← preset chips (rounded pills)
   ┌──────────────────────────────────────────────┐
   │  ticker [______]    when [ Mar 2020 ]          │  ← typed date field
   │                                                │
   │  amount        $10,000                         │  ← live value, editable
   │  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○        │  ← slider (primary control)
   └──────────────────────────────────────────────┘
              (   CHECK MY BAG   )                  ← big rounded primary button

   ───────────  card slides in here on submit  ───────────
```

### Inputs (only these — no day)

| Field  | Type        | UI                                | Notes |
|--------|-------------|-----------------------------------|-------|
| ticker | string      | text input + ~8 preset chips      | NVDA, TSLA, AAPL, BTC, GME, AMZN, MSTR, PLTR |
| date   | month + year | **typed date field**, parsed to month + year | Accepts `"Mar 2020"`, `"March 2020"`, `"3/2020"`, `"2020-03"`. Day (if typed) is ignored — the math model is month+year only. Clamp year to 2015–(now-1); reject/normalize unparseable input with an inline hint. |
| amount | USD number  | **slider** (primary) + editable value display | Default $10,000. Slider range ~$100–$100k on a friendly (e.g. log-ish) scale; the dollar value shown above the slider is also a directly-editable input so power users can type an exact figure. |

### Page states

- **Empty** — form only (the `/` landing).
- **Loading** — submit button → spinner; a playful skeleton card occupies the reveal slot.
- **Result** — card slides in below; form stays above for tweak-and-re-check.
- **Error** — friendly inline message in the reveal slot (§7).

### Visual language

Light background, lighter/soft color palette, generously rounded corners, soft shadows, clear big friendly type, gentle motion (slide-in, count-up, bounce on chips). Green for gains; a wry muted red for losses. Avoid generic-template feel — intentional playful identity. (Implementation phase uses the artifact-design / frontend-design taste guidance.)

**One typeface everywhere.** A single font family is used across the wordmark, form, card, and share image — hierarchy comes from weight and size only, never from switching families. The same font file is bundled into the `@vercel/og` renderer so the OG PNG matches the on-screen card exactly.

---

## 6. Return math + month-snapping (must be bulletproof)

Implement exactly per source spec §7. Pure functions in `lib/bag-math.ts`:

- `toYearMonth(x)` — normalize Tako's `x` labels (`"2020-01"`, `"Jan 2020"`, `"2020-01-31"`, `"2020"`) → `"YYYY-MM"` or `null`. **Adjust to the real format discovered in Phase 0.**
- `pickStart(data, year, month)` — exact month, else nearest month ≥ target, else first available.
- `computeBag(data, year, month, amount)` — returns `startPrice`, `startDateActual`, `currentPrice`, `multiple`, `currentValue`, `gain`, `returnPct`, `snapped`.

Rules:
- Snap target much later than requested (> 2 months) → return `IPO_AFTER` with suggested earliest month.
- Round displayed money sensibly ($12,431, not $12431.04). `multiple` to 1 decimal.
- Surface the *actual* matched month in fine-print ("Closest data: Mar 2020 · via Tako") so numbers stay honest.
- Negative return is a feature (§7 edge cases).
- Never render `NaN` / `Infinity`; format huge multiples cleanly (`1,240×`).

---

## 7. The comparison engine (local list + seeded picker) + edge cases

### "You could've bought" (no LLM)

All comparisons come from `data/items.ts` — a hand-curated list the owner edits freely. Each item:

```ts
{ icon: "🌯", name: "Chipotle burritos", price: 12, scale: "everyday", blurb: "Guac included, obviously." }
```

`scale ∈ "everyday" | "aspirational" | "flex"`. `pickItems(amount, seed, exclude[])`:

- Filters out items the amount can't afford (`floor(amount / price) < 1`) and anything in `exclude[]`.
- Selects **3** items, preferring one from each scale (everyday / aspirational / flex) when the budget allows, so the card always mixes a cheap laugh, an aspirational one, and a flex. Falls back gracefully if a scale has no affordable item.
- Computes `qty = floor(amount / price)` per item; renders `{qty} {name}` with the stored `blurb` underneath.
- **Seeded + deterministic:** the seed is derived from the canonical params (`ticker|year|month|amount`). The default first selection is reproducible — so the OG share image always matches what the user saw, with **no caching needed** for comparisons.

**Reroll** = re-run `pickItems` with a bumped seed and the current 3 items added to `exclude[]`; animate the rows swapping. Reroll is purely client-side and does not change the shared/OG canonical selection.

If the curated list ever can't fill 3 affordable items (tiny gain), show as many as qualify (1–2) rather than padding.

### Edge cases (all handled, all kept playful)

- **IPO_AFTER** — "📅 NVDA wasn't public yet in 2010 — earliest is Jan 1999." One-tap fix to earliest month.
- **NO_DATA** — friendly retry; offer known-good preset tickers. (Server retries once with looser query `"<ticker> stock price history"` before giving up.)
- **Negative return** — flip the card: "🫠 Good thing you didn't. You'd have **$3,100** left of your $10k." Then 3 "what you dodged" items via the **same `pickItems`** over the loss amount, with a loss-framing copy variant. Losses are *more* shareable — lean in.
- **Unknown/typo ticker** — validate against returned card title; mismatch → suggest closest preset.
- **Crypto (BTC/ETH)** — best-effort; render if Tako returns a clean series.
- **Huge multiples** — format cleanly, never `NaN`/`Infinity`.

---

## 8. Sharing + caching (the viral engine)

### Sharing (industry-standard OG unfurl)

- `/c/...` exports `generateMetadata` setting:
  - `og:title` = `"$10k in NVDA (Mar 2020) → $234,100"`
  - `og:image` = `/api/og/NVDA/2020/3/10000`
  - `twitter:card` = `summary_large_image`
- `/api/og/...` renders the **same `BagCard` component** as a PNG via `@vercel/og`, so the share image matches the screen exactly. Bundle an emoji font (Noto Color Emoji) or use Twemoji SVGs so emoji render in Satori.
- **Share row:** Share to X (`twitter.com/intent/tweet` with prefilled hook `"I should've bought $NVDA in 2020 😭 fumbled the bag:"` + the `/c/...` url), Copy link, Download PNG.

### Caching (lean, at launch)

- `bag:{ticker}:{year}:{month}` → Tako series + `fetchedAt`. Historical start prices never change; refresh only if the stored series is > 24h old (current point staleness).
- No comparison cache needed — `pickItems` is a cheap deterministic local function.
- Edge cache headers on `/c/*` and `/api/og/*`.
- Rationale: a viral spike means thousands of identical `$10k NVDA 2020` requests; cache-first protects Tako credits.

---

## 9. Build order

**Phase 0 — Tako spike (first, before any UI).** Throwaway script hits the real endpoint with the key for NVDA / TSLA / AAPL, `from Jan 2020 to present`. Confirm: (a) monthly-ish series back to 2020, (b) the real `x` format, (c) we can snap to a target month. Tune `toYearMonth` to the real format. Decide the snap rule if any ticker is coarser than monthly. **Everything downstream assumes this works — verify first.**

**Phase 1 — Core loop, unstyled.** Form → `/api/bagcheck` → `pickItems` over the curated list → plain inline result. Real numbers, real items from `data/items.ts`, reroll works.

**Phase 2 — The card + page.** Build `BagCard` (light/playful), `BagForm`, ticker→embed modal, count-up, reroll animation, slide-in, the four page states. Apply the light/playful/rounded visual language.

**Phase 3 — Virality.** `/c/...` server route + `generateMetadata`, `/api/og/...` PNG, Share-to-X / Copy / Download, in-place URL rewrite from `/`.

**Phase 4 — Caching + edges.** Redis caching for Tako series (§8), all §7 edge cases, rate-limit friendliness.

**Phase 5 — Polish.** Preset chips, loading skeletons, mobile layout, share analytics.

---

## 10. Testing

- **Unit (priority):** `lib/bag-math.ts` — `toYearMonth` across all label formats, `pickStart` snapping (exact / nearest-after / IPO-after), `computeBag` math incl. negative returns and huge multiples. `lib/pick-items.ts` — determinism for a fixed seed, scale-mixing, affordability filter (`qty ≥ 1`), `exclude[]` honored on reroll, graceful 1–2 item fallback on tiny amounts. `lib/format.ts` formatters. `lib/parse-date.ts` across accepted formats + unparseable input + year clamping.
- **Integration:** `/api/bagcheck` (mock Tako: happy path, NO_DATA, IPO_AFTER, looser-query retry).
- **Component:** `BagCard` across states (gain, loss, snapped fine-print, huge multiple); `BagForm` validation/clamping, slider ↔ editable-value sync, typed-date parsing/hint.
- **OG smoke:** `/api/og/...` returns a valid PNG for a known input.

---

## 11. Definition of done

A stranger lands on `fumbledthebag`, types `TSLA / Jan / 2019 / $5,000`, hits Check my bag, watches the card slide in with a real current value and 3 funny things, rerolls them once, clicks the ticker to see the live Tako chart, taps **Share to X** — and the tweet unfurls a crisp image of that exact light/playful card. All in under 5 seconds, even under load.
