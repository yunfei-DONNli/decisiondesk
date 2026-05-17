import { buildHoldingSummary } from "@/analysis/holding/holding";
import type { AnalysisTaskRequest } from "@/analysis/team/multica-bridge";
import type { AppNotification } from "@/automation/notify/notification-center";
import type { WatchlistItem } from "@/automation/watchlist/watchlist-store";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import { formatQuoteChange, formatQuotePrice } from "@/market/realtime/realtime-quote";
import type { AnalysisHistoryEntry } from "@/workbench/history/history-store";

const ROLES = [
  "技术分析师",
  "基本面分析师",
  "新闻分析师",
  "情绪分析师",
  "多空辩论员",
  "风险主管"
];

type SidebarProps = {
  historyEntries: AnalysisHistoryEntry[];
  locale: Locale;
  notifications: AppNotification[];
  onRemoveWatchlistItem: (itemId: string) => void;
  onReanalyze: (request: AnalysisTaskRequest) => void;
  onToggleLocale: () => void;
  onSelectEntry: (entryId: string) => void;
  selectedEntryId: string | null;
  watchlistItems: WatchlistItem[];
};

function getIssueStatusClass(status: string): string {
  if (status === "completed") {
    return "status-pill-info";
  }
  if (status === "failed") {
    return "status-pill-danger";
  }
  if (status === "running") {
    return "";
  }

  return "status-pill-neutral";
}

function getLocalizedIssueStatus(locale: Locale, status: string): string {
  if (status === "completed") {
    return t(locale, "completed");
  }
  if (status === "running") {
    return locale === "en-US" ? "Running" : "分析中";
  }
  if (status === "failed") {
    return locale === "en-US" ? "Failed" : "失败";
  }

  return locale === "en-US" ? "Queued" : "排队中";
}

function formatHistoryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", { hour12: false });
}

function formatWatchlistStatus(locale: Locale, status: WatchlistItem["status"]): string {
  if (status === "completed") {
    return t(locale, "completedReassessment");
  }
  if (status === "scheduled") {
    return t(locale, "scheduledReassessment");
  }
  if (status === "running") {
    return locale === "en-US" ? "Reassessing" : "重评估中";
  }

  return locale === "en-US" ? "Tracking" : "跟踪中";
}

export function Sidebar({
  historyEntries,
  locale,
  notifications,
  onRemoveWatchlistItem,
  onReanalyze,
  onToggleLocale,
  onSelectEntry,
  selectedEntryId,
  watchlistItems
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>智策台</h1>
        <p>DecisionDesk · 投研工作台</p>
      </div>

      <nav className="sidebar-nav" aria-label="主导航">
        {[t(locale, "navTasks"), t(locale, "navHistory"), t(locale, "navLibrary"), t(locale, "navAutomation")].map((item, index) => (
          <button className={index === 0 ? "active" : ""} key={item} type="button">
            {item}
          </button>
        ))}
      </nav>
      <button className="secondary-button locale-toggle" onClick={onToggleLocale} type="button">
        {locale === "zh-CN" ? "English" : "中文"}
      </button>

      <section className="sidebar-section">
        <h2>{t(locale, "historyTitle")}</h2>
        <div className="sidebar-task-list">
          {historyEntries.length > 0 ? historyEntries.map((entry) => {
            const isActive = entry.id === selectedEntryId;
            const versionTime = entry.result?.updatedAt ?? entry.createdAt;

            return (
              <article
                className={`sidebar-task-card ${isActive ? "sidebar-task-card-active" : ""}`}
                key={entry.id}
              >
                <button
                  className="sidebar-card-button"
                  onClick={() => onSelectEntry(entry.id)}
                  type="button"
                >
                  <strong>{entry.request.displayName}</strong>
                  <p>{entry.request.query}</p>
                  <p>{buildHoldingSummary(entry.request.holding, locale)}</p>
                </button>
                <div className="sidebar-task-meta">
                  <span>{entry.issue.identifier ?? entry.issue.id}</span>
                  <span>{formatHistoryTimestamp(versionTime)}</span>
                </div>
                <div className="sidebar-task-actions">
                  <span className={`status-pill ${getIssueStatusClass(entry.issue.status)}`}>
                    {getLocalizedIssueStatus(locale, entry.issue.status)}
                  </span>
                  <button
                    className="ghost-button"
                    onClick={() => onReanalyze(entry.request)}
                    type="button"
                  >
                    {t(locale, "actionReanalyze")}
                  </button>
                </div>
              </article>
            );
          }) : (
            <div className="sidebar-empty-state">
              <strong>{t(locale, "historyEmpty")}</strong>
              <p>{t(locale, "historyEmptyDesc")}</p>
            </div>
          )}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <h2>{t(locale, "watchlistTitle")}</h2>
          <span className="status-pill status-pill-info">{watchlistItems.length} 只</span>
        </div>
        <div className="sidebar-task-list">
          {watchlistItems.length > 0 ? watchlistItems.map((item) => (
            <article className="sidebar-task-card" key={item.id}>
              <div className="sidebar-card-button">
                <strong>{item.request.displayName}</strong>
                <p>{item.request.market} · {item.request.symbol}</p>
                <p>{buildHoldingSummary(item.request.holding, locale)}</p>
              </div>
              <div className="sidebar-task-meta">
                <span>{formatWatchlistStatus(locale, item.status)}</span>
                <span>{item.nextRunAt ? t(locale, "followUpTime", { value: formatHistoryTimestamp(item.nextRunAt) }) : t(locale, "awaitingTask")}</span>
              </div>
              <div className="sidebar-task-meta">
                <span>{formatQuotePrice(item.quote)}</span>
                <span>{formatQuoteChange(item.quote)}</span>
              </div>
              <div className="sidebar-task-actions">
                <button
                  className="ghost-button"
                  onClick={() => onReanalyze(item.request)}
                  type="button"
                >
                  {t(locale, "actionReanalyze")}
                </button>
                <button
                  className="ghost-button ghost-button-danger"
                  onClick={() => onRemoveWatchlistItem(item.id)}
                  type="button"
                >
                  {t(locale, "actionRemove")}
                </button>
              </div>
            </article>
          )) : (
            <div className="sidebar-empty-state">
              <strong>{t(locale, "watchlistEmpty")}</strong>
              <p>{t(locale, "watchlistEmptyDesc")}</p>
            </div>
          )}
        </div>
      </section>

      <section className="sidebar-section">
        <h2>{t(locale, "officialTeam")}</h2>
        <div className="role-list">
          {ROLES.map((role, index) => (
            <article className="role-item" key={role}>
              <strong>{role}</strong>
              <p>{index < 2 ? t(locale, "completed") : t(locale, "pendingDispatch")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-section-header">
          <h2>{t(locale, "notificationCenter")}</h2>
          <span className="status-pill status-pill-info">{notifications.length} 条</span>
        </div>
        <div className="sidebar-task-list">
          {notifications.length > 0 ? notifications.map((notification) => (
            <article className="sidebar-task-card" key={notification.id}>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <div className="sidebar-task-meta">
                <span>{notification.level === "success" ? t(locale, "completed") : t(locale, "notifyHint")}</span>
                <span>{formatHistoryTimestamp(notification.createdAt)}</span>
              </div>
            </article>
          )) : (
            <div className="sidebar-empty-state">
              <strong>{t(locale, "notificationEmpty")}</strong>
              <p>{t(locale, "notificationEmptyDesc")}</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
