import { describe, expect, it } from "vitest";
import {
  buildFundingEventDedupeKey,
  capJobCostLimit,
  earlierOfficialEventDate,
  getZonedDayBounds,
  normalizeFundingRound,
  outstandingBudgetReservations,
} from "@/lib/job-rules";

 describe("同轮融资与事件日期", () => {
  const identity = {
    company: "Example Space",
    round: "Series C",
    amountOriginal: "1200000000",
    currency: "USD",
    type: "equity" as const,
  };

  it("同轮报道指纹不依赖报道日期或签约/交割阶段", () => {
    const first = buildFundingEventDedupeKey(identity);
    const delayed = buildFundingEventDedupeKey({ ...identity, round: "C round" });
    expect(first).toBe(delayed);
    expect(normalizeFundingRound("C轮融资")).toBe("series-c");
  });

  it("不同轮次不合并，轮次不明时退回 URL 去重", () => {
    expect(buildFundingEventDedupeKey(identity)).not.toBe(buildFundingEventDedupeKey({ ...identity, round: "Series D" }));
    expect(buildFundingEventDedupeKey({ ...identity, round: "new financing" })).toBeNull();
  });

  it("只有更早官方日期可形成重大更正", () => {
    expect(earlierOfficialEventDate("2026-11-25T00:00:00Z", "2026-11-20T00:00:00Z", "official")).toBe("2026-11-20T00:00:00.000Z");
    expect(earlierOfficialEventDate("2026-11-25T00:00:00Z", "2026-11-20T00:00:00Z", "media")).toBeNull();
    expect(earlierOfficialEventDate("2026-11-20T00:00:00Z", "2026-11-25T00:00:00Z", "official")).toBeNull();
  });
});

describe("时区自然日与预算", () => {
  it("正确处理夏令时 23 小时和 25 小时自然日", () => {
    const spring = getZonedDayBounds(new Date("2026-03-08T12:00:00Z"), "America/New_York");
    const autumn = getZonedDayBounds(new Date("2026-11-01T12:00:00Z"), "America/New_York");
    expect((spring.end.getTime() - spring.start.getTime()) / 3_600_000).toBe(23);
    expect((autumn.end.getTime() - autumn.start.getTime()) / 3_600_000).toBe(25);
  });

  it("上海自然日对应 UTC+8 日界", () => {
    const day = getZonedDayBounds(new Date("2026-11-26T12:00:00Z"), "Asia/Shanghai");
    expect(day.dateKey).toBe("2026-11-26");
    expect(day.start.toISOString()).toBe("2026-11-25T16:00:00.000Z");
    expect(day.end.toISOString()).toBe("2026-11-26T16:00:00.000Z");
  });

  it("日预算扣除已花费和在途预留，免费任务仍可创建", () => {
    const reserved = outstandingBudgetReservations([{ costLimitUsd: "2", spentUsd: "0.5" }]);
    expect(reserved.toFixed(1)).toBe("1.5");
    expect(capJobCostLimit({ requestedCostLimitUsd: "2", dailyBudgetUsd: "3", spentTodayUsd: "1", reservedUsd: reserved })).toBe("0.5000");
    expect(capJobCostLimit({ requestedCostLimitUsd: "2", dailyBudgetUsd: "3", spentTodayUsd: "3" })).toBe("0.0000");
  });
});
