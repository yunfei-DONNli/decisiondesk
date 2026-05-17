import { describe, expect, it } from "vitest";
import { buildHoldingSummary } from "./holding";

describe("holding helpers", () => {
  it("renders a concise summary for empty and populated holding inputs", () => {
    expect(buildHoldingSummary(null)).toBe("未持仓");
    expect(buildHoldingSummary({
      costBasis: "28.50",
      hasPosition: true,
      positionSize: "25%",
      sharesHeld: "2000"
    })).toBe("已持仓 · 成本价 28.50 · 仓位 25% · 股数 2000");
    expect(buildHoldingSummary({
      costBasis: "28.50",
      hasPosition: true,
      positionSize: "25%",
      sharesHeld: "2000"
    }, "en-US")).toBe("Holding · Cost basis 28.50 · Position 25% · Shares 2000");
  });
});
