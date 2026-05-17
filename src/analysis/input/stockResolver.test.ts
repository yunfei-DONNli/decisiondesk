import { describe, expect, it } from "vitest";
import { identifyStockCandidates } from "@/analysis/input/stockResolver";

describe("identifyStockCandidates", () => {
  it("returns exact Xiaomi match for Xiaomi queries", () => {
    expect(identifyStockCandidates("帮我分析一下小米")).toEqual([
      expect.objectContaining({
        displayName: "小米集团",
        symbol: "1810.HK"
      })
    ]);
  });

  it("returns Alibaba candidates instead of falling back to unrelated stocks", () => {
    expect(identifyStockCandidates("分析一下阿里巴巴")).toEqual([
      expect.objectContaining({
        displayName: "阿里巴巴-W",
        symbol: "9988.HK"
      }),
      expect.objectContaining({
        displayName: "阿里巴巴",
        symbol: "BABA"
      })
    ]);
  });

  it("returns no candidates for unsupported queries", () => {
    expect(identifyStockCandidates("分析一下完全不存在的公司")).toEqual([]);
  });
});
