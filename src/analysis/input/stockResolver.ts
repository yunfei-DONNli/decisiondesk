export type Market = "A股" | "港股" | "美股";

export type StockCandidate = {
  displayName: string;
  market: Market;
  symbol: string;
  aliases: string[];
};

const CANDIDATES: StockCandidate[] = [
  {
    displayName: "小米集团",
    market: "港股",
    symbol: "1810.HK",
    aliases: ["小米", "小米集团", "xiaomi"]
  },
  {
    displayName: "贵州茅台",
    market: "A股",
    symbol: "600519.SH",
    aliases: ["茅台", "贵州茅台", "moutai"]
  },
  {
    displayName: "苹果",
    market: "美股",
    symbol: "AAPL",
    aliases: ["苹果", "apple", "aapl"]
  }
];

export function identifyStockCandidates(query: string): StockCandidate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const exact = CANDIDATES.filter((candidate) =>
    candidate.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
      || normalized.includes(candidate.symbol.toLowerCase())
  );

  return exact.length > 0 ? exact : CANDIDATES.slice(0, 2);
}
