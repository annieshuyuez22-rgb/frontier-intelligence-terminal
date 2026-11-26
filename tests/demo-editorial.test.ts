import { describe, expect, it } from "vitest";
import { DEMO_BRIEF, DEMO_EVENTS, DEMO_SOURCES } from "@/lib/demo-data";

 describe("演示数据与编辑边界", () => {
  it("演示记录与来源不会伪装成真实抓取", () => {
    for (const event of DEMO_EVENTS) {
      expect(event.mode).toBe("demo");
      expect(event.title).toContain("演示");
      expect(event.summary.length).toBeGreaterThanOrEqual(150);
      expect(event.summary.length).toBeLessThanOrEqual(300);
      for (const source of event.sources) {
        expect(new URL(source.url).hostname).toBe("example.com");
        expect(source.accessStatus).toBe("demo_not_fetched");
      }
    }
    expect(DEMO_SOURCES.filter((source) => ["x", "linkedin", "search"].includes(source.channel)).every((source) => !source.configured && source.status === "unconfigured" && !source.lastSuccessAt)).toBe(true);
  });

  it("估值 2B / 融资 200M、恰好 1B 与严格超过 1B 分开", () => {
    const valuation = DEMO_EVENTS.find((event) => event.id === "evt-demo-funding-valuation-not-round");
    const borderline = DEMO_EVENTS.find((event) => event.funding?.qualification === "borderline");
    const strict = DEMO_EVENTS.filter((event) => event.funding?.qualification === "strict");
    expect(valuation?.funding?.amountUsd).toBe("200000000");
    expect(valuation?.funding?.qualification).toBe("ineligible");
    expect(borderline?.funding?.amountUsd).toBe("1000000000");
    expect(strict.every((event) => Number(event.funding?.amountUsd) > 1_000_000_000)).toBe(true);
    expect(DEMO_BRIEF.stats.qualifiedFunding).toBe(strict.length);
  });

  it("混合融资可进入混合主列表，但股权拆分保持未知", () => {
    const mixed = DEMO_EVENTS.find((event) => event.funding?.type === "mixed");
    expect(mixed?.funding?.qualification).toBe("strict");
    expect(mixed?.funding?.splitUnknown).toBe(true);
    expect(mixed?.summary).toContain("不能把全部金额写成股权");
  });

  it("科研候选不会被摘要成已确认发现", () => {
    const preprint = DEMO_EVENTS.find((event) => event.infoType === "preprint");
    expect(preprint?.title).toContain("候选");
    expect(preprint?.title).toContain("尚非确认发现");
    expect(preprint?.verificationStatus).toBe("insufficient");
    expect(preprint?.summary).toContain("不是已确认发现");
    expect(preprint?.summary).toContain("尚无独立实验团队");
  });

  it("第三方评测不会被写成官方基准，且保留协议和成本边界", () => {
    const review = DEMO_EVENTS.find((event) => event.infoType === "third_party_review");
    expect(review).toBeDefined();
    expect(review?.summary).toContain("第三方");
    expect(review?.summary).not.toContain("官方基准");
    expect(review?.evidenceBoundary).toMatch(/样本|协议|harness|成本|局限/);
    expect(review?.metrics.some((metric) => /成本/i.test(metric.label))).toBe(true);
  });

  it("旧事件的新报道保留真实事件日期与重大更正版本", () => {
    const old = DEMO_EVENTS.find((event) => event.id === "evt-demo-old-event-new-report-major-correction");
    if (!old) throw new Error("缺少旧事件演示 fixture");
    expect(old.eventDate).toBe("2026-10-18");
    expect(old.publishedAt.slice(0, 10) > old.eventDate).toBe(true);
    expect(old?.versions?.some((version) => version.majorCorrection)).toBe(true);
    expect(old?.addedThisRound).toContain("新增");
  });

  it("营销指标注明口径、周期、样本和归因限制", () => {
    const marketing = DEMO_EVENTS.find((event) => event.category === "marketing");
    expect(marketing?.metrics.length).toBeGreaterThanOrEqual(2);
    expect(marketing?.metrics.every((metric) => metric.methodology && (metric.period || metric.sample))).toBe(true);
    expect(`${marketing?.summary} ${marketing?.evidenceBoundary}`).toMatch(/归因|自报|对照组/);
  });

  it("RSI 显示全称，社交热度与推断不冒充技术证据", () => {
    const narrative = DEMO_EVENTS.find((event) => event.id === "evt-demo-rsi-narrative-social-not-evidence");
    expect(`${narrative?.title} ${narrative?.summary}`).toContain("Recursive Self-Improvement");
    expect(narrative?.claims.some((claim) => claim.kind === "ai_inference")).toBe(true);
    expect(`${narrative?.summary} ${narrative?.evidenceBoundary}`).toMatch(/社交|讨论/);
  });

  it("所有关键数字与主张均可追溯到对应来源", () => {
    for (const event of DEMO_EVENTS) {
      const sourceIds = new Set(event.sources.map((source) => source.id));
      for (const metric of event.metrics) expect(metric.citationId && sourceIds.has(metric.citationId), `${event.id} 的指标 ${metric.id} 缺少来源`).toBe(true);
      for (const claim of event.claims) {
        if (claim.kind === "ai_inference") continue;
        expect(claim.citationIds.length, `${event.id} 的主张 ${claim.id} 缺少引用`).toBeGreaterThan(0);
        for (const citationId of claim.citationIds) expect(sourceIds.has(citationId)).toBe(true);
      }
    }
  });
});
