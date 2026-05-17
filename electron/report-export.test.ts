import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReportExportPath, sanitizeFileSegment } from "./report-export";

describe("report export path helpers", () => {
  it("sanitizes file name segments and falls back for empty values", () => {
    expect(sanitizeFileSegment("  1810.HK / 小米 <test>  ", "analysis")).toBe("1810.HK-test");
    expect(sanitizeFileSegment("   ", "analysis")).toBe("analysis");
  });

  it("builds a deterministic deliverables path", () => {
    const outputPath = buildReportExportPath({
      issueIdentifier: "DON/2",
      outputRoot: "/workspace/stock",
      symbol: "1810.HK",
      timestamp: new Date("2026-05-17T08:00:00.000Z")
    });

    expect(outputPath).toBe(path.join(
      "/workspace/stock",
      "deliverables",
      "decisiondesk",
      "1810.HK-DON-2-2026-05-17T08-00-00-000Z.html"
    ));
  });
});
