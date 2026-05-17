import { describe, expect, it } from "vitest";
import { createCompareCandidates, rankCompareResults, toggleCompareCandidate } from "./compare-store";
import type { AnalysisResult } from "@/shared/analysis-result";

const candidates = [
  {
    aliases: ["xiaomi"],
    displayName: "Xiaomi",
    market: "港股" as const,
    symbol: "1810.HK"
  },
  {
    aliases: ["moutai"],
    displayName: "Moutai",
    market: "A股" as const,
    symbol: "600519.SH"
  },
  {
    aliases: ["apple"],
    displayName: "Apple",
    market: "美股" as const,
    symbol: "AAPL"
  }
];

const result = (symbol: string, technical: number): AnalysisResult => ({
  actionSuggestion: "Observe",
  bullBearDebate: {
    bears: ["Risk"],
    bulls: ["Upside"]
  },
  generatedAt: "2026-05-17T08:00:00.000Z",
  holding: {
    costBasis: "",
    hasPosition: false,
    positionSize: "",
    sharesHeld: ""
  },
  keyEvents: ["Event"],
  language: "en-US",
  market: "美股",
  positionSuggestion: "0%-10%",
  priceTargets: ["100"],
  recommendation: "观望",
  riskVerdict: {
    confidence: "中",
    level: "中",
    summary: `${symbol} summary`
  },
  scores: {
    fundamental: 8,
    news: 7,
    sentiment: 6,
    technical,
    valuation: 7
  },
  sourceSummary: ["Source"],
  stopLoss: "90",
  symbol,
  updatedAt: "2026-05-17T09:00:00.000Z"
});

describe("compare-store", () => {
  it("creates initial candidates and enforces the five-item selection cap", () => {
    const initial = createCompareCandidates(candidates);
    expect(initial[0].selected).toBe(true);
    expect(initial[1].selected).toBe(true);
    expect(initial[2].selected).toBe(false);

    const toggled = toggleCompareCandidate(initial, "AAPL");
    expect(toggled[2].selected).toBe(true);
  });

  it("ranks compare results by composite score", () => {
    const ranked = rankCompareResults([
      result("AAA", 5),
      result("BBB", 9)
    ]);

    expect(ranked[0].symbol).toBe("BBB");
    expect(ranked[0].compositeScore).toBeGreaterThan(ranked[1].compositeScore);
  });
});
