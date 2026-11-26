import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JobRetryButton } from "@/components/job-retry-button";
import { ManualRefresh } from "@/components/manual-refresh";
import { formatDateTime, formatDuration } from "@/components/format";
import { getLanguage } from "@/components/language-server";
import { translate } from "@/components/language";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDataMode, getJobs } from "@/lib/view-data";
import { jobStatusLabelsI18n, type RefreshJobRecord } from "@/lib/domain";

export const instant = false;
export const metadata: Metadata = { title: "采集与任务" };

const triggerLabels: Record<RefreshJobRecord["trigger"], { zh: string; en: string }> = { manual: { zh: "手动", en: "Manual" }, scheduled: { zh: "定时", en: "Scheduled" }, retry: { zh: "重试", en: "Retry" }, worker: { zh: "工作器", en: "Worker" } };

export default async function JobsPage() {
  const [mode, language] = await Promise.all([getDataMode(), getLanguage()]);
  const user = mode === "live" ? await getCurrentUser() : null;
  if (mode === "live" && !user) redirect("/login?next=/jobs");
  const jobs = await getJobs(mode);
  const t = (zh: string, en: string) => translate(language, zh, en);
  const running = jobs.filter((job) => ["queued", "collecting", "verifying", "generating"].includes(job.status)).length;
  const failed = jobs.filter((job) => job.status === "failed" || job.status === "partial").length;
  const estimated = jobs.reduce((sum, job) => sum + Number(job.estimatedCostUsd), 0);

  return (
    <div className="page-shell">
      <PageHeader eyebrow={t("OPERATIONS / 任务审计", "OPERATIONS / JOB AUDIT")} title={t("采集、核验与生成任务", "Collection, verification & generation jobs")} description={t("排队、执行、部分失败与失败分开显示。耗时和成本来自任务记录；重试会经过同样的权限、预算与防重约束。", "Queued, running, partial, and failed states are distinct. Duration and cost come from job records; retries enforce the same permissions, budgets, and deduplication.")} actions={<ManualRefresh mode={mode} initialJob={jobs[0] ?? null} />} meta={<><span>{running} {t("个进行中", "running")}</span><span>{failed} {t("个失败或部分失败", "failed or partial")}</span><span>{t("列表估算成本", "Estimated listed cost")} ${Number.isFinite(estimated) ? estimated.toFixed(4) : t("未知", "unknown")}</span></>} />
      {jobs.length === 0 ? <EmptyState title={t("尚无任务记录", "No jobs yet")} description={t("没有历史任务不代表采集成功。配置来源后，可手动创建第一个受预算约束的更新任务。", "No job history does not imply successful collection. Configure sources, then create a budget-limited refresh job.")} /> : <div className="job-list">{jobs.map((job) => (
        <article className="job-card" key={job.id}>
          <div className="job-card-header">
            <div><h2>{job.id}</h2><p>{triggerLabels[job.trigger][language]} · {t("创建", "Created")} {formatDateTime(job.createdAt, undefined, language)}</p></div>
            <div className="button-row"><Badge tone={job.status === "failed" || job.status === "partial" ? "danger" : job.status === "completed" ? "success" : "info"}>{jobStatusLabelsI18n[job.status][language]}</Badge><JobRetryButton jobId={job.id} status={job.status} mode={mode} /></div>
          </div>
          <div className="progress-track" role="progressbar" aria-label={t(`任务 ${job.id} 进度`, `Progress for job ${job.id}`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={job.progress}><div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }} /></div>
          <div className="progress-meta"><span>{job.currentStep || t("未提供当前步骤", "Current step unavailable")}</span><span className="numeric">{job.progress}%</span></div>
          {job.errorSummary ? <div className="job-error"><strong>{t("错误摘要：", "Error summary: ")}</strong>{job.errorSummary}</div> : null}
          <dl className="job-details">
            <div><dt>{t("采集窗口", "Collection window")}</dt><dd>{formatDateTime(job.windowStart, undefined, language)}<br />{t("至", "to")} {formatDateTime(job.windowEnd, undefined, language)}</dd></div>
            <div><dt>{t("开始 / 完成", "Started / finished")}</dt><dd>{formatDateTime(job.startedAt, undefined, language)}<br />{formatDateTime(job.finishedAt, undefined, language)}</dd></div>
            <div><dt>{t("耗时", "Duration")}</dt><dd>{formatDuration(job.startedAt, job.finishedAt, language)}</dd></div>
            <div><dt>{t("估算成本", "Estimated cost")}</dt><dd>${job.estimatedCostUsd} USD</dd></div>
          </dl>
        </article>
      ))}</div>}
    </div>
  );
}
