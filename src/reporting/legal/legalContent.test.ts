import { describe, expect, it } from "vitest";
import {
  buildPrimarySourceNotes,
  getLegalDisclaimerShort,
  getSourceTypeItems
} from "./legalContent";

describe("legal content helpers", () => {
  it("keeps a stable short disclaimer for in-product surfaces", () => {
    expect(getLegalDisclaimerShort("zh-CN")).toContain("不构成任何投资建议");
    expect(getLegalDisclaimerShort("zh-CN")).toContain("收益承诺");
    expect(getLegalDisclaimerShort("en-US")).toContain("investment advice");
  });

  it("limits source notes to the most important three items and falls back when empty", () => {
    expect(buildPrimarySourceNotes(["A", "B", "C", "D"], "zh-CN")).toEqual(["A", "B", "C"]);
    expect(buildPrimarySourceNotes([], "zh-CN")).toEqual(["当前版本尚未返回明确来源摘要。"]);
    expect(buildPrimarySourceNotes([], "en-US")).toEqual(["This version does not yet include an explicit source summary."]);
    expect(getSourceTypeItems("zh-CN")).toHaveLength(3);
  });
});
