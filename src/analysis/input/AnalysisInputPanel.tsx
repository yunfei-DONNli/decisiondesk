import {
  createCompareCandidates,
  rankCompareResults,
  toggleCompareCandidate,
  type CompareCandidate,
  type CompareResultItem
} from "@/analysis/compare/compare-store";
import {
  EMPTY_HOLDING_INPUT,
  type HoldingInput
} from "@/analysis/holding/holding";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type AnalysisTaskRequest,
  MulticaBridge,
  type AnalysisTaskState,
  type MulticaIssueSummary
} from "@/analysis/team/multica-bridge";
import { identifyStockCandidates, type StockCandidate } from "@/analysis/input/stockResolver";

const multicaBridge = new MulticaBridge();

type AnalysisInputPanelProps = {
  draftVersion: number;
  locale: Locale;
  mode?: "draft" | "workspace";
  onTaskStateChange: (state: AnalysisTaskState) => void;
  onStartDraft: () => void;
  reanalysisRequest?: (AnalysisTaskRequest & { requestId: string }) | null;
};

export function AnalysisInputPanel({
  draftVersion,
  locale,
  mode = "workspace",
  onTaskStateChange,
  onStartDraft,
  reanalysisRequest = null
}: AnalysisInputPanelProps) {
  const [query, setQuery] = useState("");
  const [holding, setHolding] = useState<HoldingInput>(EMPTY_HOLDING_INPUT);
  const [compareCandidates, setCompareCandidates] = useState<CompareCandidate[]>([]);
  const [compareResults, setCompareResults] = useState<CompareResultItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskSummary, setTaskSummary] = useState<MulticaIssueSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const lastAutoRequestId = useRef<string | null>(null);
  const candidates = useMemo(() => identifyStockCandidates(query), [query]);
  const selected = candidates[0];
  const draftSuggestions = [
    t(locale, "draftTaskSuggestionXiaomi"),
    t(locale, "draftTaskSuggestionAlibaba"),
    t(locale, "draftTaskSuggestionMoutai")
  ];
  const draftTasks = [
    {
      badge: t(locale, "draftTaskBadgeResearch"),
      prompt: t(locale, "draftTaskSuggestionAlibaba"),
      title: t(locale, "draftTaskCardFocusTitle"),
      description: t(locale, "draftTaskCardFocusDesc")
    },
    {
      badge: t(locale, "draftTaskBadgeCompare"),
      prompt: t(locale, "draftTaskSuggestionCompare"),
      title: t(locale, "draftTaskCardCompareTitle"),
      description: t(locale, "draftTaskCardCompareDesc")
    },
    {
      badge: t(locale, "draftTaskBadgeRisk"),
      prompt: t(locale, "draftTaskSuggestionRisk"),
      title: t(locale, "draftTaskCardRiskTitle"),
      description: t(locale, "draftTaskCardRiskDesc")
    }
  ];
  const draftPlaybook = [
    t(locale, "draftTaskPlaybookOne"),
    t(locale, "draftTaskPlaybookTwo"),
    t(locale, "draftTaskPlaybookThree")
  ];
  const draftStats = [
    {
      label: t(locale, "draftTaskStatRoutingLabel"),
      value: t(locale, "draftTaskStatRoutingValue")
    },
    {
      label: t(locale, "draftTaskStatCoverageLabel"),
      value: t(locale, "draftTaskStatCoverageValue")
    },
    {
      label: t(locale, "draftTaskStatHandoffLabel"),
      value: t(locale, "draftTaskStatHandoffValue")
    }
  ];
  const draftSignals = [
    t(locale, "draftTaskSignalOne"),
    t(locale, "draftTaskSignalTwo"),
    t(locale, "draftTaskSignalThree")
  ];
  const draftChecklist = [
    t(locale, "draftTaskChecklistOne"),
    t(locale, "draftTaskChecklistTwo"),
    t(locale, "draftTaskChecklistThree")
  ];
  const candidateSummary = candidates.length > 0
    ? candidates.map((candidate: StockCandidate) => `${candidate.displayName}（${candidate.symbol}）`).join(" / ")
    : t(locale, "awaitingCandidates");

  useEffect(() => {
    setCompareCandidates(createCompareCandidates(candidates));
  }, [candidates]);

  useEffect(() => {
    setQuery("");
    setHolding(EMPTY_HOLDING_INPUT);
    setCompareResults([]);
    setTaskSummary(null);
    setErrorMessage("");
  }, [draftVersion]);

  function beginManualDraft(): void {
    onStartDraft();
    setErrorMessage("");
    setTaskSummary(null);
    setCompareResults([]);
  }

  async function submitAnalysis(payload: AnalysisTaskRequest): Promise<void> {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const createdAt = new Date().toISOString();
      const issue = await multicaBridge.createAnalysisIssue({
        ...payload
      });
      setTaskSummary(issue);
      const result = await multicaBridge.fetchAnalysisResult(issue.id);
      onTaskStateChange({
        createdAt,
        issue,
        request: payload,
        result
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "创建分析任务失败。";
      setErrorMessage(message);
      setTaskSummary(null);
      onTaskStateChange({
        createdAt: null,
        issue: null,
        request: null,
        result: null
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateIssue(): Promise<void> {
    if (!selected) {
      setErrorMessage("请先输入股票代码、名称或问题，完成标的识别。");
      setTaskSummary(null);
      return;
    }

    await submitAnalysis({
      displayName: selected.displayName,
      holding,
        language: locale,
        market: selected.market,
        query,
        symbol: selected.symbol
    });
  }

  useEffect(() => {
    if (!reanalysisRequest || lastAutoRequestId.current === reanalysisRequest.requestId) {
      return;
    }

    lastAutoRequestId.current = reanalysisRequest.requestId;
    setQuery(reanalysisRequest.query);
    setHolding(reanalysisRequest.holding);
    setErrorMessage("");
    setTaskSummary(null);
    setCompareResults([]);
    void submitAnalysis(reanalysisRequest);
  }, [reanalysisRequest]);

  async function handleCompare(): Promise<void> {
    const picked = compareCandidates.filter((candidate) => candidate.selected).slice(0, 5);
    if (picked.length === 0) {
      return;
    }

    setIsComparing(true);
    try {
      const results = await Promise.all(picked.map(async (candidate) => {
        const issue = await multicaBridge.createAnalysisIssue({
          displayName: candidate.displayName,
          holding,
          language: locale,
          market: candidate.market,
          query,
          symbol: candidate.symbol
        });

        const result = await multicaBridge.fetchAnalysisResult(issue.id);
        return result;
      }));

      setCompareResults(rankCompareResults(results.filter((result): result is NonNullable<typeof result> => Boolean(result))));
    } finally {
      setIsComparing(false);
    }
  }

  if (mode === "draft") {
    return (
      <section className="draft-task-shell">
        <div className="draft-task-overview">
          <div className="draft-task-hero">
            <span className="draft-task-kicker">DecisionDesk / Launch Desk</span>
            <h2>{t(locale, "draftTaskHeroTitle")}</h2>
            <p>{t(locale, "draftTaskDesc")}</p>
            <div className="draft-task-overview-list">
              {draftPlaybook.map((item) => (
                <article className="draft-task-overview-item" key={item}>
                  <span />
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="draft-task-overview-panel">
            <div className="draft-task-overview-panel-header">
              <span className="status-pill status-pill-info">{t(locale, "draftTaskOverviewLabel")}</span>
              <h3>{t(locale, "draftTaskOverviewTitle")}</h3>
            </div>
            <div className="draft-task-stat-grid">
              {draftStats.map((item) => (
                <article className="draft-task-stat-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="draft-task-grid">
          <aside className="draft-task-sidebar">
            <section className="draft-task-section-card">
              <div className="draft-task-section-header">
                <div>
                  <strong>{t(locale, "draftTaskTemplatesTitle")}</strong>
                  <p>{t(locale, "draftTaskTemplatesDesc")}</p>
                </div>
              </div>
              <div className="draft-task-template-list">
                {draftTasks.map((task) => (
                  <button
                    className="draft-task-template-card"
                    key={task.title}
                    onClick={() => {
                      beginManualDraft();
                      setQuery(task.prompt);
                    }}
                    type="button"
                  >
                    <span className="draft-task-template-badge">{task.badge}</span>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="draft-task-section-card draft-task-section-card-accent">
              <div className="draft-task-section-header">
                <div>
                  <strong>{t(locale, "draftTaskSignalTitle")}</strong>
                  <p>{t(locale, "draftTaskSignalDesc")}</p>
                </div>
              </div>
              <div className="draft-task-signal-list">
                {draftSignals.map((signal) => (
                  <article className="draft-task-signal-item" key={signal}>
                    <span className="draft-task-signal-dot" />
                    <p>{signal}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <div className="draft-task-main">
            <section className="draft-task-console-card">
              <div className="draft-task-console-header">
                <div>
                  <span className="status-pill">{t(locale, "draftTaskConsoleLabel")}</span>
                  <h3>{t(locale, "draftTaskConsoleTitle")}</h3>
                </div>
                <p>{t(locale, "draftTaskConsoleDesc")}</p>
              </div>

              <div className="draft-task-suggestion-row">
                {draftSuggestions.map((suggestion) => (
                  <button
                    className="draft-suggestion-chip"
                    key={suggestion}
                    onClick={() => {
                      beginManualDraft();
                      setQuery(suggestion);
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="draft-task-brief-grid">
                <article className="draft-task-brief-card draft-task-brief-card-intent">
                  <span>{t(locale, "draftTaskAssistantLabel")}</span>
                  <strong>{t(locale, "draftTaskCanvasTitle")}</strong>
                  <p>{t(locale, "draftTaskAssistantMessage")}</p>
                </article>
                <article className="draft-task-brief-card draft-task-brief-card-query">
                  <span>{t(locale, "draftTaskUserLabel")}</span>
                  <strong>{t(locale, "draftTaskDraftLabel")}</strong>
                  <p>{query.trim().length > 0 ? query : t(locale, "draftTaskEmptyMessage")}</p>
                </article>
              </div>

              <div className="draft-task-composer">
                <div className="draft-task-composer-header">
                  <div>
                    <strong>{t(locale, "draftTaskComposerTitle")}</strong>
                    <p>{t(locale, "draftTaskComposerDesc")}</p>
                  </div>
                  <span className="status-pill status-pill-neutral">{t(locale, "draftTaskChatLabel")}</span>
                </div>
                <textarea
                  className="draft-task-textarea"
                  onChange={(event) => {
                    beginManualDraft();
                    setQuery(event.target.value);
                  }}
                  placeholder={t(locale, "queryPlaceholder")}
                  value={query}
                />
                <div className="draft-task-footer">
                  <div className="draft-task-candidates">
                    <strong>{t(locale, "draftTaskResolverTitle")}</strong>
                    <span>{candidateSummary}</span>
                  </div>
                  <button
                    className="primary-button"
                    disabled={isSubmitting || query.trim().length === 0}
                    onClick={() => void handleCreateIssue()}
                    type="button"
                  >
                    {isSubmitting ? t(locale, "createIssuePending") : t(locale, "actionStartAnalysis")}
                  </button>
                </div>
              </div>
            </section>

            <section className="draft-task-bottom-grid">
              <article className="draft-task-bottom-card">
                <span className="status-pill status-pill-neutral">{t(locale, "draftTaskBottomReadyLabel")}</span>
                <strong>{t(locale, "draftTaskBottomReadyTitle")}</strong>
                <p>{t(locale, "draftTaskBottomReadyDesc")}</p>
              </article>
              <article className="draft-task-bottom-card">
                <span className="status-pill status-pill-info">{t(locale, "draftTaskBottomHistoryLabel")}</span>
                <strong>{t(locale, "draftTaskBottomHistoryTitle")}</strong>
                <p>{t(locale, "draftTaskBottomHistoryDesc")}</p>
              </article>
              <article className="draft-task-bottom-card draft-task-bottom-card-checklist">
                <span className="status-pill status-pill-info">{t(locale, "draftTaskChecklistLabel")}</span>
                <strong>{t(locale, "draftTaskChecklistTitle")}</strong>
                <ul className="draft-task-checklist">
                  {draftChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>
          </div>
        </div>

        {errorMessage ? (
          <div className="feedback-card feedback-error">
            <strong>{t(locale, "createFailed")}</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="analysis-input-header">
        <div>
          <h2>{t(locale, "analysisInputTitle")}</h2>
          <p>{t(locale, "analysisInputDesc")}</p>
        </div>
        <span className="status-pill">T03 联调中</span>
      </div>
      <form className="analysis-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          {t(locale, "stockInputLabel")}
          <input
            value={query}
            onChange={(event) => {
              beginManualDraft();
              setQuery(event.target.value);
            }}
            placeholder={t(locale, "queryPlaceholder")}
          />
        </label>
        <div className="form-row">
          <label>
            {t(locale, "detectedTarget")}
            <input value={selected?.displayName ?? t(locale, "awaitingConfirmation")} readOnly />
          </label>
          <label>
            {t(locale, "marketAndSymbol")}
            <input value={selected ? `${selected.market} · ${selected.symbol}` : t(locale, "awaitingConfirmation")} readOnly />
          </label>
        </div>
        <div className="panel-subtitle">
          {t(locale, "candidateLabel")}
          {candidates.length > 0
            ? candidates.map((candidate: StockCandidate) => ` ${candidate.displayName}（${candidate.symbol}）`).join(" / ")
            : t(locale, "awaitingCandidates")}
        </div>
        <section className="holding-card">
          <div className="holding-card-header">
            <div>
              <strong>{t(locale, "holdingHeader")}</strong>
              <p>{t(locale, "holdingHeaderDesc")}</p>
            </div>
            <label className="holding-toggle">
              <input
                checked={holding.hasPosition}
                onChange={(event) => {
                  beginManualDraft();
                  setHolding((current) => ({
                    ...current,
                    hasPosition: event.target.checked
                  }));
                }}
                type="checkbox"
              />
              {t(locale, "hasPosition")}
            </label>
          </div>
          <div className="form-row">
            <label>
              {t(locale, "costBasis")}
              <input
                onChange={(event) => {
                  beginManualDraft();
                  setHolding((current) => ({
                    ...current,
                    costBasis: event.target.value
                  }));
                }}
                placeholder={t(locale, "costBasisPlaceholder")}
                value={holding.costBasis}
              />
            </label>
            <label>
              {t(locale, "positionSize")}
              <input
                onChange={(event) => {
                  beginManualDraft();
                  setHolding((current) => ({
                    ...current,
                    positionSize: event.target.value
                  }));
                }}
                placeholder={t(locale, "positionSizePlaceholder")}
                value={holding.positionSize}
              />
            </label>
          </div>
          <label>
            {t(locale, "sharesHeld")}
            <input
              onChange={(event) => {
                beginManualDraft();
                setHolding((current) => ({
                  ...current,
                  sharesHeld: event.target.value
                }));
              }}
              placeholder={t(locale, "sharesHeldPlaceholder")}
              value={holding.sharesHeld}
            />
          </label>
        </section>
        <section className="holding-card">
          <div className="holding-card-header">
            <div>
              <strong>{t(locale, "compareResultTitle")}</strong>
              <p>{t(locale, "compareDesc")}</p>
            </div>
            <span className="status-pill status-pill-info">{t(locale, "compareLimitHint")}</span>
          </div>
          <div className="compare-candidate-list">
            {compareCandidates.map((candidate) => (
              <label className="compare-candidate-item" key={candidate.symbol}>
                <input
                  checked={candidate.selected}
                  onChange={() => setCompareCandidates((current) => toggleCompareCandidate(current, candidate.symbol))}
                  type="checkbox"
                />
                <div>
                  <strong>{candidate.displayName}</strong>
                  <p>{candidate.market} · {candidate.symbol}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="analysis-actions">
            <button
              className="secondary-button"
              disabled={isComparing}
              onClick={() => void handleCompare()}
              type="button"
            >
              {isComparing ? t(locale, "createIssuePending") : t(locale, "compareAnalyze")}
            </button>
            <span className="preview-export-message">{t(locale, "compareSelectionHint")}</span>
          </div>
          <div className="compare-result-list">
            {compareResults.length > 0 ? compareResults.map((item, index) => (
              <article className="compare-result-card" key={item.symbol}>
                <strong>#{index + 1} {item.symbol}</strong>
                <p>{t(locale, "compareCompositeScore")}: {item.compositeScore.toFixed(2)}</p>
                <p>{item.summary}</p>
              </article>
            )) : (
              <div className="sidebar-empty-state">
                <strong>{t(locale, "compareResultTitle")}</strong>
                <p>{t(locale, "compareEmpty")}</p>
              </div>
            )}
          </div>
        </section>
        <div className="analysis-actions">
          <button
            className="primary-button"
            disabled={isSubmitting}
            onClick={() => void handleCreateIssue()}
            type="button"
          >
            {isSubmitting ? t(locale, "createIssuePending") : t(locale, "actionStartAnalysis")}
          </button>
          <button className="secondary-button" type="button">
            {taskSummary ? t(locale, "issueCreated") : t(locale, "candidateLabel")}
          </button>
        </div>
      </form>

      {errorMessage ? (
        <div className="feedback-card feedback-error">
          <strong>{t(locale, "createFailed")}</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {taskSummary ? (
        <div className="feedback-card">
          <div className="feedback-header">
            <strong>{t(locale, "issueCreated")}</strong>
            <span className={`status-pill ${taskSummary.runtime.status === "ready" ? "" : "status-pill-warning"}`}>
              {taskSummary.status}
            </span>
          </div>
          <div className="feedback-grid">
            <div>
              {t(locale, "issueId")}
              <strong>{taskSummary.id}</strong>
            </div>
            <div>
              {t(locale, "issueIdentifier")}
              <strong>{taskSummary.identifier ?? t(locale, "awaitingTask")}</strong>
            </div>
            <div>
              {t(locale, "issueTitle")}
              <strong>{taskSummary.title}</strong>
            </div>
            <div>
              {t(locale, "issueAssignee")}
              <strong>{taskSummary.assignee ?? t(locale, "awaitingTask")}</strong>
            </div>
            <div>
              {t(locale, "issueRuntime")}
              <strong>{taskSummary.runtime.status}</strong>
            </div>
          </div>
          <p className="feedback-detail">{taskSummary.runtime.detail}</p>
          <p className="feedback-detail">
            当前阶段会创建父 Issue，并自动扇出技术面、基本面、新闻面、情绪面、多空辩论和风险裁决子任务。
          </p>
          <div className="feedback-tags">
            <span>Agents：{taskSummary.runtime.agents.length > 0 ? taskSummary.runtime.agents.join(" / ") : "暂无"}</span>
            <span>Squads：{taskSummary.runtime.squads.length > 0 ? taskSummary.runtime.squads.join(" / ") : "暂无"}</span>
          </div>
          {taskSummary.childIssues && taskSummary.childIssues.length > 0 ? (
            <div className="feedback-child-list">
              {taskSummary.childIssues.map((child) => (
                <div className="feedback-child-item" key={child.id}>
                  <strong>{child.title}</strong>
                  <span>{child.assignee}</span>
                  <span>{child.id}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
