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
  locale: Locale;
  onTaskStateChange: (state: AnalysisTaskState) => void;
  reanalysisRequest?: (AnalysisTaskRequest & { requestId: string }) | null;
};

export function AnalysisInputPanel({
  locale,
  onTaskStateChange,
  reanalysisRequest = null
}: AnalysisInputPanelProps) {
  const [query, setQuery] = useState(locale === "en-US" ? "Analyze Xiaomi for me" : "帮我分析一下小米");
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

  useEffect(() => {
    setCompareCandidates(createCompareCandidates(candidates));
  }, [candidates]);

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
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(locale, "queryPlaceholder")}
          />
        </label>
        <div className="form-row">
          <label>
            {t(locale, "analysisGenerated")}
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
                onChange={(event) => setHolding((current) => ({
                  ...current,
                  hasPosition: event.target.checked
                }))}
                type="checkbox"
              />
              {t(locale, "hasPosition")}
            </label>
          </div>
          <div className="form-row">
            <label>
              {t(locale, "costBasis")}
              <input
                onChange={(event) => setHolding((current) => ({
                  ...current,
                  costBasis: event.target.value
                }))}
                placeholder={t(locale, "costBasisPlaceholder")}
                value={holding.costBasis}
              />
            </label>
            <label>
              {t(locale, "positionSize")}
              <input
                onChange={(event) => setHolding((current) => ({
                  ...current,
                  positionSize: event.target.value
                }))}
                placeholder={t(locale, "positionSizePlaceholder")}
                value={holding.positionSize}
              />
            </label>
          </div>
          <label>
            {t(locale, "sharesHeld")}
            <input
              onChange={(event) => setHolding((current) => ({
                ...current,
                sharesHeld: event.target.value
              }))}
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
            {taskSummary ? t(locale, "analysisGenerated") : t(locale, "candidateLabel")}
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
