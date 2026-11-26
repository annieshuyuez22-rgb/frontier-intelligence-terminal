import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { EventEditor } from "@/components/event-editor";
import { EventStateControls } from "@/components/event-state-controls";
import { formatDate, formatDateTime, formatUsd, uniqueSourceCount, verificationTone } from "@/components/format";
import { Badge, EmptyState, InlineNotice, PageHeader } from "@/components/ui";
import { VersionCompare } from "@/components/version-compare";
import { getLanguage } from "@/components/language-server";
import { eventDisplaySummary, eventDisplayTitle, translate } from "@/components/language";
import { categoryLabels, editorialStatusLabelsI18n, fundingStageLabelsI18n, fundingTypeLabelsI18n, infoTypeLabelsI18n, qualificationLabelsI18n, verificationLabelsI18n, type ClaimRecord, type EventRecord, type SourceRecord, type UILanguage } from "@/lib/domain";
import { getCurrentUser } from "@/lib/auth";
import { getDataMode, getEvent } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "事件证据详情" };

function ClaimList({ claims, sources, language }: { claims: ClaimRecord[]; sources: SourceRecord[]; language: UILanguage }) {
  const t = (zh: string, en: string) => translate(language, zh, en);
  return (
    <ol className="claim-list">
      {claims.map((claim) => (
        <li className={claim.kind === "ai_inference" || claim.kind === "analysis" ? "claim-card claim-card-ai" : "claim-card"} id={`claim-${claim.id}`} key={claim.id}>
          <span className="claim-kind">{claim.kind === "fact" ? t("SOURCE FACT / 来源事实", "SOURCE FACT") : claim.kind === "correction" ? t("CORRECTION / 更正", "CORRECTION") : claim.kind === "analysis" ? t("EDITORIAL ANALYSIS / 编辑分析", "EDITORIAL ANALYSIS") : t("AI INFERENCE / AI 推断", "AI INFERENCE")}</span>
          <p>{claim.text}</p>
          <div className="citation-links">
            <span className="form-message">{t("来源映射：", "Source mapping: ")}</span>
            {claim.citationIds.length === 0 ? <span className="citation-missing">{t("无来源引用；不可当作已核验事实", "No source citation; not a verified fact")}</span> : claim.citationIds.map((citationId) => {
              const index = sources.findIndex((source) => source.id === citationId);
              return index >= 0 ? <a className="citation-link" key={citationId} href={`#source-${sources[index]?.id}`} aria-label={t(`跳到来源 S${index + 1}`, `Jump to source S${index + 1}`)}>[S{index + 1}]</a> : <span className="citation-missing" key={citationId}>{t("[引用未关联]", "[Citation unlinked]")}</span>;
            })}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const [event, user] = await Promise.all([getEvent(id, mode), mode === "live" ? getCurrentUser() : Promise.resolve(null)]);
  if (!event) notFound();
  const canEdit = mode === "live" && user?.role === "admin";
  const t = (zh: string, en: string) => translate(language, zh, en);
  const title = eventDisplayTitle(event, language);
  const summary = eventDisplaySummary(event, language);
  const related = event.relatedIds && event.relatedIds.length > 0
    ? (await Promise.all(event.relatedIds.map((relatedId) => getEvent(relatedId, mode)))).filter((item): item is EventRecord => item !== null && item.editorialStatus === "published")
    : [];
  const facts = event.claims.filter((claim) => claim.kind === "fact" || claim.kind === "correction");
  const analyses = event.claims.filter((claim) => claim.kind === "analysis" || claim.kind === "ai_inference");
  const independentSources = uniqueSourceCount(event.sources);

  return (
    <div className="page-shell" id="overview">
      <Link className="text-link" href="/events"><ArrowLeft aria-hidden="true" size={14} />{t("返回全量事件流", "Back to event stream")}</Link>
      <PageHeader
        eyebrow={`${categoryLabels[event.category].en.toUpperCase()} / EVIDENCE RECORD`}
        title={title.text}
        description={summary.text}
        meta={<>
          <Badge tone="info">{infoTypeLabelsI18n[event.infoType][language]}</Badge>
          <Badge tone={verificationTone[event.verificationStatus]}>{verificationLabelsI18n[event.verificationStatus][language]}</Badge>
          {event.editorialStatus === "pending" ? <Badge tone="warning">{editorialStatusLabelsI18n.pending[language]}</Badge> : null}
          {language === "en" && (title.fallback || summary.fallback) ? <Badge tone="warning">English summary not provided</Badge> : null}
          <span>{independentSources} {t("个独立来源", "independent sources")} / {event.sources.length} {t("份文档", "documents")}</span>
        </>}
        actions={<EventActions event={event} mode={mode} />}
      />

      <div className="detail-layout">
        <div className="detail-main">
          {canEdit ? <EventEditor event={event} /> : null}
          {event.summaryEn ? <section className="detail-section" aria-labelledby="english-summary-title"><h2 id="english-summary-title">English summary</h2><p lang="en">{event.summaryEn}</p></section> : null}
          <section className="detail-section" aria-labelledby="timeline-title">
            <h2 id="timeline-title">{t("时间线，不混用日期", "Timeline without conflating dates")}</h2>
            <p>{t("事件本身发生时间，与媒体报道、系统首次发现和后续更新分别记录。", "The event date, source publication, system discovery, and later updates are recorded separately.")}</p>
            <dl className="detail-list">
              <div><dt>{t("事件日期", "Event date")}</dt><dd>{event.eventDate}</dd></div>
              <div><dt>{t("来源发布", "Source published")}</dt><dd>{formatDateTime(event.publishedAt, undefined, language)}</dd></div>
              <div><dt>{t("系统首见", "First seen")}</dt><dd>{formatDateTime(event.firstSeenAt, undefined, language)}</dd></div>
              <div><dt>{t("最近更新", "Last updated")}</dt><dd>{formatDateTime(event.updatedAt, undefined, language)}</dd></div>
              <div><dt>{t("本轮新增", "Added this round")}</dt><dd>{event.addedThisRound || t("未单独说明", "Not separately described")}</dd></div>
            </dl>
          </section>

          <section className="detail-section" aria-labelledby="facts-title">
            <h2 id="facts-title">{t("来源事实与更正", "Source facts & corrections")}</h2>
            <p>{t("此区仅呈现标记为来源事实或更正的 claim；引用编号可跳到底部原始来源。", "Only claims marked as source facts or corrections appear here; citation links jump to original sources below.")}</p>
            {facts.length === 0 ? <EmptyState title={t("没有结构化事实 claim", "No structured fact claims")} description={t("摘要不能替代 claim→source 映射。当前事件的事实证据尚未完成结构化。", "A summary cannot replace claim→source mappings. Fact evidence has not been structured for this event.")} /> : <ClaimList claims={facts} sources={event.sources} language={language} />}
          </section>

          <section className="detail-section" aria-labelledby="analysis-title">
            <h2 id="analysis-title">{t("编辑分析与 AI 推断", "Editorial analysis & AI inference")}</h2>
            <p>{t("此区不是来源事实。AI 推断即使附带引用，也需要独立验证。", "This section is not source fact. AI inference requires independent verification even when citations are present.")}</p>
            <InlineNotice tone="warning"><strong>{t("影响分析：", "Impact analysis: ")}</strong>{event.whyItMatters}</InlineNotice>
            {analyses.length === 0 ? <EmptyState title={t("没有额外分析 claim", "No additional analysis claims")} description={t("当前没有单独结构化的编辑分析或 AI 推断。", "No separately structured editorial analysis or AI inference is available.")} /> : <ClaimList claims={analyses} sources={event.sources} language={language} />}
          </section>

          <section className="detail-section" aria-labelledby="metrics-title">
            <h2 id="metrics-title">{t("关键指标、协议与局限", "Key metrics, protocols & limitations")}</h2>
            <p>{t("原始数值与方法并列。成本未单列时不根据其他指标推算。", "Original values and methods appear together. Costs are not inferred from other metrics.")}</p>
            {event.metrics.length === 0 ? <EmptyState title={t("没有结构化指标", "No structured metrics")} description={t("当前事件没有可审计的关键数字。", "No auditable key figures are available for this event.")} /> : <div className="table-scroll"><table className="data-table metric-table"><thead><tr><th scope="col">{t("指标 / 数值", "Metric / value")}</th><th scope="col">{t("Protocol / 方法", "Protocol / method")}</th><th scope="col">{t("Sample / 样本", "Sample")}</th><th scope="col">{t("Cost / 成本", "Cost")}</th><th scope="col">{t("周期 / 引用", "Period / citation")}</th></tr></thead><tbody>{event.metrics.map((metric) => {
              const sourceIndex = metric.citationId ? event.sources.findIndex((source) => source.id === metric.citationId) : -1;
              const isCost = /cost|成本|费用|预算|cpc|cpm|cpa/i.test(metric.label);
              return <tr key={metric.id}><td>{metric.label}<br /><strong className="metric-value">{metric.value} {metric.unit}</strong></td><td>{metric.methodology ?? t("未知", "Unknown")}</td><td>{metric.sample ?? t("未知", "Unknown")}</td><td>{isCost ? `${metric.value} ${metric.unit ?? ""}` : t("未单列", "Not separated")}</td><td>{metric.period ?? t("未知", "Unknown")}{sourceIndex >= 0 ? <><br /><a className="citation-link" href={`#source-${event.sources[sourceIndex]?.id}`}>[S{sourceIndex + 1}]</a></> : null}</td></tr>;
            })}</tbody></table></div>}
            <InlineNotice tone="warning"><strong>{t("指标与研究局限：", "Metric & research limitations: ")}</strong>{event.evidenceBoundary || t("未提供，不能假设没有局限。", "Not provided; do not assume there are no limitations.")}</InlineNotice>
          </section>

          {event.funding ? <section className="detail-section" aria-labelledby="funding-title"><h2 id="funding-title">{t("融资归一化", "Funding normalization")}</h2><p>{t("估值不等于融资；类型、阶段与资格需共同判断。", "Valuation is not funding; type, stage, and qualification must be evaluated together.")}</p><dl className="detail-list"><div><dt>{t("原币金额", "Original amount")}</dt><dd>{event.funding.amountOriginal ?? t("未披露", "Undisclosed")} {event.funding.currency}</dd></div><div><dt>{t("美元金额", "USD amount")}</dt><dd>{formatUsd(event.funding.amountUsd, true, language)}</dd></div><div><dt>{t("类型 / 阶段", "Type / stage")}</dt><dd>{fundingTypeLabelsI18n[event.funding.type][language]} / {fundingStageLabelsI18n[event.funding.stage][language]}</dd></div><div><dt>{t("资格", "Qualification")}</dt><dd>{qualificationLabelsI18n[event.funding.qualification][language]}{event.funding.splitUnknown ? t("；金额拆分未知", "; split unknown") : ""}</dd></div><div><dt>{t("FX 换算", "FX conversion")}</dt><dd>{event.funding.fxRate ?? t("未知", "Unknown")} · {event.funding.fxSource ?? t("来源未知", "Source unknown")} · {event.funding.fxDate ?? t("日期未知", "Date unknown")}</dd></div></dl></section> : null}

          <section className="detail-section" aria-labelledby="sources-title">
            <h2 id="sources-title">{t("公开来源", "Public sources")}</h2>
            <p>{t("访问状态、全文 / 摘要边界与独立来源组完整保留。外部链接在新标签打开。", "Access status, full-text / excerpt boundaries, and independent source groups are preserved. External links open in a new tab.")}</p>
            {event.sources.length === 0 ? <EmptyState title={t("无公开来源", "No public sources")} description={t("这条记录缺少可访问的公开来源，不应作为已核验事实传播。", "This record has no accessible public source and should not be shared as a verified fact.")} /> : <div className="source-list">{event.sources.map((source, index) => <article className="source-card" id={`source-${source.id}`} key={source.id}><div className="source-card-heading"><span className="eyebrow">S{index + 1} / {source.channel}</span><Badge>{source.accessStatus}</Badge></div><h3><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ExternalLink aria-hidden="true" size={13} /></a></h3><p>{source.excerpt || t("未保存来源摘录。", "No source excerpt was saved.")}</p><div className="source-card-meta">{source.originGroup} · {source.sourceType} · {t("发布", "Published")} {source.publishedAt ? formatDateTime(source.publishedAt, undefined, language) : t("未知", "unknown")} · {t("抓取", "Fetched")} {formatDateTime(source.fetchedAt, undefined, language)}</div></article>)}</div>}
          </section>

          <section className="detail-section" aria-labelledby="versions-title">
            <h2 id="versions-title">{t("更新历史与版本对比", "Update history & version comparison")}</h2>
            <p>{t("重大更正单独标记；快照差异来自实际版本记录。", "Major corrections are labeled separately; snapshot differences come from actual versions.")}</p>
            {event.versions?.some((version) => version.majorCorrection) ? <InlineNotice tone="danger"><strong>{t("此事件包含重大更正。", "This event includes a major correction.")}</strong>{t("请优先阅读最新版本，并检查变化字段对原结论的影响。", "Read the latest version first and inspect how changed fields affect the original conclusion.")}</InlineNotice> : null}
            <VersionCompare versions={event.versions ?? []} />
          </section>
        </div>

        <aside className="detail-sidebar" aria-label={t("研究辅助信息", "Research tools")}>
          <div className="panel"><div className="panel-heading"><h2>{t("研究状态", "Research state")}</h2></div><EventStateControls eventId={event.id} mode={mode} initialState={{ bookmarked: event.viewerState?.bookmarked ?? false, read: Boolean(event.viewerState?.readAt), hidden: event.viewerState?.hidden ?? false, privateNote: event.viewerState?.privateNote ?? "" }} /></div>
          <div className="panel"><div className="panel-heading"><h2>{t("证据边界", "Evidence limits")}</h2></div><p className="form-message">{event.evidenceBoundary}</p></div>
          <div className="panel"><div className="panel-heading"><h2>{t("建议行动", "Suggested actions")}</h2></div>{event.actions.length === 0 ? <p className="form-message">{t("数据不足，暂无行动建议。", "Insufficient data; no suggested actions.")}</p> : <div className="action-stack">{event.actions.map((action) => <article className="action-item" key={action.id}><h3>{action.title}</h3><p>{action.verification}</p><p><strong>{t("产出：", "Output: ")}</strong>{action.expectedOutput}</p></article>)}</div>}</div>
          <div className="panel"><div className="panel-heading"><h2>{t("关联事件", "Related events")}</h2></div>{related.length === 0 ? <p className="form-message">{t("暂无已发布的关联事件。", "No published related events.")}</p> : <div className="related-list">{related.map((item) => <Link href={`/events/${encodeURIComponent(item.slug || item.id)}`} key={item.id}>{eventDisplayTitle(item, language).text}<br /><small className="form-message">{formatDate(item.eventDate, undefined, language)}</small></Link>)}</div>}</div>
          <div className="panel"><div className="panel-heading"><h2>{t("主题与公司", "Topics & companies")}</h2></div><div className="tag-list">{[...event.topics, ...event.companies, ...event.regions].map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div>
        </aside>
      </div>
    </div>
  );
}
