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
