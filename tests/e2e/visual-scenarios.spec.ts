import { expect, test } from "@playwright/test";
import { seedAppState } from "./helpers";

test.describe("DecisionDesk visual scenarios", () => {
  test("空态工作台", async ({ page }) => {
    await seedAppState(page, {
      complianceAck: true,
      history: [],
      notifications: [],
      watchlist: []
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "智策台" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "发起分析任务" })).toBeVisible();
    await expect(page.getByText("还没有历史版本")).toBeVisible();
    await expect(page.getByRole("heading", { name: "结果预览" })).toBeVisible();
    await expect(page).toHaveScreenshot("workbench-empty.png", { animations: "disabled", fullPage: true });
  });

  test("分析结果页", async ({ page }) => {
    await seedAppState(page);

    await page.goto("/");

    await expect(page.getByText("图表信号包")).toBeVisible();
    await expect(page.getByText("1810.HK", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "雷达图" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "多空权重" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "风险三角" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "K线" })).toBeVisible();
    await expect(page).toHaveScreenshot("result-page.png", { animations: "disabled", fullPage: true });
  });

  test("自选股列表", async ({ page }) => {
    await seedAppState(page);

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "自选股", exact: true })).toBeVisible();
    const watchlistSection = page.locator(".sidebar-section").filter({ has: page.getByRole("heading", { name: "自选股", exact: true }) });
    await expect(watchlistSection.getByText("小米集团", { exact: true })).toBeVisible();
    await expect(watchlistSection.getByText("贵州茅台", { exact: true })).toBeVisible();
    await expect(watchlistSection.getByText("苹果", { exact: true })).toBeVisible();
    await expect(watchlistSection.getByRole("button", { name: "移除" }).first()).toBeVisible();
    await expect(page).toHaveScreenshot("watchlist.png", { animations: "disabled", fullPage: true });
  });

  test("多股对比", async ({ page }) => {
    await seedAppState(page, {
      history: [],
      notifications: [],
      watchlist: []
    });

    await page.goto("/");

    await page.getByLabel("输入股票代码 / 名称 / 问题").fill("小米 茅台 苹果");
    await page.getByRole("button", { name: "开始对比" }).click();

    await expect(page.getByText("多股对比")).toBeVisible();
    await expect(page.getByText("#1 1810.HK")).toBeVisible();
    await expect(page.getByText("#2 600519.SH")).toBeVisible();
    await expect(page.getByText("白酒龙头具备防御属性，但估值与消费节奏需要继续观察。")).toBeVisible();
    await expect(page).toHaveScreenshot("compare.png", { animations: "disabled", fullPage: true });
  });

  test("合规弹窗", async ({ page }) => {
    await seedAppState(page, {
      complianceAck: false,
      history: [],
      notifications: [],
      watchlist: []
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "首次使用前请确认风险边界" })).toBeVisible();
    await expect(page).toHaveScreenshot("compliance-modal.png", { animations: "disabled", fullPage: true });
    await page.getByRole("button", { name: "我已知晓并继续使用" }).click();
    await expect(page.getByRole("heading", { name: "首次使用前请确认风险边界" })).toBeHidden();
  });
});
