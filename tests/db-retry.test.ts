import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { withDbRetry } from "@/db";

 describe("数据库读取重试边界", () => {
  it("连接超时后有限重试并返回真实结果", async () => {
    let calls = 0;
    const result = await withDbRetry("test.retry", async () => {
      calls += 1;
      if (calls < 3) throw Object.assign(new Error("read timed out"), { code: "ETIMEDOUT" });
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("非连接类错误立即抛出，不掩盖数据问题", async () => {
    let calls = 0;
    await expect(withDbRetry("test.invalid", async () => {
      calls += 1;
      throw new Error("invalid input syntax");
    })).rejects.toThrow("invalid input syntax");
    expect(calls).toBe(1);
  });

  it("持续连接失败达到上限后保留错误", async () => {
    let calls = 0;
    await expect(withDbRetry("test.exhausted", async () => {
      calls += 1;
      throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
    }, 2)).rejects.toThrow("socket hang up");
    expect(calls).toBe(2);
  });
});
