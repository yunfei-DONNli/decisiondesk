import { describe, expect, it } from "vitest";
import {
  buildBullBearWeightData,
  buildCandleSeries,
  buildRadarChartData,
  buildRiskTriangleData
} from "./chartData";
import type { AnalysisResult } from "@/shared/analysis-result";

const result: AnalysisResult = {
  actionSuggestion: "Observe",
  bullBearDebate: {
    bears: ["Risk"],
    bulls: ["Upside", "Momentum"]
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
    summary: "summary"
  },
  scores: {
    fundamental: 8,
    news: 7,
    sentiment: 6,
    technical: 5,
    valuation: 7
  },
  sourceSummary: ["Source"],
  stopLoss: "90",
  symbol: "AAPL",
  updatedAt: "2026-05-17T09:00:00.000Z"
};

describe("chart data builders", () => {
  it("builds radar, weight, risk, and candle data from AnalysisResult", () => {
    expect(buildRadarChartData(result).datasets[0].data).toHaveLength(5);
    expect(buildBullBearWeightData(result).datasets[0].data).toEqual([2, 1]);
    expect(buildRiskTriangleData(result).datasets[0].data).toHaveLength(3);
    expect(buildCandleSeries(result)).toHaveLength(4);
  });
});
