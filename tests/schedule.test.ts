import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isPreferenceDue } from "@/lib/job-engine";

 describe("调度抖动与夏令时", () => {
  it("北京时间 08:00 前不执行，08:00 后允许补跑", () => {
    expect(isPreferenceDue("08:00", "Asia/Shanghai", new Date("2026-11-25T23:59:00Z"))).toBe(false);
    expect(isPreferenceDue("08:00", "Asia/Shanghai", new Date("2026-11-26T00:00:00Z"))).toBe(true);
    expect(isPreferenceDue("08:00", "Asia/Shanghai", new Date("2026-11-26T00:26:00Z"))).toBe(true);
    expect(isPreferenceDue("08:00", "Asia/Shanghai", new Date("2026-11-26T23:59:00Z"))).toBe(false);
  });

  it("春季不存在的本地时间会在下一个可达分钟补跑", () => {
    expect(isPreferenceDue("02:30", "America/New_York", new Date("2026-03-08T06:59:00Z"))).toBe(false);
    expect(isPreferenceDue("02:30", "America/New_York", new Date("2026-03-08T07:00:00Z"))).toBe(true);
  });

  it("非法时间配置不会执行", () => {
    expect(isPreferenceDue("25:00", "Asia/Shanghai", new Date("2026-11-26T00:00:00Z"))).toBe(false);
    expect(isPreferenceDue("not-a-time", "Asia/Shanghai", new Date("2026-11-26T00:00:00Z"))).toBe(false);
  });
});
