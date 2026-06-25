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

  // Tako series ordering is not guaranteed (Phase-0 spike deferred). Sort
  // ascending by ym so find/snap and current-price selection are correct.
  // Zero-padded "YYYY-MM" sorts lexicographically identical to chronological.
  norm.sort((a, b) => (a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0));

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
