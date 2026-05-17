import type {
  AnalysisTaskRequest,
  MulticaIssueSummary
} from "@/analysis/team/multica-bridge";
import {
  validateAnalysisResult,
  type AnalysisResult
} from "@/shared/analysis-result";

export const ANALYSIS_HISTORY_STORAGE_KEY = "decisiondesk.analysis-history.v1";

export type AnalysisHistoryEntry = {
  createdAt: string;
  id: string;
  issue: MulticaIssueSummary;
  request: AnalysisTaskRequest;
  result: AnalysisResult | null;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAnalysisTaskRequest(value: unknown): value is AnalysisTaskRequest {
  return isRecord(value)
    && typeof value.displayName === "string"
    && typeof value.language === "string"
    && typeof value.market === "string"
    && typeof value.query === "string"
    && typeof value.symbol === "string";
}

function isMulticaIssueSummary(value: unknown): value is MulticaIssueSummary {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.prompt === "string"
    && typeof value.status === "string"
    && typeof value.title === "string"
    && isRecord(value.runtime)
    && Array.isArray(value.runtime.agents)
    && Array.isArray(value.runtime.squads)
    && typeof value.runtime.detail === "string"
    && typeof value.runtime.status === "string";
}

function isAnalysisHistoryEntry(value: unknown): value is AnalysisHistoryEntry {
  return isRecord(value)
    && typeof value.createdAt === "string"
    && typeof value.id === "string"
    && isAnalysisTaskRequest(value.request)
    && isMulticaIssueSummary(value.issue)
    && (value.result === null || validateAnalysisResult(value.result));
}

function getSortTimestamp(entry: AnalysisHistoryEntry): number {
  const timestamp = entry.result?.updatedAt ?? entry.createdAt;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortHistoryEntries(entries: AnalysisHistoryEntry[]): AnalysisHistoryEntry[] {
  return [...entries].sort((left, right) => getSortTimestamp(right) - getSortTimestamp(left));
}

export function upsertHistoryEntry(
  entries: AnalysisHistoryEntry[],
  nextEntry: AnalysisHistoryEntry
): AnalysisHistoryEntry[] {
  return sortHistoryEntries([
    nextEntry,
    ...entries.filter((entry) => entry.id !== nextEntry.id)
  ]);
}

export function createHistoryEntry(payload: {
  createdAt: string;
  issue: MulticaIssueSummary;
  request: AnalysisTaskRequest;
  result: AnalysisResult | null;
}): AnalysisHistoryEntry {
  return {
    createdAt: payload.createdAt,
    id: payload.issue.id,
    issue: payload.issue,
    request: payload.request,
    result: payload.result
  };
}

export function loadHistoryEntries(
  storage: StorageReader,
  storageKey: string = ANALYSIS_HISTORY_STORAGE_KEY
): AnalysisHistoryEntry[] {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortHistoryEntries(parsed.filter(isAnalysisHistoryEntry));
  } catch {
    return [];
  }
}

export function saveHistoryEntries(
  storage: StorageWriter,
  entries: AnalysisHistoryEntry[],
  storageKey: string = ANALYSIS_HISTORY_STORAGE_KEY
): void {
  storage.setItem(storageKey, JSON.stringify(sortHistoryEntries(entries)));
}
