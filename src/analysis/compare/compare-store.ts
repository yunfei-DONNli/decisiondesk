import type { AnalysisResult } from "@/shared/analysis-result";
import type { StockCandidate } from "@/analysis/input/stockResolver";

export type CompareCandidate = StockCandidate & {
  selected: boolean;
};

export type CompareResultItem = {
  compositeScore: number;
  recommendation: string;
  riskLevel: string;
  summary: string;
  symbol: string;
};

export function createCompareCandidates(candidates: StockCandidate[]): CompareCandidate[] {
  return candidates.map((candidate, index) => ({
    ...candidate,
    selected: index < 2
  }));
}

export function toggleCompareCandidate(
  candidates: CompareCandidate[],
  symbol: string
): CompareCandidate[] {
  const selectedCount = candidates.filter((candidate) => candidate.selected).length;

  return candidates.map((candidate) => {
    if (candidate.symbol !== symbol) {
      return candidate;
    }

    if (!candidate.selected && selectedCount >= 5) {
      return candidate;
    }

    return {
      ...candidate,
      selected: !candidate.selected
    };
  });
}

export function buildCompareResultItem(result: AnalysisResult): CompareResultItem {
  const compositeScore = Number((
    result.scores.technical
    + result.scores.fundamental
    + result.scores.news
    + result.scores.sentiment
    + result.scores.valuation
  / 5).toFixed(2));

  return {
    compositeScore,
    recommendation: result.recommendation,
    riskLevel: result.riskVerdict.level,
    summary: result.riskVerdict.summary,
    symbol: result.symbol
  };
}

export function rankCompareResults(results: AnalysisResult[]): CompareResultItem[] {
  return results
    .map(buildCompareResultItem)
    .sort((left, right) => right.compositeScore - left.compositeScore);
}
