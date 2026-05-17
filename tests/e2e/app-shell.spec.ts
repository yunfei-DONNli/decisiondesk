import { expect, test } from "@playwright/test";

test("renders app shell and accepts compliance notice", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "智策台" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "首次使用前请确认风险边界" })).toBeVisible();

  await page.getByRole("button", { name: "我已知晓并继续使用" }).click();

  await expect(page.getByRole("heading", { name: "发起分析任务" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "历史版本" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "结果预览" })).toBeVisible();
});
