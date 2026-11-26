import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { verificationLabelsI18n, type ActionItem, type DailyBriefRecord, type DataMode, type EventRecord, type UILanguage } from "@/lib/domain";
import { formatDateTime, uniqueSourceCount, verificationTone } from "./format";
import { IntelligenceCharts } from "./intelligence-charts";
import { eventDisplaySummary, eventDisplayTitle, translate } from "./language";
import { Badge, EmptyState, InlineNotice, Section, StatCard } from "./ui";

function briefActions(brief: DailyBriefRecord, events: EventRecord[]): ActionItem[] {
  const actions = [...brief.actions];
  const ids = new Set(actions.map((action) => action.id));
  for (const event of events) {
    for (const action of event.actions) {
      if (!ids.has(action.id) && actions.length < 3) {
        actions.push(action);
        ids.add(action.id);
      }
    }
  }
  return actions.slice(0, 3);
}

export function BriefView({ brief, events, mode, language }: { brief: DailyBriefRecord; events: EventRecord[]; mode: DataMode; language: UILanguage }) {
  const t = (zh: string, en: string) => translate(language, zh, en);
  const visibleEvents = events.slice(0, 10);
  const actions = briefActions(brief, events);

  return (
    <>
      {brief.majorCorrections.length > 0 ? (
        <InlineNotice tone="danger">
          <strong>{t("重大更正", "Major corrections")}</strong>
          <ul>{brief.majorCorrections.map((correction) => <li key={correction}>{correction}</li>)}</ul>
        </InlineNotice>
      ) : null}
      <div className="stats-grid" aria-label={t("今日情报统计", "Today’s intelligence statistics")}>
        <StatCard label={t("新增事件", "New events")} value={brief.stats.newEvents} note={t(`统计窗内样本 ${brief.coverage.sampleSize} 条`, `${brief.coverage.sampleSize} samples in window`)} />
        <StatCard label={t("重大更新", "Major updates")} value={brief.stats.majorUpdates} note={t("以来源与版本记录为准", "Based on source and version records")} />
        <StatCard label={t("严格合格大额融资", "Strictly qualified funding")} value={brief.stats.qualifiedFunding} note={t("严格超过 $1B，不含恰好 $1B", "Strictly over $1B; exactly $1B excluded")} tone="success" />
        <StatCard label={t("待核验", "Pending verification")} value={brief.stats.pendingVerification} note={t("单一来源、冲突或证据不足", "Single source, conflicting, or insufficient evidence")} tone="warning" />
      </div>

      <div className="coverage-block">
        <dl>
          <div><dt>{t("统计窗口", "Statistical window")}</dt><dd>{formatDateTime(brief.coverage.windowStart, brief.timezone, language)} — {formatDateTime(brief.coverage.windowEnd, brief.timezone, language)} ({brief.timezone})</dd></div>
          <div><dt>{t("样本与覆盖", "Sample & coverage")}</dt><dd>{brief.coverage.sampleSize} {t("条样本", "samples")}; {brief.coverage.channels.length > 0 ? brief.coverage.channels.join(" / ") : t("渠道覆盖未知", "Channel coverage unknown")}</dd></div>
          <div><dt>{t("解释边界", "Interpretation limits")}</dt><dd>{brief.coverage.caveats} {t("采集增长不等于市场热度，样本变化也可能来自渠道启停或抓取失败。", "Collection growth is not market momentum; sample changes may also reflect channel toggles or fetch failures.")}</dd></div>
          <div><dt>{t("生成时间", "Generated at")}</dt><dd>{formatDateTime(brief.generatedAt, brief.timezone, language)}</dd></div>
        </dl>
      </div>

      <div className="brief-grid">
        <Section title={t("今日核心事件", "Today’s core events")} description={t("按编辑优先级呈现，目标为 5–10 条；数量不足时不使用旧闻或无来源内容补齐。", "Ordered by editorial priority, targeting 5–10 items. Gaps are never filled with old or unsourced content.")}>
          {visibleEvents.length < 5 ? (
            <InlineNotice tone="warning"><strong>{t(`本期仅有 ${visibleEvents.length} 条可用事件。`, `Only ${visibleEvents.length} usable events are available.`)}</strong>{t("未达到常规 5–10 条，当前缺口如实保留；请检查渠道覆盖与核验状态。", "Below the usual 5–10 items. The gap is retained honestly; check channel coverage and verification.")}</InlineNotice>
          ) : null}
          {visibleEvents.length === 0 ? <EmptyState title={t("今日简报尚无事件", "No events in today’s brief")} description={t("这可能是采集未运行、来源未配置或所有记录仍在核验。空简报不会被当作采集成功。", "Collection may not have run, sources may be unconfigured, or records may still be under review. An empty brief is not a collection success.")} /> : (
            <div className="brief-list">
              {visibleEvents.map((event, index) => {
                const title = eventDisplayTitle(event, language);
                const summary = eventDisplaySummary(event, language);
                return (
                  <article className="brief-item" key={event.id}>
                    <span className="brief-index">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="brief-item-meta">
                        <Badge tone={verificationTone[event.verificationStatus]}>{verificationLabelsI18n[event.verificationStatus][language]}</Badge>
                        <span>{event.eventDate}</span><span>{uniqueSourceCount(event.sources)} {t("个独立来源", "independent sources")}</span>
                        {language === "en" && (title.fallback || summary.fallback) ? <Badge tone="warning">English summary not provided</Badge> : null}
                      </div>
                      <h3><Link href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{title.text}</Link></h3>
                      <p>{summary.text}</p>
                      <div className="brief-item-meta"><span>{event.addedThisRound || t("本轮新增证据未单独说明", "New evidence in this round was not separately described")}</span></div>
                      <Link className="text-link" href={`/events/${encodeURIComponent(event.slug || event.id)}`}>{t("事实、来源与行动建议", "Facts, sources & suggested actions")} <ArrowUpRight aria-hidden="true" size={13} /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {events.length > 10 ? <p className="form-message">{t(`另有 ${events.length - 10} 条未进入本期简报，可在全量事件流中检查。`, `${events.length - 10} additional events were not included; review them in the full event stream.`)}</p> : null}
        </Section>

        <Section title={t("今日最值得行动", "Today’s most actionable items")} description={t("最多三条，包含材料、复核动作与预期产出。", "Up to three items, with materials, verification steps, and expected output.")}>
          {actions.length === 0 ? <EmptyState title={t("行动建议不足", "Insufficient action suggestions")} description={t("当前事件没有足够证据生成可执行建议。", "Current events lack enough evidence for actionable recommendations.")} /> : (
            <div className="action-stack">
              {actions.map((action, index) => (
                <article className="action-item" key={action.id}>
                  <span className="eyebrow">ACTION {String(index + 1).padStart(2, "0")} / {action.priority}</span>
                  <h3>{action.title}</h3>
                  <dl>
                    <div><dt>{t("所需材料", "Materials")}</dt><dd>{action.materials}</dd></div>
                    <div><dt>{t("复核动作", "Verification")}</dt><dd>{action.verification}</dd></div>
                    <div><dt>{t("预期产出", "Expected output")}</dt><dd>{action.expectedOutput}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
          {actions.length < 3 ? <p className="form-message">{t(`当前仅有 ${actions.length} 条具备基本依据的行动建议，不自动补足三条。`, `Only ${actions.length} suggestions have adequate support; no extra items are generated to reach three.`)}</p> : null}
        </Section>
      </div>

      <Section title={t("趋势与资金流向", "Trends & capital flows")} description={t("图形与数据表等价呈现；样本、时间窗与口径见上方覆盖说明。", "Charts and data tables are equivalent; see sample, window, and methodology notes above.")} id="trends">
        <IntelligenceCharts events={events} brief={brief} language={language} />
      </Section>
      {mode === "demo" ? <p className="privacy-caption">{t("本页所有图表均基于演示样本生成，不能用于实时市场判断。", "All charts use demo samples and must not inform live market judgments.")}</p> : null}
    </>
  );
}
