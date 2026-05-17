import type { HoldingInput } from "@/analysis/holding/holding";
import type { RealtimeQuote } from "@/market/realtime/realtime-quote";
import type { AnalysisResult } from "@/shared/analysis-result";

declare const window: {
  decisionDesk?: {
    multica: MulticaDesktopApi;
  };
};

export type MulticaIssueStatus = "queued" | "running" | "completed" | "failed";

export type MulticaRuntimeHealth = {
  agents: string[];
  detail: string;
  squads: string[];
  status: "ready" | "attention" | "error";
};

export type AnalysisTaskRequest = {
  displayName: string;
  holding: HoldingInput;
  language: string;
  market: string;
  query: string;
  symbol: string;
};

export type MulticaIssueSummary = {
  assignee?: string;
  childIssues?: Array<{
    assignee: string;
    id: string;
    title: string;
  }>;
  identifier?: string;
  id: string;
  prompt: string;
  runtime: MulticaRuntimeHealth;
  status: MulticaIssueStatus;
  title: string;
};

export type AnalysisTaskState = {
  createdAt: string | null;
  issue: MulticaIssueSummary | null;
  request: AnalysisTaskRequest | null;
  result: AnalysisResult | null;
};

type MulticaDesktopApi = {
  createAnalysisIssue: (payload: AnalysisTaskRequest) => Promise<MulticaIssueSummary>;
  fetchAnalysisResult: (issueId: string) => Promise<AnalysisResult | null>;
  fetchRealtimeQuote: (symbol: string, market: string) => Promise<RealtimeQuote>;
  exportAnalysisReport: (payload: {
    html: string;
    issueIdentifier?: string;
    symbol?: string;
  }) => Promise<{ path: string }>;
  listAgents: () => Promise<string[]>;
  notify: (payload: { body: string; title: string }) => Promise<void>;
};

function getDesktopApi(): MulticaDesktopApi {
  if (!window.decisionDesk?.multica) {
    throw new Error("未检测到桌面端 Multica API，请通过 Electron 启动 DecisionDesk。");
  }

  return window.decisionDesk.multica;
}

export class MulticaBridge {
  async listAgents(): Promise<string[]> {
    return getDesktopApi().listAgents();
  }

  async createAnalysisIssue(payload: AnalysisTaskRequest): Promise<MulticaIssueSummary> {
    return getDesktopApi().createAnalysisIssue(payload);
  }

  async fetchAnalysisResult(issueId: string): Promise<AnalysisResult | null> {
    return getDesktopApi().fetchAnalysisResult(issueId);
  }

  async exportAnalysisReport(payload: {
    html: string;
    issueIdentifier?: string;
    symbol?: string;
  }): Promise<{ path: string }> {
    return getDesktopApi().exportAnalysisReport(payload);
  }

  async fetchRealtimeQuote(symbol: string, market: string): Promise<RealtimeQuote> {
    return getDesktopApi().fetchRealtimeQuote(symbol, market);
  }

  async notify(payload: { body: string; title: string }): Promise<void> {
    return getDesktopApi().notify(payload);
  }
}
