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
