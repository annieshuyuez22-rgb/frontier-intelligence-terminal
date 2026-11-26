import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { refreshJobs } from "@/db/schema";
import { jobResultForRoute, retryRefreshJob } from "@/lib/job-engine";
import { ApiError, enforceRateLimit, requireLiveMode, requireMutation, runApi, uuidSchema } from "../../../_lib/http";
import { scheduleRefreshExecution } from "../../../_lib/jobs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request);
    await requireLiveMode();
    enforceRateLimit(request, "job-retry", 5, 15 * 60 * 1000, user.id);
    const id = uuidSchema.parse((await context.params).id);
    const rows = await requireDb().select({ createdBy: refreshJobs.createdBy, status: refreshJobs.status }).from(refreshJobs).where(eq(refreshJobs.id, id)).limit(1);
    if (!rows[0]) throw new ApiError(404, "任务不存在");
    if (rows[0].createdBy !== user.id) throw new ApiError(403, "无权重试该任务");
    if (!["completed", "partial", "failed"].includes(rows[0].status)) throw new ApiError(409, "运行中的任务不能重试");
    const result = await retryRefreshJob(id, user.id);
    scheduleRefreshExecution(result.job.id);
    return NextResponse.json(jobResultForRoute(result), { status: 202 });
  });
}
