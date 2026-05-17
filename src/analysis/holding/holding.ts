import type { Locale } from "@/i18n/messages";

export type HoldingInput = {
  costBasis: string;
  hasPosition: boolean;
  positionSize: string;
  sharesHeld: string;
};

export const EMPTY_HOLDING_INPUT: HoldingInput = {
  costBasis: "",
  hasPosition: false,
  positionSize: "",
  sharesHeld: ""
};

export function buildHoldingSummary(
  holding: HoldingInput | null | undefined,
  locale: Locale = "zh-CN"
): string {
  if (!holding?.hasPosition) {
    return locale === "en-US" ? "No position" : "未持仓";
  }

  const details = [
    holding.costBasis ? `${locale === "en-US" ? "Cost basis" : "成本价"} ${holding.costBasis}` : null,
    holding.positionSize ? `${locale === "en-US" ? "Position" : "仓位"} ${holding.positionSize}` : null,
    holding.sharesHeld ? `${locale === "en-US" ? "Shares" : "股数"} ${holding.sharesHeld}` : null
  ].filter((item): item is string => Boolean(item));

  if (details.length > 0) {
    return `${locale === "en-US" ? "Holding" : "已持仓"} · ${details.join(" · ")}`;
  }

  return locale === "en-US" ? "Holding" : "已持仓";
}
