import type { Page } from "@playwright/test";
import {
  ANALYSIS_HISTORY_STORAGE_KEY,
  COMPLIANCE_ACK_STORAGE_KEY,
  NOTIFICATION_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
  sampleHistory,
  sampleIssue,
  sampleNotifications,
  sampleQuote,
  sampleResult,
  sampleWatchlist
} from "./fixtures";

export async function seedAppState(
  page: Page,
  options: {
    complianceAck?: boolean;
    history?: unknown[];
    notifications?: unknown[];
    watchlist?: unknown[];
  } = {}
): Promise<void> {
  const {
    complianceAck = true,
    history = sampleHistory,
    notifications = sampleNotifications,
    watchlist = sampleWatchlist
  } = options;
  const issueValue = structuredClone(sampleIssue);
  const resultValue = structuredClone(sampleResult);
  const quoteValue = structuredClone(sampleQuote);
  const resultSeedsBySymbol = {
    "1810.HK": structuredClone(sampleResult),
    "600519.SH": {
      ...structuredClone(sampleResult),
      actionSuggestion: "估值处于高位，适合继续观察而非追价。",
      market: "A股",
      priceTargets: ["1720 CNY", "1780 CNY"],
      recommendation: "观望",
      riskVerdict: {
        confidence: "中",
        level: "中",
        summary: "白酒龙头具备防御属性，但估值与消费节奏需要继续观察。"
      },
      scores: {
        fundamental: 8.6,
        news: 6.9,
        sentiment: 6.1,
        technical: 6.5,
        valuation: 5.4
      },
      sourceSummary: ["季报摘要", "券商晨会纪要"],
      stopLoss: "1580 CNY",
      symbol: "600519.SH"
    },
    AAPL: {
      ...structuredClone(sampleResult),
      actionSuggestion: "等待下一轮财报验证后再决定是否追踪加仓。",
      market: "美股",
      priceTargets: ["220 USD", "228 USD"],
      recommendation: "买入",
      riskVerdict: {
        confidence: "高",
        level: "低",
        summary: "现金流稳定，回购和生态优势仍然明显。"
      },
      scores: {
        fundamental: 8.9,
        news: 7.6,
        sentiment: 7.9,
        technical: 7.2,
        valuation: 6.5
      },
      sourceSummary: ["10-Q 摘要", "产品发布会纪要"],
      stopLoss: "198 USD",
      symbol: "AAPL"
    }
  };

  await page.addInitScript(
    ({
      complianceAckValue,
      historyValue,
      notificationsValue,
      watchlistValue,
      issueSeed,
      quoteSeed,
      resultSeeds
    }) => {
      window.localStorage.clear();

      if (complianceAckValue) {
        window.localStorage.setItem("decisiondesk.compliance-ack.v1", "acknowledged");
      }

      window.localStorage.setItem("decisiondesk.analysis-history.v1", JSON.stringify(historyValue));
      window.localStorage.setItem("decisiondesk.notifications.v1", JSON.stringify(notificationsValue));
      window.localStorage.setItem("decisiondesk.watchlist.v1", JSON.stringify(watchlistValue));
      const issueRequests = new Map<string, {
        displayName: string;
        market: string;
        symbol: string;
      }>();

      const mockApi = {
        async createAnalysisIssue(payload: {
          displayName: string;
          market: string;
          symbol: string;
        }) {
          const nextIssue = structuredClone(issueSeed);
          nextIssue.id = `issue-${payload.symbol}`;
          nextIssue.identifier = `DD-${payload.symbol}`;
          nextIssue.title = `${payload.displayName}综合分析`;
          nextIssue.prompt = `分析${payload.displayName}`;
          issueRequests.set(nextIssue.id, payload);
          return nextIssue;
        },
        async exportAnalysisReport() {
          return { path: "deliverables/decisiondesk/report.html" };
        },
        async fetchAnalysisResult(issueId: string) {
          const payload = issueRequests.get(issueId);
          if (!payload) {
            return structuredClone(resultSeeds["1810.HK"]);
          }

          const nextResult = structuredClone(resultSeeds[payload.symbol] ?? resultSeeds["1810.HK"]);
          nextResult.market = payload.market;
          nextResult.symbol = payload.symbol;
          return nextResult;
        },
        async fetchRealtimeQuote(symbol: string) {
          const quote = watchlistValue.find((item: { id: string; quote: unknown }) => item.id === symbol)?.quote;
          return quote ?? structuredClone(quoteSeed);
        },
        async listAgents() {
          return ["技术分析师", "基本面分析师", "情绪分析师"];
        },
        async notify() {
          return undefined;
        }
      };

      Object.defineProperty(window, "decisionDesk", {
        configurable: true,
        value: { multica: mockApi },
        writable: true
      });
    },
    {
      complianceAckValue: complianceAck,
      historyValue: history,
      issueSeed: issueValue,
      notificationsValue: notifications,
      quoteSeed: quoteValue,
      resultSeeds: resultSeedsBySymbol,
      watchlistValue: watchlist
    }
  );
}

export {
  ANALYSIS_HISTORY_STORAGE_KEY,
  COMPLIANCE_ACK_STORAGE_KEY,
  NOTIFICATION_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY
};
