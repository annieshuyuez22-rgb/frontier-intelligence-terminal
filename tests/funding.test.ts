import { describe, expect, it } from "vitest";
import {
  analyzeFunding,
  canonicalizeUrl,
  fundingDedupeFingerprint,
  qualifyFunding,
  sumSameCurrency,
} from "@/lib/funding";

const fx = { rate: "1.17", date: "2026-11-25", source: "frankfurter.app", reliable: true };

 describe("融资硬门槛与口径", () => {
  it("估值 20 亿美元、融资 2 亿美元不会进入超 1B 列表", () => {
    const result = analyzeFunding("Example valued at $2 billion after raising $200 million in a Series B equity round");
    expect(result.amountOriginal).toBe("200000000");
    expect(result.qualification).toBe("ineligible");
  });

  it("中文估值与融资同样分开", () => {
    const result = analyzeFunding("示例公司估值20亿美元，本轮股权融资2亿美元");
    expect(result.amountOriginal).toBe("200000000");
    expect(result.qualification).toBe("ineligible");
  });

  it("金额后置估值和累计融资也不会抢占本轮金额", () => {
    expect(analyzeFunding("Example raised $200 million at a $2 billion valuation in its Series B").amountOriginal).toBe("200000000");
    expect(analyzeFunding("Example raised $200 million, bringing total funding to $2 billion").amountOriginal).toBe("200000000");
    expect(analyzeFunding("Example's $2 billion valuation follows a $200 million Series B round").amountOriginal).toBe("200000000");
    expect(analyzeFunding("Example raised $200 million in Series B；累计融资20亿美元").amountOriginal).toBe("200000000");
  });

  it("严格超过 10 亿美元才符合主筛选", () => {
    expect(analyzeFunding("Example announced a $1.2 billion Series C equity round").qualification).toBe("strict");
    expect(analyzeFunding("Example announced a $1000000001 Series C equity round").qualification).toBe("strict");
  });

  it("恰好 10 亿美元只进入临界关注", () => {
    const result = analyzeFunding("Example announced a $1 billion Series C equity round");
    expect(result.qualification).toBe("borderline");
  });

  it("more than $1B 可入选，up to 和约数保持未知", () => {
    expect(analyzeFunding("Example raised more than $1 billion in equity funding").qualification).toBe("strict");
    expect(analyzeFunding("Example raised up to $1.2 billion in equity funding").qualification).toBe("unknown");
    expect(analyzeFunding("Example raised approximately $1.2 billion in equity funding").qualification).toBe("unknown");
  });

  it("累计融资、基金规模、订单、资本开支不冒充本轮融资", () => {
    expect(analyzeFunding("Example has $2 billion total funding to date").qualification).not.toBe("strict");
    expect(analyzeFunding("Example Ventures closes a $2 billion new fund").type).toBe("fund");
    expect(analyzeFunding("Example received a $2 billion purchase order").qualification).toBe("ineligible");
    expect(analyzeFunding("Example announced $2 billion capital expenditure").qualification).toBe("ineligible");
  });

  it("债务、授信、补贴、并购与股权分开", () => {
    expect(analyzeFunding("Example issued $2 billion in debt notes").type).toBe("debt");
    expect(analyzeFunding("Example obtained a $2 billion credit facility").type).toBe("credit");
    expect(analyzeFunding("Example received a $2 billion government subsidy").type).toBe("subsidy");
    expect(analyzeFunding("Example announced a $2 billion acquisition").type).toBe("acquisition");
    expect(qualifyFunding({ amountUsd: "2000000000", type: "debt" })).toBe("ineligible");
  });

  it("传闻和洽谈不进入已核实超 1B", () => {
    expect(analyzeFunding("Example reportedly raises $2 billion in equity").qualification).toBe("unknown");
    expect(analyzeFunding("Example is in talks to raise $2 billion in equity").qualification).toBe("unknown");
  });

  it("混合融资未披露拆分时明确标记", () => {
    const result = analyzeFunding("Example announced $1.2 billion in equity and debt financing");
    expect(result.type).toBe("mixed");
    expect(result.splitUnknown).toBe(true);
    expect(result.qualification).toBe("strict");
  });

  it("非美元无可靠汇率时金额保持未知", () => {
    const missing = analyzeFunding("Example raised €900 million in an equity round");
    expect(missing.amountUsd).toBeNull();
    expect(missing.qualification).toBe("unknown");
    const converted = analyzeFunding("Example raised €900 million in an equity round", { fx });
    expect(converted.amountUsd).toBe("1053000000");
    expect(converted.fxDate).toBe("2026-11-25");
    expect(converted.qualification).toBe("strict");
  });

  it("不同币种不能直接相加", () => {
    expect(sumSameCurrency([
      { amount: "100", currency: "USD" },
      { amount: "100", currency: "EUR" },
    ])).toBeNull();
    expect(sumSameCurrency([
      { amount: "100", currency: "USD" },
      { amount: "200", currency: "USD" },
    ])).toEqual({ amount: "300", currency: "USD" });
  });

  it("金额不明不能进入已核实超 1B", () => {
    const result = analyzeFunding("Example announced a new equity round with undisclosed amount");
    expect(result.amountOriginal).toBeNull();
    expect(result.qualification).toBe("unknown");
  });
});

describe("融资事件去重", () => {
  const input = {
    company: "Example Space",
    eventDate: "2026-11-25",
    amountOriginal: "1200000000",
    currency: "USD",
    round: "Series C",
    type: "equity" as const,
    stage: "announced" as const,
  };

  it("同一轮融资指纹稳定，转载 URL 跟踪参数不制造新文档", () => {
    expect(fundingDedupeFingerprint(input)).toBe(fundingDedupeFingerprint({ ...input }));
    expect(canonicalizeUrl("HTTPS://WWW.Example.com/news/?utm_source=x&b=2&a=1#top")).toBe("https://www.example.com/news?a=1&b=2");
  });

  it("不同金额或轮次不会共享指纹", () => {
    expect(fundingDedupeFingerprint(input)).not.toBe(fundingDedupeFingerprint({ ...input, amountOriginal: "2000000000" }));
    expect(fundingDedupeFingerprint(input)).not.toBe(fundingDedupeFingerprint({ ...input, round: "Series D" }));
  });
});
