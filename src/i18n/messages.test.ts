import { describe, expect, it } from "vitest";
import { t } from "./messages";

describe("i18n messages", () => {
  it("returns localized static and parameterized messages", () => {
    expect(t("zh-CN", "watchlistTitle")).toBe("自选股");
    expect(t("en-US", "watchlistTitle")).toBe("Watchlist");
    expect(t("en-US", "addedToWatchlist", { name: "Xiaomi" })).toContain("Xiaomi");
  });
});
