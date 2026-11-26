import { NextResponse } from "next/server";
import { after } from "next/server";
import { verifyCronSecret } from "@/lib/auth";
import { deliverDueBriefs } from "@/lib/delivery";
import { createDueScheduledJobs, jobResultForRoute, runWorkerCycle } from "@/lib/job-engine";
import { ApiError, runApi } from "../_lib/http";
import { scheduleRefreshExecution } from "../_lib/jobs";

function authorize(request: Request): void {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!verifyCronSecret(token)) throw new ApiError(401, "cron 未授权");
}

async function handle(request: Request): Promise<Response> {
  request.headers.get("user-agent");
  return runApi(async () => {
    authorize(request);
    const action = new URL(request.url).searchParams.get("action") ?? "refresh";
    if (!["refresh", "deliver", "all"].includes(action)) throw new ApiError(400, "action 必须为 refresh、deliver 或 all");
    const now = new Date();
    const jobs = action === "refresh" || action === "all" ? await createDueScheduledJobs(now) : [];
    for (const result of jobs) scheduleRefreshExecution(result.job.id);
    if (action === "refresh") {
      after(async () => {
        try {
          await runWorkerCycle(10);
        } catch (error) {
          console.error("cron 恢复执行失败", error instanceof Error ? error.message : "未知错误");
        }
      });
    }
    if (action === "all") {
      after(async () => {
        try {
          await runWorkerCycle(10);
          await deliverDueBriefs(now);
        } catch (error) {
          console.error("cron 刷新或投递失败", error instanceof Error ? error.message : "未知错误");
        }
      });
    }
    const deliveries = action === "deliver" ? await deliverDueBriefs(now) : [];
    return NextResponse.json({
      ok: true,
      action,
      evaluatedAt: now.toISOString(),
      jobs: jobs.map(jobResultForRoute),
      deliveries,
      recoveryScheduled: action !== "deliver",
    });
  });
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
