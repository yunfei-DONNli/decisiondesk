import { describe, expect, it } from "vitest";
import { buildAnalysisReportDocument } from "@/reporting/reportTemplate";
import type { MulticaIssueSummary } from "@/analysis/team/multica-bridge";
import type { AnalysisResult } from "@/shared/analysis-result";

const issue: MulticaIssueSummary = {
  id: "issue-1",
  identifier: "DON-2",
  prompt: "分析小米",
  runtime: {
    agents: ["codex-risk-chair"],
    detail: "runtime ready",
    squads: ["DecisionDesk Research Squad"],
    status: "ready"
  },
  status: "completed",
  title: "小米集团分析"
};

const result: AnalysisResult = {
  actionSuggestion: "等待右侧确认后分批建仓",
  bullBearDebate: {
    bears: ["卖空占比偏高，需要控制仓位"],
    bulls: ["新车节奏顺利时有估值上修空间"]
  },
  generatedAt: "2026-05-17T08:00:00.000Z",
  holding: {
    costBasis: "28.50",
    hasPosition: true,
    positionSize: "25%",
    sharesHeld: "2000"
  },
  keyEvents: ["财报窗口", "新车型节奏"],
  language: "zh-CN",
  market: "港股",
  positionSuggestion: "20%-30%",
  priceTargets: ["32.5", "36+"],
  recommendation: "买入",
  riskVerdict: {
    confidence: "中",
    level: "中",
    summary: "风险来自 <EV 安全> 与监管变化"
  },
  scores: {
    fundamental: 8.2,
    news: 7,
    sentiment: 6.5,
    technical: 4,
    valuation: 6.8
  },
  sourceSummary: ["风险主管最终裁决"],
  stopLoss: "跌破 28 减仓",
  symbol: "1810.HK",
  updatedAt: "2026-05-17T09:00:00.000Z"
};

describe("buildAnalysisReportDocument", () => {
  it("renders the analysis result as a complete HTML report", () => {
    const html = buildAnalysisReportDocument({
      issue,
      locale: "zh-CN",
      result
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("1810.HK");
    expect(html).toContain("DON-2");
    expect(html).toContain("买入");
    expect(html).toContain("32.5 / 36+");
    expect(html).toContain("持仓情况");
    expect(html).toContain("已持仓");
    expect(html).toContain("本产品仅供研究与产品演示使用，不构成任何投资建议、投顾服务或收益承诺。");
    expect(html).toContain("数据来源类型");
    expect(html).toContain("当前版本主要来源");
  });

  it("escapes dynamic content before inserting it into the HTML document", () => {
    const html = buildAnalysisReportDocument({
      issue,
      locale: "zh-CN",
      result
    });

    expect(html).toContain("风险来自 &lt;EV 安全&gt; 与监管变化");
    expect(html).not.toContain("风险来自 <EV 安全> 与监管变化");
  });

  it("renders English report labels when locale is en-US", () => {
    const html = buildAnalysisReportDocument({
      issue,
      locale: "en-US",
      result: {
        ...result,
        language: "en-US"
      }
    });

    expect(html).toContain('lang="en-US"');
    expect(html).toContain("Trading judgment");
    expect(html).toContain("Holding status");
    expect(html).toContain("Source categories");
  });
});
