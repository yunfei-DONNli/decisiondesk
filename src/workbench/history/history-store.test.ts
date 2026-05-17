import { describe, expect, it } from "vitest";
import type { AnalysisTaskRequest, MulticaIssueSummary } from "@/analysis/team/multica-bridge";
import type { AnalysisResult } from "@/shared/analysis-result";
import {
  createHistoryEntry,
  loadHistoryEntries,
  saveHistoryEntries,
  upsertHistoryEntry
} from "./history-store";

const baseRequest: AnalysisTaskRequest = {
  displayName: "小米集团",
  holding: {
    costBasis: "28.50",
    hasPosition: true,
    positionSize: "25%",
    sharesHeld: "2000"
  },
  language: "zh-CN",
  market: "港股",
  query: "帮我分析一下小米",
  symbol: "1810.HK"
};

const baseIssue: MulticaIssueSummary = {
  id: "issue-1",
  identifier: "DON-1",
  prompt: "分析小米",
  runtime: {
    agents: ["codex-risk-chair"],
    detail: "runtime ready",
    squads: ["DecisionDesk Research Squad"],
    status: "ready"
  },
  status: "completed",
  title: "小米分析"
};

const baseResult: AnalysisResult = {
  actionSuggestion: "等待右侧确认后分批建仓",
  bullBearDebate: {
    bears: ["卖空占比偏高，需要控制仓位"],
    bulls: ["新车节奏顺利时有估值上修空间"]
  },
  generatedAt: "2026-05-17T08:00:00.000Z",
  holding: baseRequest.holding,
  keyEvents: ["财报窗口", "新车型节奏"],
  language: "zh-CN",
  market: "港股",
  positionSuggestion: "20%-30%",
  priceTargets: ["32.5", "36+"],
  recommendation: "买入",
  riskVerdict: {
    confidence: "中",
    level: "中",
    summary: "等待进一步确认"
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

function createMemoryStorage(): Storage {
  const bucket = new Map<string, string>();
  return {
    clear: () => bucket.clear(),
    getItem: (key: string) => bucket.get(key) ?? null,
    key: (index: number) => Array.from(bucket.keys())[index] ?? null,
    get length() {
      return bucket.size;
    },
    removeItem: (key: string) => {
      bucket.delete(key);
    },
    setItem: (key: string, value: string) => {
      bucket.set(key, value);
    }
  };
}

describe("history-store", () => {
  it("keeps the newest history version first and replaces duplicate issues", () => {
    const firstEntry = createHistoryEntry({
      createdAt: "2026-05-17T08:00:00.000Z",
      issue: baseIssue,
      request: baseRequest,
      result: {
        ...baseResult,
        updatedAt: "2026-05-17T08:30:00.000Z"
      }
    });
    const secondEntry = createHistoryEntry({
      createdAt: "2026-05-17T09:00:00.000Z",
      issue: {
        ...baseIssue,
        id: "issue-2",
        identifier: "DON-2"
      },
      request: {
        ...baseRequest,
        query: "帮我重新分析一下小米"
      },
      result: {
        ...baseResult,
        updatedAt: "2026-05-17T09:15:00.000Z"
      }
    });
    const replacedSecondEntry = createHistoryEntry({
      createdAt: "2026-05-17T09:20:00.000Z",
      issue: secondEntry.issue,
      request: secondEntry.request,
      result: {
        ...baseResult,
        recommendation: "观望",
        updatedAt: "2026-05-17T09:45:00.000Z"
      }
    });

    const history = upsertHistoryEntry(
      upsertHistoryEntry([firstEntry], secondEntry),
      replacedSecondEntry
    );

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe("issue-2");
    expect(history[0].result?.recommendation).toBe("观望");
    expect(history[1].id).toBe("issue-1");
  });

  it("round-trips persisted history entries and ignores invalid payloads", () => {
    const storage = createMemoryStorage();
    const entry = createHistoryEntry({
      createdAt: "2026-05-17T08:00:00.000Z",
      issue: baseIssue,
      request: baseRequest,
      result: baseResult
    });

    saveHistoryEntries(storage, [entry], "test-history");
    expect(loadHistoryEntries(storage, "test-history")).toEqual([entry]);

    storage.setItem("test-history", JSON.stringify([{ invalid: true }]));
    expect(loadHistoryEntries(storage, "test-history")).toEqual([]);
  });
});
