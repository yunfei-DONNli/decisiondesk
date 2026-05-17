import { contextBridge, ipcRenderer } from "electron";
import type {
  AnalysisTaskRequest,
  MulticaIssueSummary
} from "../src/analysis/team/multica-bridge";
import type { RealtimeQuote } from "../src/market/realtime/realtime-quote";
import type { AnalysisResult } from "../src/shared/analysis-result";

contextBridge.exposeInMainWorld("decisionDesk", {
  multica: {
    createAnalysisIssue: (payload: AnalysisTaskRequest): Promise<MulticaIssueSummary> =>
      ipcRenderer.invoke("multica:create-analysis-issue", payload),
    fetchAnalysisResult: (issueId: string): Promise<AnalysisResult | null> =>
      ipcRenderer.invoke("multica:fetch-analysis-result", issueId),
    fetchRealtimeQuote: (symbol: string, market: string): Promise<RealtimeQuote> =>
      ipcRenderer.invoke("market:fetch-realtime-quote", { market, symbol }),
    listAgents: (): Promise<string[]> => ipcRenderer.invoke("multica:list-agents"),
    notify: (payload: { body: string; title: string }): Promise<void> =>
      ipcRenderer.invoke("notify:show", payload),
    exportAnalysisReport: (payload: {
      html: string;
      issueIdentifier?: string;
      symbol?: string;
    }): Promise<{ path: string }> => ipcRenderer.invoke("reporting:export-analysis-report", payload)
  }
});
