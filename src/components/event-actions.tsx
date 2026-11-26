"use client";

import { useState } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import type { EventRecord, UILanguage } from "@/lib/domain";
import { downloadText, errorMessage } from "./api-client";
import { eventDisplaySummary, eventDisplayTitle } from "./language";
import { useLanguage } from "./language-provider";

function publicMarkdown(event: EventRecord, language: UILanguage): string {
  const tr = (zh: string, en: string) => language === "en" ? en : zh;
  const title = eventDisplayTitle(event, language).text;
  const summary = eventDisplaySummary(event, language).text;
  const unknown = tr("未知", "Unknown");
  const lines = [
    `# ${title}`,
    "",
    tr("> 演示数据：此文件在浏览器本地生成，仅用于产品预览，不代表实时事实。", "> Demo data generated locally in the browser for preview only; not live facts."),
    "",
    `- ${tr("事件日期", "Event date")}: ${event.eventDate}`,
    `- ${tr("发布时间", "Published")}: ${event.publishedAt}`,
    `- ${tr("首次发现", "First seen")}: ${event.firstSeenAt}`,
    `- ${tr("最近更新", "Updated")}: ${event.updatedAt}`,
    `- ${tr("核验状态", "Verification")}: ${event.verificationStatus}`,
    `- ${tr("证据边界", "Evidence limits")}: ${event.evidenceBoundary}`,
    "",
    tr("## 摘要", "## Summary"),
    summary,
    "",
    tr("## 影响分析（非来源事实）", "## Impact analysis (not a source fact)"),
    event.whyItMatters,
  ];
  const facts = event.claims.filter((claim) => claim.kind === "fact" || claim.kind === "correction");
  const inferences = event.claims.filter((claim) => claim.kind === "ai_inference" || claim.kind === "analysis");
  if (facts.length > 0) lines.push("", tr("## 来源事实", "## Source facts"), ...facts.map((claim) => `- ${claim.text}`));
  if (inferences.length > 0) lines.push("", tr("## AI / 编辑分析（未核验）", "## AI / editorial analysis (unverified)"), ...inferences.map((claim) => `- ${claim.text}`));
  if (event.metrics.length > 0) lines.push("", tr("## 指标", "## Metrics"), ...event.metrics.map((metric) => `- ${metric.label}: ${metric.value} ${metric.unit ?? ""}; ${tr("样本", "Sample")}: ${metric.sample ?? unknown}; ${tr("方法", "Methodology")}: ${metric.methodology ?? unknown}`));
  if (event.funding) lines.push("", tr("## 融资", "## Funding"), `- ${tr("原币", "Original currency")}: ${event.funding.amountOriginal ?? tr("未披露", "Undisclosed")} ${event.funding.currency}`, `- ${tr("美元", "USD")}: ${event.funding.amountUsd ?? unknown}`, `- ${tr("类型 / 阶段 / 资格", "Type / stage / qualification")}: ${event.funding.type} / ${event.funding.stage} / ${event.funding.qualification}`, tr("- 估值不等于融资。", "- Valuation is not funding."));
  if (event.sources.length > 0) lines.push("", tr("## 公开来源", "## Public sources"), ...event.sources.map((source) => `- [${source.title}](${source.url}) — ${source.originGroup}; ${source.accessStatus}`));
  lines.push("", tr("本导出不含收藏、已读、隐藏状态或私密备注。", "This export excludes bookmarks, read/hidden state, and private notes."), "");
  return lines.join("\n");
}

export function EventActions({ event, mode }: { event: EventRecord; mode: "live" | "demo" }) {
  const { language, t } = useLanguage();
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const title = eventDisplayTitle(event, language).text;
  const summary = eventDisplaySummary(event, language).text;

  async function copySummary() {
    setMessage("");
    try {
      const text = `${title}\n\n${summary}\n\n${t("证据边界", "Evidence limits")}: ${event.evidenceBoundary}\n${t("事件日期", "Event date")}: ${event.eventDate}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setMessage(t("公开摘要已复制，不含任何私密备注。", "Public summary copied without private notes."));
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }

  async function share() {
    const url = `${window.location.origin}/events/${encodeURIComponent(event.slug || event.id)}#overview`;
    try {
      if (navigator.share) await navigator.share({ title, text: summary, url });
      else await navigator.clipboard.writeText(url);
      setMessage(t("公开深链接已准备，仅包含事件标识与公开内容锚点。", "Public deep link ready; it contains only the event identifier and public anchor."));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage(t("已取消分享。", "Share cancelled."));
      else setMessage(errorMessage(error));
    }
  }

  function exportDemo() {
    downloadText(`demo-event-${event.slug || event.id}.md`, publicMarkdown(event, language));
    setMessage(t("演示 Markdown 已在本地生成并明确标注演示，不含私密备注。", "Demo Markdown generated locally and labeled as demo; private notes excluded."));
  }

  return (
    <div>
      <div className="button-row">
        <button className="button button-secondary button-small" type="button" onClick={() => void copySummary()}>{copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}{t("复制公开摘要", "Copy public summary")}</button>
        <button className="button button-secondary button-small" type="button" onClick={() => void share()}><Share2 aria-hidden="true" size={14} />{t("分享深链接", "Share deep link")}</button>
        {mode === "demo" ? <button className="button button-secondary button-small" type="button" onClick={exportDemo}><Download aria-hidden="true" size={14} />{t("导出演示 Markdown", "Export demo Markdown")}</button> : <a className="button button-secondary button-small" href={`/api/events/${encodeURIComponent(event.id)}/export`} download><Download aria-hidden="true" size={14} />{t("导出 Markdown", "Export Markdown")}</a>}
      </div>
      <p className="privacy-caption">{t("分享与导出仅使用公开事件字段，不含收藏、已读、隐藏或私密备注。", "Sharing and exports use public event fields only; bookmarks, read/hidden state, and private notes are excluded.")}</p>
      {message ? <p className="state-message" role="status">{message}</p> : null}
    </div>
  );
}
