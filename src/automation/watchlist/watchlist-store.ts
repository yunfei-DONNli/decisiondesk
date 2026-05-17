import type { AnalysisTaskRequest } from "@/analysis/team/multica-bridge";
import type { RealtimeQuote } from "@/market/realtime/realtime-quote";

export const WATCHLIST_STORAGE_KEY = "decisiondesk.watchlist.v1";

export type WatchlistStatus = "idle" | "scheduled" | "running" | "completed";

export type WatchlistItem = {
  addedAt: string;
  id: string;
  lastAnalyzedAt: string | null;
  lastIssueId: string | null;
  nextRunAt: string | null;
  quote: RealtimeQuote | null;
  request: AnalysisTaskRequest;
  status: WatchlistStatus;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

const DEFAULT_REASSESSMENT_INTERVAL_MS = 12 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHolding(value: unknown): value is AnalysisTaskRequest["holding"] {
  return isRecord(value)
    && typeof value.costBasis === "string"
    && typeof value.hasPosition === "boolean"
    && typeof value.positionSize === "string"
    && typeof value.sharesHeld === "string";
}

function isAnalysisTaskRequest(value: unknown): value is AnalysisTaskRequest {
  return isRecord(value)
    && typeof value.displayName === "string"
    && isHolding(value.holding)
    && typeof value.language === "string"
    && typeof value.market === "string"
    && typeof value.query === "string"
    && typeof value.symbol === "string";
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  return isRecord(value)
    && typeof value.addedAt === "string"
    && typeof value.id === "string"
    && (typeof value.lastAnalyzedAt === "string" || value.lastAnalyzedAt === null)
    && (typeof value.lastIssueId === "string" || value.lastIssueId === null)
    && (typeof value.nextRunAt === "string" || value.nextRunAt === null)
    && isAnalysisTaskRequest(value.request)
    && typeof value.status === "string";
}

function sortWatchlistItems(items: WatchlistItem[]): WatchlistItem[] {
  return [...items].sort((left, right) => left.request.symbol.localeCompare(right.request.symbol, "zh-CN"));
}

export function createWatchlistItem(payload: {
  addedAt: string;
  issueId?: string | null;
  lastAnalyzedAt?: string | null;
  request: AnalysisTaskRequest;
}): WatchlistItem {
  const nextRunAt = new Date(Date.parse(payload.lastAnalyzedAt ?? payload.addedAt) + DEFAULT_REASSESSMENT_INTERVAL_MS).toISOString();
  return {
    addedAt: payload.addedAt,
    id: payload.request.symbol,
    lastAnalyzedAt: payload.lastAnalyzedAt ?? payload.addedAt,
    lastIssueId: payload.issueId ?? null,
    nextRunAt,
    quote: null,
    request: payload.request,
    status: "idle"
  };
}

export function upsertWatchlistItem(items: WatchlistItem[], nextItem: WatchlistItem): WatchlistItem[] {
  return sortWatchlistItems([
    nextItem,
    ...items.filter((item) => item.id !== nextItem.id)
  ]);
}

export function removeWatchlistItem(items: WatchlistItem[], itemId: string): WatchlistItem[] {
  return sortWatchlistItems(items.filter((item) => item.id !== itemId));
}

export function markWatchlistForRun(items: WatchlistItem[], itemId: string, now: string): WatchlistItem[] {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    return {
      ...item,
      nextRunAt: now,
      status: "scheduled"
    };
  });
}

export function syncWatchlistAnalysisResult(
  items: WatchlistItem[],
  payload: {
    analyzedAt: string;
    issueId: string;
    quote?: RealtimeQuote | null;
    request: AnalysisTaskRequest;
  }
): WatchlistItem[] {
  const existing = items.find((item) => item.id === payload.request.symbol);
  const nextItem: WatchlistItem = {
    ...(existing ?? createWatchlistItem({
      addedAt: payload.analyzedAt,
      request: payload.request
    })),
    lastAnalyzedAt: payload.analyzedAt,
    lastIssueId: payload.issueId,
    nextRunAt: new Date(Date.parse(payload.analyzedAt) + DEFAULT_REASSESSMENT_INTERVAL_MS).toISOString(),
    quote: payload.quote ?? existing?.quote ?? null,
    request: payload.request,
    status: "completed"
  };

  return upsertWatchlistItem(items, nextItem);
}

export function syncWatchlistQuote(
  items: WatchlistItem[],
  payload: {
    quote: RealtimeQuote;
    symbol: string;
  }
): WatchlistItem[] {
  return items.map((item) => {
    if (item.id !== payload.symbol) {
      return item;
    }

    return {
      ...item,
      quote: payload.quote
    };
  });
}

export function findWatchlistDueItem(
  items: WatchlistItem[],
  nowIso: string
): WatchlistItem | null {
  const now = Date.parse(nowIso);
  return items.find((item) =>
    item.nextRunAt !== null
      && Date.parse(item.nextRunAt) <= now
      && item.status !== "running"
  ) ?? null;
}

export function loadWatchlistItems(
  storage: StorageReader,
  storageKey: string = WATCHLIST_STORAGE_KEY
): WatchlistItem[] {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortWatchlistItems(parsed.filter(isWatchlistItem));
  } catch {
    return [];
  }
}

export function saveWatchlistItems(
  storage: StorageWriter,
  items: WatchlistItem[],
  storageKey: string = WATCHLIST_STORAGE_KEY
): void {
  storage.setItem(storageKey, JSON.stringify(sortWatchlistItems(items)));
}
