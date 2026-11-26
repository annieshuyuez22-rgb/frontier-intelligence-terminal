import { describe, expect, it } from "vitest";
import { createDocument } from "@/lib/collectors/utils";

function documentAt(url: string, title = "Example announces a breakthrough") {
  return createDocument({
    url,
    title,
    excerpt: "Necessary factual excerpt, not a full article.",
    publishedAt: "2026-11-25T08:00:00Z",
    channel: "rss",
    sourceType: "media",
    accessStatus: "ok",
    isFullText: false,
    fetchedAt: "2026-11-26T08:00:00Z",
  });
}

 describe("来源独立性与规范化", () => {
  it("同题同日的跨站转载不增加独立来源组", () => {
    const original = documentAt("https://news.example.com/story");
    const reprint = documentAt("https://reprint.example.org/article", "Example announces a breakthrough!");
    expect(reprint.originGroup).toBe(original.originGroup);
    expect(reprint.canonicalUrl).not.toBe(original.canonicalUrl);
  });

  it("不同标题或日期不会错误合并来源组", () => {
    const original = documentAt("https://news.example.com/story");
    expect(documentAt("https://other.example.com/story", "Another research result").originGroup).not.toBe(original.originGroup);
    const later = createDocument({
      url: "https://news.example.com/story-later",
      title: "Example announces a breakthrough",
      excerpt: "Excerpt",
      publishedAt: "2026-11-26T08:00:00Z",
      channel: "rss",
      sourceType: "media",
      accessStatus: "ok",
      isFullText: false,
      fetchedAt: "2026-11-26T09:00:00Z",
    });
    expect(later.originGroup).not.toBe(original.originGroup);
  });

  it("只保留必要纯文本摘录，不执行 HTML", () => {
    const document = createDocument({
      url: "https://example.com/review",
      title: "<b>Independent review</b><script>alert(1)</script>",
      excerpt: "<p>Protocol and sample</p><img src=x onerror=alert(1)>",
      publishedAt: null,
      channel: "manual",
      sourceType: "third_party_review",
      accessStatus: "ok",
      isFullText: true,
      fetchedAt: "2026-11-26T09:00:00Z",
    });
    expect(document.title).toBe("Independent review");
    expect(document.excerpt).toBe("Protocol and sample");
    expect(document.sourceType).toBe("third_party_review");
  });
});
