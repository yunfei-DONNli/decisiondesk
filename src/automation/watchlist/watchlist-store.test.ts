import { describe, expect, it } from "vitest";
import type { AnalysisTaskRequest } from "@/analysis/team/multica-bridge";
import {
  createWatchlistItem,
  findWatchlistDueItem,
  loadWatchlistItems,
  markWatchlistForRun,
  removeWatchlistItem,
  saveWatchlistItems,
  syncWatchlistAnalysisResult,
  syncWatchlistQuote,
  upsertWatchlistItem
} from "./watchlist-store";

const request: AnalysisTaskRequest = {
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

describe("watchlist-store", () => {
  it("upserts, schedules, and removes watchlist items", () => {
    const first = createWatchlistItem({
      addedAt: "2026-05-17T08:00:00.000Z",
      issueId: "issue-1",
      request
    });

    const updated = syncWatchlistAnalysisResult([first], {
      analyzedAt: "2026-05-17T12:00:00.000Z",
      issueId: "issue-2",
      request: {
        ...request,
        query: "收盘后重新分析一下小米"
      }
    });

    expect(updated[0].lastIssueId).toBe("issue-2");
    expect(updated[0].status).toBe("completed");
    expect(updated[0].quote).toBeNull();

    const scheduled = markWatchlistForRun(updated, "1810.HK", "2026-05-18T00:00:00.000Z");
    expect(scheduled[0].status).toBe("scheduled");
    expect(scheduled[0].nextRunAt).toBe("2026-05-18T00:00:00.000Z");

    const removed = removeWatchlistItem(scheduled, "1810.HK");
    expect(removed).toEqual([]);
  });

  it("finds due items and round-trips storage payloads", () => {
    const storage = createMemoryStorage();
    const item = createWatchlistItem({
      addedAt: "2026-05-17T08:00:00.000Z",
      issueId: "issue-1",
      request
    });
    const items = upsertWatchlistItem([], {
      ...item,
      nextRunAt: "2026-05-17T09:00:00.000Z",
      status: "scheduled"
    });

    saveWatchlistItems(storage, items, "watchlist-test");
    expect(loadWatchlistItems(storage, "watchlist-test")).toEqual(items);
    expect(findWatchlistDueItem(items, "2026-05-17T10:00:00.000Z")?.id).toBe("1810.HK");
  });

  it("updates quote snapshots without changing watchlist identity", () => {
    const item = createWatchlistItem({
      addedAt: "2026-05-17T08:00:00.000Z",
      issueId: "issue-1",
      request
    });

    const updated = syncWatchlistQuote([item], {
      quote: {
        asOf: "2026-05-17T09:30:00.000Z",
        changePercent: 1.28,
        currency: "HKD",
        marketState: "live",
        price: 31.42,
        symbol: "1810.HK"
      },
      symbol: "1810.HK"
    });

    expect(updated[0].quote?.price).toBe(31.42);
    expect(updated[0].id).toBe("1810.HK");
  });
});
