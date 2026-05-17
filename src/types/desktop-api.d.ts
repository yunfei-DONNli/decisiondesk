import type {
  AnalysisTaskRequest,
  MulticaIssueSummary
} from "@/analysis/team/multica-bridge";
import type { AnalysisResult } from "@/shared/analysis-result";
import type { RealtimeQuote } from "@/market/realtime/realtime-quote";

declare global {
  interface Window {
    decisionDesk?: {
      multica: {
        createAnalysisIssue: (payload: AnalysisTaskRequest) => Promise<MulticaIssueSummary>;
        fetchAnalysisResult: (issueId: string) => Promise<AnalysisResult | null>;
        fetchRealtimeQuote: (symbol: string, market: string) => Promise<RealtimeQuote>;
        listAgents: () => Promise<string[]>;
        notify: (payload: { body: string; title: string }) => Promise<void>;
        exportAnalysisReport: (payload: {
          html: string;
          issueIdentifier?: string;
          symbol?: string;
        }) => Promise<{ path: string }>;
      };
    };
  }
}

export {};
