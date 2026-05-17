import { buildHoldingSummary } from "@/analysis/holding/holding";
import type { AnalysisTaskRequest } from "@/analysis/team/multica-bridge";
import type { AppNotification } from "@/automation/notify/notification-center";
import type { WatchlistItem } from "@/automation/watchlist/watchlist-store";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import { formatQuoteChange, formatQuotePrice } from "@/market/realtime/realtime-quote";
import type { AnalysisHistoryEntry } from "@/workbench/history/history-store";
import { useState } from "react";

type SidebarProps = {
  historyEntries: AnalysisHistoryEntry[];
  isDraftingNewTask: boolean;
  locale: Locale;
  notifications: AppNotification[];
  onCreateTask: () => void;
  onRemoveWatchlistItem: (itemId: string) => void;
  onReanalyze: (request: AnalysisTaskRequest) => void;
  onToggleLocale: () => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | null;
  watchlistItems: WatchlistItem[];
};

type Tab = "analysis" | "watchlist" | "compare";

export function Sidebar({
  historyEntries,
  isDraftingNewTask,
  locale,
  onCreateTask,
  onRemoveWatchlistItem,
  onReanalyze,
  onToggleLocale,
  onSelectEntry,
  selectedEntryId,
  watchlistItems
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>("analysis");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">智策台</span>
        <button className="locale-btn" onClick={onToggleLocale} type="button">
          {locale === "zh-CN" ? "EN" : "中"}
        </button>
      </div>

      <button className="new-task-btn" onClick={onCreateTask} type="button">
        + {t(locale, "newTask")}
      </button>

      <nav className="sidebar-tabs">
        {(["analysis", "watchlist", "compare"] as Tab[]).map((t) => (
          <button
            className={`tab-btn${tab === t ? " tab-active" : ""}`}
            key={t}
            onClick={() => setTab(t)}
            type="button"
          >
            {t === "analysis" ? t(locale, "navTasks") : t === "watchlist" ? t(locale, "watchlistTitle") : t(locale, "compareResultTitle")}
          </button>
        ))}
      </nav>

      <div className="sidebar-list">
        {tab === "analysis" && (
          historyEntries.length > 0 ? historyEntries.map((entry) => (
            <div
              className={`list-row${!isDraftingNewTask && entry.id === selectedEntryId ? " list-row-active" : ""}`}
              key={entry.id}
              onClick={() => onSelectEntry(entry.id)}
            >
              <span className="list-row-name">{entry.request.displayName}</span>
              <span className="list-row-meta">{entry.request.symbol} · {entry.request.market}</span>
              <span className={`list-row-status status-${entry.issue.status}`}>
                {entry.issue.status === "completed" ? t(locale, "completed") : entry.issue.status === "running" ? (locale === "en-US" ? "Running" : "分析中") : entry.issue.status === "failed" ? (locale === "en-US" ? "Failed" : "失败") : (locale === "en-US" ? "Queued" : "排队中")}
              </span>
            </div>
          )) : (
            <div className="list-empty">{t(locale, "historyEmpty")}</div>
          )
        )}

        {tab === "watchlist" && (
          watchlistItems.length > 0 ? watchlistItems.map((item) => (
            <div className="list-row" key={item.id}>
              <span className="list-row-name">{item.request.displayName}</span>
              <span className="list-row-meta">
                {formatQuotePrice(item.quote)} {formatQuoteChange(item.quote)}
              </span>
              <span className="list-row-status">
                {item.status === "completed" ? t(locale, "completed") : item.status === "running" ? (locale === "en-US" ? "Running" : "分析中") : item.status === "scheduled" ? t(locale, "scheduledReassessment") : ""}
              </span>
              <button className="list-row-action" onClick={() => onRemoveWatchlistItem(item.id)} type="button">×</button>
            </div>
          )) : (
            <div className="list-empty">{t(locale, "watchlistEmpty")}</div>
          )
        )}

        {tab === "compare" && (
          <div className="list-empty">{t(locale, "compareEmpty")}</div>
        )}
      </div>
    </aside>
  );
}