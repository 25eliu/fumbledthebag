import { monthName, formatMoney } from "@/lib/format";
import type { BagResult } from "@/lib/types";

export function buildOgTitle(result: BagResult): string {
  const [, sm] = result.startDateActual.split("-").map(Number);
  return `${formatMoney(result.amount)} in ${result.ticker} (${monthName(sm).slice(0, 3)} ${result.year}) → ${formatMoney(result.currentValue)}`;
}
