import { describe, expect, it } from "vitest";
import { formatQuoteChange, formatQuotePrice, type RealtimeQuote } from "./realtime-quote";

const quote: RealtimeQuote = {
  asOf: "2026-05-17T09:30:00.000Z",
  changePercent: 1.28,
  currency: "HKD",
  marketState: "live",
  price: 31.42,
  symbol: "1810.HK"
};

describe("realtime quote helpers", () => {
  it("formats price and percentage deltas for UI display", () => {
    expect(formatQuotePrice(quote)).toBe("HKD 31.42");
    expect(formatQuoteChange(quote)).toBe("+1.28%");
    expect(formatQuotePrice(null)).toBe("待刷新");
  });
});
