import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadarController,
  RadialLinearScale,
  ScatterController,
  Tooltip
} from "chart.js";
import { Chart, Doughnut, Radar, Scatter } from "react-chartjs-2";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import type { Locale } from "@/i18n/messages";
import type { AnalysisResult } from "@/shared/analysis-result";
import {
  buildBullBearWeightData,
  buildCandleSeries,
  buildRadarChartData,
  buildRiskTriangleData
} from "./chartData";

ChartJS.register(
  ArcElement,
  CategoryScale,
  CandlestickController,
  CandlestickElement,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadarController,
  RadialLinearScale,
  ScatterController,
  Tooltip
);

type AnalysisChartsProps = {
  locale: Locale;
  result: AnalysisResult;
};

export function AnalysisCharts({ locale, result }: AnalysisChartsProps) {
  const radarData = buildRadarChartData(result);
  const bullBearData = buildBullBearWeightData(result);
  const riskTriangleData = buildRiskTriangleData(result);
  const candles = buildCandleSeries(result);

  return (
    <section className="chart-grid">
      <article className="chart-card">
        <h3>{locale === "en-US" ? "Radar score map" : "雷达图"}</h3>
        <Radar data={radarData} options={{ responsive: true, scales: { r: { max: 10, min: 0 } } }} />
      </article>
      <article className="chart-card">
        <h3>{locale === "en-US" ? "Bull/Bear weights" : "多空权重"}</h3>
        <Doughnut data={bullBearData} options={{ responsive: true }} />
      </article>
      <article className="chart-card">
        <h3>{locale === "en-US" ? "Risk triangle" : "风险三角"}</h3>
        <Scatter
          data={riskTriangleData}
          options={{
            responsive: true,
            scales: {
              x: { max: 10, min: 0, title: { display: true, text: locale === "en-US" ? "Market conviction" : "市场信念" } },
              y: { max: 10, min: 0, title: { display: true, text: locale === "en-US" ? "Risk pressure" : "风险压力" } }
            }
          }}
        />
      </article>
      <article className="chart-card">
        <h3>{locale === "en-US" ? "Candlestick view" : "K线"}</h3>
        <Chart
          data={{
            datasets: [
              {
                data: candles,
                label: result.symbol,
                type: "candlestick" as const
              }
            ]
          }}
          options={{ responsive: true }}
          type="candlestick"
        />
      </article>
    </section>
  );
}
