# fumbledthebag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build fumbledthebag — a one-page toy where you pick a ticker + date + amount, see what that money would be worth now, get 3 funny "you could've bought" items, and share a card that unfurls beautifully on social.

**Architecture:** Next.js 14 App Router. One page component served at `/` (empty) and `/c/[ticker]/[year]/[month]/[amount]` (pre-filled + server-rendered OG tags). A server route (`/api/bagcheck`) fetches Tako market data and computes the return math (keys never touch the client). Comparisons come from a local curated list + a seeded, deterministic picker (no LLM). A dynamic OG route renders the same card as a PNG. Lean Redis caching on the Tako series only.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · framer-motion (motion system) · @vercel/og (Satori share images) · @upstash/redis (cache) · zod (boundary validation) · Vitest + @testing-library/react + jsdom (tests).

## Global Constraints

- **Framework:** Next.js 14 App Router + TypeScript + Tailwind. Server Route Handlers are mandatory — `TAKO_API_KEY` must never reach the client.
- **No LLM anywhere.** Comparisons come only from `data/items.ts` + `lib/pick-items.ts`. There is no Anthropic dependency and no `/api/roast` route.
- **Env vars (server only):** `TAKO_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. The app must run in dev with only `TAKO_API_KEY` set (cache degrades to a no-op when Redis env is absent).
- **Tako requests use light theme:** `output_settings.knowledge_card_settings.image_dark_mode: false`.
- **One typeface everywhere:** a single font family (this plan uses **Fredoka**) across wordmark, form, card, and the OG image. Hierarchy via weight/size only. The same font file is bundled into the `@vercel/og` renderer.
- **Aesthetic:** light, playful, lighter colors, rounded corners, soft shadows, clear big type. Green for gains, a wry muted red for losses.
- **Money math lives on the server.** The client only renders. Money displayed rounded ($12,431, not $12431.04); `multiple` to 1 decimal; never render `NaN`/`Infinity`.
- **Inputs:** ticker (text + preset chips), date (typed field → month+year, day ignored, year clamped 2015–2025), amount (slider primary + editable value, default $10,000).
- **Motion:** one shared motion system (`lib/motion.ts`); transform/opacity only; respects `prefers-reduced-motion`.
- **Canonical seed** for `pickItems` is `"{ticker}|{year}|{month}|{amount}"` so the OG image always matches the page.
- **Commit after every task.** Conventional commit messages (`feat:`, `test:`, `chore:`). Attribution is disabled globally — do not add co-author trailers.

---

## File Structure

**Pure libs (unit-tested):**
- `lib/types.ts` — shared types (single source of truth).
- `lib/format.ts` — money/multiple/percent/qty formatters + `monthName`.
- `lib/parse-date.ts` — typed date string → `{ month, year }` or error.
- `lib/bag-math.ts` — `toYearMonth`, `pickStart`, `computeBag`.
- `data/items.ts` — the curated comparison list (the one file the owner edits).
- `lib/pick-items.ts` — seeded deterministic picker.
- `lib/tako.ts` — Tako API client.
- `lib/cache.ts` — Redis wrapper + `bagKey`, degrades to no-op without env.
- `lib/motion.ts` — shared motion variants/config + `useCountUp`.
- `lib/url.ts` — build/parse canonical `/c/...` paths and X-share URLs.

**Server routes:**
- `app/api/bagcheck/route.ts` — Tako + cache + math → `BagResult | BagError`.
- `app/api/og/[ticker]/[year]/[month]/[amount]/route.tsx` — PNG via `@vercel/og`.

**Pages:**
- `app/layout.tsx` — html shell, font, `<MotionConfig reducedMotion="user">`.
- `app/page.tsx` — landing (empty state) → renders `<BagApp/>`.
- `app/c/[ticker]/[year]/[month]/[amount]/page.tsx` — pre-filled + `generateMetadata` (OG tags).

**Components:**
- `components/BagApp.tsx` — client orchestrator: state, submit→fetch→reveal, URL rewrite, reroll.
- `components/BagForm.tsx` — ticker chips/input, typed date, amount slider+value, submit.
- `components/BagCard.tsx` — the shared card (live + OG), count-up, 3 rows, states.
- `components/TickerTakoCard.tsx` — hover popover (themed Tako preview) + click modal (embed iframe).
- `components/ShareRow.tsx` — Share to X / Copy link / Download.

**Setup:**
- `scripts/tako-spike.ts` — throwaway Phase-0 verifier (kept in repo for reference).
- `assets/Fredoka-SemiBold.ttf`, `assets/Fredoka-Bold.ttf` — font files for OG.
- Vitest config, Tailwind config, `.env.example`.

---

## Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `.env.example`, `.gitignore`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Next.js app and a working `npm test` (Vitest) command.

- [ ] **Step 1: Scaffold dependencies**

Create `package.json`:

```json
{
  "name": "fumbledthebag",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@upstash/redis": "^1.34.0",
    "@vercel/og": "^0.6.2",
    "framer-motion": "^11.3.0",
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vitest": "^2.0.0"
  }
}
```

Run: `npm install`

- [ ] **Step 2: Config files**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "trytako.com" }] },
};
export default nextConfig;
```

Create `postcss.config.mjs`:

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-fredoka)", "system-ui", "sans-serif"] },
      colors: {
        cream: "#FFFDF7",
        ink: "#2B2A33",
        gain: "#16B364",
        loss: "#E5685C",
        accent: "#FFD43B",
      },
      borderRadius: { xl2: "1.75rem" },
      boxShadow: { soft: "0 12px 40px -12px rgba(43,42,51,0.18)" },
    },
  },
  plugins: [],
};
export default config;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

Add `@vitejs/plugin-react` to devDependencies and run `npm install @vitejs/plugin-react@^4.3.0 -D`.

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: App shell + styles**

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: theme(colors.cream); color: theme(colors.ink); }
```

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "fumbledthebag",
  description: "I should've bought ___",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="font-sans antialiased">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
```

Create `app/page.tsx` (placeholder, replaced in Task 15):

```tsx
export default function Home() {
  return <main className="min-h-dvh grid place-items-center"><h1 className="text-4xl font-bold">fumbledthebag 🧢</h1></main>;
}
```

Create `.env.example`:

```
TAKO_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Create `.gitignore`:

```
node_modules
.next
.env*.local
.env
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 4: Write the smoke test**

Create `lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("toolchain", () => {
  it("runs vitest", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 6: Verify the app boots**

Run: `npm run build`
Expected: build completes with no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 + Tailwind + Vitest"
```

---

## Task 2: Phase-0 Tako spike (verify the data format before building math)

**Files:**
- Create: `scripts/tako-spike.ts`

**Interfaces:**
- Produces: documented confirmation of (a) a monthly-ish series back to 2020, (b) the real `x` label format, (c) snapping is possible. Findings feed `toYearMonth` in Task 5.

> The source spec is explicit: do this before assuming the data shape. `toYearMonth` (Task 5) is written defensively to handle every candidate format, but this spike confirms reality and catches surprises (coarser-than-monthly granularity, unexpected labels).

- [ ] **Step 1: Write the spike script**

Create `scripts/tako-spike.ts`:

```ts
// Throwaway verification of the Tako contract. Run with: npx tsx scripts/tako-spike.ts
// Requires TAKO_API_KEY in the environment.
async function search(text: string) {
  const res = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.TAKO_API_KEY! },
    body: JSON.stringify({
      inputs: { text },
      source_indexes: ["tako"],
      search_effort: "fast",
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });
  if (!res.ok) throw new Error(`Tako ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  for (const ticker of ["NVDA", "TSLA", "AAPL"]) {
    const json = await search(`${ticker} monthly stock price from January 2020 to present`);
    const card = json?.outputs?.knowledge_cards?.[0];
    const data = card?.visualization_data?.data ?? [];
    console.log(`\n=== ${ticker} ===`);
    console.log("title:", card?.title, "| confidence:", card?.confidence);
    console.log("embed_url:", card?.embed_url);
    console.log("points:", data.length, "| first x:", JSON.stringify(data[0]?.x), "| last x:", JSON.stringify(data.at(-1)?.x));
    console.log("sample:", JSON.stringify(data.slice(0, 3)));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the spike**

Run: `TAKO_API_KEY=<your key> npx tsx scripts/tako-spike.ts`
Expected: for each ticker, a non-empty `points` count, a printed `x` format (e.g. `"2020-01"`), and an `embed_url`.

**Record the observed `x` format in the commit message.** If granularity is coarser than monthly for any ticker, note it — `pickStart` (Task 5) already snaps to nearest month ≥ target, which covers coarser data, but confirm.

- [ ] **Step 3: Commit**

```bash
git add scripts/tako-spike.ts
git commit -m "chore: add Tako Phase-0 spike (observed x format: <PASTE HERE>)"
```

---

## Task 3: Shared types + formatters

**Files:**
- Create: `lib/types.ts`, `lib/format.ts`
- Test: `lib/__tests__/format.test.ts`

**Interfaces:**
- Produces:
  - `lib/types.ts`: `TakoPoint`, `TakoCard`, `Scale`, `Item`, `PickedItem`, `BagMath`, `BagResult`, `BagError`, `BagErrorCode`.
  - `lib/format.ts`: `formatMoney(n: number): string`, `formatMultiple(n: number): string`, `formatPercent(n: number): string`, `formatQty(n: number): string`, `monthName(month: number): string`.

- [ ] **Step 1: Write the types**

Create `lib/types.ts`:

```ts
export type TakoPoint = { x: string; y: number };

export type TakoCard = {
  card_id: string;
  title: string;
  description: string;
  webpage_url: string;
  image_url: string;
  embed_url: string;
  confidence?: string;
  visualization_data?: { data: TakoPoint[]; viz_config?: Record<string, unknown> };
};

export type Scale = "everyday" | "aspirational" | "flex";
export type Item = { icon: string; name: string; price: number; scale: Scale; blurb: string };
export type PickedItem = Item & { qty: number };

export type BagMath = {
  startPrice: number;
  startDateActual: string; // "YYYY-MM"
  currentPrice: number;
  currentDate: string; // "YYYY-MM"
  multiple: number;
  currentValue: number;
  gain: number;
  returnPct: number;
  snapped: boolean;
  isLoss: boolean;
};

export type BagResult = BagMath & {
  ticker: string;
  year: number;
  month: number;
  amount: number;
  embedUrl: string;
  imageUrl: string;
  confidence?: string;
};

export type BagErrorCode = "NO_DATA" | "IPO_AFTER" | "BAD_REQUEST";
export type BagError = {
  error: BagErrorCode;
  message: string;
  suggestedYear?: number;
  suggestedMonth?: number;
};
```

- [ ] **Step 2: Write the failing formatter tests**

Create `lib/__tests__/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatMoney, formatMultiple, formatPercent, formatQty, monthName } from "@/lib/format";

describe("formatMoney", () => {
  it("rounds to whole dollars with commas", () => {
    expect(formatMoney(12431.04)).toBe("$12,431");
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(234100)).toBe("$234,100");
  });
});

describe("formatMultiple", () => {
  it("uses one decimal and an x", () => {
    expect(formatMultiple(23.44)).toBe("23.4×");
    expect(formatMultiple(1240)).toBe("1,240.0×");
  });
});

describe("formatPercent", () => {
  it("rounds to whole percent with a sign", () => {
    expect(formatPercent(2241.3)).toBe("+2,241%");
    expect(formatPercent(-68.9)).toBe("-69%");
  });
});

describe("formatQty", () => {
  it("groups thousands", () => { expect(formatQty(1240)).toBe("1,240"); });
});

describe("monthName", () => {
  it("maps 1..12 to names", () => {
    expect(monthName(3)).toBe("March");
    expect(monthName(1)).toBe("January");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- format`
Expected: FAIL ("Failed to resolve import @/lib/format").

- [ ] **Step 4: Implement the formatters**

Create `lib/format.ts`:

```ts
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function monthName(month: number): string {
  return MONTHS[Math.min(12, Math.max(1, month)) - 1];
}

export function formatMoney(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  return `$${safe.toLocaleString("en-US")}`;
}

export function formatMultiple(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;
}

export function formatPercent(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  const sign = safe > 0 ? "+" : "";
  return `${sign}${safe.toLocaleString("en-US")}%`;
}

export function formatQty(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  return safe.toLocaleString("en-US");
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- format`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/format.ts lib/__tests__/format.test.ts
git commit -m "feat: shared types and display formatters"
```

---

## Task 4: Typed date parser

**Files:**
- Create: `lib/parse-date.ts`
- Test: `lib/__tests__/parse-date.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseDate(input: string, opts?: { minYear?: number; maxYear?: number }): { month: number; year: number } | { error: string }`. Defaults `minYear: 2015`, `maxYear: 2025`. Ignores any day. Month defaults to 1 (January) when only a year is given.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/parse-date.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseDate } from "@/lib/parse-date";

describe("parseDate", () => {
  it("parses 'Mar 2020'", () => { expect(parseDate("Mar 2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses 'March 2020'", () => { expect(parseDate("March 2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses '3/2020'", () => { expect(parseDate("3/2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses '2020-03'", () => { expect(parseDate("2020-03")).toEqual({ month: 3, year: 2020 }); });
  it("ignores a day in '3/15/2020'", () => { expect(parseDate("3/15/2020")).toEqual({ month: 3, year: 2020 }); });
  it("defaults month to January when only a year is given", () => { expect(parseDate("2020")).toEqual({ month: 1, year: 2020 }); });
  it("clamps a too-late year to maxYear", () => { expect(parseDate("Jan 2099")).toEqual({ month: 1, year: 2025 }); });
  it("clamps a too-early year to minYear", () => { expect(parseDate("Jan 1990")).toEqual({ month: 1, year: 2015 }); });
  it("errors on garbage", () => { expect(parseDate("banana")).toEqual({ error: expect.any(String) }); });
  it("errors on empty", () => { expect(parseDate("")).toEqual({ error: expect.any(String) }); });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- parse-date`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the parser**

Create `lib/parse-date.ts`:

```ts
const MONTH_LOOKUP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function clampYear(year: number, minYear: number, maxYear: number): number {
  return Math.min(maxYear, Math.max(minYear, year));
}

export function parseDate(
  input: string,
  opts: { minYear?: number; maxYear?: number } = {}
): { month: number; year: number } | { error: string } {
  const minYear = opts.minYear ?? 2015;
  const maxYear = opts.maxYear ?? 2025;
  const s = input.trim().toLowerCase();
  if (!s) return { error: "Enter a date like “Mar 2020”." };

  // "2020-03" or "2020-03-15"
  let m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (m) return { month: clampMonth(+m[2]), year: clampYear(+m[1], minYear, maxYear) };

  // "3/2020" or "3/15/2020"
  m = s.match(/^(\d{1,2})\/(?:\d{1,2}\/)?(\d{4})$/);
  if (m) return { month: clampMonth(+m[1]), year: clampYear(+m[2], minYear, maxYear) };

  // "mar 2020" / "march 2020"
  m = s.match(/^([a-z]{3,})\.?\s+(\d{4})$/);
  if (m) {
    const mo = MONTH_LOOKUP[m[1].slice(0, 3)];
    if (mo) return { month: mo, year: clampYear(+m[2], minYear, maxYear) };
  }

  // "2020" only
  m = s.match(/^(\d{4})$/);
  if (m) return { month: 1, year: clampYear(+m[1], minYear, maxYear) };

  return { error: "Couldn’t read that date — try “Mar 2020”." };
}

function clampMonth(month: number): number {
  return Math.min(12, Math.max(1, month));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- parse-date`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/parse-date.ts lib/__tests__/parse-date.test.ts
git commit -m "feat: typed date parser (month+year, day ignored, year clamped)"
```

---

## Task 5: Return math + month-snapping

**Files:**
- Create: `lib/bag-math.ts`
- Test: `lib/__tests__/bag-math.test.ts`

**Interfaces:**
- Consumes: `TakoPoint`, `BagMath`, `BagError` from `lib/types.ts`.
- Produces:
  - `toYearMonth(x: string): string | null`
  - `computeBag(data: TakoPoint[], year: number, month: number, amount: number): BagMath | BagError`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/bag-math.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toYearMonth, computeBag } from "@/lib/bag-math";
import type { TakoPoint } from "@/lib/types";

describe("toYearMonth", () => {
  it("handles YYYY-MM", () => expect(toYearMonth("2020-01")).toBe("2020-01"));
  it("handles YYYY-MM-DD", () => expect(toYearMonth("2020-01-31")).toBe("2020-01"));
  it("handles 'Jan 2020'", () => expect(toYearMonth("Jan 2020")).toBe("2020-01"));
  it("handles 'January 2020'", () => expect(toYearMonth("January 2020")).toBe("2020-01"));
  it("handles year only", () => expect(toYearMonth("2020")).toBe("2020-01"));
  it("returns null on garbage", () => expect(toYearMonth("???")).toBeNull());
});

const series: TakoPoint[] = [
  { x: "2020-01", y: 5 },
  { x: "2020-02", y: 6 },
  { x: "2020-03", y: 8 },
  { x: "2024-01", y: 100 },
];

describe("computeBag", () => {
  it("computes a gain from the exact month", () => {
    const r = computeBag(series, 2020, 1, 1000);
    expect("error" in r).toBe(false);
    if ("error" in r) return;
    expect(r.startPrice).toBe(5);
    expect(r.startDateActual).toBe("2020-01");
    expect(r.currentPrice).toBe(100);
    expect(r.currentValue).toBe(20000);
    expect(r.multiple).toBe(20);
    expect(r.gain).toBe(19000);
    expect(r.snapped).toBe(false);
    expect(r.isLoss).toBe(false);
  });

  it("snaps forward to the nearest available month", () => {
    const r = computeBag(series, 2020, 2, 1000);
    if ("error" in r) throw new Error("unexpected error");
    expect(r.startDateActual).toBe("2020-02");
    expect(r.snapped).toBe(false);
  });

  it("flags IPO_AFTER when the request predates the data by >2 months", () => {
    const r = computeBag(series, 2010, 1, 1000);
    expect("error" in r).toBe(true);
    if (!("error" in r)) return;
    expect(r.error).toBe("IPO_AFTER");
    expect(r.suggestedYear).toBe(2020);
    expect(r.suggestedMonth).toBe(1);
  });

  it("returns NO_DATA on empty series", () => {
    const r = computeBag([], 2020, 1, 1000);
    expect("error" in r && r.error).toBe("NO_DATA");
  });

  it("detects a loss", () => {
    const losing: TakoPoint[] = [{ x: "2021-01", y: 100 }, { x: "2024-01", y: 31 }];
    const r = computeBag(losing, 2021, 1, 10000);
    if ("error" in r) throw new Error("unexpected error");
    expect(r.isLoss).toBe(true);
    expect(r.currentValue).toBe(3100);
    expect(r.gain).toBe(-6900);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- bag-math`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the math**

Create `lib/bag-math.ts`:

```ts
import type { TakoPoint, BagMath, BagError } from "@/lib/types";

const MONTH_LOOKUP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function toYearMonth(x: string): string | null {
  if (!x) return null;
  const s = String(x).trim();

  let m = s.match(/^(\d{4})-(\d{2})/); // 2020-01 or 2020-01-31
  if (m) return `${m[1]}-${m[2]}`;

  m = s.match(/^(\d{4})\/(\d{1,2})/); // 2020/1
  if (m) return `${m[1]}-${String(+m[2]).padStart(2, "0")}`;

  m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{4})$/); // Jan 2020 / January 2020
  if (m) {
    const mo = MONTH_LOOKUP[m[1].slice(0, 3).toLowerCase()];
    if (mo) return `${m[2]}-${String(mo).padStart(2, "0")}`;
  }

  m = s.match(/^(\d{4})$/); // 2020
  if (m) return `${m[1]}-01`;

  const d = new Date(s); // ISO-ish fallback
  if (!Number.isNaN(d.getTime())) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return null;
}

function ymToInt(ym: string): number {
  const [y, mo] = ym.split("-").map(Number);
  return y * 12 + (mo - 1);
}

export function computeBag(
  data: TakoPoint[],
  year: number,
  month: number,
  amount: number
): BagMath | BagError {
  const norm = data
    .map((p) => ({ y: p.y, ym: toYearMonth(p.x) }))
    .filter((p): p is { y: number; ym: string } => p.ym !== null && Number.isFinite(p.y));

  if (norm.length === 0) return { error: "NO_DATA", message: "No usable price data for that ticker." };

  const target = `${year}-${String(month).padStart(2, "0")}`;
  const start = norm.find((p) => p.ym === target) ?? norm.find((p) => p.ym >= target) ?? norm[0];
  const current = norm[norm.length - 1];

  if (!start || !current || start.y <= 0) {
    return { error: "NO_DATA", message: "No usable price data for that ticker." };
  }

  if (ymToInt(start.ym) - ymToInt(target) > 2) {
    return {
      error: "IPO_AFTER",
      message: `Earliest data is ${start.ym}. Try a later date.`,
      suggestedYear: Number(start.ym.slice(0, 4)),
      suggestedMonth: Number(start.ym.slice(5, 7)),
    };
  }

  const shares = amount / start.y;
  const currentValue = shares * current.y;
  const gain = currentValue - amount;

  return {
    startPrice: start.y,
    startDateActual: start.ym,
    currentPrice: current.y,
    currentDate: current.ym,
    multiple: currentValue / amount,
    currentValue,
    gain,
    returnPct: (currentValue / amount - 1) * 100,
    snapped: start.ym !== target,
    isLoss: gain < 0,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- bag-math`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/bag-math.ts lib/__tests__/bag-math.test.ts
git commit -m "feat: return math + month-snapping (IPO_AFTER, NO_DATA, loss detection)"
```

---

## Task 6: Curated item list + seeded picker

**Files:**
- Create: `data/items.ts`, `lib/pick-items.ts`
- Test: `lib/__tests__/pick-items.test.ts`

**Interfaces:**
- Consumes: `Item`, `PickedItem`, `Scale` from `lib/types.ts`.
- Produces:
  - `data/items.ts`: `export const ITEMS: Item[]` (the editable list).
  - `lib/pick-items.ts`: `pickItems(amount: number, seed: string, exclude?: string[], count?: number): PickedItem[]` — deterministic for a given seed; excludes by item `name`; prefers one item per scale; `qty = floor(amount / price)`; drops items with `qty < 1`; returns up to `count` (default 3), fewer if not enough affordable.

- [ ] **Step 1: Write the curated list**

Create `data/items.ts`:

```ts
import type { Item } from "@/lib/types";

// THE ONE FILE TO EDIT. Add/remove items freely.
// scale: "everyday" (cheap laugh) | "aspirational" (nice) | "flex" (absurd).
export const ITEMS: Item[] = [
  { icon: "🌯", name: "Chipotle burritos", price: 12, scale: "everyday", blurb: "Guac included, obviously." },
  { icon: "☕", name: "lattes", price: 6, scale: "everyday", blurb: "Caffeinated regret." },
  { icon: "🍕", name: "large pizzas", price: 18, scale: "everyday", blurb: "Friday sorted forever." },
  { icon: "🎮", name: "video games", price: 70, scale: "everyday", blurb: "Backlog of dreams." },
  { icon: "👟", name: "pairs of sneakers", price: 150, scale: "everyday", blurb: "Never worn, obviously." },
  { icon: "📱", name: "iPhones", price: 1000, scale: "aspirational", blurb: "One per pocket." },
  { icon: "💻", name: "MacBook Pros", price: 2500, scale: "aspirational", blurb: "For the spreadsheets of grief." },
  { icon: "⌚", name: "Rolex Submariners", price: 10000, scale: "aspirational", blurb: "Time you’ll never get back." },
  { icon: "🎓", name: "years of state tuition", price: 11000, scale: "aspirational", blurb: "Knowledge optional." },
  { icon: "🚗", name: "used Honda Civics", price: 18000, scale: "aspirational", blurb: "Reliable, unlike your timing." },
  { icon: "🏎️", name: "used Porsche 911s", price: 80000, scale: "flex", blurb: "Vroom of shame." },
  { icon: "🏠", name: "median home down payments", price: 80000, scale: "flex", blurb: "Equity you’ll never know." },
  { icon: "🪙", name: "kilos of gold", price: 90000, scale: "flex", blurb: "Pirate-grade flex." },
  { icon: "🛥️", name: "entry-level yachts", price: 300000, scale: "flex", blurb: "Seasick with envy." },
  { icon: "🏝️", name: "private island weeks", price: 500000, scale: "flex", blurb: "Population: your ego." },
];
```

- [ ] **Step 2: Write the failing tests**

Create `lib/__tests__/pick-items.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pickItems } from "@/lib/pick-items";

describe("pickItems", () => {
  it("is deterministic for the same seed", () => {
    const a = pickItems(50000, "NVDA|2020|1|10000");
    const b = pickItems(50000, "NVDA|2020|1|10000");
    expect(a).toEqual(b);
  });

  it("returns 3 items for a healthy amount", () => {
    const r = pickItems(500000, "seed");
    expect(r).toHaveLength(3);
  });

  it("computes qty = floor(amount / price)", () => {
    const r = pickItems(50000, "seed");
    for (const item of r) expect(item.qty).toBe(Math.floor(50000 / item.price));
  });

  it("never includes an item the amount can't afford", () => {
    const r = pickItems(50, "seed"); // only sub-$50 items qualify
    for (const item of r) expect(item.price).toBeLessThanOrEqual(50);
    for (const item of r) expect(item.qty).toBeGreaterThanOrEqual(1);
  });

  it("honors the exclude list (by name)", () => {
    const first = pickItems(500000, "seed");
    const excluded = first.map((i) => i.name);
    const second = pickItems(500000, "seed", excluded);
    for (const item of second) expect(excluded).not.toContain(item.name);
  });

  it("mixes scales when the budget allows", () => {
    const r = pickItems(1000000, "varied-seed");
    const scales = new Set(r.map((i) => i.scale));
    expect(scales.size).toBeGreaterThanOrEqual(2);
  });

  it("returns fewer than 3 when too little is affordable", () => {
    const r = pickItems(6, "seed"); // only the $6 latte qualifies
    expect(r.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- pick-items`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 4: Implement the picker**

Create `lib/pick-items.ts`:

```ts
import type { Item, PickedItem, Scale } from "@/lib/types";
import { ITEMS } from "@/data/items";

const SCALES: Scale[] = ["everyday", "aspirational", "flex"];

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickItems(
  amount: number,
  seed: string,
  exclude: string[] = [],
  count = 3
): PickedItem[] {
  const rng = mulberry32(hashSeed(seed));
  const affordable = ITEMS.filter(
    (it) => !exclude.includes(it.name) && Math.floor(amount / it.price) >= 1
  );
  if (affordable.length === 0) return [];

  const picked: Item[] = [];
  // Prefer one item per scale (in a seeded-random scale order).
  for (const scale of shuffle(SCALES, rng)) {
    if (picked.length >= count) break;
    const candidates = shuffle(affordable.filter((it) => it.scale === scale && !picked.includes(it)), rng);
    if (candidates.length) picked.push(candidates[0]);
  }
  // Fill any remaining slots from whatever's left.
  for (const it of shuffle(affordable.filter((it) => !picked.includes(it)), rng)) {
    if (picked.length >= count) break;
    picked.push(it);
  }

  return picked.slice(0, count).map((it) => ({ ...it, qty: Math.floor(amount / it.price) }));
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- pick-items`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/items.ts lib/pick-items.ts lib/__tests__/pick-items.test.ts
git commit -m "feat: curated item list + seeded deterministic picker"
```

---

## Task 7: Tako client

**Files:**
- Create: `lib/tako.ts`
- Test: `lib/__tests__/tako.test.ts`

**Interfaces:**
- Consumes: `TakoCard` from `lib/types.ts`.
- Produces: `takoSearch(text: string): Promise<TakoCard | null>` — POSTs to Tako with light theme; returns `knowledge_cards[0]` or `null`; throws on non-OK HTTP.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/tako.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { takoSearch } from "@/lib/tako";

afterEach(() => vi.restoreAllMocks());

describe("takoSearch", () => {
  it("sends light theme and returns the first card", async () => {
    const card = { card_id: "x", title: "NVDA", embed_url: "e", image_url: "i", webpage_url: "w", description: "d" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ outputs: { knowledge_cards: [card] } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TAKO_API_KEY", "test-key");

    const result = await takoSearch("NVDA stock");
    expect(result).toEqual(card);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.output_settings.knowledge_card_settings.image_dark_mode).toBe(false);
    expect(fetchMock.mock.calls[0][1].headers["X-API-Key"]).toBe("test-key");
  });

  it("returns null when there are no cards", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: { knowledge_cards: [] } }) }));
    expect(await takoSearch("nothing")).toBeNull();
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }));
    await expect(takoSearch("err")).rejects.toThrow(/Tako 500/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- tako`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the client**

Create `lib/tako.ts`:

```ts
import type { TakoCard } from "@/lib/types";

export async function takoSearch(text: string): Promise<TakoCard | null> {
  const res = await fetch("https://trytako.com/api/v1/knowledge_search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": process.env.TAKO_API_KEY! },
    body: JSON.stringify({
      inputs: { text },
      source_indexes: ["tako"],
      search_effort: "fast",
      output_settings: { knowledge_card_settings: { image_dark_mode: false } },
      country_code: "US",
      locale: "en-US",
    }),
  });
  if (!res.ok) throw new Error(`Tako ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.outputs?.knowledge_cards?.[0] ?? null;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- tako`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tako.ts lib/__tests__/tako.test.ts
git commit -m "feat: Tako client (light theme)"
```

---

## Task 8: Redis cache wrapper (degrades to no-op)

**Files:**
- Create: `lib/cache.ts`
- Test: `lib/__tests__/cache.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `bagKey(ticker: string, year: number, month: number): string` → `bag:{TICKER}:{year}:{month}`.
  - `cacheGet<T>(key: string): Promise<T | null>`
  - `cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void>`
  - When `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are unset, both functions no-op (`get` → null, `set` → resolves) so dev works without Redis.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/cache.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("cache", () => {
  beforeEach(() => { vi.resetModules(); });

  it("builds an uppercase bag key", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { bagKey } = await import("@/lib/cache");
    expect(bagKey("nvda", 2020, 3)).toBe("bag:NVDA:2020:3");
  });

  it("no-ops without Redis env (get returns null, set resolves)", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { cacheGet, cacheSet } = await import("@/lib/cache");
    await expect(cacheSet("k", { a: 1 })).resolves.toBeUndefined();
    await expect(cacheGet("k")).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- cache`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the cache**

Create `lib/cache.ts`:

```ts
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export function bagKey(ticker: string, year: number, month: number): string {
  return `bag:${ticker.toUpperCase()}:${year}:${month}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return (await redis.get<T>(key)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (!redis) return;
  try {
    if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
    else await redis.set(key, value);
  } catch {
    // cache failures must never break a request
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- cache`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/cache.ts lib/__tests__/cache.test.ts
git commit -m "feat: Redis cache wrapper with no-op fallback"
```

---

## Task 9: /api/bagcheck route handler

**Files:**
- Create: `app/api/bagcheck/route.ts`, `lib/url.ts`
- Test: `lib/__tests__/url.test.ts`, `app/api/bagcheck/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `takoSearch`, `computeBag`, `cacheGet`/`cacheSet`/`bagKey`, `monthName`.
- Produces:
  - `lib/url.ts`: `canonicalPath(p: { ticker: string; year: number; month: number; amount: number }): string` → `/c/NVDA/2020/3/10000`; `seedFor(p): string` → `"NVDA|2020|3|10000"`; `xShareUrl(ticker: string, year: number, resultUrl: string): string`.
  - `POST /api/bagcheck` accepting JSON `{ ticker, year, month, amount }` → `BagResult` or `BagError` (HTTP 200 for both; HTTP 400 only for malformed input). Caches the Tako card under `bagKey`, refreshing when older than 24h.

- [ ] **Step 1: Write the failing url tests**

Create `lib/__tests__/url.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { canonicalPath, seedFor, xShareUrl } from "@/lib/url";

describe("url helpers", () => {
  it("builds a canonical path with an uppercase ticker", () => {
    expect(canonicalPath({ ticker: "nvda", year: 2020, month: 3, amount: 10000 })).toBe("/c/NVDA/2020/3/10000");
  });
  it("builds a stable seed", () => {
    expect(seedFor({ ticker: "NVDA", year: 2020, month: 3, amount: 10000 })).toBe("NVDA|2020|3|10000");
  });
  it("builds an X intent url with hook + result url", () => {
    const u = xShareUrl("NVDA", 2020, "https://x.test/c/NVDA/2020/3/10000");
    expect(u).toContain("https://twitter.com/intent/tweet?");
    expect(decodeURIComponent(u)).toContain("$NVDA");
    expect(decodeURIComponent(u)).toContain("https://x.test/c/NVDA/2020/3/10000");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- url`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement url helpers**

Create `lib/url.ts`:

```ts
type BagParams = { ticker: string; year: number; month: number; amount: number };

export function canonicalPath({ ticker, year, month, amount }: BagParams): string {
  return `/c/${ticker.toUpperCase()}/${year}/${month}/${amount}`;
}

export function seedFor({ ticker, year, month, amount }: BagParams): string {
  return `${ticker.toUpperCase()}|${year}|${month}|${amount}`;
}

export function xShareUrl(ticker: string, year: number, resultUrl: string): string {
  const hook = `I should've bought $${ticker.toUpperCase()} in ${year} 😭 fumbled the bag:`;
  const params = new URLSearchParams({ text: hook, url: resultUrl });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- url`
Expected: PASS.

- [ ] **Step 5: Write the failing route test**

Create `app/api/bagcheck/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/tako", () => ({ takoSearch: vi.fn() }));
vi.mock("@/lib/cache", () => ({
  bagKey: (t: string, y: number, m: number) => `bag:${t}:${y}:${m}`,
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/bagcheck/route";
import { takoSearch } from "@/lib/tako";

function req(body: unknown) {
  return new Request("http://test/api/bagcheck", { method: "POST", body: JSON.stringify(body) });
}

const goodCard = {
  card_id: "c", title: "NVDA", description: "", webpage_url: "w",
  image_url: "https://trytako.com/img", embed_url: "https://trytako.com/embed",
  confidence: "High",
  visualization_data: { data: [{ x: "2020-01", y: 5 }, { x: "2024-01", y: 100 }] },
};

beforeEach(() => vi.clearAllMocks());

describe("POST /api/bagcheck", () => {
  it("returns a computed BagResult on the happy path", async () => {
    (takoSearch as any).mockResolvedValue(goodCard);
    const res = await POST(req({ ticker: "NVDA", year: 2020, month: 1, amount: 1000 }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ticker).toBe("NVDA");
    expect(json.multiple).toBe(20);
    expect(json.embedUrl).toBe("https://trytako.com/embed");
  });

  it("returns 400 on malformed input", async () => {
    const res = await POST(req({ ticker: "", year: 1900, month: 99, amount: -5 }));
    expect(res.status).toBe(400);
  });

  it("retries with a looser query then returns NO_DATA", async () => {
    (takoSearch as any).mockResolvedValue(null);
    const res = await POST(req({ ticker: "ZZZZ", year: 2020, month: 1, amount: 1000 }));
    const json = await res.json();
    expect(json.error).toBe("NO_DATA");
    expect((takoSearch as any).mock.calls.length).toBe(2);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm test -- bagcheck`
Expected: FAIL ("Failed to resolve import @/app/api/bagcheck/route").

- [ ] **Step 7: Implement the route**

Create `app/api/bagcheck/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { takoSearch } from "@/lib/tako";
import { computeBag } from "@/lib/bag-math";
import { bagKey, cacheGet, cacheSet } from "@/lib/cache";
import { monthName } from "@/lib/format";
import type { TakoCard, BagResult } from "@/lib/types";

const Body = z.object({
  ticker: z.string().trim().min(1).max(10),
  year: z.number().int().min(2015).max(2025),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive().max(100_000_000),
});

type CachedBag = { card: TakoCard; fetchedAt: number };
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Invalid input." }, { status: 400 });
  }
  const { ticker, year, month, amount } = parsed.data;
  const upper = ticker.toUpperCase();

  let card: TakoCard | null = null;
  const cached = await cacheGet<CachedBag>(bagKey(upper, year, month));
  if (cached && Date.now() - cached.fetchedAt < DAY_MS) {
    card = cached.card;
  } else {
    card = await takoSearch(`${upper} monthly stock price from ${monthName(month)} ${year} to present`);
    if (!card?.visualization_data?.data?.length) {
      card = await takoSearch(`${upper} stock price history`);
    }
    if (card?.visualization_data?.data?.length) {
      await cacheSet(bagKey(upper, year, month), { card, fetchedAt: Date.now() } satisfies CachedBag);
    }
  }

  if (!card?.visualization_data?.data?.length) {
    return NextResponse.json({ error: "NO_DATA", message: "Couldn’t find price data for that ticker." });
  }

  const math = computeBag(card.visualization_data.data, year, month, amount);
  if ("error" in math) return NextResponse.json(math);

  const result: BagResult = {
    ticker: upper,
    year,
    month,
    amount,
    ...math,
    embedUrl: card.embed_url,
    imageUrl: card.image_url,
    confidence: card.confidence,
  };
  return NextResponse.json(result);
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm test -- bagcheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add app/api/bagcheck lib/url.ts lib/__tests__/url.test.ts
git commit -m "feat: /api/bagcheck route + url helpers (Tako + cache + math)"
```

---

## Task 10: Motion system + count-up hook

**Files:**
- Create: `lib/motion.ts`
- Test: `lib/__tests__/motion.test.ts`

**Interfaces:**
- Consumes: framer-motion.
- Produces:
  - `DURATION`, `EASE`, `SPRING` constants.
  - Variant objects: `cardReveal`, `rowStagger`, `rowItem`, `popover`, `pressable`.
  - `useCountUp(target: number, durationMs?: number): number` — eased rAF count-up that respects reduced motion (returns `target` immediately when reduced).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/motion.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { DURATION, EASE, SPRING, cardReveal, rowItem, popover } from "@/lib/motion";

describe("motion system", () => {
  it("exposes consistent timing tokens", () => {
    expect(typeof DURATION.base).toBe("number");
    expect(Array.isArray(EASE)).toBe(true);
    expect(SPRING.type).toBe("spring");
  });
  it("defines hidden/show states for shared variants", () => {
    for (const v of [cardReveal, rowItem, popover]) {
      expect(v).toHaveProperty("hidden");
      expect(v).toHaveProperty("show");
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- motion`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the motion system**

Create `lib/motion.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import { useReducedMotion, type Variants, type Transition } from "framer-motion";

export const DURATION = { fast: 0.18, base: 0.32, slow: 0.5 };
export const EASE = [0.22, 1, 0.36, 1] as const;
export const SPRING: Transition = { type: "spring", stiffness: 320, damping: 30, mass: 0.8 };

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

export const rowStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

export const rowItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

export const popover: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 6 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.12 } },
};

export const pressable = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: SPRING,
};

export function useCountUp(target: number, durationMs = 900): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduce]);

  return value;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- motion`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/motion.ts lib/__tests__/motion.test.ts
git commit -m "feat: shared motion system + count-up hook (reduced-motion aware)"
```

---

## Task 11: BagCard component

**Files:**
- Create: `components/BagCard.tsx`
- Test: `components/__tests__/BagCard.test.tsx`

**Interfaces:**
- Consumes: `BagResult`, `PickedItem` from types; `formatMoney`/`formatMultiple`/`formatPercent`/`formatQty`/`monthName`; `useCountUp`, `cardReveal`, `rowStagger`, `rowItem`; `TickerTakoCard` (Task 12) is injected as a prop so this component is testable in isolation.
- Produces: `BagCard` (default export) with props:
  ```ts
  type BagCardProps = {
    result: BagResult;
    items: PickedItem[];
    onReroll?: () => void;
    tickerSlot?: React.ReactNode; // <TickerTakoCard/> on the live page; plain text in OG
    shareSlot?: React.ReactNode;  // <ShareRow/> on the live page; omitted in OG
    animate?: boolean;            // false for OG/static render
  };
  ```

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/BagCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BagCard from "@/components/BagCard";
import type { BagResult, PickedItem } from "@/lib/types";

const gain: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i", confidence: "High",
};
const items: PickedItem[] = [
  { icon: "🌯", name: "Chipotle burritos", price: 12, scale: "everyday", blurb: "Guac included.", qty: 1240 },
];

describe("BagCard", () => {
  it("renders the worth, multiple, and items", () => {
    render(<BagCard result={gain} items={items} animate={false} />);
    expect(screen.getByText("$234,100")).toBeInTheDocument();
    expect(screen.getByText("23.4×")).toBeInTheDocument();
    expect(screen.getByText(/1,240 Chipotle burritos/)).toBeInTheDocument();
    expect(screen.getByText(/Mar(ch)? 2020/)).toBeInTheDocument();
  });

  it("shows loss framing for a negative return", () => {
    const loss: BagResult = { ...gain, currentValue: 3100, gain: -6900, multiple: 0.31, returnPct: -69, isLoss: true };
    render(<BagCard result={loss} items={items} animate={false} />);
    expect(screen.getByText(/Good thing you didn't/i)).toBeInTheDocument();
    expect(screen.getByText("$3,100")).toBeInTheDocument();
  });

  it("renders the snapped fine-print", () => {
    render(<BagCard result={{ ...gain, snapped: true }} items={items} animate={false} />);
    expect(screen.getByText(/Closest data/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- BagCard`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement BagCard**

Create `components/BagCard.tsx`:

```tsx
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
  const counted = useCountUp(animate ? value : value, animate ? 900 : 0);
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- BagCard`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BagCard.tsx components/__tests__/BagCard.test.tsx
git commit -m "feat: BagCard component (gain/loss/snapped states, count-up, item rows)"
```

---

## Task 12: TickerTakoCard (hover popover + click modal)

**Files:**
- Create: `components/TickerTakoCard.tsx`
- Test: `components/__tests__/TickerTakoCard.test.tsx`

**Interfaces:**
- Consumes: `popover` variant from `lib/motion`; framer-motion `AnimatePresence`.
- Produces: `TickerTakoCard` (default export) with props `{ ticker: string; embedUrl: string; imageUrl: string }`. Renders the ticker as a chip; hover (with ~120ms intent delay) shows a popover with the themed Tako `imageUrl`; click opens a modal with the `embedUrl` iframe (Esc/backdrop closes; focus moves to the dialog).

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/TickerTakoCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TickerTakoCard from "@/components/TickerTakoCard";

describe("TickerTakoCard", () => {
  it("renders the ticker chip", () => {
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://e" imageUrl="https://i" />);
    expect(screen.getByRole("button", { name: /NVDA/ })).toBeInTheDocument();
  });

  it("opens a modal with the embed iframe on click", async () => {
    const user = userEvent.setup();
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://embed.test" imageUrl="https://i" />);
    await user.click(screen.getByRole("button", { name: /NVDA/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const iframe = dialog.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://embed.test");
  });

  it("closes the modal on Escape", async () => {
    const user = userEvent.setup();
    render(<TickerTakoCard ticker="NVDA" embedUrl="https://embed.test" imageUrl="https://i" />);
    await user.click(screen.getByRole("button", { name: /NVDA/ }));
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- TickerTakoCard`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement TickerTakoCard**

Create `components/TickerTakoCard.tsx`:

```tsx
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

  const enter = () => { hoverTimer.current = setTimeout(() => setHovered(true), 120); };
  const leave = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHovered(false); };

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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- TickerTakoCard`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/TickerTakoCard.tsx components/__tests__/TickerTakoCard.test.tsx
git commit -m "feat: ticker hover Tako preview + click embed modal"
```

---

## Task 13: BagForm component

**Files:**
- Create: `components/BagForm.tsx`
- Test: `components/__tests__/BagForm.test.tsx`

**Interfaces:**
- Consumes: `parseDate`; `formatMoney`; `pressable` from motion.
- Produces: `BagForm` (default export) with props:
  ```ts
  type BagFormValues = { ticker: string; month: number; year: number; amount: number };
  type BagFormProps = {
    initial?: Partial<BagFormValues>;
    onSubmit: (values: BagFormValues) => void;
    pending?: boolean;
  };
  ```
  Renders preset ticker chips (`NVDA TSLA AAPL BTC GME AMZN MSTR PLTR`), a ticker text input, a typed date field (parsed on submit; inline error if unparseable), and an amount slider with an editable value display ($100–$100k). Calls `onSubmit` with validated values.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/BagForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagForm from "@/components/BagForm";

describe("BagForm", () => {
  it("submits parsed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BagForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));

    expect(onSubmit).toHaveBeenCalledWith({ ticker: "NVDA", month: 3, year: 2020, amount: 10000 });
  });

  it("shows an inline error for an unparseable date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BagForm onSubmit={onSubmit} initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "banana");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/couldn’t read that date|enter a date/i)).toBeInTheDocument();
  });

  it("fills the ticker from a preset chip", async () => {
    const user = userEvent.setup();
    render(<BagForm onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "TSLA" }));
    expect(screen.getByLabelText(/ticker/i)).toHaveValue("TSLA");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- BagForm`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement BagForm**

Create `components/BagForm.tsx`:

```tsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- BagForm`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/BagForm.tsx components/__tests__/BagForm.test.tsx
git commit -m "feat: BagForm (preset chips, typed date, amount slider + editable value)"
```

---

## Task 14: ShareRow component

**Files:**
- Create: `components/ShareRow.tsx`
- Test: `components/__tests__/ShareRow.test.tsx`

**Interfaces:**
- Consumes: `xShareUrl` from `lib/url`; `formatMoney`; `pressable`.
- Produces: `ShareRow` (default export) with props `{ ticker: string; year: number; resultUrl: string; ogImageUrl: string }`. Renders: a "Share to X" link (`href` = `xShareUrl(...)`, opens new tab), a "Copy link" button (writes `resultUrl` to clipboard, shows "Copied!"), and a "Download" link to `ogImageUrl` with a `download` attribute.

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/ShareRow.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareRow from "@/components/ShareRow";

describe("ShareRow", () => {
  const props = { ticker: "NVDA", year: 2020, resultUrl: "https://x.test/c/NVDA/2020/3/10000", ogImageUrl: "https://x.test/api/og/NVDA/2020/3/10000" };

  it("links Share to X with the result url", () => {
    render(<ShareRow {...props} />);
    const link = screen.getByRole("link", { name: /share to x/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("twitter.com/intent/tweet"));
    expect(decodeURIComponent(link.getAttribute("href")!)).toContain(props.resultUrl);
  });

  it("copies the link to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const user = userEvent.setup();
    render(<ShareRow {...props} />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(props.resultUrl);
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("offers a download of the OG image", () => {
    render(<ShareRow {...props} />);
    const dl = screen.getByRole("link", { name: /download/i });
    expect(dl).toHaveAttribute("href", props.ogImageUrl);
    expect(dl).toHaveAttribute("download");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- ShareRow`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement ShareRow**

Create `components/ShareRow.tsx`:

```tsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- ShareRow`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ShareRow.tsx components/__tests__/ShareRow.test.tsx
git commit -m "feat: ShareRow (X intent, copy link, download)"
```

---

## Task 15: BagApp orchestrator + landing page

**Files:**
- Create: `components/BagApp.tsx`
- Modify: `app/page.tsx`
- Test: `components/__tests__/BagApp.test.tsx`

**Interfaces:**
- Consumes: `BagForm`, `BagCard`, `TickerTakoCard`, `ShareRow`, `pickItems`, `seedFor`/`canonicalPath`, types.
- Produces: `BagApp` (default export) with props `{ initial?: Partial<BagFormValues>; initialResult?: BagResult }`. Orchestrates: submit → `POST /api/bagcheck` → on success compute items via `pickItems(gain-or-loss-amount, seed)` → render `BagCard` with `TickerTakoCard`/`ShareRow` slots → rewrite URL to `canonicalPath(...)` via `history.replaceState`. Reroll bumps a counter, re-runs `pickItems` with the previous names excluded and a `#n` seed suffix. Renders error states (NO_DATA / IPO_AFTER) inline.

> Comparison amount: use `Math.abs(gain)` for gains and the surviving `currentValue` for losses, matching the card copy ("at least you dodged" uses the loss size — pass `Math.abs(gain)`).

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/BagApp.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagApp from "@/components/BagApp";
import type { BagResult } from "@/lib/types";

const result: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "https://embed", imageUrl: "https://img", confidence: "High",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
});
afterEach(() => vi.restoreAllMocks());

describe("BagApp", () => {
  it("submits, shows the card, and rewrites the URL", async () => {
    const user = userEvent.setup();
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);

    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Mar 2020");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));

    expect(await screen.findByText("$234,100")).toBeInTheDocument();
    expect(replaceState).toHaveBeenCalledWith(expect.anything(), "", "/c/NVDA/2020/3/10000");
  });

  it("renders an IPO_AFTER error inline", async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({ error: "IPO_AFTER", message: "Earliest data is 2020-01.", suggestedYear: 2020, suggestedMonth: 1 }) });
    const user = userEvent.setup();
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Jan 2010");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));
    expect(await screen.findByText(/Earliest data is 2020-01/)).toBeInTheDocument();
  });

  it("renders an initialResult immediately (for /c/ pages)", () => {
    render(<BagApp initialResult={result} initial={{ ticker: "NVDA", month: 3, year: 2020, amount: 10000 }} />);
    expect(screen.getByText("$234,100")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- BagApp`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement BagApp**

Create `components/BagApp.tsx`:

```tsx
"use client";
import { useMemo, useState } from "react";
import BagForm, { type BagFormValues } from "@/components/BagForm";
import BagCard from "@/components/BagCard";
import TickerTakoCard from "@/components/TickerTakoCard";
import ShareRow from "@/components/ShareRow";
import { pickItems } from "@/lib/pick-items";
import { canonicalPath, seedFor } from "@/lib/url";
import type { BagResult, BagError, PickedItem } from "@/lib/types";

type Props = { initial?: Partial<BagFormValues>; initialResult?: BagResult };

function comparisonAmount(r: BagResult): number {
  return r.isLoss ? Math.abs(r.gain) : Math.abs(r.gain);
}

export default function BagApp({ initial, initialResult }: Props) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BagResult | null>(initialResult ?? null);
  const [error, setError] = useState<BagError | null>(null);
  const [rerolls, setRerolls] = useState(0);
  const [excluded, setExcluded] = useState<string[]>([]);

  const items: PickedItem[] = useMemo(() => {
    if (!result) return [];
    const seed = `${seedFor(result)}${rerolls ? `#${rerolls}` : ""}`;
    return pickItems(comparisonAmount(result), seed, excluded);
  }, [result, rerolls, excluded]);

  async function handleSubmit(values: BagFormValues) {
    setPending(true);
    setError(null);
    setResult(null);
    setRerolls(0);
    setExcluded([]);
    try {
      const res = await fetch("/api/bagcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as BagResult | BagError;
      if ("error" in data) { setError(data); return; }
      setResult(data);
      window.history.replaceState(null, "", canonicalPath(data));
    } catch {
      setError({ error: "NO_DATA", message: "Something went wrong — try again." });
    } finally {
      setPending(false);
    }
  }

  function reroll() {
    setExcluded((prev) => [...prev, ...items.map((i) => i.name)]);
    setRerolls((n) => n + 1);
  }

  return (
    <main className="min-h-dvh px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">fumbledthebag 🧢</h1>
        <p className="mt-1 text-ink/60">“I should've bought ___”</p>
      </header>

      <BagForm initial={initial} onSubmit={handleSubmit} pending={pending} />

      {error && (
        <div className="mx-auto mt-6 w-full max-w-[420px] rounded-xl2 bg-white p-6 text-center shadow-soft">
          <p className="font-semibold text-ink/80">
            {error.error === "IPO_AFTER" ? "📅 " : "🤔 "}{error.message}
          </p>
          {error.error === "NO_DATA" && (
            <p className="mt-2 text-sm text-ink/55">Try a preset like NVDA, TSLA, or AAPL.</p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <BagCard
            result={result}
            items={items}
            onReroll={reroll}
            tickerSlot={<TickerTakoCard ticker={result.ticker} embedUrl={result.embedUrl} imageUrl={result.imageUrl} />}
            shareSlot={
              <ShareRow
                ticker={result.ticker}
                year={result.year}
                resultUrl={typeof window !== "undefined" ? window.location.origin + canonicalPath(result) : canonicalPath(result)}
                ogImageUrl={`/api/og/${result.ticker}/${result.year}/${result.month}/${result.amount}`}
              />
            }
          />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Replace the landing page**

Replace `app/page.tsx` with:

```tsx
import BagApp from "@/components/BagApp";

export default function Home() {
  return <BagApp initial={{ ticker: "NVDA", amount: 10000 }} />;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- BagApp`
Expected: PASS.

- [ ] **Step 6: Manual smoke (optional but recommended)**

Run: `TAKO_API_KEY=<key> npm run dev`, open `http://localhost:3000`, submit `NVDA / Mar 2020 / $10,000`. Expect the card to slide in, the URL to become `/c/NVDA/2020/3/10000`, reroll to swap items, and hovering NVDA to show the chart preview.

- [ ] **Step 7: Commit**

```bash
git add components/BagApp.tsx app/page.tsx components/__tests__/BagApp.test.tsx
git commit -m "feat: BagApp orchestrator + landing page (submit, reveal, URL rewrite, reroll, errors)"
```

---

## Task 16: Canonical /c/ result route + OG metadata

**Files:**
- Create: `app/c/[ticker]/[year]/[month]/[amount]/page.tsx`
- Test: `app/c/__tests__/metadata.test.ts`

**Interfaces:**
- Consumes: `BagApp`, `BagResult`, `monthName`, `formatMoney`, `canonicalPath`.
- Produces:
  - `generateMetadata({ params })` returning per-result OG/Twitter tags (`og:title`, `og:image` = `/api/og/...`, `twitter:card` = `summary_large_image`).
  - A server page that fetches the result (calling the same logic as `/api/bagcheck` via an absolute fetch) and renders `<BagApp initialResult=… initial=… />` so the page shows the result immediately and is crawlable.
  - Exported helper `buildOgTitle(result: BagResult): string` (tested) → e.g. `"$10k in NVDA (Mar 2020) → $234,100"`.

- [ ] **Step 1: Write the failing metadata test**

Create `app/c/__tests__/metadata.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildOgTitle } from "@/app/c/[ticker]/[year]/[month]/[amount]/page";
import type { BagResult } from "@/lib/types";

const r: BagResult = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

describe("buildOgTitle", () => {
  it("summarizes the bag", () => {
    expect(buildOgTitle(r)).toBe("$10,000 in NVDA (Mar 2020) → $234,100");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- metadata`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Implement the /c/ page**

Create `app/c/[ticker]/[year]/[month]/[amount]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import BagApp from "@/components/BagApp";
import { monthName, formatMoney } from "@/lib/format";
import { canonicalPath } from "@/lib/url";
import type { BagResult, BagError } from "@/lib/types";

type Params = { ticker: string; year: string; month: string; amount: string };

function parseParams(p: Params) {
  return {
    ticker: decodeURIComponent(p.ticker).toUpperCase(),
    year: Number(p.year),
    month: Number(p.month),
    amount: Number(p.amount),
  };
}

export function buildOgTitle(result: BagResult): string {
  const [, sm] = result.startDateActual.split("-").map(Number);
  return `${formatMoney(result.amount)} in ${result.ticker} (${monthName(sm).slice(0, 3)} ${result.year}) → ${formatMoney(result.currentValue)}`;
}

function baseUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function fetchResult(values: ReturnType<typeof parseParams>): Promise<BagResult | BagError> {
  const res = await fetch(`${baseUrl()}/api/bagcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  return res.json();
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const values = parseParams(params);
  const data = await fetchResult(values);
  const ogImage = `/api/og/${values.ticker}/${values.year}/${values.month}/${values.amount}`;
  const title = "error" in data ? "fumbledthebag 🧢" : buildOgTitle(data);
  return {
    title,
    openGraph: { title, images: [{ url: ogImage, width: 1200, height: 630 }], url: canonicalPath(values) },
    twitter: { card: "summary_large_image", title, images: [ogImage] },
  };
}

export default async function ResultPage({ params }: { params: Params }) {
  const values = parseParams(params);
  const data = await fetchResult(values);
  const initialResult = "error" in data ? undefined : data;
  return <BagApp initial={values} initialResult={initialResult} />;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- metadata`
Expected: PASS.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: build succeeds; `/c/[ticker]/[year]/[month]/[amount]` listed as a dynamic route.

- [ ] **Step 6: Commit**

```bash
git add "app/c"
git commit -m "feat: canonical /c result route with per-result OG metadata"
```

---

## Task 17: Dynamic OG image route

**Files:**
- Create: `app/api/og/[ticker]/[year]/[month]/[amount]/route.tsx`
- Add: `assets/Fredoka-SemiBold.ttf`, `assets/Fredoka-Bold.ttf`
- Test: `app/api/og/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `@vercel/og` `ImageResponse`; `pickItems`; `seedFor`; `formatMoney`/`formatMultiple`/`formatQty`/`monthName`; fetches the bag data via `/api/bagcheck`.
- Produces: `GET` returning a 1200×630 PNG that mirrors the card (same data, same single font, light theme). Uses the canonical seed so the items match the page.

> Satori (the engine behind `@vercel/og`) does not run React hooks or framer-motion — it renders static JSX with inline styles only. So this route rebuilds the card layout as plain styled `div`s rather than importing `BagCard`. Keep the two visually in sync by hand; both are driven by the same data and font.

- [ ] **Step 1: Add the font files**

Download Fredoka SemiBold and Bold TTFs into `assets/`:

```bash
mkdir -p assets
curl -L -o assets/Fredoka-SemiBold.ttf "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka%5Bwght%5D.ttf"
cp assets/Fredoka-SemiBold.ttf assets/Fredoka-Bold.ttf
```

(The variable font works for both weights; the two filenames keep the loader code explicit. If the variable font renders too light in Satori, replace with static instances.)

- [ ] **Step 2: Write the failing test**

Create `app/api/og/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:fs", () => ({ readFileSync: () => new Uint8Array([0]) }));

const result = {
  ticker: "NVDA", year: 2020, month: 3, amount: 10000,
  startPrice: 5.97, startDateActual: "2020-03", currentPrice: 140, currentDate: "2026-06",
  multiple: 23.4, currentValue: 234100, gain: 224100, returnPct: 2241, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => result }));
});
afterEach(() => vi.restoreAllMocks());

describe("GET /api/og", () => {
  it("returns a PNG response", async () => {
    const { GET } = await import("@/app/api/og/[ticker]/[year]/[month]/[amount]/route");
    const res = await GET(new Request("http://test/api/og/NVDA/2020/3/10000"), {
      params: { ticker: "NVDA", year: "2020", month: "3", amount: "10000" },
    });
    expect(res.headers.get("content-type")).toContain("image/png");
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- og`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 4: Implement the OG route**

Create `app/api/og/[ticker]/[year]/[month]/[amount]/route.tsx`:

```tsx
import { ImageResponse } from "@vercel/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pickItems } from "@/lib/pick-items";
import { seedFor } from "@/lib/url";
import { formatMoney, formatMultiple, formatQty, monthName } from "@/lib/format";
import type { BagResult, BagError } from "@/lib/types";

export const runtime = "nodejs";

type Params = { ticker: string; year: string; month: string; amount: string };

function loadFont(file: string): ArrayBuffer {
  const buf = readFileSync(join(process.cwd(), "assets", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const values = {
    ticker: decodeURIComponent(params.ticker).toUpperCase(),
    year: Number(params.year),
    month: Number(params.month),
    amount: Number(params.amount),
  };

  const origin = new URL(request.url).origin;
  const res = await fetch(`${origin}/api/bagcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  const data = (await res.json()) as BagResult | BagError;

  const semibold = loadFont("Fredoka-SemiBold.ttf");
  const bold = loadFont("Fredoka-Bold.ttf");
  const fonts = [
    { name: "Fredoka", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Fredoka", data: bold, weight: 700 as const, style: "normal" as const },
  ];

  if ("error" in data) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFDF7", alignItems: "center", justifyContent: "center", fontFamily: "Fredoka", fontSize: 56, color: "#2B2A33" }}>
          fumbledthebag 🧢
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  }

  const items = pickItems(Math.abs(data.gain), seedFor(values)).slice(0, 3);
  const [, sm] = data.startDateActual.split("-").map(Number);
  const accent = data.isLoss ? "#E5685C" : "#16B364";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#FFFDF7", padding: 64, fontFamily: "Fredoka", color: "#2B2A33" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 600, color: "#9b9aa1" }}>
          <span>fumbledthebag</span><span>🧢</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 24, fontWeight: 600 }}>
          {formatMoney(data.amount)} in {data.ticker} · {monthName(sm)} {data.year}
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 28, color: "#6f6e76" }}>
          {data.isLoss ? "🫠 Good thing you didn't — you'd have" : "it'd be worth"}
        </div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700, color: accent, lineHeight: 1.05 }}>
          {formatMoney(data.currentValue)}
        </div>
        {!data.isLoss && (
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: accent }}>{formatMultiple(data.multiple)}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, gap: 10 }}>
          {items.map((item) => (
            <div key={item.name} style={{ display: "flex", fontSize: 30 }}>
              <span style={{ marginRight: 14 }}>{item.icon}</span>
              <span style={{ fontWeight: 600 }}>{formatQty(item.qty)} {item.name}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- og`
Expected: PASS.

- [ ] **Step 6: Manual smoke (recommended)**

Run: `TAKO_API_KEY=<key> npm run dev`, open `http://localhost:3000/api/og/NVDA/2020/3/10000`. Expect a 1200×630 PNG showing the card with emoji and the Fredoka font.

- [ ] **Step 7: Commit**

```bash
git add "app/api/og" assets/Fredoka-SemiBold.ttf assets/Fredoka-Bold.ttf
git commit -m "feat: dynamic OG share image (same data, single font, light theme)"
```

---

## Task 18: Edge-case polish, caching headers, and final verification

**Files:**
- Modify: `components/BagApp.tsx` (IPO_AFTER one-tap fix), `app/c/[ticker]/[year]/[month]/[amount]/page.tsx` (edge cache headers via route segment config), `app/api/og/[ticker]/[year]/[month]/[amount]/route.tsx` (cache headers)
- Test: `components/__tests__/BagApp.edge.test.tsx`

**Interfaces:**
- Consumes: existing `BagApp`, `BagError`.
- Produces: a one-tap "Try {Mon Year}" fix on `IPO_AFTER` that re-submits with the suggested month/year; edge cache headers on `/c/*` and `/api/og/*`.

- [ ] **Step 1: Write the failing edge test**

Create `components/__tests__/BagApp.edge.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BagApp from "@/components/BagApp";

const success = {
  ticker: "NVDA", year: 2020, month: 1, amount: 10000,
  startPrice: 5, startDateActual: "2020-01", currentPrice: 100, currentDate: "2026-06",
  multiple: 20, currentValue: 200000, gain: 190000, returnPct: 1900, snapped: false, isLoss: false,
  embedUrl: "e", imageUrl: "i",
};

beforeEach(() => {
  (globalThis as any).__calls = 0;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
    (globalThis as any).__calls += 1;
    if ((globalThis as any).__calls === 1) {
      return { ok: true, json: async () => ({ error: "IPO_AFTER", message: "Earliest data is 2020-01.", suggestedYear: 2020, suggestedMonth: 1 }) };
    }
    return { ok: true, json: async () => success };
  }));
});
afterEach(() => vi.restoreAllMocks());

describe("BagApp IPO_AFTER one-tap fix", () => {
  it("re-submits with the suggested month and shows the result", async () => {
    const user = userEvent.setup();
    render(<BagApp initial={{ ticker: "NVDA", amount: 10000 }} />);
    await user.clear(screen.getByLabelText(/when/i));
    await user.type(screen.getByLabelText(/when/i), "Jan 2010");
    await user.click(screen.getByRole("button", { name: /check my bag/i }));

    const fix = await screen.findByRole("button", { name: /try jan 2020/i });
    await user.click(fix);
    expect(await screen.findByText("$200,000")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- BagApp.edge`
Expected: FAIL (no "Try Jan 2020" button yet).

- [ ] **Step 3: Add the one-tap fix to BagApp**

In `components/BagApp.tsx`, extract the submit body into a reusable `runCheck(values)` and wire the IPO fix button. Replace the `handleSubmit` function and the error block:

```tsx
  async function runCheck(values: BagFormValues) {
    setPending(true);
    setError(null);
    setResult(null);
    setRerolls(0);
    setExcluded([]);
    try {
      const res = await fetch("/api/bagcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as BagResult | BagError;
      if ("error" in data) { setError(data); return; }
      setResult(data);
      window.history.replaceState(null, "", canonicalPath(data));
    } catch {
      setError({ error: "NO_DATA", message: "Something went wrong — try again." });
    } finally {
      setPending(false);
    }
  }

  const [lastTicker, setLastTicker] = useState(initial?.ticker ?? "");
  const [lastAmount, setLastAmount] = useState(initial?.amount ?? 10000);

  function handleSubmit(values: BagFormValues) {
    setLastTicker(values.ticker);
    setLastAmount(values.amount);
    void runCheck(values);
  }
```

Replace the error block with one that offers the fix (add this import at top: `import { monthName } from "@/lib/format";`):

```tsx
      {error && (
        <div className="mx-auto mt-6 w-full max-w-[420px] rounded-xl2 bg-white p-6 text-center shadow-soft">
          <p className="font-semibold text-ink/80">
            {error.error === "IPO_AFTER" ? "📅 " : "🤔 "}{error.message}
          </p>
          {error.error === "IPO_AFTER" && error.suggestedYear && error.suggestedMonth && (
            <button
              onClick={() => runCheck({ ticker: lastTicker, amount: lastAmount, month: error.suggestedMonth!, year: error.suggestedYear! })}
              className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream"
            >
              Try {monthName(error.suggestedMonth).slice(0, 3)} {error.suggestedYear}
            </button>
          )}
          {error.error === "NO_DATA" && (
            <p className="mt-2 text-sm text-ink/55">Try a preset like NVDA, TSLA, or AAPL.</p>
          )}
        </div>
      )}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- BagApp.edge`
Expected: PASS.

- [ ] **Step 5: Add edge cache headers**

At the top of `app/api/og/[ticker]/[year]/[month]/[amount]/route.tsx`, after `export const runtime`, add:

```tsx
export const revalidate = 86400; // cache the PNG at the edge for a day
```

In `app/c/[ticker]/[year]/[month]/[amount]/page.tsx`, add at the top level (module scope):

```tsx
export const revalidate = 86400;
```

- [ ] **Step 6: Full test + build**

Run: `npm test`
Expected: ALL tests pass.

Run: `npm run build`
Expected: build succeeds with no type errors; routes `/`, `/c/...`, `/api/bagcheck`, `/api/og/...` all present.

- [ ] **Step 7: Reduced-motion + mobile manual check (recommended)**

With `npm run dev`: enable OS "reduce motion" and confirm the card appears instantly (no broken layout); count-up jumps to final. Resize to a phone width and confirm the form and card stack cleanly and the page never scrolls horizontally.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: IPO_AFTER one-tap fix + edge cache headers; final polish"
```

---

## Self-Review

**Spec coverage:**
- §2 brand/first-load/reveal/aesthetic/typography/amount/date/comparison/ticker/motion → Tasks 1, 3–6, 10–15, 17.
- "One page, two URLs" (§3) → Tasks 15 (`/`, URL rewrite) + 16 (`/c/`, OG metadata).
- Data flow (§3) → Tasks 7–9 (Tako, cache, /api/bagcheck), 6 (pickItems), 17 (OG).
- Routes/modules (§4) → all files created across Tasks 3–17.
- Page UI + states + visual language + motion (§5) → Tasks 11–15, 10.
- Math + snapping (§6) → Task 5.
- Comparison engine + edge cases (§7) → Tasks 6 (picker), 11 (loss framing), 18 (IPO fix), 9 (NO_DATA + looser retry).
- Sharing + caching (§8) → Tasks 9 (bag cache), 14 (share row), 16 (OG meta), 17 (OG image), 18 (edge headers).
- Build order (§9) → tasks ordered Phase 0 (Task 2) → libs → API → components → pages → OG → polish.
- Testing (§10) → every lib/component/route has a test task.
- Definition of done (§11) → covered by Tasks 15–17 manual smokes.

**Placeholder scan:** No TBD/TODO/"handle errors appropriately"; every code step shows complete code; the only `<PASTE HERE>` is the human-recorded spike finding in Task 2's commit message, which is intentional.

**Type consistency:** `BagResult`/`BagError`/`BagMath`/`PickedItem`/`Item`/`Scale` defined once in `lib/types.ts` and imported everywhere. `pickItems(amount, seed, exclude?, count?)`, `seedFor`, `canonicalPath`, `parseDate`, `computeBag`, `takoSearch`, `bagKey`/`cacheGet`/`cacheSet` signatures match across all call sites (route, BagApp, OG route, /c page). Card props (`tickerSlot`/`shareSlot`/`animate`) consistent between BagApp and BagCard.

**Note for the implementer:** Task 2 (the Tako spike) requires a real `TAKO_API_KEY`. If the observed `x` format differs from the candidates handled in `toYearMonth` (Task 5), add a case there before proceeding — the rest of the pipeline assumes `toYearMonth` returns `YYYY-MM`.
