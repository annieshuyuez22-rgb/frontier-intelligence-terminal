import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "fi_mode", value: "demo", url: process.env.E2E_BASE_URL || "http://localhost:3100" }]);
});

test("演示简报、真实空操作边界与桌面视觉", async ({ page }) => {
  await page.goto("/brief", { waitUntil: "networkidle" });
  await expect(page.getByText("演示数据", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /演示日报/ })).toBeVisible();
  await page.getByRole("button", { name: "手动更新", exact: true }).click();
  await expect(page.locator(".form-message").getByText("演示模式不触发真实采集，也不会产生费用。")).toBeVisible();
  await page.screenshot({ path: "artifacts/brief-desktop.png", fullPage: true });
});

test("融资主列表保留混合融资并隔离临界和估值", async ({ page }) => {
  await page.goto("/funding");
  const primary = page.locator("section").filter({ has: page.locator("#funding-主筛选") });
  await expect(primary.locator("tbody tr")).toHaveCount(2);
  await expect(primary).toContainText("弥珥能源");
  await expect(primary).toContainText("拆分未知");
  await expect(primary).not.toContainText("格风生物");
  await expect(page.getByRole("heading", { name: "临界关注：恰好 $1B" })).toBeVisible();
  await page.screenshot({ path: "artifacts/funding-desktop.png", fullPage: true });
});

test("全文筛选、布局切换与证据详情", async ({ page }) => {
  await page.goto("/events");
  await page.locator('input[name="query"]').fill("冰脊计算");
  await page.getByRole("button", { name: "应用筛选" }).click();
  await expect(page.locator(".event-grid article")).toHaveCount(1);
  await page.getByRole("link", { name: "列表", exact: true }).click();
  await expect(page.locator(".event-list article")).toHaveCount(1);
  await page.goto("/events/demo-asterq-equity-1200m-strict");
  await expect(page.getByRole("heading", { name: "来源事实与更正" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "公开来源" })).toBeVisible();
  await expect(page.locator(".claim-card").first().locator(".citation-link").first()).toBeVisible();
});

test("移动端保留导航与筛选能力", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/brief");
  await page.getByRole("button", { name: "打开导航" }).click();
  await expect(page.getByRole("complementary", { name: "移动导航" })).toBeVisible();
  await page.locator(".mobile-sidebar-heading").getByRole("button", { name: "关闭导航" }).click();
  await page.goto("/events");
  await expect(page.locator('input[name="query"]')).toBeVisible();
  await page.screenshot({ path: "artifacts/events-mobile.png", fullPage: true });
});

test("英文界面与事件英文摘要可切换且不伪造翻译", async ({ page, context }) => {
  await context.addCookies([{ name: "fi_language", value: "en", url: process.env.E2E_BASE_URL || "http://localhost:3100" }]);
  await page.goto("/funding", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Funding strictly over $1B" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Event stream", exact: true })).toBeVisible();
  await expect(page.locator("#funding-Primary\\ screen, #funding-主筛选").first()).toBeVisible();
  await expect(page.getByText(/Fictional Asterq Intelligence/).first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { name: "严格超过 $1B 的融资" })).toBeVisible();
});
