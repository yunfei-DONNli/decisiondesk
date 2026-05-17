export type RealtimeQuote = {
  asOf: string;
  changePercent: number;
  currency: string;
  marketState: "closed" | "live";
  price: number;
  symbol: string;
};

export function formatQuotePrice(quote: RealtimeQuote | null | undefined): string {
  if (!quote) {
    return "待刷新";
  }

  return `${quote.currency} ${quote.price.toFixed(2)}`;
}

export function formatQuoteChange(quote: RealtimeQuote | null | undefined): string {
  if (!quote) {
    return "暂无变动";
  }

  const sign = quote.changePercent > 0 ? "+" : "";
  return `${sign}${quote.changePercent.toFixed(2)}%`;
}
