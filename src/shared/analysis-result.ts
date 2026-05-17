import type { HoldingInput } from "@/analysis/holding/holding";

export type RecommendationState = "强烈买入" | "买入" | "观望" | "减仓" | "卖出";
export type RiskLevel = "低" | "中" | "高";
export type ConfidenceLevel = "低" | "中" | "高";

export type ScoreBreakdown = {
  technical: number;
  fundamental: number;
  news: number;
  sentiment: number;
  valuation: number;
};

export type AnalysisResult = {
  symbol: string;
  market: string;
  language: string;
  generatedAt: string;
  holding: HoldingInput;
  updatedAt: string;
  recommendation: RecommendationState;
  actionSuggestion: string;
  priceTargets: string[];
  stopLoss: string;
  positionSuggestion: string;
  scores: ScoreBreakdown;
  bullBearDebate: {
    bulls: string[];
    bears: string[];
  };
  riskVerdict: {
    level: RiskLevel;
    confidence: ConfidenceLevel;
    summary: string;
  };
  keyEvents: string[];
  sourceSummary: string[];
};

export function validateAnalysisResult(input: unknown): input is AnalysisResult {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const value = input as Record<string, unknown>;
  return typeof value.symbol === "string"
    && typeof value.market === "string"
    && typeof value.language === "string"
    && typeof value.generatedAt === "string"
    && typeof value.holding === "object"
    && value.holding !== null
    && typeof value.updatedAt === "string"
    && typeof value.recommendation === "string"
    && typeof value.actionSuggestion === "string"
    && Array.isArray(value.priceTargets)
    && typeof value.stopLoss === "string"
    && typeof value.positionSuggestion === "string"
    && typeof value.scores === "object"
    && value.scores !== null
    && typeof value.bullBearDebate === "object"
    && value.bullBearDebate !== null
    && typeof value.riskVerdict === "object"
    && value.riskVerdict !== null
    && Array.isArray(value.keyEvents)
    && Array.isArray(value.sourceSummary);
}
