import { buildHoldingSummary } from "@/analysis/holding/holding";
import type { MulticaIssueSummary } from "@/analysis/team/multica-bridge";
import {
  buildPrimarySourceNotes,
  getLegalDisclaimerShort,
  getSourceTypeItems
} from "@/reporting/legal/legalContent";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import type { AnalysisResult, RiskLevel } from "@/shared/analysis-result";

type ReportTemplateInput = {
  issue: MulticaIssueSummary | null;
  locale: Locale;
  result: AnalysisResult | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTime(value: string | undefined, locale: Locale): string {
  if (!value) {
    return locale === "en-US" ? "Pending" : "待生成";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale, {
    hour12: false
  });
}

function renderList(items: string[], emptyLabel: string): string {
  const safeItems = items.length > 0 ? items : [emptyLabel];
  return safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderScoreCards(result: AnalysisResult, locale: Locale): string {
  const scoreEntries = [
    [locale === "en-US" ? "Technical" : "技术面", result.scores.technical],
    [locale === "en-US" ? "Fundamental" : "基本面", result.scores.fundamental],
    [locale === "en-US" ? "News" : "新闻面", result.scores.news],
    [locale === "en-US" ? "Sentiment" : "情绪面", result.scores.sentiment],
    [locale === "en-US" ? "Valuation" : "估值面", result.scores.valuation]
  ];

  return scoreEntries.map(([label, score]) => {
    const numericScore = Number(score);
    const tone = numericScore >= 7.5 ? "strong" : numericScore >= 5.5 ? "balanced" : "weak";
    return `
      <article class="score-card score-card--${tone}">
        <span>${escapeHtml(String(label))}</span>
        <strong>${numericScore.toFixed(1)}</strong>
        <small>/ 10</small>
      </article>
    `;
  }).join("");
}

function normalizeRiskLevel(level: RiskLevel, locale: Locale): string {
  if (locale === "en-US") {
    if (level === "低") {
      return "Low";
    }
    if (level === "高") {
      return "High";
    }
    return "Medium";
  }

  return level;
}

function getRiskBadgeClass(level: RiskLevel): string {
  if (level === "低") {
    return "risk-low";
  }
  if (level === "高") {
    return "risk-high";
  }

  return "risk-medium";
}

function renderPlaceholder(issue: MulticaIssueSummary | null, locale: Locale): string {
  return `
    <section class="empty-state">
      <span class="eyebrow">DecisionDesk / HTML Report</span>
      <h1>${locale === "en-US" ? "Waiting for the Multica analysis result" : "等待 Multica 分析结果"}</h1>
      <p>${locale === "en-US" ? "Once the parent issue is created, the right pane switches to the formal research report preview and aggregates technical, fundamental, news, sentiment, bull/bear debate, and the final risk verdict." : "父 Issue 已创建后，右侧会自动切换为正式投研报告预览，并汇总技术面、基本面、新闻面、情绪面、多空辩论与风险裁决。"}</p>
      <div class="placeholder-grid">
        <article>
          <span>${t(locale, "currentTask")}</span>
          <strong>${escapeHtml(issue?.identifier ?? t(locale, "awaitingTask"))}</strong>
        </article>
        <article>
          <span>${t(locale, "issueStatus")}</span>
          <strong>${escapeHtml(issue?.status ?? t(locale, "awaitingTask"))}</strong>
        </article>
        <article>
          <span>${locale === "en-US" ? "Notes" : "说明"}</span>
          <strong>${escapeHtml(issue?.runtime.detail ?? (locale === "en-US" ? "Aggregation starts after the task is created." : "创建任务后开始聚合"))}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderReport(issue: MulticaIssueSummary | null, locale: Locale, result: AnalysisResult): string {
  const sourceNotes = buildPrimarySourceNotes(result.sourceSummary, locale);

  return `
    <section class="hero">
      <div>
        <span class="eyebrow">${locale === "en-US" ? "DecisionDesk / Research Workbench" : "DecisionDesk / 智策台"}</span>
        <h1>${escapeHtml(result.symbol)} · ${escapeHtml(result.market)}</h1>
        <p class="hero-summary">${escapeHtml(result.riskVerdict.summary)}</p>
      </div>
      <aside class="decision-aside">
        <span class="recommendation">${escapeHtml(result.recommendation)}</span>
        <strong>${escapeHtml(result.actionSuggestion)}</strong>
        <small>Issue: ${escapeHtml(issue?.identifier ?? issue?.id ?? (locale === "en-US" ? "Local preview" : "本地预览"))}</small>
      </aside>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>${locale === "en-US" ? "Trading judgment" : "交易判断"}</h2>
        <span class="risk-badge ${getRiskBadgeClass(result.riskVerdict.level)}">
          ${locale === "en-US" ? "Risk" : "风险"} ${escapeHtml(normalizeRiskLevel(result.riskVerdict.level, locale))} / ${locale === "en-US" ? "Confidence" : "置信度"} ${escapeHtml(result.riskVerdict.confidence)}
        </span>
      </div>
      <div class="metrics-grid">
        <article class="metric-card">
          <span>${locale === "en-US" ? "Targets" : "目标价"}</span>
          <strong>${escapeHtml(result.priceTargets.join(" / ") || (locale === "en-US" ? "Pending" : "待补充"))}</strong>
        </article>
        <article class="metric-card">
          <span>${locale === "en-US" ? "Stop loss" : "止损位"}</span>
          <strong>${escapeHtml(result.stopLoss)}</strong>
        </article>
        <article class="metric-card">
          <span>${locale === "en-US" ? "Suggested exposure" : "建议仓位"}</span>
          <strong>${escapeHtml(result.positionSuggestion)}</strong>
        </article>
        <article class="metric-card">
          <span>${t(locale, "holdingLabel")}</span>
          <strong>${escapeHtml(buildHoldingSummary(result.holding, locale))}</strong>
        </article>
        <article class="metric-card">
          <span>${locale === "en-US" ? "Updated at" : "更新时间"}</span>
          <strong>${escapeHtml(formatTime(result.updatedAt, locale))}</strong>
        </article>
      </div>
    </section>

    <section class="section">
      <div class="section-heading">
        <h2>${locale === "en-US" ? "Dimension scores" : "维度评分"}</h2>
        <p>${locale === "en-US" ? "All five dimensions feed into the final verdict, and the report is rendered directly from the Multica-aggregated result." : "五维评分统一进入最终裁决，右侧报告直接对接 Multica 聚合结果。"}</p>
      </div>
      <div class="score-grid">${renderScoreCards(result, locale)}</div>
    </section>

    <section class="section debate-grid">
      <article class="debate-card">
        <h2>${locale === "en-US" ? "Bull case" : "多头论点"}</h2>
        <ul>${renderList(result.bullBearDebate.bulls, locale === "en-US" ? "Waiting for the bull case summary." : "等待多头观点汇总。")}</ul>
      </article>
      <article class="debate-card debate-card--bear">
        <h2>${locale === "en-US" ? "Bear case" : "空头论点"}</h2>
        <ul>${renderList(result.bullBearDebate.bears, locale === "en-US" ? "Waiting for the bear case summary." : "等待空头观点汇总。")}</ul>
      </article>
    </section>

    <section class="section source-grid">
      <article class="source-card">
        <h2>${locale === "en-US" ? "Key events" : "关键事件"}</h2>
        <ul>${renderList(result.keyEvents, locale === "en-US" ? "Waiting for the key events summary." : "等待关键事件汇总。")}</ul>
      </article>
      <article class="source-card">
        <h2>${t(locale, "sourceSummary")}</h2>
        <ul>${renderList(result.sourceSummary, locale === "en-US" ? "Waiting for the source summary." : "等待来源摘要。")}</ul>
      </article>
    </section>

    <section class="section source-grid">
      <article class="source-card">
        <h2>${t(locale, "dataSourceTypes")}</h2>
        <ul>${renderList(getSourceTypeItems(locale), locale === "en-US" ? "Pending source category notes." : "待补充来源类型说明。")}</ul>
      </article>
      <article class="source-card">
        <h2>${t(locale, "primarySources")}</h2>
        <ul>${renderList(sourceNotes, t(locale, "latestSourcesFallback"))}</ul>
      </article>
    </section>

    <section class="section footer-note">
      <div>
        <span>${t(locale, "generatedAt")}</span>
        <strong>${escapeHtml(formatTime(result.generatedAt, locale))}</strong>
      </div>
      <div>
        <span>${t(locale, "resultLanguage")}</span>
        <strong>${escapeHtml(result.language)}</strong>
      </div>
      <div class="disclaimer">
        <span>${locale === "en-US" ? "Disclaimer" : "免责声明"}</span>
        <strong>${escapeHtml(getLegalDisclaimerShort(locale))}</strong>
      </div>
    </section>
  `;
}

export function buildAnalysisReportDocument({ issue, locale, result }: ReportTemplateInput): string {
  const body = result ? renderReport(issue, locale, result) : renderPlaceholder(issue, locale);

  return `
    <!DOCTYPE html>
    <html lang="${locale}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DecisionDesk Analysis Report</title>
        <style>
          :root {
            color-scheme: light;
            --bg: #f4f7f5;
            --paper: #ffffff;
            --line: #d9e3dc;
            --text: #14231a;
            --muted: #5f6f65;
            --accent: #0e9f6e;
            --accent-soft: #e8f5ee;
            --danger-soft: #fff1ef;
            --danger: #c75b4d;
            --warning-soft: #fff8e8;
            --warning: #b47b18;
            --shadow: 0 24px 60px rgba(22, 39, 29, 0.08);
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background:
              radial-gradient(circle at top left, rgba(14, 159, 110, 0.12), transparent 28%),
              linear-gradient(180deg, #f8fbf8 0%, var(--bg) 100%);
            color: var(--text);
            font-family: "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
          }

          .page {
            max-width: 1180px;
            margin: 0 auto;
            padding: 28px;
          }

          .report-shell,
          .empty-state {
            background: rgba(255, 255, 255, 0.94);
            border: 1px solid rgba(217, 227, 220, 0.9);
            border-radius: 28px;
            box-shadow: var(--shadow);
            backdrop-filter: blur(18px);
          }

          .report-shell {
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .empty-state {
            padding: 48px 32px;
          }

          .eyebrow {
            display: inline-flex;
            padding: 6px 12px;
            border-radius: 999px;
            background: var(--accent-soft);
            color: var(--accent);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 300px;
            gap: 20px;
            padding: 24px;
            border-radius: 24px;
            background: linear-gradient(135deg, #f6fbf8 0%, #edf7f1 100%);
            border: 1px solid var(--line);
          }

          .hero h1,
          .empty-state h1 {
            margin: 16px 0 10px;
            font-size: 38px;
            line-height: 1.05;
          }

          .hero-summary,
          .empty-state p,
          .section-heading p {
            margin: 0;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.7;
          }

          .decision-aside {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 14px;
            padding: 18px;
            border-radius: 20px;
            background: #0f1f18;
            color: #f4fbf7;
          }

          .decision-aside strong {
            font-size: 16px;
            line-height: 1.6;
          }

          .decision-aside small {
            color: rgba(244, 251, 247, 0.72);
          }

          .recommendation {
            display: inline-flex;
            align-self: flex-start;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.12);
            font-size: 12px;
            font-weight: 700;
          }

          .section {
            padding: 24px;
            border-radius: 24px;
            border: 1px solid var(--line);
            background: var(--paper);
          }

          .section-heading,
          .footer-note {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }

          .section-heading h2,
          .debate-card h2,
          .source-card h2 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          .metrics-grid,
          .score-grid,
          .debate-grid,
          .source-grid,
          .placeholder-grid {
            display: grid;
            gap: 16px;
          }

          .metrics-grid,
          .placeholder-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            margin-top: 18px;
          }

          .score-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            margin-top: 18px;
          }

          .debate-grid,
          .source-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metric-card,
          .score-card,
          .debate-card,
          .source-card,
          .placeholder-grid article {
            border-radius: 18px;
            border: 1px solid var(--line);
            background: #fbfdfb;
          }

          .metric-card,
          .placeholder-grid article {
            padding: 18px;
          }

          .metric-card span,
          .footer-note span,
          .placeholder-grid span {
            display: block;
            color: var(--muted);
            font-size: 12px;
            margin-bottom: 8px;
          }

          .metric-card strong,
          .placeholder-grid strong {
            font-size: 18px;
            line-height: 1.5;
          }

          .score-card {
            padding: 18px 16px;
            text-align: center;
          }

          .score-card span,
          .score-card small {
            color: var(--muted);
          }

          .score-card strong {
            display: block;
            margin: 8px 0 2px;
            font-size: 30px;
          }

          .score-card--strong {
            background: var(--accent-soft);
          }

          .score-card--balanced {
            background: var(--warning-soft);
          }

          .score-card--weak {
            background: var(--danger-soft);
          }

          .risk-badge {
            display: inline-flex;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }

          .risk-low {
            background: var(--accent-soft);
            color: var(--accent);
          }

          .risk-medium {
            background: var(--warning-soft);
            color: var(--warning);
          }

          .risk-high {
            background: var(--danger-soft);
            color: var(--danger);
          }

          .debate-card,
          .source-card {
            padding: 22px;
          }

          .debate-card--bear {
            background: #fffaf9;
          }

          ul {
            margin: 0;
            padding-left: 18px;
            color: var(--muted);
            line-height: 1.8;
          }

          .footer-note {
            align-items: stretch;
          }

          .footer-note > div {
            flex: 1;
            padding: 18px;
            border-radius: 18px;
            border: 1px solid var(--line);
            background: #fbfdfb;
          }

          .footer-note strong {
            display: block;
            line-height: 1.7;
          }

          .disclaimer {
            flex: 1.4;
            background: #f8fbf8;
          }

          @media (max-width: 980px) {
            .hero,
            .metrics-grid,
            .score-grid,
            .debate-grid,
            .source-grid,
            .placeholder-grid,
            .section-heading,
            .footer-note {
              grid-template-columns: 1fr;
              display: grid;
            }

            .page {
              padding: 16px;
            }

            .report-shell,
            .empty-state,
            .section {
              padding: 20px;
            }

            .hero h1,
            .empty-state h1 {
              font-size: 30px;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          ${result ? `<article class="report-shell">${body}</article>` : body}
        </main>
      </body>
    </html>
  `;
}
