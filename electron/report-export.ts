import path from "node:path";

export type ExportAnalysisReportPayload = {
  html: string;
  issueIdentifier?: string;
  symbol?: string;
};

export function sanitizeFileSegment(value: string | undefined, fallback: string): string {
  const normalized = (value ?? fallback)
    .trim()
    .replaceAll(/[^a-zA-Z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");

  return normalized || fallback;
}

export function buildReportExportPath(payload: {
  issueIdentifier?: string;
  outputRoot: string;
  symbol?: string;
  timestamp: Date;
}): string {
  const timestamp = payload.timestamp.toISOString().replaceAll(/[:.]/g, "-");
  const symbol = sanitizeFileSegment(payload.symbol, "analysis");
  const issuePart = sanitizeFileSegment(payload.issueIdentifier, "local-preview");

  return path.join(
    payload.outputRoot,
    "deliverables",
    "decisiondesk",
    `${symbol}-${issuePart}-${timestamp}.html`
  );
}
