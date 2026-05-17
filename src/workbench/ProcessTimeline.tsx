import type { AppNotification } from "@/automation/notify/notification-center";
import type { WatchlistItem } from "@/automation/watchlist/watchlist-store";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";

type ProcessTimelineProps = {
  locale: Locale;
  notifications?: AppNotification[];
  watchlistItems?: WatchlistItem[];
};

export function ProcessTimeline({
  locale,
  notifications = [],
  watchlistItems = []
}: ProcessTimelineProps) {
  const defaultItems = [
    {
      role: t(locale, "timelineInputRole"),
      stage: t(locale, "timelineInputStage"),
      title: t(locale, "timelineInputTitle"),
      summary: t(locale, "timelineInputSummary")
    },
    {
      role: t(locale, "timelineTechRole"),
      stage: t(locale, "timelineTechStage"),
      title: t(locale, "timelineTechTitle"),
      summary: t(locale, "timelineTechSummary")
    },
    {
      role: t(locale, "timelineResearchRole"),
      stage: t(locale, "timelineResearchStage"),
      title: t(locale, "timelineResearchTitle"),
      summary: t(locale, "timelineResearchSummary")
    }
  ];

  const items = watchlistItems.length > 0
    ? [
      ...defaultItems,
      {
        role: t(locale, "timelineAutomationRole"),
        stage: watchlistItems.some((item) => item.status === "scheduled") ? t(locale, "scheduledReassessment") : t(locale, "watchlistTitle"),
        title: t(locale, "timelineAutomationTitle", { count: watchlistItems.length }),
        summary: watchlistItems
          .slice(0, 2)
          .map((item) => `${item.request.displayName}：${item.nextRunAt ? new Date(item.nextRunAt).toLocaleString("zh-CN", { hour12: false }) : "待安排"}`)
          .join(" / ")
      },
      {
        role: t(locale, "timelineNotifyRole"),
        stage: notifications[0]?.level === "success" ? t(locale, "timelineNotifyStageSuccess") : t(locale, "timelineNotifyStageIdle"),
        title: t(locale, "timelineNotifyTitle"),
        summary: notifications[0]?.message ?? t(locale, "timelineNotifySummary")
      }
    ]
    : defaultItems;

  return (
    <section className="panel">
      <div className="analysis-input-header">
        <div>
          <h2>{t(locale, "timelineTitle")}</h2>
          <p>{t(locale, "timelineDesc")}</p>
        </div>
        <span className="status-pill">T01-T03</span>
      </div>
      <div className="timeline-list">
        {items.map((item) => (
          <article className="timeline-item" key={item.title}>
            <div>
              <div className="timeline-role">{item.role}</div>
              <div className="timeline-stage">{item.stage}</div>
            </div>
            <div className="timeline-body">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
