import { useMemo, useState } from "react";
import { MulticaBridge, type MulticaIssueSummary } from "@/analysis/team/multica-bridge";
import type { Locale } from "@/i18n/messages";
import { t } from "@/i18n/messages";
import {
  buildPrimarySourceNotes,
  getLegalDisclaimerShort,
  getSourceTypeItems
} from "@/reporting/legal/legalContent";
import { AnalysisCharts } from "@/reporting/charts/AnalysisCharts";
import type { RealtimeQuote } from "@/market/realtime/realtime-quote";
import { formatQuoteChange, formatQuotePrice } from "@/market/realtime/realtime-quote";
import { buildAnalysisReportDocument } from "@/reporting/reportTemplate";
import type { AnalysisResult } from "@/shared/analysis-result";

type ResultPreviewPaneProps = {
  issue: MulticaIssueSummary | null;
  locale: Locale;
  quote?: RealtimeQuote | null;
  result: AnalysisResult | null;
};

const multicaBridge = new MulticaBridge();

export function ResultPreviewPane({ issue, locale, quote = null, result }: ResultPreviewPaneProps) {
  const [exportMessage, setExportMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const sourceNotes = useMemo(() => buildPrimarySourceNotes(result?.sourceSummary ?? [], locale), [locale, result]);
  const reportDocument = useMemo(() => buildAnalysisReportDocument({
    issue,
    locale,
    result
  }), [issue, locale, result]);

  async function handleExport(): Promise<void> {
    if (!result) {
      return;
    }

    setIsExporting(true);
    setExportMessage("");
    try {
      const exported = await multicaBridge.exportAnalysisReport({
        html: reportDocument,
        issueIdentifier: issue?.identifier,
        symbol: result.symbol
      });
      setExportMessage(t(locale, "exportSuccess", { path: exported.path }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t(locale, "exportFailed");
      setExportMessage(message);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <aside className="preview-pane">
      <header>
        <div>
          <h2>{t(locale, "previewTitle")}</h2>
          <p>{t(locale, "desktopReportDesc")}</p>
        </div>
        <span className="status-pill">{result ? t(locale, "reportReadyStatus") : t(locale, "reportWaitStatus")}</span>
      </header>
      <div className="preview-actions">
        <button
          className="primary-button"
          disabled={!result || isExporting}
          onClick={() => void handleExport()}
          type="button"
        >
          {isExporting ? t(locale, "exportPending") : t(locale, "exportReport")}
        </button>
        <span className="preview-export-message">
          {exportMessage || (result ? t(locale, "deliverablesHint") : t(locale, "reportWaitStatus"))}
        </span>
      </div>
      <section className="market-snapshot-card">
        <div>
          <h3>{t(locale, "liveSnapshot")}</h3>
          <p>{t(locale, "liveSnapshotDesc")}</p>
        </div>
        <div className="market-snapshot-grid">
          <article>
            <span>{t(locale, "currentPrice")}</span>
            <strong>{formatQuotePrice(quote)}</strong>
          </article>
          <article>
            <span>{t(locale, "liveChange")}</span>
            <strong>{formatQuoteChange(quote)}</strong>
          </article>
          <article>
            <span>{t(locale, "quoteAsOf")}</span>
            <strong>{quote ? new Date(quote.asOf).toLocaleString(locale, { hour12: false }) : t(locale, "pendingLiveRefresh")}</strong>
          </article>
        </div>
      </section>
      {result ? (
        <section className="legal-summary-card">
          <div>
            <h3>{t(locale, "chartsTitle")}</h3>
            <p>{result.symbol}</p>
          </div>
          <AnalysisCharts locale={locale} result={result} />
        </section>
      ) : null}
      <section className="legal-summary-card">
        <div>
          <h3>{t(locale, "legalAndSources")}</h3>
          <p>{getLegalDisclaimerShort(locale)}</p>
        </div>
        <div className="legal-summary-grid">
          <article>
            <span>{t(locale, "dataSourceTypes")}</span>
            <ul>
              {getSourceTypeItems(locale).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article>
            <span>{t(locale, "primarySources")}</span>
            <ul>
              {sourceNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <div className="preview-browser">
        <div className="browser-toolbar">
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-dot" />
          <div className="browser-address">
            {issue?.identifier ? `multica://${issue.identifier}` : t(locale, "browserAddressFallback")}
          </div>
        </div>
        <iframe
          className="report-frame"
          srcDoc={reportDocument}
          title="DecisionDesk HTML Report Preview"
        />
      </div>
    </aside>
  );
}
