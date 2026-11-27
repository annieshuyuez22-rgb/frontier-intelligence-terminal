"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { jobStatusLabelsI18n, type DataMode, type JobStatus, type RefreshJobRecord } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";
import { Badge } from "./ui";

const activeStatuses: JobStatus[] = ["queued", "collecting", "verifying", "generating"];
const steps: { status: JobStatus; zh: string; en: string }[] = [
  { status: "queued", zh: "排队", en: "Queue" },
  { status: "collecting", zh: "采集", en: "Collect" },
  { status: "verifying", zh: "核验", en: "Verify" },
  { status: "generating", zh: "生成", en: "Generate" },
  { status: "completed", zh: "完成", en: "Complete" },
  { status: "partial", zh: "部分失败", en: "Partial" },
  { status: "failed", zh: "失败", en: "Failed" },
];

export function ManualRefresh({ mode, initialJob = null }: { mode: DataMode; initialJob?: RefreshJobRecord | null }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [job, setJob] = useState<RefreshJobRecord | null>(initialJob);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const running = pending || (job ? activeStatuses.includes(job.status) : false);
  const activeJobId = job && activeStatuses.includes(job.status) ? job.id : null;

  useEffect(() => {
    if (!activeJobId || mode === "demo") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch("/api/refresh?limit=1", { cache: "no-store" });
        const data = await readApiJson<{ jobs: RefreshJobRecord[] }>(response);
        if (cancelled) return;
        const latest = data.jobs.find((item) => item.id === activeJobId) ?? data.jobs[0];
        if (latest) {
          setJob(latest);
          if (!activeStatuses.includes(latest.status)) {
            setMessage(latest.status === "completed" ? t("更新完成，正在重新载入情报", "Update complete; refreshing intelligence") : t("任务已结束，请检查结果与错误摘要", "Job ended; review the result and error summary"));
            router.refresh();
          }
        }
      } catch (error) {
        if (!cancelled) setMessage(`${t("轮询暂停", "Polling paused")}: ${errorMessage(error)}`);
      }
    };
    const timer = window.setInterval(() => void poll(), 2000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeJobId, mode, router, t]);

  async function refresh() {
    if (mode === "demo") {
      setMessage(t("演示模式不触发真实采集，也不会产生费用。", "Demo mode does not trigger real collection or charges."));
      return;
    }
    if (running) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.status === 401) {
        setMessage(t("实时内容可直接阅读，无需登录；采集更新仅管理员可用。请登录，或先完成首次配置。", "Live intelligence is public. Only administrators can run collection. Sign in or complete first-time setup."));
        return;
      }
      const data = await readApiJson<{ job: RefreshJobRecord; existing: boolean }>(response);
      setJob(data.job);
      setMessage(data.existing ? t("已有相同窗口的任务，已接入该任务，未重复执行", "An existing job covers this window; joined it without duplicating work") : t("任务已排队，后端会防止重复执行", "Job queued; the backend prevents duplicate execution"));
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  const currentIndex = job ? steps.findIndex((step) => step.status === job.status) : -1;

  return (
    <div className="refresh-control">
      <button className="button button-primary" type="button" onClick={() => void refresh()} disabled={mode === "live" && running}>
        {running ? <LoaderCircle className="spin" aria-hidden="true" size={15} /> : <RefreshCw aria-hidden="true" size={15} />}
        {running ? t("更新进行中", "Updating") : mode === "live" ? t("管理员更新", "Admin refresh") : t("手动更新", "Refresh now")}
      </button>
      {job ? (
        <div className="refresh-status" aria-live="polite">
          <div className="refresh-status-header">
            <strong>{t("最近更新任务", "Latest refresh job")}</strong>
            <Badge tone={job.status === "failed" || job.status === "partial" ? "danger" : job.status === "completed" ? "success" : "info"}>
              {jobStatusLabelsI18n[job.status][language]} · {job.progress}%
            </Badge>
          </div>
          <ol className="job-steps" aria-label={t("更新进度", "Refresh progress")}>
            {steps.map((step, index) => {
              const alternateTerminal = (step.status === "partial" || step.status === "failed") && step.status !== job.status;
              const className = alternateTerminal
                ? "job-step"
                : index === currentIndex
                  ? job.status === "failed" || job.status === "partial" ? "job-step job-step-failed" : "job-step job-step-active"
                  : index < currentIndex && !alternateTerminal ? "job-step job-step-complete" : "job-step";
              return <li key={step.status} className={className} aria-current={index === currentIndex ? "step" : undefined}>{t(step.zh, step.en)}</li>;
            })}
          </ol>
          <p>{job.currentStep || t("等待后台状态", "Waiting for backend status")}</p>
          {job.errorSummary ? <p className="job-error">{job.errorSummary}</p> : null}
        </div>
      ) : null}
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </div>
  );
}
