"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { categoryLabels, infoTypeLabelsI18n, verificationLabelsI18n, type DataMode, type EventRecord } from "@/lib/domain";
import { EventStateControls } from "./event-state-controls";
import { formatDate, uniqueSourceCount, verificationTone } from "./format";
import { eventDisplaySummary, eventDisplayTitle } from "./language";
import { useLanguage } from "./language-provider";
import type { EventUserState } from "./types";
import { Badge } from "./ui";

export function EventCard({ event, mode, layout = "grid", headingLevel = 2 }: { event: EventRecord; mode: DataMode; layout?: "grid" | "list"; headingLevel?: 2 | 3 }) {
  const { language, t } = useLanguage();
  const [userState, setUserState] = useState<EventUserState>({
    bookmarked: event.viewerState?.bookmarked ?? false,
    read: Boolean(event.viewerState?.readAt),
    hidden: event.viewerState?.hidden ?? false,
    privateNote: event.viewerState?.privateNote ?? "",
  });
  const sources = uniqueSourceCount(event.sources);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const title = eventDisplayTitle(event, language);
  const summary = eventDisplaySummary(event, language);
  const missingEnglish = language === "en" && (title.fallback || summary.fallback);

  if (userState.hidden) {
    return (
      <article className="event-card event-card-hidden">
        <p className="restore-hidden">{t("已隐藏", "Hidden")}: {title.text}</p>
        <EventStateControls eventId={event.id} mode={mode} initialState={userState} onStateChange={setUserState} />
      </article>
    );
  }

  return (
    <article className={`event-card ${layout === "list" ? "event-card-row" : ""}`}>
      <div className="event-card-category">
        <span>{categoryLabels[event.category][language]} / {event.slug}</span>
        <span>{formatDate(event.eventDate, undefined, language)}</span>
      </div>
      <div className="card-meta">
        <Badge tone="info">{infoTypeLabelsI18n[event.infoType][language]}</Badge>
        <Badge tone={verificationTone[event.verificationStatus]}>{verificationLabelsI18n[event.verificationStatus][language]}</Badge>
        <span>{sources} {t("个独立来源", "independent sources")}</span>
        <span>{t("更新", "Updated")} {formatDate(event.updatedAt, undefined, language)}</span>
        {missingEnglish ? <Badge tone="warning">{t("英文摘要未提供", "English summary not provided")}</Badge> : null}
      </div>
      <Heading><Link href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{title.text}</Link></Heading>
      <p className="event-summary">{summary.text}</p>
      {event.metrics.length > 0 ? (
        <dl className="key-metrics" aria-label={t("关键数字", "Key metrics")}>
          {event.metrics.slice(0, 3).map((metric) => (
            <div className="key-metric" key={metric.id}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}{metric.unit ? ` ${metric.unit}` : ""}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="event-evidence"><strong>{t("证据边界：", "Evidence limits: ")}</strong>{event.evidenceBoundary || t("尚未提供，需回到原始来源核实。", "Not provided; verify against the primary sources.")}</p>
      <div className="score-strip" aria-label={t("研究评分", "Research scores")}>
        <div className="score-item"><span>{t("综合优先度", "Overall priority")}</span><strong>{event.score.total ?? t("未知", "Unknown")}</strong></div>
        <div className="score-item"><span>{t("影响", "Impact")}</span><strong>{event.score.impact.value ?? t("未知", "Unknown")}</strong></div>
        <div className="score-item"><span>{t("证据", "Evidence")}</span><strong>{event.score.evidence.value ?? t("未知", "Unknown")}</strong></div>
      </div>
      <p className="event-why"><strong>{t("建议：", "Suggested action: ")}</strong>{event.actions[0]?.expectedOutput ?? event.whyItMatters}</p>
      <div className="event-card-footer">
        <div className="tag-list">
          {event.topics.slice(0, 3).map((topic) => <Badge key={topic}>{topic}</Badge>)}
        </div>
        <Link className="text-link" href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{t("查看证据", "View evidence")} <ArrowUpRight aria-hidden="true" size={14} /></Link>
      </div>
      <EventStateControls eventId={event.id} mode={mode} initialState={userState} onStateChange={setUserState} />
    </article>
  );
}
