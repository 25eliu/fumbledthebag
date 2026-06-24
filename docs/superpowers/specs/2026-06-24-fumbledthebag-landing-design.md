# fumbledthebag — One-Page Toy: Design Spec

**Date:** 2026-06-24
**Status:** Approved for implementation planning
**Scope:** The landing page as a fully working, shippable single-page toy (real Tako data, real Claude roasts, inline result card, industry-standard share). Source product spec: "Bag Check — One-Shot Build Prompt" (kept as the canonical reference for the Tako contract, math, and roast engine).

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
| **Card look** | Light & playful everywhere, including the OG share image. One look across screen and share. | Cohesive identity; the funny content carries the levity, not dark chrome. |
| **Scope** | Landing page, fully working end-to-end (real Tako + real Claude + inline card + share). | Shippable single-page experience. |
| **Sharing** | Industry-standard card-component sharing via server-rendered OG image unfurl. | The artifact IS the share. |
| **Caching** | Lean Redis caching included at launch. | Cheap insurance against torching Tako credits / LLM bill on a viral spike. |

### Fixed tech (from source spec, unchanged)

- **Next.js 14 (App Router) + TypeScript + Tailwind.** Server Route Handlers mandatory — API keys never touch the client.
- **Vercel** hosting + `@vercel/og` (Satori) for dynamic share images.
- **Upstash Redis** (or Vercel KV) for caching.
- **Tako** is the only market-data source. **Anthropic API** (Claude, `claude-sonnet-4-6`) generates the funny comparisons.
- Icons = **emoji** for MVP (render in OG/Satori; bundle Noto Color Emoji or Twemoji SVGs).
- Env vars (server only): `TAKO_API_KEY`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

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
/api/roast (server)
   └─ Claude → 3 funny "you could've bought" items as strict JSON. Cached + rerollable.
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
| `/api/roast` | Route Handler | Claude → 3 items. Accepts `exclude[]` for rerolls. First roll cached, rerolls bypass cache. |
| `/api/og/[ticker]/[year]/[month]/[amount]` | Route Handler | `@vercel/og` renders the card as a PNG. |

Keep files small and focused (per coding-style rules). Suggested modules:

- `lib/tako.ts` — Tako client (exact contract from source spec §3).
- `lib/bag-math.ts` — `toYearMonth`, `pickStart`, `computeBag` (the bulletproof part; pure functions, unit-tested).
- `lib/roast.ts` — Claude call + defensive JSON parse + hardcoded fallback set.
- `lib/cache.ts` — Redis get/set wrappers + key builders + `gainBucket`.
- `lib/format.ts` — money/multiple/percent formatters.
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
   │  ticker [______]    when [Mar ▾] [2020 ▾]      │
   │  amount [$10,000]   ·  $100   $1k   $10k        │
   └──────────────────────────────────────────────┘
              (   CHECK MY BAG   )                  ← big rounded primary button

   ───────────  card slides in here on submit  ───────────
```

### Inputs (only these — no day)

| Field  | Type        | UI                                | Notes |
|--------|-------------|-----------------------------------|-------|
| ticker | string      | text input + ~8 preset chips      | NVDA, TSLA, AAPL, BTC, GME, AMZN, MSTR, PLTR |
| month  | 1–12        | dropdown                          | month names |
| year   | 2015–(now-1)| dropdown                          | clamped to sane range |
| amount | USD number  | input + quick chips $100/$1k/$10k | default $10,000 |

### Page states

- **Empty** — form only (the `/` landing).
- **Loading** — submit button → spinner; a playful skeleton card occupies the reveal slot.
- **Result** — card slides in below; form stays above for tweak-and-re-check.
- **Error** — friendly inline message in the reveal slot (§7).

### Visual language

Light background, lighter/soft color palette, generously rounded corners, soft shadows, clear big friendly type, gentle motion (slide-in, count-up, bounce on chips). Green for gains; a wry muted red for losses. Avoid generic-template feel — intentional playful identity. (Implementation phase uses the artifact-design / frontend-design taste guidance.)

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

## 7. The roast engine + edge cases

### Roast (`/api/roast`, Claude)

Exactly per source spec §8: `claude-sonnet-4-6`, `max_tokens: 1000`, strict JSON of exactly 3 items `{ icon, thing, qty, blurb }`. Defensive parse (strip fences, `JSON.parse`, validate 3 items, hardcoded fallback on failure). Reroll re-calls with current items added to `exclude[]` at `temperature ≈ 0.9`. First roll cached per `gainBucket` (TTL 7d); rerolls bypass cache.

### Edge cases (all handled, all kept playful)

- **IPO_AFTER** — "📅 NVDA wasn't public yet in 2010 — earliest is Jan 1999." One-tap fix to earliest month.
- **NO_DATA** — friendly retry; offer known-good preset tickers. (Server retries once with looser query `"<ticker> stock price history"` before giving up.)
- **Negative return** — flip the card: "🫠 Good thing you didn't. You'd have **$3,100** left of your $10k." Then 3 funny "what you dodged" items (roast prompt variant). Losses are *more* shareable — lean in.
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
- `roast:{gainBucket}` → first funny set, TTL 7d (`gainBucket` = gain rounded to a band so similar amounts reuse).
- Edge cache headers on `/c/*` and `/api/og/*`.
- Rationale: a viral spike means thousands of identical `$10k NVDA 2020` requests; cache-first protects Tako credits and the LLM bill.

---

## 9. Build order

**Phase 0 — Tako spike (first, before any UI).** Throwaway script hits the real endpoint with the key for NVDA / TSLA / AAPL, `from Jan 2020 to present`. Confirm: (a) monthly-ish series back to 2020, (b) the real `x` format, (c) we can snap to a target month. Tune `toYearMonth` to the real format. Decide the snap rule if any ticker is coarser than monthly. **Everything downstream assumes this works — verify first.**

**Phase 1 — Core loop, unstyled.** Form → `/api/bagcheck` → `/api/roast` → plain inline result. Real numbers, real funny items, reroll works.

**Phase 2 — The card + page.** Build `BagCard` (light/playful), `BagForm`, ticker→embed modal, count-up, reroll animation, slide-in, the four page states. Apply the light/playful/rounded visual language.

**Phase 3 — Virality.** `/c/...` server route + `generateMetadata`, `/api/og/...` PNG, Share-to-X / Copy / Download, in-place URL rewrite from `/`.

**Phase 4 — Caching + edges.** Redis caching (§8), all §7 edge cases, rate-limit friendliness.

**Phase 5 — Polish.** Preset chips, loading skeletons, mobile layout, share analytics.

---

## 10. Testing

- **Unit (priority):** `lib/bag-math.ts` — `toYearMonth` across all label formats, `pickStart` snapping (exact / nearest-after / IPO-after), `computeBag` math incl. negative returns and huge multiples. `lib/roast.ts` defensive parser (fenced JSON, malformed, wrong item count → fallback). `lib/format.ts` formatters.
- **Integration:** `/api/bagcheck` (mock Tako: happy path, NO_DATA, IPO_AFTER, looser-query retry), `/api/roast` (mock Claude: valid, malformed→fallback, reroll excludes).
- **Component:** `BagCard` across states (gain, loss, snapped fine-print, huge multiple); `BagForm` validation/clamping.
- **OG smoke:** `/api/og/...` returns a valid PNG for a known input.

---

## 11. Definition of done

A stranger lands on `fumbledthebag`, types `TSLA / Jan / 2019 / $5,000`, hits Check my bag, watches the card slide in with a real current value and 3 funny things, rerolls them once, clicks the ticker to see the live Tako chart, taps **Share to X** — and the tweet unfurls a crisp image of that exact light/playful card. All in under 5 seconds, even under load.
