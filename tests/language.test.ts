import { describe, expect, it } from "vitest";
import { eventDisplaySummary, eventDisplayTitle, translate } from "@/components/language";

 describe("界面语言与事实回退", () => {
  it("英文界面使用已提供的英文标题和摘要", () => {
    const event = { title: "中文标题", titleEn: "English title", summary: "中文摘要", summaryEn: "English summary" };
    expect(eventDisplayTitle(event, "en")).toEqual({ text: "English title", fallback: false });
    expect(eventDisplaySummary(event, "en")).toEqual({ text: "English summary", fallback: false });
    expect(translate("en", "中文", "English")).toBe("English");
  });

  it("没有英文编辑内容时回退原文，不机器伪造翻译", () => {
    const event = { title: "中文标题", titleEn: null, summary: "中文摘要", summaryEn: null };
    expect(eventDisplayTitle(event, "en")).toEqual({ text: "中文标题", fallback: true });
    expect(eventDisplaySummary(event, "en")).toEqual({ text: "中文摘要", fallback: true });
    expect(eventDisplayTitle(event, "zh").text).toBe("中文标题");
  });
});
