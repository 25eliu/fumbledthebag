type BagParams = { ticker: string; year: number; month: number; amount: number };

export function canonicalPath({ ticker, year, month, amount }: BagParams): string {
  return `/c/${ticker.toUpperCase()}/${year}/${month}/${amount}`;
}

export function seedFor({ ticker, year, month, amount }: BagParams): string {
  return `${ticker.toUpperCase()}|${year}|${month}|${amount}`;
}
