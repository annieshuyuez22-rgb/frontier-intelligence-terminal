import type { JobStatus, UILanguage, VerificationStatus } from "@/lib/domain";

export function formatDate(value: string, timezone = "Asia/Shanghai", language: UILanguage = "zh"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined, timezone = "Asia/Shanghai", language: UILanguage = "zh"): string {
  if (!value) return language === "en" ? "No record" : "暂无记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatUsd(value: string | null | undefined, compact = true, language: UILanguage = "zh"): string {
  if (!value) return language === "en" ? "Amount undisclosed" : "金额未披露";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0,
  }).format(amount);
}

export function formatDuration(startedAt?: string | null, finishedAt?: string | null, language: UILanguage = "zh"): string {
  if (!startedAt) return language === "en" ? "Not started" : "未开始";
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return language === "en" ? "Unknown" : "未知";
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return language === "en" ? `${seconds}s` : `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  return language === "en" ? `${minutes}m ${seconds % 60}s` : `${minutes} 分 ${seconds % 60} 秒`;
}

export function uniqueSourceCount(sources: { originGroup: string }[]): number {
  return new Set(sources.map((source) => source.originGroup)).size;
}

export const verificationTone: Record<VerificationStatus, string> = {
  cross_verified: "success",
  single_source: "info",
  conflicting: "danger",
  insufficient: "warning",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  queued: "排队中",
  collecting: "采集中",
  verifying: "核验中",
  generating: "生成中",
  completed: "已完成",
  partial: "部分失败",
  failed: "失败",
};

export function safeNextPath(value: string | string[] | undefined, fallback = "/brief"): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}
