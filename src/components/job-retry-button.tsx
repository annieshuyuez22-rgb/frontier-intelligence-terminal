"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";
import type { DataMode, JobStatus, RefreshJobRecord } from "@/lib/domain";
import { errorMessage, readApiJson } from "./api-client";
import { useLanguage } from "./language-provider";

export function JobRetryButton({ jobId, status, mode }: { jobId: string; status: JobStatus; mode: DataMode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const retryable = ["completed", "partial", "failed"].includes(status);

  async function retry() {
    if (mode === "demo") {
      setMessage(t("演示模式不创建真实重试任务。此操作未调用后台。", "Demo mode does not create a real retry job. No backend request was made."));
      return;
    }
    if (!retryable || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await readApiJson<{ job: RefreshJobRecord; existing: boolean }>(response);
      setMessage(data.existing ? t("已接入现有重试任务", "Joined the existing retry job") : t(`重试任务 ${data.job.id} 已排队`, `Retry job ${data.job.id} queued`));
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button className="button button-secondary button-small" type="button" disabled={mode === "live" && (!retryable || pending)} onClick={() => void retry()} title={!retryable ? t("运行中的任务不能重试", "Running jobs cannot be retried") : t("创建一次受预算约束的重试", "Create a budget-limited retry")}>
        {pending ? <LoaderCircle className="spin" aria-hidden="true" size={14} /> : <RotateCcw aria-hidden="true" size={14} />}{t("重试", "Retry")}
      </button>
      {message ? <p className="state-message" role="status">{message}</p> : null}
    </div>
  );
}
