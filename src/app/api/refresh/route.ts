import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createRefreshJob, jobResultForRoute, listJobsForUser, publicRefreshJob } from "@/lib/job-engine";
import { enforceRateLimit, queryLimit, readJson, requireLiveMode, requireMutation, runApi } from "../_lib/http";
import { scheduleRefreshExecution } from "../_lib/jobs";

const refreshSchema = z.object({
  costLimitUsd: z.string().regex(/^\d+(?:\.\d{1,4})?$/).optional(),
}).strict();

export async function GET(request: Request): Promise<Response> {
  request.headers.get("user-agent");
  return runApi(async () => {
    const user = await requireUser();
    enforceRateLimit(request, "refresh-read", 60, 15 * 60 * 1000, user.id);
    const jobs = await listJobsForUser(user.id, queryLimit(request, 10));
    return NextResponse.json({ jobs: jobs.map(publicRefreshJob) });
  });
}

export async function POST(request: Request): Promise<Response> {
  return runApi(async () => {
    const user = await requireMutation(request);
    await requireLiveMode();
    enforceRateLimit(request, "refresh", 5, 15 * 60 * 1000, user.id);
    let costLimitUsd: string | undefined;
    if (Number(request.headers.get("content-length") ?? 0) > 0) {
      costLimitUsd = (await readJson(request, refreshSchema, 4 * 1024)).costLimitUsd;
    }
    const result = await createRefreshJob({ userId: user.id, trigger: "manual", costLimitUsd });
    scheduleRefreshExecution(result.job.id);
    return NextResponse.json(jobResultForRoute(result), { status: 202 });
  });
}
