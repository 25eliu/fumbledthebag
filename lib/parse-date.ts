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
  if (!s) return { error: "Enter a date like \"Mar 2020\"." };

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

  return { error: "Couldn't read that date — try \"Mar 2020\"." };
}

function clampMonth(month: number): number {
  return Math.min(12, Math.max(1, month));
}
