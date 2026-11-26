import type { Metadata } from "next";
import Link from "next/link";
import { BriefView } from "@/components/brief-view";
import { formatDateTime } from "@/components/format";
import { ManualRefresh } from "@/components/manual-refresh";
import { Badge, EmptyState, ErrorState, PageHeader, Section } from "@/components/ui";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { getDataMode, getJobs, getSourceHealth, getSystemStatus, getTodayBrief, listEvents } from "@/lib/view-data";

export const instant = false;
export const metadata: Metadata = { title: "今日简报" };

export default async function BriefPage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const [brief, allEvents, sources, jobs, status] = await Promise.all([
    getTodayBrief(mode),
    listEvents(undefined, mode),
    getSourceHealth(mode),
    getJobs(mode),
    getSystemStatus(mode),
  ]);
  const t = (zh: string, en: string) => translate(language, zh, en);
  const events = brief
    ? brief.eventIds.map((id) => allEvents.find((event) => event.id === id || event.slug === id)).filter((event) => event !== undefined)
    : [];
  const abnormal = sources.filter((source) => source.status === "error" || (source.enabled && source.configured && !source.lastSuccessAt));
  const unconfigured = sources.filter((source) => source.enabled && !source.configured);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={`DAILY BRIEF / ${brief?.date ?? "NO EDITION"}`}
        title={brief?.title ?? t("今日简报尚未生成", "Today’s brief is not available")}
        description={brief?.introduction ?? t("当前没有可用日报。这里不会用旧数据冒充今日更新；请检查最近任务与渠道状态后手动更新。", "No brief is available. Older content is never presented as today’s update; check recent jobs and source health before refreshing.")}
        actions={<ManualRefresh mode={mode} initialJob={jobs[0] ?? null} />}
        meta={<>
          <span>{t("最后成功更新：", "Last successful update: ")}{formatDateTime(status.lastSuccessAt, brief?.timezone, language)}</span>
          <span>{t("本期事件：", "Events in this edition: ")}{events.length}</span>
          <Badge tone={status.stale ? "warning" : status.lastSuccessAt ? "success" : "neutral"}>{status.stale ? t("数据可能过期", "Data may be stale") : status.lastSuccessAt ? t("已有成功快照", "Successful snapshot available") : t("尚无成功更新", "No successful update")}</Badge>
        </>}
      />

      {brief ? <BriefView brief={brief} events={events} mode={mode} language={language} /> : (
        <EmptyState
          title={t("没有可发布的今日简报", "No publishable brief today")}
          description={status.error || t("系统尚未生成日报，或当前统计窗口没有通过编辑发布的内容。手动更新完成前不显示虚构摘要。", "No brief has been generated, or no content in this window has passed editorial review. No fabricated summary is shown before refresh completes.")}
          action={<Link className="button button-secondary" href="/jobs">{t("检查采集任务", "Inspect collection jobs")}</Link>}
        />
      )}

      <Section title={t("渠道覆盖与异常", "Channel coverage & errors")} description={t("未配置不等于正常；没有成功时间的渠道不会被标记为成功。", "Unconfigured is not healthy; channels without a success timestamp are never marked successful.")}>
        {sources.length === 0 ? <EmptyState title={t("渠道信息未知", "Channel status unknown")} description={t("数据层未返回来源健康状态，无法判断本期覆盖范围。", "No source health data was returned, so edition coverage cannot be determined.")} /> : (
          <div className="channel-list">
            {sources.map((source) => (
              <article className="channel-card" key={source.id}>
                <div>
                  <h3>{source.name} <Badge>{source.channel}</Badge></h3>
                  <p>{source.lastError || `${t("最近成功：", "Last success: ")}${formatDateTime(source.lastSuccessAt, undefined, language)} · ${t("本期", "Items")} ${source.itemCount ?? t("未知", "unknown")}`}</p>
                </div>
                <Badge tone={source.status === "error" ? "danger" : !source.configured ? "warning" : source.status === "success" ? "success" : "neutral"}>
                  {!source.enabled ? t("已停用", "Disabled") : !source.configured ? t("未配置", "Not configured") : source.status === "error" ? t("异常", "Error") : source.status === "success" ? t("成功", "Success") : t("待运行", "Pending")}
                </Badge>
              </article>
            ))}
          </div>
        )}
        {abnormal.length > 0 || unconfigured.length > 0 ? <p className="form-message">{t("覆盖缺口：", "Coverage gaps: ")}{abnormal.length} {t("个异常或无成功记录渠道，", "failed or never-successful channels; ")}{unconfigured.length} {t("个未配置渠道。简报结论需结合这些缺口阅读。", "unconfigured channels. Read conclusions with these gaps in mind.")}</p> : null}
        {abnormal.length === 0 && unconfigured.length === 0 && sources.length > 0 ? <p className="form-message">{t("当前未报告异常渠道，但这不代表所有来源均已覆盖。", "No channel errors are reported, but this does not imply complete source coverage.")}</p> : null}
      </Section>
      {status.error ? <ErrorState title={t("数据暂时不可用", "Data temporarily unavailable")} description={status.error} /> : null}
    </div>
  );
}
