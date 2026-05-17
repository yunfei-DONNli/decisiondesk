import type { AnalysisResult } from "@/shared/analysis-result";

export function buildRadarChartData(result: AnalysisResult) {
  return {
    datasets: [
      {
        backgroundColor: "rgba(20, 184, 122, 0.18)",
        borderColor: "#0e9f6e",
        borderWidth: 2,
        data: [
          result.scores.technical,
          result.scores.fundamental,
          result.scores.news,
          result.scores.sentiment,
          result.scores.valuation
        ],
        label: result.symbol
      }
    ],
    labels: ["Technical", "Fundamental", "News", "Sentiment", "Valuation"]
  };
}

export function buildBullBearWeightData(result: AnalysisResult) {
  return {
    datasets: [
      {
        backgroundColor: ["#0e9f6e", "#c75b4d"],
        data: [result.bullBearDebate.bulls.length || 1, result.bullBearDebate.bears.length || 1]
      }
    ],
    labels: ["Bull", "Bear"]
  };
}

export function buildRiskTriangleData(result: AnalysisResult) {
  return {
    datasets: [
      {
        backgroundColor: "rgba(199, 91, 77, 0.2)",
        borderColor: "#c75b4d",
        borderWidth: 2,
        data: [
          { x: result.scores.technical, y: result.scores.news },
          { x: result.scores.sentiment, y: result.scores.fundamental },
          { x: result.scores.valuation, y: result.scores.technical }
        ],
        pointRadius: 5,
        showLine: true
      }
    ]
  };
}

export function buildCandleSeries(result: AnalysisResult) {
  const base = result.scores.technical + result.scores.fundamental + result.scores.news;
  return [
    { c: Number((base + 0.4).toFixed(2)), h: Number((base + 1.2).toFixed(2)), l: Number((base - 0.9).toFixed(2)), o: Number((base - 0.3).toFixed(2)), x: 1 },
    { c: Number((base + 0.8).toFixed(2)), h: Number((base + 1.5).toFixed(2)), l: Number((base - 0.4).toFixed(2)), o: Number((base + 0.1).toFixed(2)), x: 2 },
    { c: Number((base + 0.2).toFixed(2)), h: Number((base + 1.1).toFixed(2)), l: Number((base - 0.7).toFixed(2)), o: Number((base + 0.6).toFixed(2)), x: 3 },
    { c: Number((base + 1.4).toFixed(2)), h: Number((base + 1.9).toFixed(2)), l: Number((base + 0.1).toFixed(2)), o: Number((base + 0.3).toFixed(2)), x: 4 }
  ];
}
