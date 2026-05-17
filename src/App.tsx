import { useEffect, useMemo, useState } from "react";
import { AnalysisInputPanel } from "@/analysis/input/AnalysisInputPanel";
import type { AnalysisTaskRequest, AnalysisTaskState } from "@/analysis/team/multica-bridge";
import {
  appendNotification,
  createAppNotification,
  loadNotifications,
  saveNotifications,
  type AppNotification
} from "@/automation/notify/notification-center";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import {
  findWatchlistDueItem,
  loadWatchlistItems,
  markWatchlistForRun,
  removeWatchlistItem,
  saveWatchlistItems,
  syncWatchlistAnalysisResult,
  syncWatchlistQuote,
  type WatchlistItem
} from "@/automation/watchlist/watchlist-store";
import { ComplianceNoticeModal } from "@/reporting/legal/ComplianceNoticeModal";
import { FIRST_USE_COMPLIANCE_ACK_STORAGE_KEY } from "@/reporting/legal/legalContent";
import { Sidebar } from "@/workbench/Sidebar";
import {
  createHistoryEntry,
  loadHistoryEntries,
  saveHistoryEntries,
  upsertHistoryEntry,
  type AnalysisHistoryEntry
} from "@/workbench/history/history-store";
import { ResultPreviewPane } from "@/workbench/ResultPreviewPane";
import { MulticaBridge } from "@/analysis/team/multica-bridge";

const multicaBridge = new MulticaBridge();
const LOCALE_STORAGE_KEY = "decisiondesk.locale.v1";

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "zh-CN";
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en-US" ? "en-US" : "zh-CN";
  });
  const [hasComplianceAck, setHasComplianceAck] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(FIRST_USE_COMPLIANCE_ACK_STORAGE_KEY) === "acknowledged";
  });
  const [historyEntries, setHistoryEntries] = useState<AnalysisHistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    return loadHistoryEntries(window.localStorage);
  });
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(() => {
    if (typeof window === "undefined") return [];
    return loadWatchlistItems(window.localStorage);
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    return loadNotifications(window.localStorage);
  });
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return loadHistoryEntries(window.localStorage)[0]?.id ?? null;
  });
  const [isDraftingNewTask, setIsDraftingNewTask] = useState(true);
  const [reanalysisRequest, setReanalysisRequest] = useState<(AnalysisTaskRequest & { requestId: string }) | null>(null);

  const activeEntry = useMemo(() => {
    if (isDraftingNewTask) return null;
    if (historyEntries.length === 0) return null;
    return historyEntries.find((entry) => entry.id === selectedEntryId) ?? historyEntries[0];
  }, [historyEntries, isDraftingNewTask, selectedEntryId]);

  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(LOCALE_STORAGE_KEY, locale); }, [locale]);
  useEffect(() => { if (typeof window !== "undefined") saveHistoryEntries(window.localStorage, historyEntries); }, [historyEntries]);
  useEffect(() => { if (typeof window !== "undefined") saveWatchlistItems(window.localStorage, watchlistItems); }, [watchlistItems]);
  useEffect(() => { if (typeof window !== "undefined") saveNotifications(window.localStorage, notifications); }, [notifications]);

  useEffect(() => {
    if (watchlistItems.length === 0) return;
    const dueItem = findWatchlistDueItem(watchlistItems, new Date().toISOString());
    if (!dueItem) return;
    setWatchlistItems((currentItems) => markWatchlistForRun(currentItems, dueItem.id, new Date().toISOString()));
    const notification = createAppNotification({
      createdAt: new Date().toISOString(),
      level: "info",
      message: t(locale, "addedToWatchlist", { name: dueItem.request.displayName }),
      title: t(locale, "watchlistTitle")
    });
    setNotifications((currentItems) => appendNotification(currentItems, notification));
    void multicaBridge.notify({ body: notification.message, title: notification.title });
    setReanalysisRequest({ ...dueItem.request, language: locale, query: locale === "en-US" ? `${dueItem.request.query} (auto)` : `${dueItem.request.query}（收盘后自动重评估）`, requestId: `${dueItem.id}-auto-${Date.now()}` });
  }, [locale, watchlistItems]);

  useEffect(() => {
    if (watchlistItems.length === 0) return;
    let cancelled = false;
    void Promise.all(watchlistItems.map(async (item) => {
      const quote = await multicaBridge.fetchRealtimeQuote(item.request.symbol, item.request.market);
      if (cancelled) return;
      setWatchlistItems((currentItems) => syncWatchlistQuote(currentItems, { quote, symbol: item.id }));
    }));
    return () => { cancelled = true; };
  }, [watchlistItems.length]);

  function handleTaskStateChange(state: AnalysisTaskState): void {
    if (!state.issue || !state.request || !state.createdAt) return;
    const issue = state.issue;
    const request = state.request;
    const analyzedAt = state.result?.updatedAt ?? state.createdAt;
    const nextEntry = createHistoryEntry({ createdAt: state.createdAt, issue, request, result: state.result });
    setHistoryEntries((currentEntries) => upsertHistoryEntry(currentEntries, nextEntry));
    if (state.result) {
      setWatchlistItems((currentItems) => syncWatchlistAnalysisResult(currentItems, { analyzedAt, entryId: nextEntry.id, result: state.result!, symbol: request.symbol }));
    }
    if (state.issue.status === "completed") {
      const notification = createAppNotification({ createdAt: new Date().toISOString(), level: "success", message: t(locale, "completedReassessmentMessage", { name: request.displayName }), title: t(locale, "analysisGenerated") });
      setNotifications((currentItems) => appendNotification(currentItems, notification));
    }
    setSelectedEntryId(nextEntry.id);
    setIsDraftingNewTask(false);
  }

  function handleStartNewTask(): void { setIsDraftingNewTask(true); setSelectedEntryId(null); }

  return (
    <div className="app-shell">
      {!hasComplianceAck && <ComplianceNoticeModal locale={locale} onAcknowledge={() => { setHasComplianceAck(true); if (typeof window !== "undefined") window.localStorage.setItem(FIRST_USE_COMPLIANCE_ACK_STORAGE_KEY, "acknowledged"); }} />}
      <Sidebar
        historyEntries={historyEntries}
        isDraftingNewTask={isDraftingNewTask}
        locale={locale}
        notifications={notifications}
        onCreateTask={handleStartNewTask}
        onRemoveWatchlistItem={(itemId) => setWatchlistItems((currentItems) => removeWatchlistItem(currentItems, itemId))}
        onReanalyze={(request) => setReanalysisRequest({ ...request, language: locale, query: locale === "en-US" ? `${request.query} (reanalysis)` : `${request.query}（重新分析）`, requestId: `reanalysis-${Date.now()}` })}
        onToggleLocale={() => setLocale((x) => x === "zh-CN" ? "en-US" : "zh-CN")}
        onSelectEntry={(entryId) => { setSelectedEntryId(entryId); setIsDraftingNewTask(false); }}
        selectedEntryId={selectedEntryId}
        watchlistItems={watchlistItems}
      />
      <main className="workspace-main">
        {isDraftingNewTask ? (
          <AnalysisInputPanel
            key={`${isDraftingNewTask}-${reanalysisRequest?.requestId ?? "draft"}`}
            locale={locale}
            reanalysisRequest={reanalysisRequest}
            onTaskStateChange={handleTaskStateChange}
          />
        ) : (
          <ResultPreviewPane issue={activeEntry?.issue ?? null} result={activeEntry?.result ?? null} />
        )}
      </main>
    </div>
  );
}